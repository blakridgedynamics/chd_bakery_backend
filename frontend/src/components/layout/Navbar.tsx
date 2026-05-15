import { Link, NavLink, useNavigate } from "react-router-dom";
import { User as UserIcon, Menu, X, MessageCircle } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { waGeneric } from "@/lib/whatsapp";
import { useSiteSettings } from "@/hooks/useBackendContent";
import type { SiteSettings } from "@/lib/api";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import NotificationMenu from "./NotificationMenu";

const links = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Menu" },
  { to: "/custom-cake", label: "Custom Cakes" },
  { to: "/experiences", label: "Experiences" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

const Navbar = ({ settings: initialSettings }: { settings?: SiteSettings | null }) => {
  const { user } = useAuth();
  const { data: fetchedSettings } = useSiteSettings({
    initialData: initialSettings,
    enabled: initialSettings === undefined,
  });
  const settings = initialSettings ?? fetchedSettings;
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-md border-b border-border">
      <div className="container flex h-16 md:h-20 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0" aria-label={`${settings?.brandName || "Bakery"} home`}>
          <img src={logo} alt={`${settings?.brandName || "Bakery"} logo`} className="h-10 md:h-12 w-auto" width={48} height={48} />
        </Link>

        <nav className="hidden lg:flex items-center gap-7">
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) => cn(
                "text-sm font-medium tracking-wide transition-smooth hover:text-primary",
                isActive ? "text-primary" : "text-foreground/80"
              )}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 md:gap-2">
          {settings?.whatsappNumber && (
            <a
              href={waGeneric(settings.whatsappNumber)}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 bg-[hsl(142_55%_38%)] text-white px-4 py-2.5 rounded-full text-xs md:text-sm font-semibold hover:opacity-95 transition-smooth shadow-soft"
            >
              <MessageCircle className="h-4 w-4" /> Order / Enquire
            </a>
          )}
          <NotificationMenu />
          <button
            onClick={() => navigate(user ? "/dashboard" : "/login")}
            className="rounded-md p-2.5 transition-smooth hover:bg-secondary"
            aria-label={user ? "Profile" : "Login"}
          >
            <UserIcon className="h-5 w-5" />
          </button>
          <button onClick={() => setOpen(o => !o)} className="lg:hidden p-2.5 rounded-full hover:bg-secondary" aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="lg:hidden border-t border-border bg-background animate-fade-in">
          <div className="container py-3 flex flex-col">
            {links.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) => cn(
                  "py-3 text-base font-medium border-b border-border/60 last:border-0",
                  isActive ? "text-primary" : "text-foreground/80"
                )}
              >
                {l.label}
              </NavLink>
            ))}
            {settings?.whatsappNumber && (
              <a
                href={waGeneric(settings.whatsappNumber)}
                target="_blank"
                rel="noreferrer"
                onClick={() => setOpen(false)}
                className="mt-3 inline-flex items-center justify-center gap-1.5 bg-[hsl(142_55%_38%)] text-white py-3 rounded-full text-sm font-semibold"
              >
                <MessageCircle className="h-4 w-4" /> Order / Enquire on WhatsApp
              </a>
            )}
          </div>
        </nav>
      )}
    </header>
  );
};

export default Navbar;
