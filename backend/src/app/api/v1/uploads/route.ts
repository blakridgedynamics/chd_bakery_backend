// src/app/api/v1/uploads/route.ts
// FIX: The old route let any authenticated user pass an arbitrary "folder"
//      value and upload to any Cloudinary path. This is now removed.
//      This generic uploads endpoint is admin-only, accepts a single image,
//      and always puts it in "chandigarh_bakery/misc".
//
// For product images → use POST /api/v1/admin/upload  (admin only)

import { NextRequest } from "next/server";
import { authorizeAdmin } from "@/lib/auth-middleware";
import { errorResponse, successResponse } from "@/lib/api-response";
import { uploadToCloudinary } from "@/lib/cloudinary";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const POST = authorizeAdmin(async (req: NextRequest) => {
  try {
    const formData = await req.formData();
    const fileValue = formData.get("file");

    if (!(fileValue instanceof File)) {
      return errorResponse("file is required and must be a file upload", 422);
    }

    if (!ALLOWED_IMAGE_TYPES.has(fileValue.type)) {
      return errorResponse("Unsupported file type. Use jpg, png, or webp.", 422);
    }

    if (fileValue.size > MAX_FILE_SIZE_BYTES) {
      return errorResponse("File too large. Max size is 5 MB.", 422);
    }

    const buffer = Buffer.from(await fileValue.arrayBuffer());

    // Folder is hardcoded — callers cannot override it.
    const uploaded = await uploadToCloudinary(buffer, {
      folder: "chandigarh_bakery/misc",
    });

    return successResponse(uploaded, "File uploaded successfully", 201);
  } catch (err) {
    const e = err as Error & { status?: number };
    console.error("[POST /uploads]", e);
    return errorResponse(e.message ?? "Failed to upload file", e.status ?? 500);
  }
});
