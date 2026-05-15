import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  CakeSlice,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Shapes,
  Star,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  adminApi,
  clearSession,
  getStoredAdmin,
  publicApi,
  readSessionCache,
  writeSessionCache,
  type SiteSettings,
} from "@/lib/api";

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/categories", label: "Categories", icon: Shapes },
  { to: "/admin/content", label: "Homepage Content", icon: Home },
  { to: "/admin/messages", label: "Messages", icon: MessageSquare },
  { to: "/admin/reviews", label: "Reviews", icon: Star },
];

const SETTINGS_CACHE_KEY = "admin:site-settings";

const AdminLayout = () => {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>(() => readSessionCache<SiteSettings>(SETTINGS_CACHE_KEY) || {});
  const navigate = useNavigate();
  const admin = getStoredAdmin();

  useEffect(() => {
    let cancelled = false;
    adminApi("/api/v1/admin/session").catch(() => {
      if (!cancelled) {
        clearSession({ redirect: false });
        toast.error("Session expired. Please sign in again.");
        navigate("/", { replace: true });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  useEffect(() => {
    publicApi<SiteSettings | null>("/api/v1/site-settings")
      .then((data) => {
        const next = data || {};
        setSettings(next);
        writeSessionCache(SETTINGS_CACHE_KEY, next);
      })
      .catch(() => undefined);
  }, []);

  const logout = () => {
    clearSession();
    navigate("/");
  };

  const brandName = settings.brandName || "Bakery";
  const initials = (admin?.name || admin?.email || "A")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-muted/40 font-sans">
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen w-72 flex-col border-r border-border bg-card transition-transform lg:sticky lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-3 border-b border-border px-6 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
            <CakeSlice className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-display text-lg font-bold leading-tight">{brandName}</p>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-smooth",
                  isActive
                    ? "bg-gradient-primary text-primary-foreground shadow-glow"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-4">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-smooth hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-foreground/30 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-border bg-card/80 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-4 lg:px-8">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(!open)}>
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="hidden lg:block" />
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-foreground">{admin?.name || admin?.email || "Admin"}</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-primary text-sm font-semibold text-primary-foreground">
                {initials}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 animate-in p-4 duration-300 fade-in lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
