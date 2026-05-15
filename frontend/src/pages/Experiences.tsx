import Layout from "@/components/layout/Layout";
import { waExperience, waLink } from "@/lib/whatsapp";
import { useSiteSettings } from "@/hooks/useBackendContent";
import { Gift, GraduationCap, Sparkles, MessageCircle } from "lucide-react";

const experiences = [
  {
    icon: GraduationCap,
    title: "Baking Workshops",
    text: "Hands-on small-batch sessions for beginners and home bakers — learn cookies, focaccia, cheesecakes & more.",
    cta: "Enquire about workshops",
    msg: "Hi! I'd like to enquire about your baking workshops.",
  },
  {
    icon: Gift,
    title: "Curated Gifting Boxes",
    text: "Beautifully packed bakery boxes for birthdays, thank-yous and corporate gifting — fully customisable.",
    cta: "Enquire about gifting",
    msg: "Hi! I'd like to enquire about your curated gifting boxes.",
  },
  {
    icon: Sparkles,
    title: "Festive Hampers",
    text: "Seasonal hampers for Diwali, Christmas, Rakhi & weddings — bulk orders welcome.",
    cta: "Enquire about hampers",
    msg: "Hi! I'd like to enquire about your festive hampers.",
  },
];

const Experiences = () => {
  const { data: settings } = useSiteSettings();

  return (
  <Layout>
    <section className="bg-gradient-warm py-14 md:py-20 border-b border-border">
      <div className="container text-center max-w-2xl">
        <p className="text-xs uppercase tracking-[0.18em] text-primary font-semibold mb-2">Beyond the bake</p>
        <h1 className="font-display text-4xl md:text-5xl mb-4">Experiences & Gifting</h1>
        <p className="text-muted-foreground">
          From hands-on workshops to thoughtfully curated hampers — let us help you celebrate the small and big moments.
        </p>
      </div>
    </section>

    <section className="container py-14 md:py-20">
      <div className="grid md:grid-cols-3 gap-6">
        {experiences.map(e => (
          <div key={e.title} className="bg-card rounded-2xl p-7 shadow-card border border-border/40 hover-lift flex flex-col">
            <div className="h-12 w-12 rounded-full bg-gradient-primary text-primary-foreground grid place-items-center mb-4">
              <e.icon className="h-5 w-5" />
            </div>
            <h3 className="font-display text-xl mb-2">{e.title}</h3>
            <p className="text-sm text-muted-foreground mb-5 flex-1">{e.text}</p>
            <a
              href={waLink(e.msg, settings?.whatsappNumber)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 bg-[hsl(142_55%_38%)] text-white px-4 py-2.5 rounded-full text-xs font-semibold"
            >
              <MessageCircle className="h-4 w-4" /> {e.cta}
            </a>
          </div>
        ))}
      </div>

      <div className="mt-14 rounded-3xl bg-gradient-primary text-primary-foreground p-10 md:p-14 shadow-warm text-center">
        <h2 className="font-display text-3xl md:text-4xl mb-3">Plan a custom experience</h2>
        <p className="opacity-90 max-w-xl mx-auto mb-6">Tell us your idea — corporate gifting, private workshops or wedding hampers. We'll bring it to life.</p>
        <a href={waExperience(settings?.whatsappNumber)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-background text-primary px-6 py-3.5 rounded-full font-semibold hover-lift">
          <MessageCircle className="h-4 w-4" /> Plan an Experience
        </a>
      </div>
    </section>
  </Layout>
  );
};

export default Experiences;
