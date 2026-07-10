/**
 * BudBook domain types.
 */

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

export type SocialPost = {
  id: string;
  author: string;
  authorSeed: string;
  body: string;
  strain?: string;
  circle?: string;
  createdAt: string;
  likes: number;
};

export type FriendProfile = {
  id: string;
  name: string;
  username: string;
  online: boolean;
  sessionsShared: number;
  lastActive: string;
  favoriteStrain?: string;
};

export type CircleGroup = {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  isPrivate: boolean;
  recentActivity: string;
};
