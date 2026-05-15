import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CatalogApi,
  ContentApi,
  type HomeContent,
  type SiteSettings,
  type Announcement,
  type Banner,
} from "@/lib/api";

const PUBLIC_CONTENT_STALE_TIME = 5 * 60 * 1000;
const HOME_CONTENT_STORAGE_KEY = "cb_home_content_v1";
const HOME_CONTENT_STORAGE_MAX_AGE = 24 * 60 * 60 * 1000;

type CachedHomeContent = {
  data: HomeContent;
  updatedAt: number;
};

function readCachedHomeContent(): CachedHomeContent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(HOME_CONTENT_STORAGE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as CachedHomeContent;
    if (!cached?.data || !cached.updatedAt) return null;
    if (Date.now() - cached.updatedAt > HOME_CONTENT_STORAGE_MAX_AGE) return null;
    return cached;
  } catch {
    return null;
  }
}

function writeCachedHomeContent(data: HomeContent, updatedAt: number) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      HOME_CONTENT_STORAGE_KEY,
      JSON.stringify({ data, updatedAt })
    );
  } catch {
    // Storage can be unavailable in private mode; the network cache still works.
  }
}

export const backendKeys = {
  home: ["backend", "home"] as const,
  siteSettings: ["backend", "site-settings"] as const,
  banners: ["backend", "banners"] as const,
  announcements: ["backend", "announcements"] as const,
  categories: ["backend", "categories"] as const,
  featured: ["backend", "featured-products"] as const,
  products: (params: Record<string, unknown>) => ["backend", "products", params] as const,
  product: (slug: string) => ["backend", "product", slug] as const,
  productReviews: (slug: string) => ["backend", "product-reviews", slug] as const,
  category: (slug: string) => ["backend", "category", slug] as const,
  categoryProducts: (slug: string, params: Record<string, unknown>) => ["backend", "category-products", slug, params] as const,
  customCakePhotos: ["backend", "custom-cake-photos"] as const,
};

export const useHomeContent = () => {
  const queryClient = useQueryClient();
  const cached = useMemo(readCachedHomeContent, []);
  const query = useQuery({
    queryKey: backendKeys.home,
    queryFn: ContentApi.home,
    staleTime: PUBLIC_CONTENT_STALE_TIME,
    gcTime: HOME_CONTENT_STORAGE_MAX_AGE,
    initialData: cached?.data,
    initialDataUpdatedAt: cached?.updatedAt,
    retry: 1,
  });

  useEffect(() => {
    if (!query.data) return;
    queryClient.setQueryData(backendKeys.siteSettings, query.data.siteSettings ?? {});
    queryClient.setQueryData(backendKeys.banners, query.data.banners);
    queryClient.setQueryData(backendKeys.announcements, query.data.announcements);
    queryClient.setQueryData(backendKeys.categories, query.data.categories);
    queryClient.setQueryData(backendKeys.featured, query.data.featuredProducts);
    writeCachedHomeContent(query.data, query.dataUpdatedAt || Date.now());
  }, [query.data, query.dataUpdatedAt, queryClient]);

  return query;
};

export const useSiteSettings = (options: { initialData?: SiteSettings | null; enabled?: boolean } = {}) =>
  useQuery({
    queryKey: backendKeys.siteSettings,
    queryFn: ContentApi.siteSettings,
    staleTime: PUBLIC_CONTENT_STALE_TIME,
    initialData: options.initialData ?? undefined,
    enabled: options.enabled,
    retry: 1,
  });

export const useBanners = (options: { initialData?: Banner[]; enabled?: boolean } = {}) =>
  useQuery({
    queryKey: backendKeys.banners,
    queryFn: ContentApi.banners,
    staleTime: PUBLIC_CONTENT_STALE_TIME,
    initialData: options.initialData,
    enabled: options.enabled,
    retry: 1,
  });

export const useAnnouncements = (options: { initialData?: Announcement[]; enabled?: boolean } = {}) =>
  useQuery({
    queryKey: backendKeys.announcements,
    queryFn: ContentApi.announcements,
    staleTime: PUBLIC_CONTENT_STALE_TIME,
    initialData: options.initialData,
    enabled: options.enabled,
    retry: 1,
  });

export const useBackendCategories = () =>
  useQuery({
    queryKey: backendKeys.categories,
    queryFn: CatalogApi.categories,
    staleTime: PUBLIC_CONTENT_STALE_TIME,
    retry: 1,
  });

export const useFeaturedProducts = () =>
  useQuery({
    queryKey: backendKeys.featured,
    queryFn: CatalogApi.featuredProducts,
    staleTime: PUBLIC_CONTENT_STALE_TIME,
    retry: 1,
  });

export const useCustomCakePhotos = () =>
  useQuery({
    queryKey: backendKeys.customCakePhotos,
    queryFn: CatalogApi.customCakePhotos,
    staleTime: PUBLIC_CONTENT_STALE_TIME,
    retry: 1,
  });
