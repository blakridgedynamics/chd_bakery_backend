export const formatINR = (n: number) =>
  "Rs. " + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
