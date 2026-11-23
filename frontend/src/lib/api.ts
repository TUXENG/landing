const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";

export interface ContentSection {
  slug: string;
  title: string;
  payload: Record<string, unknown>;
  updated_at?: string | null;
}

export type ContentMap = Record<string, ContentSection>;

export interface LeadPayload {
  name: string;
  email: string;
  phone?: string;
  message: string;
  source?: string;
  website?: string;
}

export interface LeadRecord {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  source: string;
  created_at: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(typeof err.detail === "string" ? err.detail : `Error HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

export const api = {
  getContent: () => request<ContentMap>("/content"),
  submitLead: (data: LeadPayload) =>
    request<{ received: boolean; message: string }>("/leads", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  login: (email: string, password: string) =>
    request<{ access_token: string; token_type: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  getLeads: (token: string) =>
    request<LeadRecord[]>("/leads", {
      headers: { Authorization: `Bearer ${token}` },
    }),
  updateContent: (token: string, slug: string, title: string, payload: Record<string, unknown>) =>
    request<ContentSection>(`/content/${slug}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title, payload }),
    }),
};
