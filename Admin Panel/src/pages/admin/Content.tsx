import { useEffect, useRef, useState } from "react";
import { ImagePlus, Pencil, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  adminApi,
  adminUpload,
  fromDateTimeLocal,
  toDateTimeLocal,
  type Announcement,
  type Banner,
  type CustomCakePhoto,
  type SiteSettings,
} from "@/lib/api";

type BannerForm = {
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  linkLabel: string;
  sortOrder: string;
  isActive: boolean;
  startsAt: string;
  endsAt: string;
};

type AnnouncementForm = {
  text: string;
  emoji: string;
  linkUrl: string;
  linkLabel: string;
  sortOrder: string;
  isActive: boolean;
  startsAt: string;
  endsAt: string;
};

type CakePhotoForm = {
  title: string;
  imageUrl: string;
  altText: string;
  sortOrder: string;
  isActive: boolean;
};

const emptyBanner: BannerForm = {
  title: "",
  subtitle: "",
  imageUrl: "",
  linkUrl: "",
  linkLabel: "",
  sortOrder: "0",
  isActive: true,
  startsAt: "",
  endsAt: "",
};

const emptyAnnouncement: AnnouncementForm = {
  text: "",
  emoji: "",
  linkUrl: "",
  linkLabel: "",
  sortOrder: "0",
  isActive: true,
  startsAt: "",
  endsAt: "",
};

const emptyCakePhoto: CakePhotoForm = {
  title: "",
  imageUrl: "",
  altText: "",
  sortOrder: "0",
  isActive: true,
};

const Content = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [cakePhotos, setCakePhotos] = useState<CustomCakePhoto[]>([]);
  const [settings, setSettings] = useState<SiteSettings>({});
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  const [bannerDialog, setBannerDialog] = useState(false);
  const [announcementDialog, setAnnouncementDialog] = useState(false);
  const [cakeDialog, setCakeDialog] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [editingCakePhoto, setEditingCakePhoto] = useState<CustomCakePhoto | null>(null);
  const [bannerForm, setBannerForm] = useState<BannerForm>(emptyBanner);
  const [announcementForm, setAnnouncementForm] = useState<AnnouncementForm>(emptyAnnouncement);
  const [cakeForm, setCakeForm] = useState<CakePhotoForm>(emptyCakePhoto);
  const [bannerUploadFile, setBannerUploadFile] = useState<File | null>(null);
  const [cakeUploadFile, setCakeUploadFile] = useState<File | null>(null);
  const bannerFileRef = useRef<HTMLInputElement>(null);
  const cakeFileRef = useRef<HTMLInputElement>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [bannerRows, announcementRows, photoRows, siteSettings] = await Promise.all([
        adminApi<Banner[]>("/api/v1/admin/banners"),
        adminApi<Announcement[]>("/api/v1/admin/announcements"),
        adminApi<CustomCakePhoto[]>("/api/v1/admin/custom-cakes/photos"),
        adminApi<SiteSettings | null>("/api/v1/admin/site-settings"),
      ]);
      setBanners(bannerRows || []);
      setAnnouncements(announcementRows || []);
      setCakePhotos(photoRows || []);
      setSettings(siteSettings || {});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load content");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAll();
  }, []);

  const uploadImage = async (uploadFile: File | null) => {
    if (!uploadFile) return null;
    const data = new FormData();
    data.append("file", uploadFile);
    const uploaded = await adminUpload<{ secureUrl?: string; url?: string }>("/api/v1/uploads", data);
    return uploaded.secureUrl || uploaded.url || null;
  };

  const openBanner = (banner?: Banner) => {
    setEditingBanner(banner || null);
    setBannerUploadFile(null);
    if (bannerFileRef.current) bannerFileRef.current.value = "";
    setBannerForm(
      banner
        ? {
            title: banner.title,
            subtitle: banner.subtitle || "",
            imageUrl: banner.imageUrl,
            linkUrl: banner.linkUrl || "",
            linkLabel: banner.linkLabel || "",
            sortOrder: String(banner.sortOrder || 0),
            isActive: banner.isActive,
            startsAt: toDateTimeLocal(banner.startsAt),
            endsAt: toDateTimeLocal(banner.endsAt),
          }
        : emptyBanner
    );
    setBannerDialog(true);
  };

  const saveBanner = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const imageUrl = (await uploadImage(bannerUploadFile)) || bannerForm.imageUrl;
      const payload = {
        title: bannerForm.title.trim(),
        subtitle: bannerForm.subtitle.trim() || null,
        imageUrl,
        linkUrl: bannerForm.linkUrl.trim() || null,
        linkLabel: bannerForm.linkLabel.trim() || null,
        sortOrder: Number(bannerForm.sortOrder || 0),
        isActive: bannerForm.isActive,
        startsAt: fromDateTimeLocal(bannerForm.startsAt),
        endsAt: fromDateTimeLocal(bannerForm.endsAt),
      };
      const saved = editingBanner
        ? await adminApi<Banner>(`/api/v1/admin/banners/${editingBanner.id}`, { method: "PATCH", body: payload })
        : await adminApi<Banner>("/api/v1/admin/banners", { method: "POST", body: payload });
      setBanners((current) => editingBanner ? current.map((item) => item.id === saved.id ? saved : item) : [saved, ...current]);
      setBannerDialog(false);
      setBannerUploadFile(null);
      toast.success(editingBanner ? "Banner updated" : "Banner created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save banner");
    }
  };

  const deleteBanner = async (banner: Banner) => {
    if (!window.confirm(`Delete banner "${banner.title}"?`)) return;
    try {
      await adminApi(`/api/v1/admin/banners/${banner.id}`, { method: "DELETE" });
      setBanners((current) => current.filter((item) => item.id !== banner.id));
      toast.success("Banner deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete banner");
    }
  };

  const openAnnouncement = (announcement?: Announcement) => {
    setEditingAnnouncement(announcement || null);
    setAnnouncementForm(
      announcement
        ? {
            text: announcement.text,
            emoji: announcement.emoji || "",
            linkUrl: announcement.linkUrl || "",
            linkLabel: announcement.linkLabel || "",
            sortOrder: String(announcement.sortOrder || 0),
            isActive: announcement.isActive,
            startsAt: toDateTimeLocal(announcement.startsAt),
            endsAt: toDateTimeLocal(announcement.endsAt),
          }
        : emptyAnnouncement
    );
    setAnnouncementDialog(true);
  };

  const saveAnnouncement = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const payload = {
        text: announcementForm.text.trim(),
        emoji: announcementForm.emoji.trim() || null,
        linkUrl: announcementForm.linkUrl.trim() || null,
        linkLabel: announcementForm.linkLabel.trim() || null,
        sortOrder: Number(announcementForm.sortOrder || 0),
        isActive: announcementForm.isActive,
        startsAt: fromDateTimeLocal(announcementForm.startsAt),
        endsAt: fromDateTimeLocal(announcementForm.endsAt),
      };
      const saved = editingAnnouncement
        ? await adminApi<Announcement>(`/api/v1/admin/announcements/${editingAnnouncement.id}`, { method: "PATCH", body: payload })
        : await adminApi<Announcement>("/api/v1/admin/announcements", { method: "POST", body: payload });
      setAnnouncements((current) => editingAnnouncement ? current.map((item) => item.id === saved.id ? saved : item) : [saved, ...current]);
      setAnnouncementDialog(false);
      toast.success(editingAnnouncement ? "Announcement updated" : "Announcement created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save announcement");
    }
  };

  const deleteAnnouncement = async (announcement: Announcement) => {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      await adminApi(`/api/v1/admin/announcements/${announcement.id}`, { method: "DELETE" });
      setAnnouncements((current) => current.filter((item) => item.id !== announcement.id));
      toast.success("Announcement deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete announcement");
    }
  };

  const openCakePhoto = (photo?: CustomCakePhoto) => {
    setEditingCakePhoto(photo || null);
    setCakeUploadFile(null);
    if (cakeFileRef.current) cakeFileRef.current.value = "";
    setCakeForm(
      photo
        ? {
            title: photo.title,
            imageUrl: photo.imageUrl,
            altText: photo.altText || "",
            sortOrder: String(photo.sortOrder || 0),
            isActive: photo.isActive,
          }
        : emptyCakePhoto
    );
    setCakeDialog(true);
  };

  const saveCakePhoto = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const imageUrl = (await uploadImage(cakeUploadFile)) || cakeForm.imageUrl;
      const payload = {
        title: cakeForm.title.trim(),
        imageUrl,
        altText: cakeForm.altText.trim() || null,
        sortOrder: Number(cakeForm.sortOrder || 0),
        isActive: cakeForm.isActive,
      };
      const saved = editingCakePhoto
        ? await adminApi<CustomCakePhoto>(`/api/v1/admin/custom-cakes/photos/${editingCakePhoto.id}`, { method: "PATCH", body: payload })
        : await adminApi<CustomCakePhoto>("/api/v1/admin/custom-cakes/photos", { method: "POST", body: payload });
      setCakePhotos((current) => editingCakePhoto ? current.map((item) => item.id === saved.id ? saved : item) : [saved, ...current]);
      setCakeDialog(false);
      setCakeUploadFile(null);
      toast.success(editingCakePhoto ? "Custom cake photo updated" : "Custom cake photo added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save photo");
    }
  };

  const deleteCakePhoto = async (photo: CustomCakePhoto) => {
    if (!window.confirm(`Delete ${photo.title}?`)) return;
    try {
      await adminApi(`/api/v1/admin/custom-cakes/photos/${photo.id}`, { method: "DELETE" });
      setCakePhotos((current) => current.filter((item) => item.id !== photo.id));
      toast.success("Photo deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete photo");
    }
  };

  const saveSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingSettings(true);
    try {
      const saved = await adminApi<SiteSettings>("/api/v1/admin/site-settings", {
        method: "PATCH",
        body: {
          ...settings,
          deliveryAreas: (settings.deliveryAreas || []).map((area) => area.trim()).filter(Boolean),
        },
      });
      setSettings(saved);
      toast.success("Site profile saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save site profile");
    } finally {
      setSavingSettings(false);
    }
  };

  const setSetting = (key: keyof SiteSettings, value: string | string[]) =>
    setSettings((current) => ({ ...current, [key]: value }));

  const imageInput = (
    uploadFile: File | null,
    setUploadFile: (file: File | null) => void,
    fileRef: React.RefObject<HTMLInputElement>
  ) => (
    <div className="flex flex-wrap items-center gap-3">
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => setUploadFile(event.target.files?.[0] || null)}
      />
      <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
        <ImagePlus className="mr-2 h-4 w-4" />
        {uploadFile ? uploadFile.name : "Upload image"}
      </Button>
    </div>
  );

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Homepage Content</h1>
          <p className="mt-1 text-muted-foreground">Manage banners, announcement strips, custom cake photos, and business profile data.</p>
        </div>
        <Button variant="outline" className="h-11" onClick={fetchAll}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="rounded-lg border border-border/60 bg-card p-6 shadow-soft">
          <div className="h-40 animate-pulse rounded-lg bg-muted" />
        </div>
      ) : (
        <Tabs defaultValue="banners" className="space-y-5">
          <TabsList className="grid h-auto w-full grid-cols-2 lg:w-[720px] lg:grid-cols-4">
            <TabsTrigger value="banners">Banners</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
            <TabsTrigger value="custom-cakes">Custom Cakes</TabsTrigger>
            <TabsTrigger value="profile">Site Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="banners" className="space-y-4">
            <Button onClick={() => openBanner()} className="bg-gradient-primary shadow-glow">
              <Plus className="mr-2 h-4 w-4" /> New Banner
            </Button>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {banners.map((banner) => (
                <div key={banner.id} className="overflow-hidden rounded-lg border border-border/60 bg-card shadow-soft">
                  <div className="aspect-[16/9] bg-muted">
                    <img src={banner.imageUrl} alt={banner.title} className="h-full w-full object-cover" />
                  </div>
                  <div className="space-y-3 p-4">
                    <div>
                      <p className="font-semibold">{banner.title}</p>
                      {banner.subtitle && <p className="line-clamp-2 text-sm text-muted-foreground">{banner.subtitle}</p>}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`rounded-md px-2 py-1 text-xs font-semibold ${banner.isActive ? "bg-emerald-500/10 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                        {banner.isActive ? "Active" : "Inactive"}
                      </span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openBanner(banner)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="outline" className="hover:border-destructive hover:text-destructive" onClick={() => deleteBanner(banner)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="announcements" className="space-y-4">
            <Button onClick={() => openAnnouncement()} className="bg-gradient-primary shadow-glow">
              <Plus className="mr-2 h-4 w-4" /> New Announcement
            </Button>
            <div className="space-y-3">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="flex flex-col gap-3 rounded-lg border border-border/60 bg-card p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold">{announcement.emoji ? `${announcement.emoji} ` : ""}{announcement.text}</p>
                    <p className="text-xs text-muted-foreground">Sort {announcement.sortOrder} - {announcement.isActive ? "Active" : "Inactive"}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openAnnouncement(announcement)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="outline" className="hover:border-destructive hover:text-destructive" onClick={() => deleteAnnouncement(announcement)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="custom-cakes" className="space-y-4">
            <Button onClick={() => openCakePhoto()} className="bg-gradient-primary shadow-glow">
              <Plus className="mr-2 h-4 w-4" /> New Custom Cake Photo
            </Button>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {cakePhotos.map((photo) => (
                <div key={photo.id} className="overflow-hidden rounded-lg border border-border/60 bg-card shadow-soft">
                  <img src={photo.imageUrl} alt={photo.altText || photo.title} className="aspect-square w-full object-cover" />
                  <div className="space-y-3 p-4">
                    <div>
                      <p className="font-semibold">{photo.title}</p>
                      <p className="text-xs text-muted-foreground">Sort {photo.sortOrder} - {photo.isActive ? "Active" : "Inactive"}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => openCakePhoto(photo)}><Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit</Button>
                      <Button size="sm" variant="outline" className="hover:border-destructive hover:text-destructive" onClick={() => deleteCakePhoto(photo)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="profile">
            <form onSubmit={saveSettings} className="max-w-3xl space-y-5 rounded-lg border border-border/60 bg-card p-6 shadow-soft">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Brand Name</Label>
                  <Input value={settings.brandName || ""} onChange={(event) => setSetting("brandName", event.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={settings.email || ""} onChange={(event) => setSetting("email", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={settings.phone || ""} onChange={(event) => setSetting("phone", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp Number</Label>
                  <Input value={settings.whatsappNumber || ""} onChange={(event) => setSetting("whatsappNumber", event.target.value)} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Tagline</Label>
                  <Input value={settings.tagline || ""} onChange={(event) => setSetting("tagline", event.target.value)} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Footer Note</Label>
                  <Input value={settings.footerNote || ""} onChange={(event) => setSetting("footerNote", event.target.value)} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Address</Label>
                  <Textarea rows={2} value={settings.address || ""} onChange={(event) => setSetting("address", event.target.value)} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Instagram URL</Label>
                  <Input value={settings.instagramUrl || ""} onChange={(event) => setSetting("instagramUrl", event.target.value)} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Delivery Areas</Label>
                  <Input
                    value={(settings.deliveryAreas || []).join(", ")}
                    onChange={(event) => setSetting("deliveryAreas", event.target.value.split(","))}
                    placeholder="Comma-separated"
                  />
                </div>
              </div>
              <Button type="submit" disabled={savingSettings} className="bg-gradient-primary shadow-glow">
                <Save className="mr-2 h-4 w-4" /> {savingSettings ? "Saving..." : "Save Site Profile"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={bannerDialog} onOpenChange={(open) => !open && setBannerDialog(false)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editingBanner ? "Edit Banner" : "Create Banner"}</DialogTitle></DialogHeader>
          <form onSubmit={saveBanner} className="space-y-4">
            <Input value={bannerForm.title} onChange={(event) => setBannerForm({ ...bannerForm, title: event.target.value })} placeholder="Title" required />
            <Textarea value={bannerForm.subtitle} onChange={(event) => setBannerForm({ ...bannerForm, subtitle: event.target.value })} placeholder="Subtitle" />
            <Input value={bannerForm.imageUrl} onChange={(event) => setBannerForm({ ...bannerForm, imageUrl: event.target.value })} placeholder="Image URL" required={!bannerUploadFile} />
            {imageInput(bannerUploadFile, setBannerUploadFile, bannerFileRef)}
            <div className="grid gap-4 sm:grid-cols-2">
              <Input value={bannerForm.linkUrl} onChange={(event) => setBannerForm({ ...bannerForm, linkUrl: event.target.value })} placeholder="Link URL" />
              <Input value={bannerForm.linkLabel} onChange={(event) => setBannerForm({ ...bannerForm, linkLabel: event.target.value })} placeholder="Link Label" />
              <Input type="number" value={bannerForm.sortOrder} onChange={(event) => setBannerForm({ ...bannerForm, sortOrder: event.target.value })} placeholder="Sort order" />
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2.5">
                <Label>Active</Label>
                <Switch checked={bannerForm.isActive} onCheckedChange={(value) => setBannerForm({ ...bannerForm, isActive: value })} />
              </div>
              <Input type="datetime-local" value={bannerForm.startsAt} onChange={(event) => setBannerForm({ ...bannerForm, startsAt: event.target.value })} />
              <Input type="datetime-local" value={bannerForm.endsAt} onChange={(event) => setBannerForm({ ...bannerForm, endsAt: event.target.value })} />
            </div>
            <DialogFooter><Button type="submit" className="bg-gradient-primary shadow-glow">Save Banner</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={announcementDialog} onOpenChange={(open) => !open && setAnnouncementDialog(false)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editingAnnouncement ? "Edit Announcement" : "Create Announcement"}</DialogTitle></DialogHeader>
          <form onSubmit={saveAnnouncement} className="space-y-4">
            <Textarea value={announcementForm.text} onChange={(event) => setAnnouncementForm({ ...announcementForm, text: event.target.value })} placeholder="Announcement text" required />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input value={announcementForm.emoji} onChange={(event) => setAnnouncementForm({ ...announcementForm, emoji: event.target.value })} placeholder="Emoji or short marker" />
              <Input type="number" value={announcementForm.sortOrder} onChange={(event) => setAnnouncementForm({ ...announcementForm, sortOrder: event.target.value })} placeholder="Sort order" />
              <Input value={announcementForm.linkUrl} onChange={(event) => setAnnouncementForm({ ...announcementForm, linkUrl: event.target.value })} placeholder="Link URL" />
              <Input value={announcementForm.linkLabel} onChange={(event) => setAnnouncementForm({ ...announcementForm, linkLabel: event.target.value })} placeholder="Link Label" />
              <Input type="datetime-local" value={announcementForm.startsAt} onChange={(event) => setAnnouncementForm({ ...announcementForm, startsAt: event.target.value })} />
              <Input type="datetime-local" value={announcementForm.endsAt} onChange={(event) => setAnnouncementForm({ ...announcementForm, endsAt: event.target.value })} />
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2.5">
              <Label>Active</Label>
              <Switch checked={announcementForm.isActive} onCheckedChange={(value) => setAnnouncementForm({ ...announcementForm, isActive: value })} />
            </div>
            <DialogFooter><Button type="submit" className="bg-gradient-primary shadow-glow">Save Announcement</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={cakeDialog} onOpenChange={(open) => !open && setCakeDialog(false)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editingCakePhoto ? "Edit Custom Cake Photo" : "Add Custom Cake Photo"}</DialogTitle></DialogHeader>
          <form onSubmit={saveCakePhoto} className="space-y-4">
            <Input value={cakeForm.title} onChange={(event) => setCakeForm({ ...cakeForm, title: event.target.value })} placeholder="Title" required />
            <Input value={cakeForm.imageUrl} onChange={(event) => setCakeForm({ ...cakeForm, imageUrl: event.target.value })} placeholder="Image URL" required={!cakeUploadFile} />
            {imageInput(cakeUploadFile, setCakeUploadFile, cakeFileRef)}
            <Input value={cakeForm.altText} onChange={(event) => setCakeForm({ ...cakeForm, altText: event.target.value })} placeholder="Alt text" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input type="number" value={cakeForm.sortOrder} onChange={(event) => setCakeForm({ ...cakeForm, sortOrder: event.target.value })} placeholder="Sort order" />
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2.5">
                <Label>Active</Label>
                <Switch checked={cakeForm.isActive} onCheckedChange={(value) => setCakeForm({ ...cakeForm, isActive: value })} />
              </div>
            </div>
            <DialogFooter><Button type="submit" className="bg-gradient-primary shadow-glow">Save Photo</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Content;
