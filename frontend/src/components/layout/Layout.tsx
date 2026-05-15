import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import WhatsAppFloat from "./WhatsAppFloat";
import AnnouncementBar from "./AnnouncementBar";
import type { Announcement, SiteSettings } from "@/lib/api";

type LayoutProps = {
  children: ReactNode;
  settings?: SiteSettings | null;
  announcements?: Announcement[];
};

const Layout = ({ children, settings, announcements }: LayoutProps) => (
  <div className="min-h-screen flex flex-col bg-background">
    <AnnouncementBar announcements={announcements} />
    <Navbar settings={settings} />
    <main className="flex-1">{children}</main>
    <Footer settings={settings} />
    <WhatsAppFloat settings={settings} />
  </div>
);

export default Layout;
