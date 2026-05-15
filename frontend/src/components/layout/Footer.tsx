import { Link } from "react-router-dom";
import { Instagram, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import logo from "@/assets/logo.png";
import { useSiteSettings } from "@/hooks/useBackendContent";
import type { SiteSettings } from "@/lib/api";
import { waGeneric } from "@/lib/whatsapp";

const Footer = ({ settings: initialSettings }: { settings?: SiteSettings | null }) => {
  const { data: fetchedSettings } = useSiteSettings({
    initialData: initialSettings,
    enabled: initialSettings === undefined,
  });
  const settings = initialSettings ?? fetchedSettings;
  const brandName = settings?.brandName || "Bakery";
  const contactRows = [
    settings?.address ? { icon: MapPin, text: settings.address } : null,
    settings?.phone || settings?.whatsappNumber
      ? { icon: Phone, text: settings.phone || settings.whatsappNumber || "" }
      : null,
    settings?.email ? { icon: Mail, text: settings.email } : null,
  ].filter(Boolean) as { icon: typeof MapPin; text: string }[];

  return (
    <footer className="mt-24 bg-secondary/60 border-t border-border">
      <div className="container py-14 grid gap-10 md:grid-cols-4">
        <div className="space-y-4">
          <img src={logo} alt={brandName} className="h-12 w-auto" width={48} height={48} loading="lazy" />
          {settings?.tagline && <p className="text-sm text-muted-foreground max-w-xs">{settings.tagline}</p>}
        </div>

        <div>
          <h4 className="font-display text-lg mb-4">Visit Us</h4>
          <div className="space-y-2">
            {contactRows.map(({ icon: Icon, text }) => (
              <p key={text} className="text-sm text-muted-foreground flex gap-2">
                <Icon className="h-4 w-4 mt-0.5 shrink-0" /> {text}
              </p>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-display text-lg mb-4">Explore</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/shop" className="hover:text-primary transition-smooth">Menu</Link></li>
            <li><Link to="/custom-cake" className="hover:text-primary transition-smooth">Custom Cakes</Link></li>
            <li><Link to="/experiences" className="hover:text-primary transition-smooth">Experiences</Link></li>
            <li><Link to="/about" className="hover:text-primary transition-smooth">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-primary transition-smooth">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-lg mb-4">Stay Connected</h4>
          <div className="flex flex-wrap gap-3">
            {settings?.whatsappNumber && (
              <a
                href={waGeneric(settings.whatsappNumber)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[hsl(142_55%_38%)] text-white text-sm font-medium hover-lift"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            )}
            {settings?.instagramUrl && (
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-primary text-primary-foreground text-sm font-medium hover-lift"
              >
                <Instagram className="h-4 w-4" /> Instagram
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container py-5 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-2">
          <p>(c) {new Date().getFullYear()} {brandName}. All rights reserved.</p>
          {settings?.footerNote && <p>{settings.footerNote}</p>}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
