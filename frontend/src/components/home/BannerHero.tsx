import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, MessageCircle, Sparkles } from "lucide-react";
import hero from "@/assets/hero.jpg";
import { useBanners, useSiteSettings } from "@/hooks/useBackendContent";
import type { Banner, SiteSettings } from "@/lib/api";
import { optimizedImageUrl } from "@/lib/images";
import { waGeneric } from "@/lib/whatsapp";

const isInternalLink = (href?: string | null) => Boolean(href && href.startsWith("/"));

type BannerHeroProps = {
  banners?: Banner[];
  settings?: SiteSettings | null;
};

const BannerHero = ({ banners: initialBanners, settings: initialSettings }: BannerHeroProps) => {
  const { data: fetchedBanners = [] } = useBanners({
    initialData: initialBanners,
    enabled: initialBanners === undefined,
  });
  const { data: fetchedSettings } = useSiteSettings({
    initialData: initialSettings,
    enabled: initialSettings === undefined,
  });
  const data = initialBanners ?? fetchedBanners;
  const settings = initialSettings ?? fetchedSettings;
  const fallbackBanner = useMemo<Banner>(
    () => ({
      id: "fallback-bakery-hero",
      title: settings?.brandName || "Fresh bakes, made to order",
      subtitle: settings?.tagline || null,
      imageUrl: hero,
      linkUrl: "/shop",
      linkLabel: "View Menu",
    }),
    [settings?.brandName, settings?.tagline]
  );
  const banners = useMemo(
    () => (data.length ? data : [fallbackBanner]),
    [data, fallbackBanner]
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const active = banners[activeIndex % banners.length] || fallbackBanner;

  useEffect(() => {
    if (banners.length < 2) return undefined;
    const interval = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % banners.length);
    }, 7000);
    return () => window.clearInterval(interval);
  }, [banners.length]);

  useEffect(() => {
    if (activeIndex >= banners.length) setActiveIndex(0);
  }, [activeIndex, banners.length]);

  useEffect(() => {
    banners.slice(0, 3).forEach((banner) => {
      if (!banner.imageUrl || banner.imageUrl === active.imageUrl) return;
      const image = new Image();
      image.src = optimizedImageUrl(banner.imageUrl, { width: 1800, height: 900, crop: "fill" });
    });
  }, [active.imageUrl, banners]);

  const go = (direction: 1 | -1) => {
    setActiveIndex((index) => (index + direction + banners.length) % banners.length);
  };

  const handleTouchEnd = (clientX: number) => {
    if (touchStartX == null || banners.length < 2) return;
    const delta = touchStartX - clientX;
    if (Math.abs(delta) > 40) go(delta > 0 ? 1 : -1);
    setTouchStartX(null);
  };

  const action =
    active.linkUrl &&
    (isInternalLink(active.linkUrl) ? (
      <Link
        to={active.linkUrl}
        className="inline-flex items-center gap-2 rounded-lg bg-background px-5 py-3 text-sm font-semibold text-foreground shadow-soft transition-smooth hover:bg-background/90"
      >
        {active.linkLabel || "Explore"} <ArrowRight className="h-4 w-4" />
      </Link>
    ) : (
      <a
        href={active.linkUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 rounded-lg bg-background px-5 py-3 text-sm font-semibold text-foreground shadow-soft transition-smooth hover:bg-background/90"
      >
        {active.linkLabel || "Explore"} <ArrowRight className="h-4 w-4" />
      </a>
    ));

  return (
    <section
      className="relative min-h-[620px] overflow-hidden border-b border-border md:min-h-[680px]"
      onTouchStart={(event) => setTouchStartX(event.touches[0]?.clientX ?? null)}
      onTouchEnd={(event) => handleTouchEnd(event.changedTouches[0]?.clientX ?? 0)}
    >
      <img
        key={active.id}
        src={optimizedImageUrl(active.imageUrl, { width: 1800, height: 900, crop: "fill" })}
        alt={active.title}
        loading="eager"
        decoding="async"
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover animate-scale-in"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-foreground/85 via-foreground/45 to-foreground/10" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background to-transparent" />

      <div className="container relative flex min-h-[620px] items-center py-16 md:min-h-[680px]">
        <div className="max-w-3xl text-background">
          <span className="mb-5 inline-flex items-center gap-2 rounded-lg bg-background/15 px-3 py-2 text-xs font-semibold backdrop-blur">
            <Sparkles className="h-4 w-4" /> Pre-order via WhatsApp
          </span>
          <h1 className="font-display text-4xl leading-[1.05] text-balance md:text-6xl lg:text-7xl">{active.title}</h1>
          {active.subtitle && <p className="mt-5 max-w-2xl text-base leading-7 text-background/88 md:text-lg">{active.subtitle}</p>}

          <div className="mt-8 flex flex-wrap gap-3">
            {settings?.whatsappNumber && (
              <a
                href={waGeneric(settings.whatsappNumber)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-[hsl(142_55%_38%)] px-5 py-3 text-sm font-semibold text-white shadow-soft transition-smooth hover:opacity-95"
              >
                <MessageCircle className="h-4 w-4" /> Order on WhatsApp
              </a>
            )}
            {action}
          </div>

          {settings?.deliveryAreas?.length ? (
            <div className="mt-7 flex flex-wrap items-center gap-5 text-sm text-background/85">
              <span>{settings.deliveryAreas.slice(0, 3).join(", ")}</span>
            </div>
          ) : null}
        </div>
      </div>

      {banners.length > 1 && (
        <div className="absolute bottom-7 right-4 flex items-center gap-2 md:right-10">
          <button
            type="button"
            onClick={() => go(-1)}
            className="rounded-lg bg-background/90 p-2.5 text-foreground shadow-soft transition-smooth hover:bg-background"
            aria-label="Previous banner"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-1.5 rounded-lg bg-background/90 px-3 py-2 shadow-soft">
            {banners.map((banner, index) => (
              <button
                key={banner.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`h-2 rounded-full transition-smooth ${index === activeIndex ? "w-6 bg-primary" : "w-2 bg-muted-foreground/35"}`}
                aria-label={`Show banner ${index + 1}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => go(1)}
            className="rounded-lg bg-background/90 p-2.5 text-foreground shadow-soft transition-smooth hover:bg-background"
            aria-label="Next banner"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  );
};

export default BannerHero;
