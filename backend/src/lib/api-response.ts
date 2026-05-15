import { NextResponse } from "next/server";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  };
}

export function successResponse<T>(
  data: T,
  message = "Success",
  status = 200,
  meta?: ApiResponse["meta"]
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, message, data, meta }, { status });
}

export function errorResponse(
  message: string,
  status = 500,
  error?: string
): NextResponse<ApiResponse> {
  return NextResponse.json({ success: false, message, error }, { status });
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  message = "Success"
): NextResponse<ApiResponse<T[]>> {
  const totalPages = Math.ceil(total / limit);
  return successResponse(data, message, 200, {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  });
}
