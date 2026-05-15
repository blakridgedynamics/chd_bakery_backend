// src/app/api/v1/admin/upload/route.ts
// FIX: replaced local adminAuth() with authorizeAdmin() wrapper.
// FIX: caller can no longer choose the Cloudinary folder — it is locked to
//      "chandigarh_bakery/products" so admins can't write to arbitrary paths.

import { NextRequest, NextResponse } from "next/server";
import { authorizeAdmin } from "@/lib/auth-middleware";
import { uploadToCloudinary } from "@/lib/cloudinary";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export const POST = authorizeAdmin(async (req: NextRequest) => {
  try {
    const formData = await req.formData();
    const files = formData.getAll("images") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, message: "No images provided" },
        { status: 400 }
      );
    }

    if (files.length > 10) {
      return NextResponse.json(
        { success: false, message: "Maximum 10 images per request" },
        { status: 400 }
      );
    }

    const urls: string[] = [];

    for (const file of files) {
      if (!ALLOWED_TYPES.has(file.type)) {
        return NextResponse.json(
          { success: false, message: `File type ${file.type} is not allowed. Use jpg, png, or webp.` },
          { status: 400 }
        );
      }
      if (file.size > MAX_SIZE) {
        return NextResponse.json(
          { success: false, message: `${file.name} exceeds the 5 MB size limit.` },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      // Folder is hardcoded — clients cannot override it.
      const result = await uploadToCloudinary(buffer, {
        folder: "chandigarh_bakery/products",
      });
      urls.push(result.secureUrl);
    }

    return NextResponse.json({ success: true, data: { urls } }, { status: 201 });
  } catch (err: unknown) {
    const e = err as Error;
    console.error("[POST /admin/upload]", e);
    return NextResponse.json(
      { success: false, message: e.message ?? "Upload failed" },
      { status: 500 }
    );
  }
});
