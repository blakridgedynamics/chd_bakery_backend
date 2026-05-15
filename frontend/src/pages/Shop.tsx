import { FormEvent, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/ProductCard";
import { CatalogApi, type BackendCategory } from "@/lib/api";
import { fromBackendCategory, fromBackendProduct } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import { backendKeys, useBackendCategories } from "@/hooks/useBackendContent";

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price low" },
  { value: "price_desc", label: "Price high" },
  { value: "rating", label: "Top rated" },
];

const flattenCategories = (items: BackendCategory[]): BackendCategory[] =>
  items.flatMap((item) => [item, ...flattenCategories(item.children || [])]);

const Shop = () => {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("search") || "");
  const active = params.get("category") || "all";
  const sortBy = params.get("sortBy") || "newest";
  const page = Math.max(1, Number(params.get("page") || 1) || 1);
  const { data: backendCategories = [], isLoading: categoriesLoading } = useBackendCategories();

  const categoryOptions = useMemo(() => {
    return flattenCategories(backendCategories).map(fromBackendCategory);
  }, [backendCategories]);

  const activeCategory = categoryOptions.find((category) => category.slug === active || category.id === active);
  const backendParams = {
    page,
    limit: 12,
    sortBy,
    search: params.get("search") || undefined,
    categoryId: active !== "all" ? activeCategory?.backendId : undefined,
  };

  const {
    data: productsResponse,
    isLoading: productsLoading,
    isError: productsError,
  } = useQuery({
    queryKey: backendKeys.products(backendParams),
    queryFn: () => CatalogApi.products(backendParams),
    enabled: Boolean(active === "all" || activeCategory?.backendId),
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  const liveProducts = productsResponse?.data?.map(fromBackendProduct) || [];
  const visibleProducts = liveProducts;
  const pagination = productsResponse?.pagination;
  const isLoading = productsLoading || categoriesLoading;

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (!value || value === "all" || (key === "sortBy" && value === "newest")) next.delete(key);
    else next.set(key, value);
    if (key !== "page") next.delete("page");
    setParams(next);
  };

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    updateParam("search", search.trim());
  };

  return (
    <Layout>
      <section className="border-b border-border bg-gradient-warm py-12 md:py-16">
        <div className="container text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Our menu</p>
          <h1 className="font-display mb-3 text-4xl md:text-5xl">Browse, then enquire on WhatsApp</h1>
          <p className="mx-auto max-w-xl text-muted-foreground">
            All bakes are made-to-order. Tap any item to start a WhatsApp chat and confirm availability.
          </p>
        </div>
      </section>

      <section className="container py-10">
        <div className="mb-6 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <form onSubmit={submitSearch} className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search cookies, cakes, granola..."
              className="w-full rounded-lg border border-border bg-background py-3 pl-11 pr-4 text-sm outline-none transition-smooth focus:border-primary focus:ring-2 focus:ring-ring/20"
            />
          </form>
          <label className="relative flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-sm">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(event) => updateParam("sortBy", event.target.value)}
              className="bg-transparent pr-7 outline-none"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-2 md:mx-0 md:flex-wrap md:justify-center md:px-0">
          {[{ id: "all", slug: "all", name: "All" }, ...categoryOptions].map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => updateParam("category", category.slug)}
              className={cn(
                "shrink-0 rounded-lg border px-5 py-2.5 text-sm font-medium transition-smooth",
                active === category.slug
                  ? "border-primary bg-primary text-primary-foreground shadow-soft"
                  : "border-border bg-background text-foreground/70 hover:border-primary hover:text-primary"
              )}
            >
              {category.name}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-80 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : (
          <div className="grid animate-fade-in grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {!isLoading && visibleProducts.length === 0 && (
          <div className="rounded-lg border border-border bg-card p-10 text-center shadow-card">
            <p className="font-display text-2xl">No products found</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {productsError ? "The live menu could not be reached. Try again in a moment." : "Try another category or search term."}
            </p>
          </div>
        )}

        {!isLoading && pagination && pagination.totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={!pagination.hasPrevPage}
              onClick={() => updateParam("page", String(page - 1))}
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              type="button"
              disabled={!pagination.hasNextPage}
              onClick={() => updateParam("page", String(page + 1))}
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </section>
    </Layout>
  );
};

export default Shop;
