import type { Product, TerpeneProfile } from './budbook';

export type ComplianceStatus = 'pending' | 'confirmed';

export type CaaParseConfidence = 'high';

export type CaaParseSource = 'url' | 'text' | 'qr';

/** Result of CAA COA ingest — authoritative for terpenes and lab_report_id. */
export type CaaCoaParseResult = {
  lab_report_id: string;
  product_key: string;
  strain_name: string;
  brand: string;
  type: Product['type'];
  category: string;
  thc_percentage: number;
  cbd_percentage: number;
  terpene_profile: TerpeneProfile[];
  compliance_status: 'confirmed';
  confidence: CaaParseConfidence;
  parse_source: CaaParseSource;
};

/** CAA enrichment joined on RDA `product_key`. */
export type CaaEnrichment = {
  product_key: string;
  compliance_status: ComplianceStatus;
  lab_report_id: string | null;
  thc_percentage: number | null;
  cbd_percentage: number | null;
  type: Product['type'];
  terpene_profile: TerpeneProfile[];
  strain_name?: string;
  brand?: string;
};

/** Cannadex catalog entry — confirmed CAA registry record. */
export type CaaCatalogEntry = CaaEnrichment & {
  strain_name: string;
  brand: string;
  category: string;
  registered_at: string;
};

export type CaaParseResponse = {
  parse: CaaCoaParseResult;
  duplicate_in_stash: boolean;
  existing_product_id: string | null;
};
