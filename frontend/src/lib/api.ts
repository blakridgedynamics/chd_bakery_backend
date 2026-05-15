const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(/\/$/, "");

export const PUBLIC_ERROR_MESSAGE = "Something went wrong. Please try again.";
export const LOGIN_ERROR_MESSAGE = "Wrong credentials.";

export const ACCESS_TOKEN_KEY = "cb_access_token";
export const REFRESH_TOKEN_KEY = "cb_refresh_token";
export const USER_STORAGE_KEY = "cb_user";

export type ApiEnvelope<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  count?: number;
  pagination?: Pagination;
  meta?: Pagination;
  category?: unknown;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type BackendUser = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  isEmailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string | null;
};

export type AuthSession = {
  user: BackendUser;
  accessToken: string;
  refreshToken: string;
};

export type Banner = {
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  linkUrl?: string | null;
  linkLabel?: string | null;
  sortOrder?: number;
};

export type Announcement = {
  id: string;
  text: string;
  emoji?: string | null;
  linkUrl?: string | null;
  linkLabel?: string | null;
  sortOrder?: number;
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

export type CustomCakePhoto = {
  id: string;
  title: string;
  imageUrl: string;
  altText?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

export type HomeContent = {
  siteSettings: SiteSettings | null;
  banners: Banner[];
  announcements: Announcement[];
  categories: BackendCategory[];
  featuredProducts: BackendProduct[];
};

export type BackendCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  children?: BackendCategory[];
};

export type BackendProduct = {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string | null;
  sku?: string;
  price: string | number;
  discountPrice?: string | number | null;
  stock?: number;
  images?: string[] | null;
  categoryId?: string | null;
  tags?: string[] | null;
  isFeatured?: boolean;
  avgRating?: string | number;
  reviewCount?: number;
  soldCount?: number;
  weight?: string | number | null;
  category?: BackendCategory | null;
};

export type ProductReview = {
  id: string;
  rating: number;
  title?: string | null;
  body?: string | null;
  isVerifiedPurchase?: boolean;
  helpfulVotes?: number;
  images?: string[] | null;
  createdAt?: string;
  userId?: string;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const isBrowser = typeof window !== "undefined";

const getStored = (key: string) => (isBrowser ? window.localStorage.getItem(key) : null);

export const getStoredUser = () => {
  try {
    const raw = getStored(USER_STORAGE_KEY);
    if (!raw) return null;
    const { role: _role, ...user } = JSON.parse(raw) as BackendUser & { role?: unknown };
    return user;
  } catch {
    return null;
  }
};

export const getAccessToken = () => getStored(ACCESS_TOKEN_KEY);
export const getRefreshToken = () => getStored(REFRESH_TOKEN_KEY);

export const storeSession = (session: AuthSession) => {
  if (!isBrowser) return;
  const { role: _role, ...user } = session.user as BackendUser & { role?: unknown };
  window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  window.localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
};

export const updateStoredUser = (user: BackendUser | null) => {
  if (!isBrowser) return;
  if (user) {
    const { role: _role, ...safeUser } = user as BackendUser & { role?: unknown };
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(safeUser));
  }
  else window.localStorage.removeItem(USER_STORAGE_KEY);
};

export const clearSession = () => {
  if (!isBrowser) return;
  window.localStorage.removeItem(USER_STORAGE_KEY);
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
};

const toUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

const parsePayload = async <T>(response: Response): Promise<ApiEnvelope<T>> => {
  const text = await response.text();
  if (!text) return { success: response.ok } as ApiEnvelope<T>;

  try {
    return JSON.parse(text) as ApiEnvelope<T>;
  } catch {
    return {
      success: response.ok,
      message: response.ok ? "Success" : "Unexpected server response",
    };
  }
};

const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const response = await fetch(toUrl("/auth/refresh"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  const payload = await parsePayload<{ accessToken: string; refreshToken: string }>(response);

  if (!response.ok || !payload.success || !payload.data?.accessToken) {
    clearSession();
    return null;
  }

  if (isBrowser) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, payload.data.accessToken);
    window.localStorage.setItem(REFRESH_TOKEN_KEY, payload.data.refreshToken);
  }

  return payload.data.accessToken;
};

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
  retryOnUnauthorized?: boolean;
};

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<ApiEnvelope<T>> {
  const { body, auth, retryOnUnauthorized = true, headers, ...init } = options;
  const token = auth ? getAccessToken() : null;
  const requestHeaders = new Headers(headers);

  if (body !== undefined && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }
  if (token) requestHeaders.set("Authorization", `Bearer ${token}`);

  const response = await fetch(toUrl(path), {
    ...init,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await parsePayload<T>(response);

  if (response.status === 401 && auth && retryOnUnauthorized) {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) {
      return apiRequest<T>(path, { ...options, retryOnUnauthorized: false });
    }
  }

  if (!response.ok || payload.success === false) {
    const publicMessage =
      response.status === 401 || response.status === 403
        ? LOGIN_ERROR_MESSAGE
        : PUBLIC_ERROR_MESSAGE;
    throw new ApiError(publicMessage, response.status);
  }

  return payload;
}

export const AuthApi = {
  async login(email: string, password: string) {
    const response = await apiRequest<AuthSession>("/auth/login", {
      method: "POST",
      body: { email, password, audience: "customer" },
    });
    if (!response.data) throw new ApiError(LOGIN_ERROR_MESSAGE, 500);
    storeSession(response.data);
    return response.data;
  },

  async requestRegistrationOtp(input: { name: string; email: string; phone?: string }) {
    return apiRequest<null>("/auth/register/request-otp", {
      method: "POST",
      body: input,
    });
  },

  async verifyRegistration(input: { email: string; otp: string; password: string }) {
    const response = await apiRequest<AuthSession>("/auth/register/verify", {
      method: "POST",
      body: input,
    });
    if (!response.data) throw new ApiError(PUBLIC_ERROR_MESSAGE, 500);
    storeSession(response.data);
    return response.data;
  },

  async requestPasswordOtp(email: string) {
    return apiRequest<null>("/auth/password/request-otp", {
      method: "POST",
      body: { email },
    });
  },

  async resetPassword(input: { email: string; otp: string; password: string }) {
    return apiRequest<null>("/auth/password/reset", {
      method: "POST",
      body: input,
    });
  },

  async logout() {
    try {
      await apiRequest<null>("/auth/logout", { method: "POST", auth: true });
    } finally {
      clearSession();
    }
  },

  async profile() {
    const response = await apiRequest<BackendUser>("/profile", { auth: true });
    if (!response.data) throw new ApiError(PUBLIC_ERROR_MESSAGE, 404);
    updateStoredUser(response.data);
    return response.data;
  },
};

export const ContentApi = {
  async home() {
    const response = await apiRequest<HomeContent>("/home");
    return response.data || {
      siteSettings: null,
      banners: [],
      announcements: [],
      categories: [],
      featuredProducts: [],
    };
  },

  async siteSettings() {
    const response = await apiRequest<SiteSettings>("/site-settings");
    if (!response.data) return {};
    return response.data;
  },

  async banners() {
    const response = await apiRequest<Banner[]>("/banners");
    return response.data || [];
  },

  async announcements() {
    const response = await apiRequest<Announcement[]>("/announcements");
    return response.data || [];
  },
};

export const CatalogApi = {
  async categories() {
    const response = await apiRequest<BackendCategory[]>("/categories");
    return response.data || [];
  },

  async products(params: Record<string, string | number | undefined> = {}) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") search.set(key, String(value));
    });
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return apiRequest<BackendProduct[]>(`/products${suffix}`);
  },

  async featuredProducts() {
    const response = await apiRequest<BackendProduct[]>("/products/featured");
    return response.data || [];
  },

  async product(slug: string) {
    const response = await apiRequest<BackendProduct>(`/products/${encodeURIComponent(slug)}`);
    return response.data || null;
  },

  async productReviews(slug: string) {
    const response = await apiRequest<ProductReview[]>(`/products/${encodeURIComponent(slug)}/reviews`);
    return response.data || [];
  },

  async category(slug: string) {
    const response = await apiRequest<BackendCategory>(`/categories/${encodeURIComponent(slug)}`);
    return response.data || null;
  },

  async categoryProducts(slug: string, params: Record<string, string | number | undefined> = {}) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") search.set(key, String(value));
    });
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return apiRequest<BackendProduct[]>(`/categories/${encodeURIComponent(slug)}/products${suffix}`);
  },

  async customCakePhotos() {
    const response = await apiRequest<CustomCakePhoto[]>("/custom-cakes/photos");
    return response.data || [];
  },
};

export const MessagesApi = {
  async create(input: { name?: string; email?: string; phone?: string; subject?: string; message: string }) {
    const isGuestPayload = Boolean(input.name || input.email);
    return apiRequest<null>("/messages", {
      method: "POST",
      auth: !isGuestPayload && Boolean(getAccessToken()),
      body: input,
    });
  },
};
