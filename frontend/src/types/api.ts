export type TabSlug = "desarrollo" | "soporte" | "academia";
export type LeadCategory = TabSlug | "general";
export type PortfolioCategory = TabSlug;
export type LeadModality = "presencial" | "remoto" | "hibrido";
export type LeadStatus = "nuevo" | "contactado" | "en_proceso" | "cerrado" | "archivado";

export type ContentSlug =
  | "hero"
  | "tab_desarrollo"
  | "tab_soporte"
  | "tab_academia"
  | "faq"
  | "contact_channels";

export interface TrustPillar {
  title: string;
  description: string;
}

export interface HeroPayload {
  badge?: string;
  title?: string;
  subtitle?: string;
  cta_primary_text?: string;
  cta_whatsapp_text?: string;
  trust_pillars?: TrustPillar[];
}

export interface TabServiceCard {
  title: string;
  description: string;
  icon?: string;
}

export interface AdvisoryOption {
  title: string;
  description: string;
}

export interface TabDesarrolloPayload {
  target_audience?: string;
  value_proposition?: string;
  cta_text?: string;
  whatsapp_prefill?: string;
  services?: TabServiceCard[];
}

export interface TabSoportePayload {
  target_audience?: string;
  value_proposition?: string;
  diagnostico_info?: string;
  cta_text?: string;
  whatsapp_prefill?: string;
  services?: TabServiceCard[];
}

export interface TabAcademiaPayload {
  target_audience?: string;
  value_proposition?: string;
  cta_text?: string;
  whatsapp_prefill?: string;
  courses?: TabServiceCard[];
  advisory_options?: AdvisoryOption[];
}

export interface FaqItem {
  category: LeadCategory;
  question: string;
  answer: string;
}

export interface FaqPayload {
  items?: FaqItem[];
}

export interface ContactChannelsPayload {
  whatsapp?: string;
  whatsapp_default_message?: string;
  email?: string;
  github?: string;
  linkedin?: string;
  youtube?: string;
  instagram?: string;
  tiktok?: string;
}

export interface ContentSection<T = Record<string, unknown>> {
  slug: string;
  title: string;
  payload: T;
  updated_at?: string | null;
}

export interface ContentMap {
  hero?: ContentSection<HeroPayload>;
  tab_desarrollo?: ContentSection<TabDesarrolloPayload>;
  tab_soporte?: ContentSection<TabSoportePayload>;
  tab_academia?: ContentSection<TabAcademiaPayload>;
  faq?: ContentSection<FaqPayload>;
  contact_channels?: ContentSection<ContactChannelsPayload>;
  [key: string]: ContentSection<unknown> | undefined;
}

export interface LeadCreate {
  name: string;
  email: string;
  phone?: string;
  service_category?: LeadCategory;
  subcategory?: string;
  modality?: LeadModality;
  estimated_budget?: string;
  message: string;
  source?: string;
  website?: string;
}

export interface LeadConfirmation {
  received: boolean;
  message: string;
}

export interface LeadUpdate {
  status?: LeadStatus;
  service_category?: LeadCategory;
  subcategory?: string | null;
  modality?: LeadModality | null;
  estimated_budget?: string | null;
  phone?: string | null;
}

export interface LeadNote {
  id: number;
  lead_id: number;
  author_id: number | null;
  note: string;
  created_at: string;
}

export interface LeadAdmin {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  service_category: LeadCategory;
  subcategory: string | null;
  modality: LeadModality | null;
  estimated_budget: string | null;
  message: string;
  source: string;
  status: LeadStatus;
  created_at: string;
  updated_at: string;
  notes_count: number;
  last_note: string | null;
  last_note_at: string | null;
}

export interface LeadDetail extends LeadAdmin {
  notes: LeadNote[];
}

export interface LeadSummaryRow {
  service_category: LeadCategory;
  nuevos: number;
  contactados: number;
  en_proceso: number;
  cerrados: number;
  archivados: number;
  total: number;
}

export interface PortfolioItem {
  id: number;
  category: PortfolioCategory;
  title: string;
  slug: string | null;
  client_label: string | null;
  description: string;
  tech_tags: string[];
  image_url: string;
  before_image_url: string | null;
  demo_url: string | null;
  video_url: string | null;
  is_featured: boolean;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface PortfolioItemCreate {
  category: PortfolioCategory;
  title: string;
  slug?: string | null;
  client_label?: string | null;
  description: string;
  tech_tags?: string[];
  image_url: string;
  before_image_url?: string | null;
  demo_url?: string | null;
  video_url?: string | null;
  is_featured?: boolean;
  sort_order?: number;
  is_published?: boolean;
}

export type PortfolioItemUpdate = Partial<PortfolioItemCreate>;

export interface Testimonial {
  id: number;
  category: LeadCategory;
  client_name: string;
  client_role: string | null;
  company_or_institution: string | null;
  comment: string;
  rating: number;
  avatar_url: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface TestimonialCreate {
  category: LeadCategory;
  client_name: string;
  client_role?: string | null;
  company_or_institution?: string | null;
  comment: string;
  rating?: number;
  avatar_url?: string | null;
  sort_order?: number;
  is_published?: boolean;
}

export type TestimonialUpdate = Partial<TestimonialCreate>;

export interface AdminMe {
  id: number;
  email: string;
  is_active: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UploadResponse {
  filename: string;
  url: string;
  size_bytes: number;
}
