import { useState } from "react";
import { Bell, ExternalLink } from "lucide-react";
import { useAnnouncements } from "@/hooks/useBackendContent";
import { cn } from "@/lib/utils";

const NotificationMenu = () => {
  const { data = [], isLoading } = useAnnouncements();
  const [open, setOpen] = useState(false);
  const count = data.length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "relative rounded-md p-2.5 transition-smooth hover:bg-secondary",
          open && "bg-secondary text-primary"
        )}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-3 w-[min(88vw,360px)] overflow-hidden rounded-lg border border-border bg-card shadow-warm">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">
              {isLoading ? "Checking for updates..." : count ? `${count} active update${count === 1 ? "" : "s"}` : "No active updates"}
            </p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {count ? (
              data.map((item) => (
                <div key={item.id} className="border-b border-border/70 px-4 py-3 last:border-b-0">
                  <p className="text-sm leading-5">{item.text}</p>
                  {item.linkUrl && (
                    <a
                      href={item.linkUrl}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                      {item.linkLabel || "Open"} <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              ))
            ) : (
              <p className="px-4 py-6 text-sm text-muted-foreground">You are all caught up.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationMenu;
