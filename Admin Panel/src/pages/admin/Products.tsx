import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Pencil, Plus, RefreshCw, Search, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { adminApi, adminUpload, type Category, type Product } from "@/lib/api";

type ProductForm = {
  title: string;
  sku: string;
  price: string;
  discountPrice: string;
  stock: string;
  lowStockThreshold: string;
  categoryId: string;
  description: string;
  shortDescription: string;
  tagsText: string;
  images: string[];
  isFeatured: boolean;
  isActive: boolean;
  weight: string;
  metaTitle: string;
  metaDescription: string;
};

const emptyForm: ProductForm = {
  title: "",
  sku: "",
  price: "",
  discountPrice: "",
  stock: "0",
  lowStockThreshold: "5",
  categoryId: "none",
  description: "",
  shortDescription: "",
  tagsText: "",
  images: [],
  isFeatured: false,
  isActive: true,
  weight: "",
  metaTitle: "",
  metaDescription: "",
};

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const toNumber = (value: string) => (value.trim() ? Number(value) : undefined);

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [productRows, categoryRows] = await Promise.all([
        adminApi<Product[]>("/api/v1/admin/products"),
        adminApi<Category[]>("/api/v1/admin/categories"),
      ]);
      setProducts(productRows || []);
      setCategories(categoryRows || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAll();
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return products;
    return products.filter((product) =>
      [product.title, product.sku, product.category?.name, product.slug]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    );
  }, [products, query]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFiles([]);
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setDialogOpen(true);
    setFiles([]);
    setForm({
      title: product.title,
      sku: product.sku,
      price: product.price,
      discountPrice: product.discountPrice || "",
      stock: String(product.stock ?? 0),
      lowStockThreshold: String(product.lowStockThreshold ?? 5),
      categoryId: product.categoryId || "none",
      description: product.description,
      shortDescription: product.shortDescription || "",
      tagsText: Array.isArray(product.tags) ? product.tags.join(", ") : "",
      images: Array.isArray(product.images) ? product.images : [],
      isFeatured: Boolean(product.isFeatured),
      isActive: Boolean(product.isActive),
      weight: product.weight || "",
      metaTitle: product.metaTitle || "",
      metaDescription: product.metaDescription || "",
    });
  };

  const closeDialog = () => {
    setEditing(null);
    setForm(emptyForm);
    setFiles([]);
    setDialogOpen(false);
  };

  const set = (key: keyof ProductForm, value: string | boolean | string[]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const uploadSelectedImages = async () => {
    if (!files.length) return [];
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));
    const uploaded = await adminUpload<{ urls: string[] }>("/api/v1/admin/upload", formData);
    return uploaded.urls || [];
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const uploadedUrls = await uploadSelectedImages();
      const images = [...form.images, ...uploadedUrls];
      const payload = {
        title: form.title.trim(),
        sku: form.sku.trim(),
        price: Number(form.price),
        discountPrice: toNumber(form.discountPrice) ?? null,
        stock: Number(form.stock),
        lowStockThreshold: Number(form.lowStockThreshold || 5),
        categoryId: form.categoryId === "none" ? null : form.categoryId,
        description: form.description.trim(),
        shortDescription: form.shortDescription.trim() || null,
        tags: form.tagsText
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        images,
        isFeatured: form.isFeatured,
        isActive: form.isActive,
        weight: toNumber(form.weight) ?? null,
        metaTitle: form.metaTitle.trim() || null,
        metaDescription: form.metaDescription.trim() || null,
      };

      const saved = editing
        ? await adminApi<Product>(`/api/v1/admin/products/${editing.id}`, { method: "PATCH", body: payload })
        : await adminApi<Product>("/api/v1/admin/products", { method: "POST", body: payload });

      if (editing) {
        setProducts((current) => current.map((product) => (product.id === saved.id ? { ...product, ...saved } : product)));
        toast.success("Product updated");
      } else {
        setProducts((current) => [saved, ...current]);
        toast.success("Product created");
      }
      closeDialog();
      void fetchAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save product");
    } finally {
      setSaving(false);
    }
  };

  const removeProduct = async (product: Product) => {
    if (!window.confirm(`Delete ${product.title}?`)) return;
    try {
      await adminApi(`/api/v1/admin/products/${product.id}`, { method: "DELETE" });
      setProducts((current) => current.filter((item) => item.id !== product.id));
      toast.success("Product deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete product");
    }
  };

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Products</h1>
          <p className="mt-1 text-muted-foreground">{products.length} catalog items.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products" className="h-11 pl-10" />
          </div>
          <Button variant="outline" onClick={fetchAll} className="h-11">
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button onClick={openCreate} className="h-11 bg-gradient-primary shadow-glow">
            <Plus className="mr-2 h-4 w-4" /> New Product
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
          <p className="py-16 text-center text-muted-foreground">No products found.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 overflow-hidden rounded-lg bg-muted">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt={product.title} className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <div>
                          <p className="font-semibold">{product.title}</p>
                          <p className="text-xs text-muted-foreground">{product.sku}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{product.category?.name || "Unassigned"}</TableCell>
                    <TableCell className="font-semibold">
                      {money.format(Number(product.discountPrice || product.price || 0))}
                    </TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {product.isFeatured && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                            <Sparkles className="h-3 w-3" /> Featured
                          </span>
                        )}
                        <span className={`rounded-md px-2 py-1 text-xs font-semibold ${product.isActive ? "bg-emerald-500/10 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                          {product.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(product)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" className="hover:border-destructive hover:text-destructive" onClick={() => removeProduct(product)}>
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
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{editing ? "Edit Product" : "Create Product"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Title</Label>
                <Input value={form.title} onChange={(event) => set("title", event.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input value={form.sku} onChange={(event) => set("sku", event.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.categoryId} onValueChange={(value) => set("categoryId", value)}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Price</Label>
                <Input type="number" min="0" step="0.01" value={form.price} onChange={(event) => set("price", event.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Discount Price</Label>
                <Input type="number" min="0" step="0.01" value={form.discountPrice} onChange={(event) => set("discountPrice", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Stock</Label>
                <Input type="number" min="0" value={form.stock} onChange={(event) => set("stock", event.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Low Stock Threshold</Label>
                <Input type="number" min="0" value={form.lowStockThreshold} onChange={(event) => set("lowStockThreshold", event.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Short Description</Label>
                <Input value={form.shortDescription} onChange={(event) => set("shortDescription", event.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Description</Label>
                <Textarea rows={4} value={form.description} onChange={(event) => set("description", event.target.value)} required />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Tags</Label>
                <Input value={form.tagsText} onChange={(event) => set("tagsText", event.target.value)} placeholder="Comma-separated" />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Images</Label>
              {form.images.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {form.images.map((url) => (
                    <div key={url} className="relative h-20 w-20 overflow-hidden rounded-lg border border-border bg-muted">
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => set("images", form.images.filter((image) => image !== url))}
                        className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
                        aria-label="Remove image"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(event) => setFiles(Array.from(event.target.files || []))}
              />
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                <ImagePlus className="mr-2 h-4 w-4" />
                {files.length ? `${files.length} selected` : "Upload images"}
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                <Label>Featured</Label>
                <Switch checked={form.isFeatured} onCheckedChange={(value) => set("isFeatured", value)} />
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                <Label>Active</Label>
                <Switch checked={form.isActive} onCheckedChange={(value) => set("isActive", value)} />
              </div>
              <div className="space-y-2">
                <Label>Weight</Label>
                <Input type="number" min="0" step="0.001" value={form.weight} onChange={(event) => set("weight", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Meta Title</Label>
                <Input value={form.metaTitle} onChange={(event) => set("metaTitle", event.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Meta Description</Label>
                <Textarea rows={2} value={form.metaDescription} onChange={(event) => set("metaDescription", event.target.value)} />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-gradient-primary shadow-glow">
                {saving ? "Saving..." : editing ? "Save Product" : "Create Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Products;
