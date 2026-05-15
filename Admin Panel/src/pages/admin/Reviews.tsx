import { useCallback, useEffect, useState } from "react";
import { Check, RefreshCw, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminApi, adminApiRaw, type Pagination, type Review } from "@/lib/api";

type ReviewStatus = "all" | "approved" | "pending";

const Reviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [status, setStatus] = useState<ReviewStatus>("all");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (status !== "all") params.set("status", status);
      const response = await adminApiRaw<Review[]>(`/api/v1/admin/reviews?${params}`);
      setReviews(response.data || []);
      setPagination(response.meta || response.pagination || null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void fetchReviews();
  }, [fetchReviews]);

  const remove = async (review: Review) => {
    if (!window.confirm("Delete this review?")) return;
    setActionId(review.id);
    try {
      await adminApi(`/api/v1/reviews/${review.id}`, { method: "DELETE" });
      setReviews((current) => current.filter((item) => item.id !== review.id));
      setPagination((current) =>
        current ? { ...current, total: Math.max(0, current.total - 1) } : current
      );
      toast.success("Review deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete review");
    } finally {
      setActionId(null);
    }
  };

  const approve = async (review: Review) => {
    setActionId(review.id);
    try {
      await adminApi<Review>(`/api/v1/reviews/${review.id}`, { method: "PATCH" });
      setReviews((current) =>
        status === "pending"
          ? current.filter((item) => item.id !== review.id)
          : current.map((item) =>
              item.id === review.id ? { ...item, isApproved: true } : item
            )
      );
      if (status === "pending") {
        setPagination((current) =>
          current ? { ...current, total: Math.max(0, current.total - 1) } : current
        );
      }
      toast.success("Review approved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not approve review");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Reviews</h1>
          <p className="mt-1 text-muted-foreground">Approve pending reviews or delete inappropriate submissions.</p>
        </div>
        <div className="flex gap-2">
          <Select value={status} onValueChange={(value) => setStatus(value as ReviewStatus)}>
            <SelectTrigger className="h-11 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All reviews</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="h-11" onClick={fetchReviews}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border/60 bg-card shadow-soft">
        {loading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-12 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">No reviews found.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Rating</TableHead>
                  <TableHead>Review</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                        <Star className="h-3.5 w-3.5 fill-current" /> {review.rating}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-md">
                      {review.title && <p className="font-semibold">{review.title}</p>}
                      {review.body && <p className="line-clamp-2 text-sm text-muted-foreground">{review.body}</p>}
                    </TableCell>
                    <TableCell>{review.product?.title || "-"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{review.user?.name || review.user?.email || "-"}</TableCell>
                    <TableCell>
                      <span className={`rounded-md px-2 py-1 text-xs font-semibold ${review.isApproved ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/10 text-amber-700"}`}>
                        {review.isApproved ? "Approved" : "Pending"}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {!review.isApproved && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actionId === review.id}
                            onClick={() => approve(review)}
                          >
                            <Check className="h-3.5 w-3.5" />
                            Approve
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionId === review.id}
                          className="hover:border-destructive hover:text-destructive"
                          onClick={() => remove(review)}
                        >
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
      {pagination && <p className="text-sm text-muted-foreground">{pagination.total} total reviews</p>}
    </div>
  );
};

export default Reviews;
