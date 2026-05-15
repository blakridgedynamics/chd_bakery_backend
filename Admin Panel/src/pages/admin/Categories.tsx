import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { adminApi, adminUpload, type Category } from "@/lib/api";

type CategoryForm = {
  name: string;
  slug: string;
  description: string;
  image: string;
  parentId: string;
  sortOrder: string;
  isActive: boolean;
};

const emptyForm: CategoryForm = {
  name: "",
  slug: "",
  description: "",
  image: "",
  parentId: "none",
  sortOrder: "0",
  isActive: true,
};

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      setCategories(await adminApi<Category[]>("/api/v1/admin/categories"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCategories();
  }, []);

  const parentName = useMemo(() => {
    const map = new Map(categories.map((category) => [category.id, category.name]));
    return (id?: string | null) => (id ? map.get(id) || "Unknown" : "Top level");
  }, [categories]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return categories;
    return categories.filter((category) =>
      [category.name, category.slug, category.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    );
  }, [categories, query]);

  const openCreate = () => {
    setEditing(null);
    setImageFile(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setImageFile(null);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      image: category.image || "",
      parentId: category.parentId || "none",
      sortOrder: String(category.sortOrder || 0),
      isActive: category.isActive,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setEditing(null);
    setDialogOpen(false);
    setForm(emptyForm);
    setImageFile(null);
  };

  const set = (key: keyof CategoryForm, value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));

  const uploadCategoryImage = async (slug: string) => {
    if (!imageFile) return null;
    const data = new FormData();
    data.append("image", imageFile);
    const uploaded = await adminUpload<{ url: string }>(`/api/v1/uploads/category/${encodeURIComponent(slug)}`, data);
    return uploaded.url;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        description: form.description.trim() || null,
        image: form.image.trim() || null,
        parentId: form.parentId === "none" ? null : form.parentId,
        sortOrder: Number(form.sortOrder || 0),
        isActive: form.isActive,
      };

      const saved = editing
        ? await adminApi<Category>(`/api/v1/categories/${encodeURIComponent(editing.slug)}`, { method: "PUT", body: payload })
        : await adminApi<Category>("/api/v1/categories", { method: "POST", body: payload });

      if (imageFile) await uploadCategoryImage(saved.slug);
      toast.success(editing ? "Category updated" : "Category created");
      closeDialog();
      void fetchCategories();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save category");
    } finally {
      setSaving(false);
    }
  };

  const removeCategory = async (category: Category) => {
    if (!window.confirm(`Delete ${category.name}?`)) return;
    try {
      await adminApi(`/api/v1/categories/${encodeURIComponent(category.slug)}`, { method: "DELETE" });
      setCategories((current) => current.filter((item) => item.id !== category.id));
      toast.success("Category deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete category");
    }
  };

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Categories</h1>
          <p className="mt-1 text-muted-foreground">Manage the nested catalog tree and category images.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search categories" className="h-11 pl-10" />
          </div>
          <Button variant="outline" className="h-11" onClick={fetchCategories}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button className="h-11 bg-gradient-primary shadow-glow" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> New Category
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border/60 bg-card shadow-soft">
        {loading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-14 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">No categories found.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Category</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Sort</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 overflow-hidden rounded-lg bg-muted">
                          {category.image && <img src={category.image} alt={category.name} className="h-full w-full object-cover" />}
                        </div>
                        <div>
                          <p className="font-semibold">{category.name}</p>
                          <p className="text-xs text-muted-foreground">{category.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{parentName(category.parentId)}</TableCell>
                    <TableCell>{category.sortOrder}</TableCell>
                    <TableCell>
                      <span className={`rounded-md px-2 py-1 text-xs font-semibold ${category.isActive ? "bg-emerald-500/10 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                        {category.isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(category)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" className="hover:border-destructive hover:text-destructive" onClick={() => removeCategory(category)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{editing ? "Edit Category" : "Create Category"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(event) => set("name", event.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={form.slug} onChange={(event) => set("slug", event.target.value)} disabled={Boolean(editing)} placeholder="Auto-generated if blank" />
              </div>
              <div className="space-y-2">
                <Label>Parent</Label>
                <Select value={form.parentId} onValueChange={(value) => set("parentId", value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Top level</SelectItem>
                    {categories
                      .filter((category) => category.id !== editing?.id)
                      .map((category) => (
                        <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input type="number" value={form.sortOrder} onChange={(event) => set("sortOrder", event.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Description</Label>
                <Textarea rows={3} value={form.description} onChange={(event) => set("description", event.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Image URL</Label>
                <Input value={form.image} onChange={(event) => set("image", event.target.value)} />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => setImageFile(event.target.files?.[0] || null)}
              />
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                <ImagePlus className="mr-2 h-4 w-4" />
                {imageFile ? imageFile.name : "Upload category image"}
              </Button>
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-2.5">
                <Label>Active</Label>
                <Switch checked={form.isActive} onCheckedChange={(value) => set("isActive", value)} />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-gradient-primary shadow-glow">
                {saving ? "Saving..." : "Save Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Categories;
