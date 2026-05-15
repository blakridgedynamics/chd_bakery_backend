import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { authorizeAdmin } from "@/lib/auth-middleware";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { eq } from "drizzle-orm";

type Ctx = { params: Promise<{ categorySlug: string }> };

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE = 5 * 1024 * 1024;

export const POST = authorizeAdmin(async (req: NextRequest, ctx) => {
  try {
    const { params } = ctx as unknown as Ctx;
    const { categorySlug } = await params;

    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, categorySlug))
      .limit(1);

    if (!category) {
      return NextResponse.json(
        { success: false, message: "Category not found" },
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
      folder: "chandigarh_bakery/categories",
      publicId: `${categorySlug}-${Date.now()}`,
    });

    await db
      .update(categories)
      .set({ image: result.secureUrl, updatedAt: new Date() })
      .where(eq(categories.id, category.id));

    return NextResponse.json(
      {
        success: true,
        message: "Category image uploaded",
        data: { url: result.secureUrl, publicId: result.publicId },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /uploads/category/:slug]", error);
    return NextResponse.json(
      { success: false, message: "Upload failed" },
      { status: 500 }
    );
  }
});
