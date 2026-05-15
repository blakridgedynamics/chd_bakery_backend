const BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export const ADMIN_TOKEN_KEY = "adminToken";
export const ADMIN_REFRESH_KEY = "adminRefreshToken";
export const ADMIN_USER_KEY = "adminUser";

export type ApiEnvelope<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  meta?: Pagination;
  pagination?: Pagination;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
  pages?: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "customer";
};

export type SiteSettings = {
  id?: string;
  brandName?: string;
  tagline?: string | null;
  footerNote?: string | null;
  phone?: string | null;
  whatsappNumber?: string | null;
  email?: string | null;
  address?: string | null;
  instagramUrl?: string | null;
  deliveryAreas?: string[] | null;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  parentId?: string | null;
  isActive: boolean;
  sortOrder: number;
  children?: Category[];
};

export type Product = {
  id: string;
  title: string;
  slug: string;
  sku: string;
  price: string;
  discountPrice?: string | null;
  description: string;
  shortDescription?: string | null;
  stock: number;
  lowStockThreshold: number;
  images: string[];
  categoryId?: string | null;
  category?: Category | null;
  tags: string[];
  isFeatured: boolean;
  isActive: boolean;
  avgRating?: string;
  reviewCount?: number;
  weight?: string | null;
  dimensions?: unknown;
  metaTitle?: string | null;
  metaDescription?: string | null;
};

export type Banner = {
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  linkUrl?: string | null;
  linkLabel?: string | null;
  sortOrder: number;
  isActive: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
};

export type Announcement = {
  id: string;
  text: string;
  emoji?: string | null;
  linkUrl?: string | null;
  linkLabel?: string | null;
  sortOrder: number;
  isActive: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
};

export type CustomCakePhoto = {
  id: string;
  title: string;
  imageUrl: string;
  altText?: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export type AdminContentPayload = {
  banners: Banner[];
  announcements: Announcement[];
  customCakePhotos: CustomCakePhoto[];
  siteSettings: SiteSettings | null;
};

export type Review = {
  id: string;
  rating: number;
  title?: string | null;
  body?: string | null;
  isApproved: boolean;
  isVerifiedPurchase: boolean;
  helpfulVotes: number;
  createdAt: string;
  user?: { id: string; name: string; email: string } | null;
  product?: { id: string; title: string; slug: string } | null;
};

const canUseStorage = typeof window !== "undefined";

export function readSessionCache<T>(key: string): T | null {
  if (!canUseStorage) return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeSessionCache<T>(key: string, value: T) {
  if (!canUseStorage) return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota/private-mode failures; network requests still work.
  }
}

export function removeSessionCache(key: string) {
  if (!canUseStorage) return;
  window.sessionStorage.removeItem(key);
}

export function getToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function getStoredAdmin(): AdminUser | null {
  try {
    const raw = localStorage.getItem(ADMIN_USER_KEY);
    return raw ? (JSON.parse(raw) as AdminUser) : null;
  } catch {
    return null;
  }
}

export function clearSession(options: { redirect?: boolean } = {}) {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_REFRESH_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);
  if (options.redirect ?? true) window.location.href = "/";
}

let refreshPromise: Promise<string | null> | null = null;

async function parseJson<T>(res: Response): Promise<ApiEnvelope<T>> {
  const text = await res.text();
  if (!text) return { success: res.ok };
  try {
    return JSON.parse(text) as ApiEnvelope<T>;
  } catch {
    return { success: res.ok, message: res.ok ? "Success" : "Unexpected server response" };
  }
}

async function tryRefresh(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const refreshToken = localStorage.getItem(ADMIN_REFRESH_KEY);
    if (!refreshToken) return null;

    try {
      const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      const json = await parseJson<{ accessToken: string; refreshToken?: string }>(res);
      if (!res.ok || !json.data?.accessToken) {
        clearSession({ redirect: false });
        return null;
      }
      localStorage.setItem(ADMIN_TOKEN_KEY, json.data.accessToken);
      if (json.data.refreshToken) localStorage.setItem(ADMIN_REFRESH_KEY, json.data.refreshToken);
      return json.data.accessToken;
    } catch {
      clearSession({ redirect: false });
      return null;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

type AdminRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  retryOnUnauthorized?: boolean;
};

export async function adminApi<T = unknown>(
  path: string,
  options: AdminRequestOptions = {}
): Promise<T> {
  const json = await adminApiRaw<T>(path, options);
  return (json.data !== undefined ? json.data : json) as T;
}

export async function adminApiRaw<T = unknown>(
  path: string,
  options: AdminRequestOptions = {}
): Promise<ApiEnvelope<T>> {
  const { body, headers, retryOnUnauthorized = true, ...init } = options;
  const token = getToken();
  const requestHeaders = new Headers(headers);

  if (body !== undefined && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }
  if (token) requestHeaders.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await parseJson<T>(res);

  if (res.status === 401 && retryOnUnauthorized && localStorage.getItem(ADMIN_REFRESH_KEY)) {
    const refreshed = await tryRefresh();
    if (refreshed) return adminApiRaw<T>(path, { ...options, retryOnUnauthorized: false });
  }

  if (!res.ok || json.success === false) {
    throw new Error(json.message || json.error || `Request failed ${res.status}`);
  }

  return json;
}

export async function publicApi<T = unknown>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  const json = await parseJson<T>(res);
  if (!res.ok || json.success === false) {
    throw new Error(json.message || json.error || `Request failed ${res.status}`);
  }
  return (json.data !== undefined ? json.data : json) as T;
}

export async function adminUpload<T = unknown>(path: string, formData: FormData): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });
  const json = await parseJson<T>(res);
  if (!res.ok || json.success === false) {
    throw new Error(json.message || json.error || `Upload failed ${res.status}`);
  }
  return (json.data !== undefined ? json.data : json) as T;
}

export function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

export function fromDateTimeLocal(value: string) {
  return value ? new Date(value).toISOString() : null;
}
