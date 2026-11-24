import type {
  AdminMe,
  ContentMap,
  ContentSection,
  LeadAdmin,
  LeadCategory,
  LeadConfirmation,
  LeadCreate,
  LeadDetail,
  LeadNote,
  LeadStatus,
  LeadSummaryRow,
  LeadUpdate,
  PortfolioCategory,
  PortfolioItem,
  PortfolioItemCreate,
  PortfolioItemUpdate,
  Testimonial,
  TestimonialCreate,
  TestimonialUpdate,
  TokenResponse,
  UploadResponse,
} from "../types/api";

const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function buildQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      sp.set(key, String(value));
    }
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

function authHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

async function parseErrorMessage(res: Response): Promise<string> {
  const payload = await res.json().catch(() => null);
  if (payload && typeof payload === "object" && "detail" in payload) {
    const detail = (payload as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0] as { msg?: string };
      if (first?.msg) return first.msg;
    }
  }
  return `Error HTTP ${res.status}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const isFormData = init?.body instanceof FormData;
  const headers: Record<string, string> = isFormData ? {} : { "Content-Type": "application/json" };

  if (init?.headers) {
    Object.assign(headers, init.headers);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  if (!res.ok) {
    throw new ApiError(res.status, await parseErrorMessage(res));
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

export interface LeadQueryFilters {
  category?: LeadCategory;
  status?: LeadStatus;
  q?: string;
  limit?: number;
  offset?: number;
}

export interface PortfolioQueryFilters {
  category?: PortfolioCategory;
  featured?: boolean;
  tag?: string;
}

export const api = {
  // Public content
  getContent: () => request<ContentMap>("/content"),

  // Public leads
  submitLead: (data: LeadCreate) =>
    request<LeadConfirmation>("/leads", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Public portfolio & testimonials
  getPortfolio: (filters?: PortfolioQueryFilters) =>
    request<PortfolioItem[]>(
      `/portfolio${buildQuery({
        category: filters?.category,
        featured: filters?.featured,
        tag: filters?.tag,
      })}`,
    ),

  getTestimonials: (category?: LeadCategory) =>
    request<Testimonial[]>(`/testimonials${buildQuery({ category })}`),

  // Auth
  login: (email: string, password: string) =>
    request<TokenResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  getMe: (token: string) =>
    request<AdminMe>("/auth/me", {
      headers: authHeader(token),
    }),

  // Content (admin)
  updateContent: (token: string, slug: string, title: string, payload: Record<string, unknown>) =>
    request<ContentSection>(`/content/${slug}`, {
      method: "PUT",
      headers: authHeader(token),
      body: JSON.stringify({ title, payload }),
    }),

  // Uploads (admin)
  uploadImage: (token: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<UploadResponse>("/uploads", {
      method: "POST",
      headers: authHeader(token),
      body: formData,
    });
  },

  // Leads CRM (admin)
  getLeads: (token: string, filters?: LeadQueryFilters) =>
    request<LeadAdmin[]>(
      `/leads${buildQuery({
        category: filters?.category,
        status: filters?.status,
        q: filters?.q,
        limit: filters?.limit,
        offset: filters?.offset,
      })}`,
      { headers: authHeader(token) },
    ),

  getLeadsSummary: (token: string) =>
    request<LeadSummaryRow[]>("/leads/summary", {
      headers: authHeader(token),
    }),

  getLeadDetail: (token: string, leadId: number) =>
    request<LeadDetail>(`/leads/${leadId}`, {
      headers: authHeader(token),
    }),

  updateLead: (token: string, leadId: number, patch: LeadUpdate) =>
    request<LeadAdmin>(`/leads/${leadId}`, {
      method: "PATCH",
      headers: authHeader(token),
      body: JSON.stringify(patch),
    }),

  addLeadNote: (token: string, leadId: number, note: string) =>
    request<LeadNote>(`/leads/${leadId}/notes`, {
      method: "POST",
      headers: authHeader(token),
      body: JSON.stringify({ note }),
    }),

  deleteLeadNote: (token: string, leadId: number, noteId: number) =>
    request<void>(`/leads/${leadId}/notes/${noteId}`, {
      method: "DELETE",
      headers: authHeader(token),
    }),

  // Portfolio (admin)
  getAdminPortfolio: (token: string, filters?: PortfolioQueryFilters) =>
    request<PortfolioItem[]>(
      `/portfolio/admin${buildQuery({
        category: filters?.category,
        featured: filters?.featured,
        tag: filters?.tag,
      })}`,
      { headers: authHeader(token) },
    ),

  createPortfolio: (token: string, data: PortfolioItemCreate) =>
    request<PortfolioItem>("/portfolio", {
      method: "POST",
      headers: authHeader(token),
      body: JSON.stringify(data),
    }),

  updatePortfolio: (token: string, itemId: number, patch: PortfolioItemUpdate) =>
    request<PortfolioItem>(`/portfolio/${itemId}`, {
      method: "PATCH",
      headers: authHeader(token),
      body: JSON.stringify(patch),
    }),

  deletePortfolio: (token: string, itemId: number) =>
    request<void>(`/portfolio/${itemId}`, {
      method: "DELETE",
      headers: authHeader(token),
    }),

  // Testimonials (admin)
  getAdminTestimonials: (token: string, category?: LeadCategory) =>
    request<Testimonial[]>(`/testimonials/admin${buildQuery({ category })}`, {
      headers: authHeader(token),
    }),

  createTestimonial: (token: string, data: TestimonialCreate) =>
    request<Testimonial>("/testimonials", {
      method: "POST",
      headers: authHeader(token),
      body: JSON.stringify(data),
    }),

  updateTestimonial: (token: string, testimonialId: number, patch: TestimonialUpdate) =>
    request<Testimonial>(`/testimonials/${testimonialId}`, {
      method: "PATCH",
      headers: authHeader(token),
      body: JSON.stringify(patch),
    }),

  deleteTestimonial: (token: string, testimonialId: number) =>
    request<void>(`/testimonials/${testimonialId}`, {
      method: "DELETE",
      headers: authHeader(token),
    }),
};
