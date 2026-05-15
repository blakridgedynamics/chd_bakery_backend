import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { authorizeAdmin } from "@/lib/auth-middleware";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { eq } from "drizzle-orm";

type Ctx = { params: Promise<{ productSlug: string }> };

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE = 5 * 1024 * 1024;

export const POST = authorizeAdmin(async (req: NextRequest, ctx) => {
  try {
    const { params } = ctx as unknown as Ctx;
    const { productSlug } = await params;

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.slug, productSlug))
      .limit(1);

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("image");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "image field is required" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { success: false, message: "Only JPG, PNG and WebP allowed" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, message: "Image must be less than 5MB" },
        { status: 400 }
      );
    }

    const result = await uploadToCloudinary(Buffer.from(await file.arrayBuffer()), {
      folder: `chandigarh_bakery/products/${product.id}`,
      publicId: `${productSlug}-${Date.now()}`,
    });

    const currentImages = (product.images as string[]) ?? [];
    const updatedImages = [...currentImages, result.secureUrl];

    await db
      .update(products)
      .set({ images: updatedImages, updatedAt: new Date() })
      .where(eq(products.id, product.id));

    return NextResponse.json(
      {
        success: true,
        message: "Image uploaded successfully",
        data: {
          url: result.secureUrl,
          publicId: result.publicId,
          totalImages: updatedImages.length,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /uploads/product/:slug]", error);
    return NextResponse.json(
      { success: false, message: "Upload failed" },
      { status: 500 }
    );
  }
});

export const DELETE = authorizeAdmin(async (req: NextRequest, ctx) => {
  try {
    const { params } = ctx as unknown as Ctx;
    const { productSlug } = await params;

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.slug, productSlug))
      .limit(1);

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const imageUrl = body.image_url;

    if (typeof imageUrl !== "string" || !imageUrl) {
      return NextResponse.json(
        { success: false, message: "image_url is required" },
        { status: 400 }
      );
    }

    try {
      const { v2: cld } = await import("cloudinary");
      const urlParts = imageUrl.split("/");
      const uploadIdx = urlParts.indexOf("upload");
      if (uploadIdx >= 0) {
        const publicId = urlParts
          .slice(uploadIdx + 2)
          .join("/")
          .replace(/\.[^/.]+$/, "");
        await cld.uploader.destroy(publicId);
      }
    } catch {
      // Cloudinary cleanup is best effort; the DB should still be updated.
    }

    const currentImages = (product.images as string[]) ?? [];
    const updatedImages = currentImages.filter((img) => img !== imageUrl);

    await db
      .update(products)
      .set({ images: updatedImages, updatedAt: new Date() })
      .where(eq(products.id, product.id));

    return NextResponse.json({
      success: true,
      message: "Image deleted",
      data: { totalImages: updatedImages.length },
    });
  } catch (error) {
    console.error("[DELETE /uploads/product/:slug]", error);
    return NextResponse.json(
      { success: false, message: "Delete failed" },
      { status: 500 }
    );
  }
});
