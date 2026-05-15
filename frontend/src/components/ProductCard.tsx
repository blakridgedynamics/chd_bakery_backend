import type { MouseEvent } from "react";
import { Link } from "react-router-dom";
import type { CatalogProduct } from "@/lib/catalog";
import { formatINR } from "@/lib/format";
import { MessageCircle } from "lucide-react";
import { waProduct } from "@/lib/whatsapp";
import { useSiteSettings } from "@/hooks/useBackendContent";
import { optimizedImageUrl } from "@/lib/images";
import type { SiteSettings } from "@/lib/api";

const ProductCard = ({
  product,
  settings: initialSettings,
}: {
  product: CatalogProduct;
  settings?: SiteSettings | null;
}) => {
  const isSoldOut = product.stock !== undefined && product.stock <= 0;
  const { data: fetchedSettings } = useSiteSettings({
    initialData: initialSettings,
    enabled: initialSettings === undefined,
  });
  const settings = initialSettings ?? fetchedSettings;
  const canEnquire = !isSoldOut && Boolean(settings?.whatsappNumber);

  const handleEnquire = (e: MouseEvent) => {
    e.preventDefault();
    if (!canEnquire) return;
    window.open(waProduct(product.name, settings?.whatsappNumber), "_blank", "noopener,noreferrer");
  };

  return (
    <Link
      to={`/product/${product.slug || product.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border/40 bg-card shadow-card hover-lift"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={optimizedImageUrl(product.image, { width: 600, height: 600, crop: "fill" })}
          alt={product.name}
          loading="lazy"
          width={400}
          height={400}
          className="h-full w-full object-cover transition-smooth group-hover:scale-105"
        />
        {product.badge && (
          <span className="absolute left-3 top-3 rounded-md bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
            {product.badge}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-base leading-snug text-foreground line-clamp-2">{product.name}</h3>
        <p className="mt-1.5 min-h-[2.5em] text-xs text-muted-foreground line-clamp-2">
          {product.shortDescription || product.description}
        </p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            Starting <span className="text-sm font-semibold text-primary">{formatINR(product.price)}</span>
          </span>
        </div>
        <button
          onClick={handleEnquire}
          disabled={!canEnquire}
          aria-label={`Enquire about ${product.name} on WhatsApp`}
          className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-md bg-[hsl(142_55%_38%)] px-3.5 py-2.5 text-xs font-semibold text-white transition-smooth hover:opacity-95 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
        >
          <MessageCircle className="h-3.5 w-3.5" /> {isSoldOut ? "Sold out" : "Enquire on WhatsApp"}
        </button>
      </div>
    </Link>
  );
};

export default ProductCard;
