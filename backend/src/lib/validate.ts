import { ZodSchema } from "zod";
import { errorResponse } from "./api-response";

export function validateBody<T>(schema: ZodSchema<T>, body: unknown) {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    const message = firstError
      ? `${firstError.path.join(".")}: ${firstError.message}`
      : "Validation failed";
    return { success: false as const, error: errorResponse("Validation failed", 422, message) };
  }
  return { success: true as const, data: parsed.data };
}
