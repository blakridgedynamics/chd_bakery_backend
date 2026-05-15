import { useSearchParams, Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/ProductCard";
import { CatalogApi } from "@/lib/api";
import { fromBackendProduct } from "@/lib/catalog";
import { backendKeys } from "@/hooks/useBackendContent";

const CategoryPage = () => {
  const { slug = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get("page") || 1) || 1);
  const sort = params.get("sort") || "newest";

  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: backendKeys.category(slug),
    queryFn: () => CatalogApi.category(slug),
    enabled: Boolean(slug),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const { data: productsResponse, isLoading: productsLoading } = useQuery({
    queryKey: backendKeys.categoryProducts(slug, { page, limit: 12, sort }),
    queryFn: () => CatalogApi.categoryProducts(slug, { page, limit: 12, sort }),
    enabled: Boolean(slug),
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  const products = productsResponse?.data?.map(fromBackendProduct) || [];
  const pagination = productsResponse?.pagination;
  const isLoading = categoryLoading || productsLoading;

  const updatePage = (nextPage: number) => {
    const next = new URLSearchParams(params);
    next.set("page", String(nextPage));
    setParams(next);
  };

  return (
    <Layout>
      <section className="border-b border-border bg-gradient-warm py-12 md:py-16">
        <div className="container">
          <Link to="/shop" className="mb-4 inline-block text-sm font-semibold text-primary hover:underline">
            Back to menu
          </Link>
          <h1 className="font-display text-4xl md:text-5xl">{category?.name || "Category"}</h1>
          {category?.description && <p className="mt-3 max-w-2xl text-muted-foreground">{category.description}</p>}
        </div>
      </section>

      <section className="container py-10">
        <div className="mb-6 flex justify-end">
          <label className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm">
            <select
              value={sort}
              onChange={(event) => {
                const next = new URLSearchParams(params);
                next.set("sort", event.target.value);
                next.delete("page");
                setParams(next);
              }}
              className="bg-transparent outline-none"
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price low</option>
              <option value="price_desc">Price high</option>
              <option value="popular">Popular</option>
            </select>
          </label>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-80 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : products.length ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-10 text-center shadow-card">
            <p className="font-display text-2xl">No products found</p>
            <p className="mt-2 text-sm text-muted-foreground">This category is waiting for products.</p>
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={!pagination.hasPrevPage}
              onClick={() => updatePage(page - 1)}
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
              onClick={() => updatePage(page + 1)}
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

export default CategoryPage;
