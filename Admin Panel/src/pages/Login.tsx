import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Gift, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ADMIN_REFRESH_KEY, ADMIN_TOKEN_KEY, ADMIN_USER_KEY, publicApi, type SiteSettings } from "@/lib/api";

type LoginData = {
  user: {
    id: string;
    name: string;
    email: string;
    role: "admin" | "customer";
  };
  accessToken: string;
  refreshToken: string;
};

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>({});

  useEffect(() => {
    publicApi<SiteSettings | null>("/api/v1/site-settings")
      .then((data) => setSettings(data || {}))
      .catch(() => undefined);
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${(import.meta.env.VITE_API_URL || "").replace(/\/$/, "")}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, audience: "admin" }),
      });

      const json = await res.json().catch(() => ({}));
      const data = (json?.data ?? json) as LoginData;

      if (!res.ok) throw new Error(json?.message || "Login failed");
      if (data?.user?.role !== "admin") throw new Error("Access denied - admin accounts only");

      localStorage.setItem(ADMIN_TOKEN_KEY, data.accessToken);
      localStorage.setItem(ADMIN_REFRESH_KEY, data.refreshToken);
      localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(data.user));

      toast.success(`Welcome back, ${data.user.name}.`);
      navigate("/admin");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const brandName = settings.brandName || "Bakery";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-soft p-4 font-sans">
      <div className="w-full max-w-md">
        <div className="animate-in rounded-lg bg-card p-8 shadow-card duration-500 fade-in slide-in-from-bottom-4 lg:p-10">
          <div className="mb-8 flex flex-col items-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
              <Gift className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">Admin Sign In</h1>
            <p className="mt-1 text-sm text-muted-foreground">{brandName} Admin Panel</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-11 pl-10"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-11 pl-10"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full bg-gradient-primary font-semibold shadow-glow transition-smooth hover:opacity-90"
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">Admin access only</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
