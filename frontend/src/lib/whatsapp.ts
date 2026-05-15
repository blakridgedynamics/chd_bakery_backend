export const normalizeWhatsAppNumber = (value?: string | null) =>
  (value || "").replace(/\D/g, "");

export const waLink = (message: string, number?: string | null) => {
  const normalized = normalizeWhatsAppNumber(number);
  if (!normalized) return "#";
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
};

export const waGeneric = (number?: string | null) =>
  waLink("Hi! I found your website and would like to enquire about your products.", number);

export const waProduct = (name: string, number?: string | null) =>
  waLink(`Hi! I'm interested in the ${name}. Could you share availability and pricing?`, number);

export const waCustomCake = (
  data: Record<string, string>,
  number?: string | null,
  brandName = "the bakery"
) => {
  const lines = [
    `Hi ${brandName}! I'd like to enquire about a custom cake.`,
    "",
    `- Name: ${data.name || "-"}`,
    `- Phone: ${data.phone || "-"}`,
    `- Occasion: ${data.occasion || "-"}`,
    `- Date required: ${data.date || "-"}`,
    `- Flavour preference: ${data.flavour || "-"}`,
    `- Servings: ${data.servings || "-"}`,
    `- Budget: ${data.budget || "-"}`,
    data.message ? `- Notes: ${data.message}` : "",
  ].filter(Boolean);
  return waLink(lines.join("\n"), number);
};

export const waExperience = (number?: string | null) =>
  waLink("Hi! I'd like to enquire about your workshops, gifting boxes & curated hampers.", number);
