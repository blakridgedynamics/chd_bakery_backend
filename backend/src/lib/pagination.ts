import { PAGINATION_DEFAULTS } from "./constants";

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export function parsePagination(searchParams: URLSearchParams): PaginationParams {
  const page = Math.max(
    1,
    parseInt(searchParams.get("page") ?? String(PAGINATION_DEFAULTS.PAGE), 10)
  );
  const limit = Math.min(
    PAGINATION_DEFAULTS.MAX_LIMIT,
    Math.max(
      1,
      parseInt(
        searchParams.get("limit") ?? String(PAGINATION_DEFAULTS.LIMIT),
        10
      )
    )
  );
  return { page, limit, offset: (page - 1) * limit };
}
