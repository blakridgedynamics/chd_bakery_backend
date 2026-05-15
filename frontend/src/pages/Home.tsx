import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/ProductCard";
import BannerHero from "@/components/home/BannerHero";
import { useHomeContent } from "@/hooks/useBackendContent";
import type { SiteSettings } from "@/lib/api";
import { fromBackendCategory, fromBackendProduct } from "@/lib/catalog";
import { optimizedImageUrl } from "@/lib/images";
import { waExperience, waGeneric } from "@/lib/whatsapp";
import {
  ArrowRight,
  BookOpen,
  Cake,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Gift,
  Heart,
  Leaf,
  MapPin,
  MessageCircle,
  Wheat,
} from "lucide-react";

const steps = [
  { icon: BookOpen, title: "Browse the menu", text: "Pick what tempts you from our handcrafted bakes." },
  { icon: MessageCircle, title: "Enquire on WhatsApp", text: "Tap any item to start the order chat." },
  { icon: ClipboardCheck, title: "Share details", text: "Tell us quantity, delivery date and any notes." },
  { icon: CheckCircle2, title: "We confirm", text: "We confirm availability, pricing and delivery." },
];

const promises = [
  { icon: Heart, title: "100% egg-free", text: "Every recipe is built without eggs and tested for texture." },
  { icon: Wheat, title: "Whole-wheat goodness", text: "We use whole-wheat, ragi, oats and jaggery wherever possible." },
  { icon: Leaf, title: "No preservatives", text: "Small batches with real butter, pure ghee and dry fruits." },
];

const flattenCategories = <T extends { children?: T[] }>(items: T[]): T[] =>
  items.flatMap((item) => [item, ...flattenCategories(item.children || [])]);

const defaultSettings: SiteSettings = {
  brandName: "Chandigarh Bakery",
  tagline: "Premium egg-free, healthy bakes handcrafted in Chandigarh.",
  footerNote: "Crafted with warmth and whole-wheat.",
  phone: "+919779474708",
  whatsappNumber: "919779474708",
  email: "hello@chandigarhbakery.in",
  address: "Chandigarh, India",
  deliveryAreas: ["Chandigarh", "Mohali", "Panchkula", "Zirakpur", "Kharar", "New Chandigarh"],
};

const Home = () => {
  const { data: homeContent } = useHomeContent();
  const backendFeatured = homeContent?.featuredProducts || [];
  const backendCategories = homeContent?.categories || [];
  const settings = { ...defaultSettings, ...(homeContent?.siteSettings ?? {}) };
  const banners = homeContent?.banners ?? [];
  const announcements = homeContent?.announcements ?? [];

  const featured = backendFeatured.slice(0, 4).map(fromBackendProduct);

  const dessertCats = flattenCategories(backendCategories)
    .filter((category) => category.image)
    .slice(0, 5)
    .map((category) => {
      const mapped = fromBackendCategory(category);
      return {
        id: mapped.slug,
        name: mapped.name,
        image: mapped.image || "/placeholder.svg",
        blurb: mapped.blurb || "Freshly baked selection",
      };
    });
  const deliveryAreas = settings?.deliveryAreas || [];

  return (
    <Layout settings={settings} announcements={announcements}>
      <BannerHero banners={banners} settings={settings} />

      <section className="border-y border-border bg-secondary/60">
        <div className="container flex flex-col items-center justify-center gap-3 py-4 text-center text-sm text-foreground/80 sm:flex-row sm:gap-8">
          <span className="inline-flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> All orders require advance pre-booking
          </span>
          {deliveryAreas.length > 0 && (
            <>
              <span className="hidden opacity-30 sm:inline">/</span>
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> Delivering across {deliveryAreas.slice(0, 3).join(", ")}
              </span>
            </>
          )}
        </div>
      </section>

      <section className="container py-16 md:py-20">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Our menu</p>
          <h2 className="font-display text-3xl md:text-5xl">Desserts & Bakes</h2>
          <p className="mt-3 text-muted-foreground">
            Cookies, tea cakes, cheesecakes, granola and munchies, refreshed when new batches go live.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-5">
          {dessertCats.map((category) => (
            <Link
              key={category.id}
              to={`/category/${category.id}`}
              className="group relative aspect-[4/5] overflow-hidden rounded-lg shadow-card hover-lift"
            >
              <img
                src={optimizedImageUrl(category.image, { width: 600, height: 750, crop: "fill" })}
                alt={category.name}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-smooth group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-background">
                <h3 className="font-display text-xl">{category.name}</h3>
                <p className="mt-0.5 text-[11px] opacity-90 line-clamp-2">{category.blurb}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3.5 font-semibold text-primary-foreground shadow-warm hover-lift"
          >
            View Full Menu <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="border-y border-border bg-gradient-warm py-16 md:py-24">
        <div className="container grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <img
            src={optimizedImageUrl(featured[0]?.image || "/placeholder.svg", { width: 900, height: 900, crop: "fill" })}
            alt="Custom celebration cake"
            className="aspect-square w-full rounded-lg object-cover shadow-warm"
          />
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 rounded-lg border border-border bg-background/70 px-3 py-1.5 text-xs font-medium text-primary backdrop-blur">
              <Cake className="h-3.5 w-3.5" /> Made-to-order
            </span>
            <h2 className="font-display text-3xl leading-[1.1] md:text-5xl">Custom cakes for your moments</h2>
            <p className="text-base text-muted-foreground md:text-lg">
              Birthdays, weddings and anniversaries, shaped around your flavour, design reference and serving size.
            </p>
            <ul className="grid gap-2 text-sm sm:grid-cols-2">
              {["Designer cakes", "Number and letter cakes", "Tiered cakes", "Vegan and sugar-free options"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" /> {item}
                </li>
              ))}
            </ul>
            <Link
              to="/custom-cake"
              className="inline-flex items-center gap-2 rounded-lg bg-[hsl(142_55%_38%)] px-6 py-3.5 font-semibold text-white shadow-warm hover-lift"
            >
              <MessageCircle className="h-4 w-4" /> Enquire for Custom Cake
            </Link>
          </div>
        </div>
      </section>

      <section className="container py-16 md:py-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Bestsellers</p>
            <h2 className="font-display text-3xl md:text-4xl">Loved this season</h2>
          </div>
          <Link to="/shop" className="shrink-0 text-sm font-medium text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} settings={settings} />
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-secondary/40 py-16 md:py-20">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Simple & quick</p>
            <h2 className="font-display text-3xl md:text-5xl">How to Order</h2>
            <p className="mt-3 text-muted-foreground">No checkout friction. We confirm every made-to-order bake personally.</p>
          </div>
          <ol className="grid gap-4 md:grid-cols-4">
            {steps.map(({ icon: Icon, title, text }, index) => (
              <li key={title} className="relative rounded-lg border border-border/40 bg-card p-6 text-center shadow-card">
                <span className="absolute -top-3 left-1/2 grid h-8 w-8 -translate-x-1/2 place-items-center rounded-lg bg-primary text-xs font-bold text-primary-foreground shadow-soft">
                  {index + 1}
                </span>
                <div className="mx-auto mb-3 mt-2 grid h-12 w-12 place-items-center rounded-lg bg-secondary text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg">{title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 text-center">
            {settings?.whatsappNumber && (
              <a
                href={waGeneric(settings.whatsappNumber)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-[hsl(142_55%_38%)] px-6 py-3.5 font-semibold text-white shadow-warm hover-lift"
              >
                <MessageCircle className="h-4 w-4" /> Start your order
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="container py-16 md:py-20">
        <div className="mb-12 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Our promise</p>
          <h2 className="font-display text-3xl md:text-4xl">Why the bake matters</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {promises.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-lg border border-border/40 bg-card p-7 shadow-card hover-lift">
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-lg bg-gradient-primary text-primary-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-xl">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {deliveryAreas.length > 0 && (
        <section className="border-y border-border bg-gradient-warm py-14 md:py-16">
          <div className="container grid items-center gap-8 md:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Where we deliver</p>
              <h2 className="font-display mb-3 text-3xl md:text-4xl">Delivery areas</h2>
              <p className="text-muted-foreground">
                We deliver fresh-baked goodness across {deliveryAreas.slice(0, 3).join(", ")}.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {deliveryAreas.slice(0, 6).map((city) => (
                <div key={city} className="rounded-lg border border-border/40 bg-card p-4 text-center shadow-card">
                  <MapPin className="mx-auto mb-1.5 h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold">{city}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="container py-16">
        <div className="grid items-center gap-8 rounded-lg bg-gradient-primary p-8 text-primary-foreground shadow-warm md:grid-cols-[2fr_1fr] md:p-12">
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.2em] opacity-80">Ready to order?</p>
            <h2 className="font-display mb-3 text-3xl md:text-5xl">Let us bake something special</h2>
            <p className="max-w-lg opacity-90">Start a WhatsApp chat and we will confirm availability, pricing and your delivery date.</p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            {settings?.whatsappNumber && (
              <a
                href={waGeneric(settings.whatsappNumber)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-background px-6 py-3.5 font-semibold text-primary hover-lift"
              >
                <MessageCircle className="h-4 w-4" /> Order
              </a>
            )}
            <a
              href={waExperience(settings?.whatsappNumber)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-primary-foreground/40 px-6 py-3.5 font-semibold hover:bg-primary-foreground/10"
            >
              <Gift className="h-4 w-4" /> Gifting
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Home;
