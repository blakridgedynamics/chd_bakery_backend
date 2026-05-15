import { useEffect, useState } from "react";
import { AlertTriangle, Package, Star, Users, Warehouse } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";

type Stats = {
  totalUsers: number;
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  pendingReviews: number;
};

const statCards = [
  { key: "totalUsers", label: "Customers", icon: Users },
  { key: "totalProducts", label: "Products", icon: Package },
  { key: "activeProducts", label: "Active Products", icon: Warehouse },
  { key: "lowStockProducts", label: "Low Stock", icon: AlertTriangle },
  { key: "pendingReviews", label: "Pending Reviews", icon: Star },
] as const;

const Dashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi<Stats>("/api/v1/admin/stats")
      .then(setStats)
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Live catalog and moderation overview.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {statCards.map(({ key, label, icon: Icon }) => (
          <div key={key} className="rounded-lg border border-border/60 bg-card p-5 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground">
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 font-display text-3xl font-bold">
              {loading ? "..." : stats?.[key] ?? 0}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
