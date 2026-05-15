import { asc, desc, eq, gt, isNull, lte, and, or } from "drizzle-orm";
import { db } from "@/db";
import { announcements, banners, categories, products, siteSettings } from "@/db/schema";
import { cache, CacheKeys } from "@/lib/cache";
import {
  PUBLIC_CONTENT_TTL_SECONDS,
  publicJson,
} from "@/lib/public-cache";

type CategoryRow = typeof categories.$inferSelect;

function buildCategoryTree(rows: CategoryRow[]) {
  const map = new Map<string, CategoryRow & { children: CategoryRow[] }>();
  const tree: Array<CategoryRow & { children: CategoryRow[] }> = [];

  for (const category of rows) {
    map.set(category.id, { ...category, children: [] });
  }

  for (const category of rows) {
    const current = map.get(category.id);
    if (!current) continue;

    if (category.parentId && map.has(category.parentId)) {
      map.get(category.parentId)?.children.push(current);
    } else {
      tree.push(current);
    }
  }

  return tree;
}

export async function GET() {
  try {
    const cached = await cache.get(CacheKeys.home());
    if (cached) {
      return publicJson({ success: true, data: cached });
    }

    const now = new Date();
    const [settingsRows, bannerRows, announcementRows, categoryRows, featuredProducts] =
      await Promise.all([
        db
          .select()
          .from(siteSettings)
          .orderBy(asc(siteSettings.createdAt))
          .limit(1),
        db
          .select()
          .from(banners)
          .where(
            and(
              eq(banners.isActive, true),
              or(isNull(banners.startsAt), lte(banners.startsAt, now)),
              or(isNull(banners.endsAt), gt(banners.endsAt, now))
            )
          )
          .orderBy(asc(banners.sortOrder), asc(banners.createdAt)),
        db
          .select()
          .from(announcements)
          .where(
            and(
              eq(announcements.isActive, true),
              or(isNull(announcements.startsAt), lte(announcements.startsAt, now)),
              or(isNull(announcements.endsAt), gt(announcements.endsAt, now))
            )
          )
          .orderBy(asc(announcements.sortOrder), asc(announcements.createdAt)),
        db
          .select()
          .from(categories)
          .where(eq(categories.isActive, true))
          .orderBy(asc(categories.sortOrder), asc(categories.name)),
        db
          .select()
          .from(products)
          .where(and(eq(products.isFeatured, true), eq(products.isActive, true)))
          .orderBy(desc(products.createdAt))
          .limit(20),
      ]);

    const payload = {
      siteSettings: settingsRows[0] ?? null,
      banners: bannerRows,
      announcements: announcementRows,
      categories: buildCategoryTree(categoryRows),
      featuredProducts,
    };

    await cache.set(CacheKeys.home(), payload, PUBLIC_CONTENT_TTL_SECONDS);
    return publicJson({ success: true, data: payload });
  } catch (error) {
    console.error("[GET /home]", error);
    return publicJson({ success: false, message: "Server error" }, 500);
  }
}
