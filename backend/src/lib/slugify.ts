import slugifyLib from "slugify";

export function makeSlug(text: string): string {
  return slugifyLib(text, {
    lower: true,
    strict: true,
    trim: true,
  });
}

export function makeUniqueSlug(text: string, suffix?: string): string {
  const base = makeSlug(text);
  return suffix ? `${base}-${suffix}` : base;
}
