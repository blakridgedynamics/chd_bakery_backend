type ImageOptions = {
  width?: number;
  height?: number;
  crop?: "fill" | "fit" | "limit";
};

export function optimizedImageUrl(src: string, options: ImageOptions = {}) {
  if (!src || !src.includes("res.cloudinary.com") || !src.includes("/image/upload/")) {
    return src;
  }

  const transforms = [
    "f_auto",
    "q_auto",
    options.crop ? `c_${options.crop}` : null,
    options.width ? `w_${options.width}` : null,
    options.height ? `h_${options.height}` : null,
  ].filter(Boolean);

  if (transforms.length === 0 || src.includes("/image/upload/f_auto")) {
    return src;
  }

  return src.replace("/image/upload/", `/image/upload/${transforms.join(",")}/`);
}
