import { FormEvent, useState } from "react";
import Layout from "@/components/layout/Layout";
import { waCustomCake } from "@/lib/whatsapp";
import { useCustomCakePhotos, useSiteSettings } from "@/hooks/useBackendContent";
import { optimizedImageUrl } from "@/lib/images";
import { Cake, MessageCircle } from "lucide-react";

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="text-xs font-semibold text-muted-foreground">{label}</span>
    <div className="mt-1">{children}</div>
  </label>
);

const inputClass = "w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring";

const CustomCake = () => {
  const { data: photos = [] } = useCustomCakePhotos();
  const { data: settings } = useSiteSettings();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    occasion: "Birthday",
    date: "",
    flavour: "",
    servings: "",
    budget: "",
    message: "",
  });

  const update = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    window.open(waCustomCake(form, settings?.whatsappNumber, settings?.brandName), "_blank", "noopener,noreferrer");
  };

  return (
    <Layout>
      <section className="border-b border-border bg-gradient-warm py-14 md:py-20">
        <div className="container max-w-2xl text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-lg border border-border bg-background/70 px-3 py-1.5 text-xs font-medium text-primary backdrop-blur">
            <Cake className="h-3.5 w-3.5" /> Made-to-order, just for you
          </span>
          <h1 className="mb-4 font-display text-4xl md:text-5xl">Custom Cake Enquiry</h1>
          <p className="text-muted-foreground">
            Birthdays, weddings, anniversaries - share your vision and we'll craft a one-of-a-kind cake for your moment.
          </p>
        </div>
      </section>

      {photos.length > 0 && (
        <section className="container py-12 md:py-16">
          <div className="mb-8 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Cake gallery</p>
            <h2 className="font-display text-3xl md:text-4xl">Recent custom cakes</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {photos.slice(0, 8).map((photo) => (
              <figure key={photo.id} className="overflow-hidden rounded-lg border border-border/40 bg-card shadow-card">
                <img
                  src={optimizedImageUrl(photo.imageUrl, { width: 600, height: 600, crop: "fill" })}
                  alt={photo.altText || photo.title}
                  loading="lazy"
                  className="aspect-square w-full object-cover transition-smooth hover:scale-105"
                />
                <figcaption className="px-3 py-2 text-xs font-semibold">{photo.title}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <section className="container max-w-3xl py-12 md:py-16">
        <form onSubmit={submit} className="space-y-5 rounded-lg border border-border/40 bg-card p-6 shadow-warm md:p-10">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <input required className={inputClass} value={form.name} onChange={(event) => update("name", event.target.value)} />
            </Field>
            <Field label="Phone">
              <input required type="tel" className={inputClass} value={form.phone} onChange={(event) => update("phone", event.target.value)} />
            </Field>
            <Field label="Occasion">
              <select className={inputClass} value={form.occasion} onChange={(event) => update("occasion", event.target.value)}>
                <option>Birthday</option>
                <option>Wedding</option>
                <option>Anniversary</option>
                <option>Baby Shower</option>
                <option>Corporate</option>
                <option>Other</option>
              </select>
            </Field>
            <Field label="Date required">
              <input required type="date" className={inputClass} value={form.date} onChange={(event) => update("date", event.target.value)} />
            </Field>
            <Field label="Flavour preference">
              <input
                placeholder="e.g. Belgian chocolate, red velvet"
                className={inputClass}
                value={form.flavour}
                onChange={(event) => update("flavour", event.target.value)}
              />
            </Field>
            <Field label="Servings required">
              <input
                placeholder="e.g. 1 kg / 15 people"
                className={inputClass}
                value={form.servings}
                onChange={(event) => update("servings", event.target.value)}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Budget range">
                <input
                  placeholder="e.g. Rs 2,500 - Rs 4,000"
                  className={inputClass}
                  value={form.budget}
                  onChange={(event) => update("budget", event.target.value)}
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Message / design notes">
                <textarea
                  rows={5}
                  className={`${inputClass} resize-none`}
                  value={form.message}
                  onChange={(event) => update("message", event.target.value)}
                  placeholder="Tell us about colours, themes, dietary needs, or design references."
                />
              </Field>
            </div>
          </div>

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[hsl(142_55%_38%)] py-4 font-semibold text-white shadow-warm hover-lift"
          >
            <MessageCircle className="h-5 w-5" /> Send Enquiry on WhatsApp
          </button>
          <p className="text-center text-[11px] text-muted-foreground">All custom cakes require a minimum 48-hour pre-booking.</p>
        </form>
      </section>
    </Layout>
  );
};

export default CustomCake;
