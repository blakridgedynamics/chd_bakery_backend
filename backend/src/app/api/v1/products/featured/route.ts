import { publicJson } from "@/lib/public-cache";
import { ProductService } from "@/services/product.service";

/* ==============================
   GET FEATURED PRODUCTS - Public
   GET /api/v1/products/featured
================================*/
export async function GET() {
  try {
    const featured = await ProductService.getFeatured();

    return publicJson({
      success: true,
      count: Array.isArray(featured) ? featured.length : 0,
      data: featured,
    });
  } catch (error) {
    console.error(error);
    return publicJson({ success: false, message: "Server error" }, 500);
  }
}
