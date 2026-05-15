import hero from "@/assets/hero.jpg";
import type { BackendCategory, BackendProduct } from "@/lib/api";

export type CatalogCategory = {
  id: string;
  backendId?: string;
  name: string;
  slug: string;
  image?: string;
  blurb?: string;
};

export type CatalogProduct = {
  id: string;
  slug?: string;
  name: string;
  category?: string;
  categoryId?: string | null;
  image: string;
  description: string;
  shortDescription?: string;
  price: number;
  discountPrice?: number | null;
  tag?: string;
  badge?: string;
  stock?: number;
  avgRating?: number;
  reviewCount?: number;
};

const toNumber = (value: string | number | null | undefined) => {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : 0;
};

const firstImage = (images?: string[] | null) => {
  if (Array.isArray(images) && images.length > 0 && images[0]) return images[0];
  return hero;
};

export const fromBackendProduct = (product: BackendProduct): CatalogProduct => {
  const tags = Array.isArray(product.tags) ? product.tags.filter(Boolean) : [];
  const price = toNumber(product.price);
  const discountPrice = product.discountPrice == null ? null : toNumber(product.discountPrice);
  const stock = product.stock ?? 0;

  return {
    id: product.slug || product.id,
    slug: product.slug,
    name: product.title,
    category: product.category?.name,
    categoryId: product.categoryId,
    image: firstImage(product.images),
    description: product.description || product.shortDescription || "",
    shortDescription: product.shortDescription || product.description,
    price: discountPrice || price,
    discountPrice,
    badge: product.isFeatured ? "Featured" : stock <= 0 ? "Sold out" : undefined,
    tag: tags[0],
    stock,
    avgRating: toNumber(product.avgRating),
    reviewCount: product.reviewCount,
  };
};

export const fromBackendCategory = (category: BackendCategory): CatalogCategory => ({
  id: category.slug || category.id,
  backendId: category.id,
  name: category.name,
  slug: category.slug,
  image: category.image || undefined,
  blurb: category.description || undefined,
});
