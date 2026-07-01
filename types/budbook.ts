/**
 * BudBook domain types.
 *
 * Raw inbound shapes come from the mock JSON (and will come from the real API).
 * Normalized entity shapes are what the BudBook UI and API routes consume.
 */

// ---------------------------------------------------------------------------
// Raw inbound (mock JSON / future API response shapes)
// ---------------------------------------------------------------------------

export type TerpeneRaw = {
  name: string;
  percentage: number;
};

export type ProductRaw = {
  id: string;
  strain_name: string;
  brand: string;
  classification: string;
  category: string;
  thc_percentage: number;
  cbd_percentage: number;
  top_terpenes: TerpeneRaw[];
  remaining_quantity: { value: number; unit: string };
  lab_report_id: string;
  preferred_dispensary_id: string;
  purchase_date?: string;
};

export type HardwareRaw = {
  id: string;
  model_name: string;
  brand: string;
  ecosystem: string;
  usage_count: number;
  condition: string;
  next_scheduled_maintenance: string;
};

export type RetailDirectoryEntryRaw = {
  id: string;
  dispensary_name: string;
  location: {
    address_line: string;
    city: string;
    state: string;
    zip: string;
  };
  preferred_budtender: { name: string; contact: string };
  last_transaction_date: string;
};

export type EfficacyScores = {
  mood: number;
  pain: number;
  anxiety: number;
};

export type SessionRaw = {
  id: string;
  timestamp: string;
  variables: {
    product_id: string;
    dosage: string;
    consumption_method: string;
    pairing: string | null;
  };
  efficacy_mapping: {
    pre: EfficacyScores;
    post: EfficacyScores;
  };
  pattern_recognition: string;
};

export type BudbookMockRaw = {
  overview: unknown;
  stash: {
    products: ProductRaw[];
    hardware: HardwareRaw[];
    retail_directory: RetailDirectoryEntryRaw[];
  };
  recent_sessions: SessionRaw[];
};

// ---------------------------------------------------------------------------
// Normalized entity shapes (BudBook UI / API entity layer)
// ---------------------------------------------------------------------------

export type TerpeneProfile = {
  terpene_name: string;
  percentage: number;
};

export type Product = {
  id: string;
  name: string;
  strain_name: string;
  brand: string;
  type: 'indica' | 'sativa' | 'hybrid';
  category: string;
  thc_percentage: number;
  cbd_percentage: number;
  terpene_profile: TerpeneProfile[];
  lab_report_id: string;
  dispensary_id: string;
  /** Join key for CAA / RDA / Cannadex. Set when known. */
  product_key?: string;
};

export type InventoryItem = {
  id: string;
  product_id: string;
  quantity: number;
  unit: string;
  is_active: boolean;
  purchase_date: string;
  notes: string;
};

export type Session = {
  id: string;
  date: string;
  product_id: string;
  consumption_method: string;
  dosage: string;
  pairing_notes: string;
  rating: number;
  mood_before: number;
  mood_after: number;
  pain_before: number;
  pain_after: number;
  anxiety_before: number;
  anxiety_after: number;
  effects_felt: string[];
  activities: string[];
  session_notes: string;
  session_name: string;
};

export type Dispensary = {
  id: string;
  name: string;
  shop_name: string;
  city: string;
  state: string;
  address: string;
  zip_code: string;
  notes: string;
  last_visit_date: string;
};

export type AccessoryCategory = 'grinder' | 'vaporizer_dry_herb' | 'other';
export type AccessoryCondition = 'good' | 'needs_maintenance';

export type Accessory = {
  id: string;
  name: string;
  brand: string;
  category: AccessoryCategory;
  condition: AccessoryCondition;
  purchase_date: string;
  notes: string;
  is_favorite: boolean;
  image_url: string;
  usage_sessions_count: number;
  condition_status: string;
  next_maintenance_date: string;
  ecosystem_tag: string;
};

export type BudbookUser = {
  id: string;
  email: string;
  full_name: string;
  username: string;
  role: string;
};

export type BudbookMockPayloads = {
  overview: unknown;
  user: BudbookUser;
  products: Product[];
  inventory: InventoryItem[];
  sessions: Session[];
  dispensaries: Dispensary[];
  accessories: Accessory[];
};
