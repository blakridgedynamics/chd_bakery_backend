import { FormEvent, useState } from "react";
import Layout from "@/components/layout/Layout";
import { MapPin, Phone, Mail, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { waGeneric } from "@/lib/whatsapp";
import { getAccessToken, MessagesApi, PUBLIC_ERROR_MESSAGE } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useSiteSettings } from "@/hooks/useBackendContent";

const inputClass =
  "mt-1 w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none transition-smooth focus:border-primary focus:ring-2 focus:ring-ring/20";

const Contact = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const isLoggedIn = Boolean(user && getAccessToken());
  const { data: settings } = useSiteSettings();
  const contactCards = [
    settings?.address ? { icon: MapPin, title: "Visit", text: settings.address } : null,
    settings?.phone ? { icon: Phone, title: "Call", text: settings.phone } : null,
    settings?.email ? { icon: Mail, title: "Email", text: settings.email } : null,
    settings?.whatsappNumber ? { icon: MessageCircle, title: "WhatsApp", text: "Tap the green button to chat instantly" } : null,
  ].filter(Boolean) as { icon: typeof MapPin; title: string; text: string }[];

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = isLoggedIn
      ? {
          subject: String(data.get("subject") || "").trim() || undefined,
          message: String(data.get("message") || "").trim(),
        }
      : {
          name: String(data.get("name") || "").trim(),
          email: String(data.get("email") || "").trim(),
          phone: String(data.get("phone") || "").trim() || undefined,
          subject: String(data.get("subject") || "").trim() || undefined,
          message: String(data.get("message") || "").trim(),
        };

    if (!isLoggedIn && (!("name" in payload) || !payload.name || !payload.email)) {
      toast.error("Please fill in your name, email and message.");
      return;
    }
    if (!payload.message) {
      toast.error("Please enter your message.");
      return;
    }

    setLoading(true);
    try {
      await MessagesApi.create(payload);
      toast.success("Thanks. We will get back to you soon.");
      form.reset();
    } catch {
      toast.error(PUBLIC_ERROR_MESSAGE);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <section className="container py-14 md:py-20">
        <div className="mb-12 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Say hello</p>
          <h1 className="font-display text-4xl md:text-5xl">We would love to hear from you</h1>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            For custom orders, bulk enquiries or a quick bakery question, drop us a message.
          </p>
          {settings?.whatsappNumber && (
            <a
              href={waGeneric(settings.whatsappNumber)}
              onClick={(event) => {
                event.preventDefault();
                window.open(waGeneric(settings.whatsappNumber), "_blank", "noopener,noreferrer");
              }}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[hsl(142_55%_38%)] px-6 py-3.5 font-semibold text-white shadow-warm hover-lift"
            >
              <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
            </a>
          )}
        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-5">
            {contactCards.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-4 rounded-lg border border-border/40 bg-card p-5 shadow-card">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-muted-foreground">{text}</p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4 rounded-lg border border-border/40 bg-card p-6 shadow-warm md:p-8">
            {!isLoggedIn && (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold text-muted-foreground">Name</span>
                  <input name="name" required className={inputClass} />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-muted-foreground">Email</span>
                  <input name="email" required type="email" className={inputClass} />
                </label>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              {!isLoggedIn && (
                <label className="block">
                  <span className="text-xs font-semibold text-muted-foreground">Phone</span>
                  <input name="phone" type="tel" className={inputClass} />
                </label>
              )}
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground">Subject</span>
                <input name="subject" className={inputClass} />
              </label>
            </div>
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">Message</span>
              <textarea name="message" required rows={5} className={`${inputClass} resize-none`} />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3.5 font-semibold text-primary-foreground shadow-warm hover-lift disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="h-4 w-4" /> {loading ? "Sending..." : "Send message"}
            </button>
          </form>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
