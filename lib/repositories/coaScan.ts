import { and, eq } from 'drizzle-orm';
import { readFile, writeFile, mkdir } from 'fs/promises';
import type {
  CoaReport,
  CoaReportStashLink,
  CoaScanErrorCode,
  NormalizedCoaResult,
  ScanInput,
  ScanJob,
  ScanJobStatus,
} from '@lib/coa/types';
import { normalizeUrl } from '@lib/coa/normalize';
import { jobMetadataForScanInput } from '@lib/coa/input';
import { validateScanInput } from '@lib/coa/validate';
import { getCurrentUserId } from '@lib/budbook-user/currentUser';
import { dbEnabled, getDb } from '@lib/db/client';
import { toCoaReport, toCoaReportStashLink, toScanJob } from '@lib/db/mappers';
import { coaReportStashLinks, coaReports, products, scanJobs } from '@lib/db/schema';
import { dataFile, getDataDir } from '@lib/data-dir';
import { readFileStash } from '@lib/stash/stashCore';

const JOBS_FILE = dataFile('coa-scan-jobs.json');
const REPORTS_FILE = dataFile('coa-reports.json');

type FileJobsData = {
  jobs: Record<string, ScanJob>;
};

type FileReportsData = {
  reports: Record<string, CoaReport>;
  links: CoaReportStashLink[];
};

const EMPTY_JOBS: FileJobsData = { jobs: {} };
const EMPTY_REPORTS: FileReportsData = { reports: {}, links: [] };

export function createScanJobId(): string {
  return `scan-${Date.now()}`;
}

export function createCoaReportId(): string {
  return `coa-report-${Date.now()}`;
}

async function ensureJobsFile(): Promise<void> {
  await mkdir(getDataDir(), { recursive: true });
  try {
    await readFile(JOBS_FILE, 'utf8');
  } catch {
    await writeFile(JOBS_FILE, JSON.stringify(EMPTY_JOBS, null, 2), 'utf8');
  }
}

async function ensureReportsFile(): Promise<void> {
  await mkdir(getDataDir(), { recursive: true });
  try {
    await readFile(REPORTS_FILE, 'utf8');
  } catch {
    await writeFile(REPORTS_FILE, JSON.stringify(EMPTY_REPORTS, null, 2), 'utf8');
  }
}

async function readFileJobs(): Promise<FileJobsData> {
  await ensureJobsFile();
  const raw = await readFile(JOBS_FILE, 'utf8');
  const parsed = JSON.parse(raw) as FileJobsData;
  return { jobs: parsed.jobs ?? {} };
}

async function writeFileJobs(data: FileJobsData): Promise<void> {
  await ensureJobsFile();
  await writeFile(JOBS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

async function readFileReports(): Promise<FileReportsData> {
  await ensureReportsFile();
  const raw = await readFile(REPORTS_FILE, 'utf8');
  const parsed = JSON.parse(raw) as FileReportsData;
  return {
    reports: parsed.reports ?? {},
    links: parsed.links ?? [],
  };
}

async function writeFileReports(data: FileReportsData): Promise<void> {
  await ensureReportsFile();
  await writeFile(REPORTS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

export type CreateScanJobInput = {
  input: ScanInput;
  metadata?: Record<string, unknown>;
};

export async function createScanJob(
  input: CreateScanJobInput,
): Promise<ScanJob> {
  const validation = validateScanInput(input.input);
  if (!validation.ok) {
    throw new Error(`${validation.errorCode}: ${validation.message}`);
  }

  const userId = await getCurrentUserId();
  const now = new Date().toISOString();
  const inputMetadata = jobMetadataForScanInput(input.input);
  const job: ScanJob = {
    id: createScanJobId(),
    user_id: userId,
    input_kind: input.input.kind,
    source_url: validation.sourceUrl,
    status: 'queued',
    provider: null,
    attempt_count: 0,
    error_code: null,
    error_message: null,
    metadata: { ...(input.metadata ?? {}), ...inputMetadata },
    created_at: now,
    updated_at: now,
    completed_at: null,
  };

  if (!dbEnabled()) {
    const data = await readFileJobs();
    data.jobs[job.id] = job;
    await writeFileJobs(data);
    return job;
  }

  const db = getDb()!;
  await db.insert(scanJobs).values({
    id: job.id,
    userId: job.user_id,
    inputKind: job.input_kind,
    sourceUrl: job.source_url,
    status: job.status,
    provider: job.provider,
    attemptCount: job.attempt_count,
    errorCode: job.error_code,
    errorMessage: job.error_message,
    metadata: job.metadata,
    createdAt: new Date(job.created_at),
    updatedAt: new Date(job.updated_at),
    completedAt: null,
  });

  return job;
}

export async function getScanJobForUser(
  jobId: string,
  userId?: string,
): Promise<ScanJob | null> {
  const ownerId = userId ?? (await getCurrentUserId());

  if (!dbEnabled()) {
    const data = await readFileJobs();
    const job = data.jobs[jobId];
    if (!job || job.user_id !== ownerId) return null;
    return job;
  }

  const db = getDb()!;
  const [row] = await db
    .select()
    .from(scanJobs)
    .where(and(eq(scanJobs.id, jobId), eq(scanJobs.userId, ownerId)));

  return row ? toScanJob(row) : null;
}

export type UpdateScanJobStatusInput = {
  status: ScanJobStatus;
  provider?: string | null;
  attemptCount?: number;
  errorCode?: CoaScanErrorCode | null;
  errorMessage?: string | null;
  metadata?: Record<string, unknown>;
  completedAt?: string | null;
};

export async function updateScanJobStatus(
  jobId: string,
  update: UpdateScanJobStatusInput,
  userId?: string,
): Promise<ScanJob | null> {
  const existing = await getScanJobForUser(jobId, userId);
  if (!existing) return null;

  const now = new Date().toISOString();
  const next: ScanJob = {
    ...existing,
    status: update.status,
    provider: update.provider !== undefined ? update.provider : existing.provider,
    attempt_count:
      update.attemptCount !== undefined ? update.attemptCount : existing.attempt_count,
    error_code: update.errorCode !== undefined ? update.errorCode : existing.error_code,
    error_message:
      update.errorMessage !== undefined ? update.errorMessage : existing.error_message,
    metadata: update.metadata !== undefined ? update.metadata : existing.metadata,
    updated_at: now,
    completed_at:
      update.completedAt !== undefined ? update.completedAt : existing.completed_at,
  };

  if (!dbEnabled()) {
    const data = await readFileJobs();
    data.jobs[jobId] = next;
    await writeFileJobs(data);
    return next;
  }

  const db = getDb()!;
  await db
    .update(scanJobs)
    .set({
      status: next.status,
      provider: next.provider,
      attemptCount: next.attempt_count,
      errorCode: next.error_code,
      errorMessage: next.error_message,
      metadata: next.metadata,
      updatedAt: new Date(next.updated_at),
      completedAt: next.completed_at ? new Date(next.completed_at) : null,
    })
    .where(and(eq(scanJobs.id, jobId), eq(scanJobs.userId, existing.user_id)));

  return next;
}

export type CreateCoaReportInput = {
  scanJobId: string;
  provider: string;
  parserVersion: string;
  sourceUrl: string;
  contentHash?: string | null;
  rawMetadata?: Record<string, unknown>;
  normalizedPayload: NormalizedCoaResult;
  confidencePayload?: Record<string, unknown>;
  extractedAt?: string;
};

export async function createCoaReport(input: CreateCoaReportInput): Promise<CoaReport | null> {
  const job = await getScanJobForUser(input.scanJobId);
  if (!job) return null;

  const now = new Date().toISOString();
  const report: CoaReport = {
    id: createCoaReportId(),
    scan_job_id: input.scanJobId,
    user_id: job.user_id,
    provider: input.provider,
    parser_version: input.parserVersion,
    source_url: normalizeUrl(input.sourceUrl),
    content_hash: input.contentHash ?? null,
    raw_metadata: input.rawMetadata ?? {},
    normalized_payload: input.normalizedPayload,
    confidence_payload: input.confidencePayload ?? {},
    extracted_at: input.extractedAt ?? now,
    created_at: now,
  };

  if (!dbEnabled()) {
    const data = await readFileReports();
    data.reports[report.id] = report;
    await writeFileReports(data);
    return report;
  }

  const db = getDb()!;
  await db.insert(coaReports).values({
    id: report.id,
    scanJobId: report.scan_job_id,
    userId: report.user_id,
    provider: report.provider,
    parserVersion: report.parser_version,
    sourceUrl: report.source_url,
    contentHash: report.content_hash,
    rawMetadata: report.raw_metadata,
    normalizedPayload: report.normalized_payload,
    confidencePayload: report.confidence_payload,
    extractedAt: new Date(report.extracted_at),
    createdAt: new Date(report.created_at),
  });

  return report;
}

export async function getCoaReportForUser(
  reportId: string,
  userId?: string,
): Promise<CoaReport | null> {
  const ownerId = userId ?? (await getCurrentUserId());

  if (!dbEnabled()) {
    const data = await readFileReports();
    const report = data.reports[reportId];
    if (!report || report.user_id !== ownerId) return null;
    return report;
  }

  const db = getDb()!;
  const [row] = await db
    .select()
    .from(coaReports)
    .where(and(eq(coaReports.id, reportId), eq(coaReports.userId, ownerId)));

  return row ? toCoaReport(row) : null;
}

export async function attachCoaReportToStashItem(
  coaReportId: string,
  productId: string,
  userId?: string,
): Promise<CoaReportStashLink | null> {
  const ownerId = userId ?? (await getCurrentUserId());
  const report = await getCoaReportForUser(coaReportId, ownerId);
  if (!report) return null;

  if (!dbEnabled()) {
    const stash = await readFileStash();
    const product = stash.products.find((p) => p.id === productId);
    if (!product) return null;

    const data = await readFileReports();
    const alreadyLinked = data.links.some(
      (link) => link.coa_report_id === coaReportId && link.product_id === productId,
    );
    if (alreadyLinked) {
      return data.links.find(
        (link) => link.coa_report_id === coaReportId && link.product_id === productId,
      )!;
    }

    const link: CoaReportStashLink = {
      coa_report_id: coaReportId,
      product_id: productId,
      user_id: ownerId,
      created_at: new Date().toISOString(),
    };
    data.links.push(link);
    await writeFileReports(data);
    return link;
  }

  const db = getDb()!;
  const [product] = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.id, productId), eq(products.userId, ownerId)));

  if (!product) return null;

  const createdAt = new Date();
  await db
    .insert(coaReportStashLinks)
    .values({
      coaReportId,
      productId,
      userId: ownerId,
      createdAt,
    })
    .onConflictDoNothing();

  const [row] = await db
    .select()
    .from(coaReportStashLinks)
    .where(
      and(
        eq(coaReportStashLinks.coaReportId, coaReportId),
        eq(coaReportStashLinks.productId, productId),
        eq(coaReportStashLinks.userId, ownerId),
      ),
    );

  return row ? toCoaReportStashLink(row) : null;
}

export async function getCoaReportForScanJob(
  scanJobId: string,
  userId?: string,
): Promise<CoaReport | null> {
  const ownerId = userId ?? (await getCurrentUserId());

  if (!dbEnabled()) {
    const data = await readFileReports();
    const report = Object.values(data.reports).find(
      (r) => r.scan_job_id === scanJobId && r.user_id === ownerId,
    );
    return report ?? null;
  }

  const db = getDb()!;
  const [row] = await db
    .select()
    .from(coaReports)
    .where(and(eq(coaReports.scanJobId, scanJobId), eq(coaReports.userId, ownerId)));

  return row ? toCoaReport(row) : null;
}
