import { useCallback, useEffect, useState } from "react";
import { Mail, MailOpen, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminApi, type ContactMessage, type Pagination } from "@/lib/api";

type MessageResponse = {
  data: ContactMessage[];
  pagination: Pagination;
};

const Messages = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ContactMessage | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (unreadOnly) params.set("unread", "true");
      const data = await adminApi<MessageResponse>(`/api/v1/messages?${params}`);
      setMessages(data.data || []);
      setPagination(data.pagination || null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [unreadOnly]);

  useEffect(() => {
    void fetchMessages();
  }, [fetchMessages]);

  const markRead = async (message: ContactMessage, isRead: boolean) => {
    try {
      await adminApi(`/api/v1/messages/${message.id}`, {
        method: "PATCH",
        body: { isRead },
      });
      setMessages((current) => current.map((item) => (item.id === message.id ? { ...item, isRead } : item)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update message");
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await adminApi(`/api/v1/messages/${pendingDelete.id}`, { method: "DELETE" });
      setMessages((current) => current.filter((message) => message.id !== pendingDelete.id));
      setPagination((current) =>
        current ? { ...current, total: Math.max(0, current.total - 1) } : current
      );
      if (selected?.id === pendingDelete.id) setSelected(null);
      setPendingDelete(null);
      toast.success("Message deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete message");
    } finally {
      setDeleting(false);
    }
  };

  const open = (message: ContactMessage) => {
    setSelected(message);
    if (!message.isRead) void markRead(message, true);
  };

  const unreadCount = messages.filter((message) => !message.isRead).length;

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Messages</h1>
          <p className="mt-1 text-muted-foreground">
            {pagination?.total ?? messages.length} total - {unreadCount} unread on this page
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant={unreadOnly ? "default" : "outline"} onClick={() => setUnreadOnly((value) => !value)}>
            {unreadOnly ? "Show all" : "Unread only"}
          </Button>
          <Button variant="outline" onClick={fetchMessages}>
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
        ) : messages.length === 0 ? (
          <div className="py-16 text-center">
            <Mail className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No messages yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-8" />
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((message) => (
                  <TableRow
                    key={message.id}
                    className={`cursor-pointer transition-colors hover:bg-muted/30 ${!message.isRead ? "bg-primary/5 font-medium" : ""}`}
                    onClick={() => open(message)}
                  >
                    <TableCell>{message.isRead ? <MailOpen className="h-4 w-4 text-muted-foreground" /> : <Mail className="h-4 w-4 text-primary" />}</TableCell>
                    <TableCell className="font-medium">{message.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{message.email}</TableCell>
                    <TableCell className="text-sm">{message.subject || "-"}</TableCell>
                    <TableCell className="max-w-xs"><p className="truncate text-sm">{message.message}</p></TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(message.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </TableCell>
                    <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => markRead(message, !message.isRead)} title={message.isRead ? "Mark unread" : "Mark read"}>
                          {message.isRead ? <Mail className="h-3.5 w-3.5" /> : <MailOpen className="h-3.5 w-3.5" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="hover:text-destructive"
                          onClick={() => setPendingDelete(message)}
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

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{selected?.subject || "Message"}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="mb-1 text-xs text-muted-foreground">From</p>
                  <p className="font-semibold">{selected.name}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="mb-1 text-xs text-muted-foreground">Email</p>
                  <a href={`mailto:${selected.email}`} className="font-semibold text-primary hover:underline">{selected.email}</a>
                </div>
                {selected.phone && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="mb-1 text-xs text-muted-foreground">Phone</p>
                    <a href={`tel:${selected.phone}`} className="font-semibold text-primary hover:underline">{selected.phone}</a>
                  </div>
                )}
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="mb-1 text-xs text-muted-foreground">Date</p>
                  <p className="font-semibold">{new Date(selected.createdAt).toLocaleString("en-IN")}</p>
                </div>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="mb-2 text-xs text-muted-foreground">Message</p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{selected.message}</p>
              </div>
              <div className="flex justify-between pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="hover:border-destructive hover:text-destructive"
                  onClick={() => setPendingDelete(selected)}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
                <a
                  href={`mailto:${selected.email}?subject=Re: ${selected.subject || "Your message"}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  <Mail className="h-4 w-4" /> Reply via email
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open && !deleting) setPendingDelete(null);
        }}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete message?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the message from{" "}
              <span className="font-medium text-foreground">
                {pendingDelete?.name || pendingDelete?.email || "this sender"}
              </span>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
              }}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Messages;
