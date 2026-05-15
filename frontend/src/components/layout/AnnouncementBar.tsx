import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Megaphone, X } from "lucide-react";
import { useAnnouncements } from "@/hooks/useBackendContent";
import type { Announcement } from "@/lib/api";

const DISMISS_KEY = "cb_dismissed_announcements";

const AnnouncementBar = ({ announcements }: { announcements?: Announcement[] }) => {
  const { data: fetched = [] } = useAnnouncements({
    initialData: announcements,
    enabled: announcements === undefined,
  });
  const data = announcements ?? fetched;
  const [dismissed, setDismissed] = useState<string | null>(() =>
    typeof window === "undefined" ? null : window.localStorage.getItem(DISMISS_KEY)
  );

  const signature = useMemo(() => data.map((item) => item.id).join("|"), [data]);
  const visible = data.slice(0, 3);

  useEffect(() => {
    if (signature && dismissed && dismissed !== signature) setDismissed(null);
  }, [dismissed, signature]);

  if (!visible.length || dismissed === signature) return null;

  const dismiss = () => {
    if (typeof window !== "undefined") window.localStorage.setItem(DISMISS_KEY, signature);
    setDismissed(signature);
  };

  return (
    <div className="border-b border-primary/10 bg-primary text-primary-foreground">
      <div className="container flex min-h-11 items-center gap-3 py-2 text-sm">
        <Megaphone className="h-4 w-4 shrink-0" />
        <div className="flex min-w-0 flex-1 items-center gap-5 overflow-hidden">
          {visible.map((item) => (
            <div key={item.id} className="flex min-w-0 shrink-0 items-center gap-2 sm:max-w-[45%] lg:max-w-[32%]">
              <span className="truncate">{item.text}</span>
              {item.linkUrl && (
                <a
                  href={item.linkUrl}
                  className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold underline-offset-4 hover:underline"
                >
                  {item.linkLabel || "View"} <ArrowRight className="h-3 w-3" />
                </a>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-md p-1.5 transition-smooth hover:bg-primary-foreground/10"
          aria-label="Dismiss announcements"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default AnnouncementBar;
