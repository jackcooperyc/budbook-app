import { and, eq } from 'drizzle-orm';
import { readFile, writeFile, mkdir } from 'fs/promises';
import type { CircleGroup, FriendProfile } from '@/types/budbook';
import { getCurrentUserId, ensureUserExists } from '@lib/budbook-user/currentUser';
import { dbEnabled, getDb } from '@lib/db/client';
import { circleMembers, circles, friendships, users } from '@lib/db/schema';
import { dataFile, getDataDir } from '@lib/data-dir';

const SOCIAL_FILE = dataFile('local-social.json');

type SocialFile = {
  friends: Record<string, FriendProfile[]>;
  circles: Record<string, CircleGroup[]>;
};

const EMPTY: SocialFile = { friends: {}, circles: {} };

function demoSeedingEnabled(): boolean {
  // Demo seed data should never appear in production user-facing flows.
  return process.env.NODE_ENV !== 'production' && process.env.BUDBOOK_MOCK_ENABLED === '1';
}

async function ensureSocialFile(): Promise<void> {
  await mkdir(getDataDir(), { recursive: true });
  try {
    await readFile(SOCIAL_FILE, 'utf8');
  } catch {
    await writeFile(SOCIAL_FILE, JSON.stringify(EMPTY, null, 2), 'utf8');
  }
}

async function readSocialFile(): Promise<SocialFile> {
  await ensureSocialFile();
  const raw = await readFile(SOCIAL_FILE, 'utf8');
  return JSON.parse(raw) as SocialFile;
}

async function writeSocialFile(data: SocialFile): Promise<void> {
  await ensureSocialFile();
  await writeFile(SOCIAL_FILE, JSON.stringify(data, null, 2), 'utf8');
}

async function seedDemoSocialDb(userId: string): Promise<void> {
  if (!demoSeedingEnabled()) return;
  const db = getDb()!;

  // Seed data for local mock mode only.
  const demoUsers = [
    { id: 'user-demo-alex', email: 'alex@budbook.demo', full_name: 'Alex Chen', username: 'alexchen' },
    { id: 'user-demo-morgan', email: 'morgan@budbook.demo', full_name: 'Morgan Lee', username: 'morganl' },
    { id: 'user-demo-riley', email: 'riley@budbook.demo', full_name: 'Riley Santos', username: 'rsantos' },
  ];
  const demoFriends: Omit<FriendProfile, 'id'>[] = [
    { name: 'Alex Chen', username: 'alexchen', online: true, sessionsShared: 12, lastActive: new Date().toISOString(), favoriteStrain: 'Blue Dream' },
    { name: 'Morgan Lee', username: 'morganl', online: false, sessionsShared: 8, lastActive: new Date(Date.now() - 86400000).toISOString(), favoriteStrain: 'GMO Cookies' },
    { name: 'Riley Santos', username: 'rsantos', online: true, sessionsShared: 5, lastActive: new Date().toISOString(), favoriteStrain: 'Jack Herer' },
  ];
  const demoCircles: CircleGroup[] = [
    { id: 'circle-1', name: 'PDX Evening Wind-Down', description: 'Micro-dose logs and sleep hygiene for Portland creatives.', memberCount: 14, isPrivate: true, recentActivity: 'Alex shared a GMO Cookies session · 2h ago' },
    { id: 'circle-2', name: 'CBD-Forward Wellness', description: 'Tincture dosing, low-THC experiments, and anxiety tracking.', memberCount: 28, isPrivate: false, recentActivity: "Morgan posted a Charlotte's Web efficacy chart · 5h ago" },
    { id: 'circle-3', name: 'CŪPR Hardware Crew', description: 'Vaporizer maintenance, grind consistency, and session prep.', memberCount: 9, isPrivate: true, recentActivity: 'Riley uploaded chamber clean photos · yesterday' },
  ];

  for (const demo of demoUsers) {
    await ensureUserExists({ ...demo, role: 'user' });
  }

  const existing = await db.select().from(friendships).where(eq(friendships.userId, userId)).limit(1);
  if (existing.length > 0) return;

  for (let i = 0; i < demoUsers.length; i++) {
    const demo = demoUsers[i];
    const meta = demoFriends[i];
    await db.insert(friendships).values({
      id: `friend-${userId}-${demo.id}`,
      userId,
      friendUserId: demo.id,
      status: 'accepted',
      sessionsShared: meta.sessionsShared,
    }).onConflictDoNothing();
  }

  for (const circle of demoCircles) {
    await db.insert(circles).values({
      id: `${circle.id}-${userId}`,
      ownerId: userId,
      name: circle.name,
      description: circle.description,
      isPrivate: circle.isPrivate,
      recentActivity: circle.recentActivity,
    }).onConflictDoNothing();

    await db.insert(circleMembers).values({
      circleId: `${circle.id}-${userId}`,
      userId,
    }).onConflictDoNothing();
  }
}

async function seedDemoSocialFile(userId: string): Promise<void> {
  if (!demoSeedingEnabled()) return;
  const data = await readSocialFile();
  if ((data.friends[userId]?.length ?? 0) > 0) return;

  const demoUsers = [
    { id: 'user-demo-alex', email: 'alex@budbook.demo', full_name: 'Alex Chen', username: 'alexchen' },
    { id: 'user-demo-morgan', email: 'morgan@budbook.demo', full_name: 'Morgan Lee', username: 'morganl' },
    { id: 'user-demo-riley', email: 'riley@budbook.demo', full_name: 'Riley Santos', username: 'rsantos' },
  ];
  const demoFriends: Omit<FriendProfile, 'id'>[] = [
    { name: 'Alex Chen', username: 'alexchen', online: true, sessionsShared: 12, lastActive: new Date().toISOString(), favoriteStrain: 'Blue Dream' },
    { name: 'Morgan Lee', username: 'morganl', online: false, sessionsShared: 8, lastActive: new Date(Date.now() - 86400000).toISOString(), favoriteStrain: 'GMO Cookies' },
    { name: 'Riley Santos', username: 'rsantos', online: true, sessionsShared: 5, lastActive: new Date().toISOString(), favoriteStrain: 'Jack Herer' },
  ];
  const demoCircles: CircleGroup[] = [
    { id: 'circle-1', name: 'PDX Evening Wind-Down', description: 'Micro-dose logs and sleep hygiene for Portland creatives.', memberCount: 14, isPrivate: true, recentActivity: 'Alex shared a GMO Cookies session · 2h ago' },
    { id: 'circle-2', name: 'CBD-Forward Wellness', description: 'Tincture dosing, low-THC experiments, and anxiety tracking.', memberCount: 28, isPrivate: false, recentActivity: "Morgan posted a Charlotte's Web efficacy chart · 5h ago" },
    { id: 'circle-3', name: 'CŪPR Hardware Crew', description: 'Vaporizer maintenance, grind consistency, and session prep.', memberCount: 9, isPrivate: true, recentActivity: 'Riley uploaded chamber clean photos · yesterday' },
  ];

  data.friends[userId] = demoUsers.map((u, i) => ({
    id: u.id,
    ...demoFriends[i],
  }));
  data.circles[userId] = demoCircles.map((c) => ({ ...c, id: `${c.id}-${userId}` }));
  await writeSocialFile(data);
}

export async function listFriends(): Promise<FriendProfile[]> {
  const userId = await getCurrentUserId();

  if (!dbEnabled()) {
    await seedDemoSocialFile(userId);
    const data = await readSocialFile();
    return data.friends[userId] ?? [];
  }

  await seedDemoSocialDb(userId);
  const db = getDb()!;

  const rows = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      username: users.username,
      sessionsShared: friendships.sessionsShared,
      createdAt: friendships.createdAt,
    })
    .from(friendships)
    .innerJoin(users, eq(users.id, friendships.friendUserId))
    .where(eq(friendships.userId, userId));

  return rows.map((r, i) => ({
    id: r.id,
    name: r.fullName,
    username: r.username,
    online: i % 2 === 0,
    sessionsShared: r.sessionsShared,
    lastActive: r.createdAt.toISOString(),
    favoriteStrain: undefined,
  }));
}

export async function listCircles(): Promise<CircleGroup[]> {
  const userId = await getCurrentUserId();

  if (!dbEnabled()) {
    await seedDemoSocialFile(userId);
    const data = await readSocialFile();
    return data.circles[userId] ?? [];
  }

  await seedDemoSocialDb(userId);
  const db = getDb()!;

  const rows = await db
    .select({
      id: circles.id,
      name: circles.name,
      description: circles.description,
      isPrivate: circles.isPrivate,
      recentActivity: circles.recentActivity,
    })
    .from(circles)
    .innerJoin(circleMembers, eq(circleMembers.circleId, circles.id))
    .where(eq(circleMembers.userId, userId));

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    memberCount: 1,
    isPrivate: r.isPrivate,
    recentActivity: r.recentActivity,
  }));
}

export async function createCircle(input: {
  name: string;
  description?: string;
  isPrivate?: boolean;
}): Promise<CircleGroup> {
  const userId = await getCurrentUserId();
  const id = `circle-${Date.now()}`;
  const circle: CircleGroup = {
    id,
    name: input.name.trim(),
    description: input.description?.trim() ?? '',
    memberCount: 1,
    isPrivate: input.isPrivate ?? false,
    recentActivity: 'Circle created',
  };

  if (!dbEnabled()) {
    const data = await readSocialFile();
    const list = data.circles[userId] ?? [];
    data.circles[userId] = [circle, ...list];
    await writeSocialFile(data);
    return circle;
  }

  const db = getDb()!;
  await db.insert(circles).values({
    id,
    ownerId: userId,
    name: circle.name,
    description: circle.description,
    isPrivate: circle.isPrivate,
    recentActivity: circle.recentActivity,
  });
  await db.insert(circleMembers).values({ circleId: id, userId });

  return circle;
}
