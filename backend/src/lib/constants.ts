import { env } from "./env";

export const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
export const APP_URL = env.NEXT_PUBLIC_APP_URL;
export const JWT_ACCESS_SECRET = env.JWT_ACCESS_SECRET;
export const JWT_REFRESH_SECRET = env.JWT_REFRESH_SECRET;
export const JWT_ACCESS_EXPIRES_IN = env.JWT_ACCESS_EXPIRES_IN;
export const JWT_REFRESH_EXPIRES_IN = env.JWT_REFRESH_EXPIRES_IN;

export const BCRYPT_SALT_ROUNDS = env.BCRYPT_SALT_ROUNDS;

export const RATE_LIMIT_MAX = env.RATE_LIMIT_MAX;
export const RATE_LIMIT_WINDOW_MS = env.RATE_LIMIT_WINDOW_MS;

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
};

export const RECENTLY_VIEWED_MAX = 20;
export const SEARCH_HISTORY_MAX = 15;
export const RECOMMENDATION_LIMIT = 10;
