import { Link, Navigate, useNavigate } from "react-router-dom";
import { FormEvent, useState } from "react";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/context/AuthContext";
import { PUBLIC_ERROR_MESSAGE } from "@/lib/api";
import { waGeneric } from "@/lib/whatsapp";
import { useSiteSettings } from "@/hooks/useBackendContent";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowRight, KeyRound, LogOut, Mail, MessageCircle, ShieldCheck, User as UserIcon } from "lucide-react";

const passwordIsStrong = (value: string) =>
  value.length >= 8 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value);

type PasswordStep = "request" | "verify";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/20";

const Dashboard = () => {
  const { user, logout, isBootstrapping, requestPasswordOtp, resetPassword } = useAuth();
  const { data: settings } = useSiteSettings();
  const navigate = useNavigate();
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordStep, setPasswordStep] = useState<PasswordStep>("request");
  const [passwordOtp, setPasswordOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const resetPasswordDialog = () => {
    setPasswordStep("request");
    setPasswordOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordLoading(false);
  };

  const handlePasswordDialogOpen = (open: boolean) => {
    setPasswordDialogOpen(open);
    if (!open) resetPasswordDialog();
  };

  const requestPasswordChangeOtp = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!user?.email) return toast.error(PUBLIC_ERROR_MESSAGE);

    setPasswordLoading(true);
    try {
      await requestPasswordOtp(user.email);
      toast.success("OTP sent to your email.");
      setPasswordStep("verify");
    } catch {
      toast.error(PUBLIC_ERROR_MESSAGE);
    } finally {
      setPasswordLoading(false);
    }
  };

  const completePasswordChange = async (event: FormEvent) => {
    event.preventDefault();
    if (!user?.email) return toast.error(PUBLIC_ERROR_MESSAGE);
    if (passwordOtp.length !== 6) return toast.error("Enter the 6 digit OTP.");
    if (!passwordIsStrong(newPassword)) {
      return toast.error("Password needs 8 characters, uppercase, lowercase and a number.");
    }
    if (newPassword !== confirmPassword) return toast.error("Passwords do not match.");

    setPasswordLoading(true);
    try {
      await resetPassword({ email: user.email, otp: passwordOtp, password: newPassword });
      toast.success("Password updated. Please sign in again.");
      setPasswordDialogOpen(false);
      await logout();
      navigate("/login");
    } catch {
      toast.error(PUBLIC_ERROR_MESSAGE);
    } finally {
      setPasswordLoading(false);
    }
  };

  if (isBootstrapping) {
    return (
      <Layout>
        <section className="container py-10 md:py-14">
          <div className="h-44 animate-pulse rounded-lg bg-muted" />
        </section>
      </Layout>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const firstName = user.name.split(" ")[0] || "there";

  return (
    <Layout>
      <section className="container py-10 md:py-14">
        <div className="mb-8 rounded-lg bg-gradient-primary p-8 text-primary-foreground shadow-warm md:p-10">
          <p className="mb-2 text-xs uppercase tracking-[0.18em] opacity-80">My account</p>
          <h1 className="font-display text-3xl md:text-4xl">Hi {firstName}</h1>
          <p className="mt-2 opacity-90">View your verified identity and keep your password secure.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-border/40 bg-card p-6 shadow-card">
            <div className="mb-4 flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl">Profile</h2>
            </div>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Name</dt>
                <dd className="font-medium">{user.name}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Email</dt>
                <dd className="break-all font-medium">{user.email}</dd>
              </div>
              {user.phone && (
                <div>
                  <dt className="text-xs text-muted-foreground">Phone</dt>
                  <dd className="font-medium">{user.phone}</dd>
                </div>
              )}
            </dl>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm">
              <button
                type="button"
                onClick={() => setPasswordDialogOpen(true)}
                className="inline-flex items-center gap-2 font-semibold text-primary hover:underline"
              >
                <KeyRound className="h-4 w-4" /> Change password
              </button>
              <button
                onClick={() => void logout()}
                className="inline-flex items-center gap-2 font-semibold text-destructive hover:underline"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-border/40 bg-card p-6 shadow-card">
            <div className="mb-4 flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl">Place an order</h2>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Share what you need and we will confirm availability, quantity, delivery date and payment details.
            </p>
            <div className="space-y-3">
              {settings?.whatsappNumber && (
                <a
                  href={waGeneric(settings.whatsappNumber)}
                  onClick={(event) => {
                    event.preventDefault();
                    window.open(waGeneric(settings.whatsappNumber), "_blank", "noopener,noreferrer");
                  }}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[hsl(142_55%_38%)] px-5 py-3 text-sm font-semibold text-white hover-lift"
                >
                  <MessageCircle className="h-4 w-4" /> Enquire on WhatsApp
                </a>
              )}
              <Link
                to="/shop"
                className="inline-flex w-full items-center justify-center rounded-lg border border-border bg-background px-5 py-3 text-sm font-semibold transition-smooth hover:bg-secondary"
              >
                Browse menu
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Dialog open={passwordDialogOpen} onOpenChange={handlePasswordDialogOpen}>
        <DialogContent className="rounded-lg sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-2xl">
              <ShieldCheck className="h-5 w-5 text-primary" /> Change password
            </DialogTitle>
            <DialogDescription>
              {passwordStep === "request"
                ? "We will send an OTP to your registered email."
                : "Enter the email OTP and choose a new password."}
            </DialogDescription>
          </DialogHeader>

          {passwordStep === "request" ? (
            <form onSubmit={requestPasswordChangeOtp} className="space-y-4">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</span>
                <div className="relative mt-1.5">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input value={user.email} readOnly className={`${inputClass} pl-11 text-muted-foreground`} />
                </div>
              </label>
              <button
                type="submit"
                disabled={passwordLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
              >
                {passwordLoading ? "Sending OTP..." : "Send OTP"} <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={completePasswordChange} className="space-y-4">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">OTP</span>
                <input
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  value={passwordOtp}
                  onChange={(event) => setPasswordOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  className={`${inputClass} mt-1.5 text-center text-lg tracking-[0.3em]`}
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">New password</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className={`${inputClass} mt-1.5`}
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Confirm password</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className={`${inputClass} mt-1.5`}
                />
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => void requestPasswordChangeOtp()}
                  disabled={passwordLoading}
                  className="inline-flex items-center justify-center rounded-lg border border-border px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Resend OTP
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {passwordLoading ? "Updating..." : "Update password"} <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Dashboard;
