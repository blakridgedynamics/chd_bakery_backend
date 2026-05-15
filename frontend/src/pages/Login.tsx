import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/context/AuthContext";
import { LOGIN_ERROR_MESSAGE, PUBLIC_ERROR_MESSAGE } from "@/lib/api";
import { toast } from "sonner";
import { ArrowRight, Eye, EyeOff, KeyRound, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import hero from "@/assets/hero.jpg";
import { useSiteSettings } from "@/hooks/useBackendContent";

type Mode = "login" | "forgot" | "reset";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none transition-smooth focus:border-primary focus:ring-2 focus:ring-ring/20";

const passwordIsStrong = (value: string) =>
  value.length >= 8 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value);

const Login = () => {
  const { login, requestPasswordOtp, resetPassword } = useAuth();
  const { data: settings } = useSiteSettings();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const submitLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Please enter your email and password.");

    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back.");
      navigate("/dashboard");
    } catch {
      toast.error(LOGIN_ERROR_MESSAGE);
    } finally {
      setLoading(false);
    }
  };

  const submitForgot = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email address.");

    setLoading(true);
    try {
      await requestPasswordOtp(email);
      toast.success("If the account exists, an OTP has been sent.");
      setMode("reset");
    } catch {
      toast.error(PUBLIC_ERROR_MESSAGE);
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !otp || !newPassword) return toast.error("Please fill in all fields.");
    if (!passwordIsStrong(newPassword)) {
      return toast.error("Password needs 8 characters, uppercase, lowercase and a number.");
    }

    setLoading(true);
    try {
      await resetPassword({ email, otp, password: newPassword });
      toast.success("Password updated. You can sign in now.");
      setPassword("");
      setNewPassword("");
      setOtp("");
      setMode("login");
    } catch {
      toast.error(PUBLIC_ERROR_MESSAGE);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <section className="container py-10 md:py-14">
        <div className="grid overflow-hidden rounded-lg border border-border bg-card shadow-warm lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative hidden min-h-[620px] lg:block">
            <img src={hero} alt={`${settings?.brandName || "Bakery"} desserts`} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-10 text-background">
              <p className="mb-3 inline-flex items-center gap-2 rounded-lg bg-background/15 px-3 py-2 text-xs font-semibold backdrop-blur">
                <ShieldCheck className="h-4 w-4" /> Secure customer access
              </p>
              <h1 className="font-display text-5xl leading-tight">Fresh bakes, faster account access.</h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-background/85">
                Sign in to view your verified profile and send bakery enquiries faster.
              </p>
            </div>
          </div>

          <div className="px-5 py-8 sm:px-8 md:px-12 lg:py-14">
            <div className="mx-auto max-w-md">
              <div className="mb-8">
                <p className="mb-2 inline-flex items-center gap-2 rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold text-primary">
                  <LockKeyhole className="h-3.5 w-3.5" /> Account
                </p>
                <h2 className="font-display text-3xl md:text-4xl">
                  {mode === "login" ? "Welcome back" : mode === "forgot" ? "Reset your password" : "Enter your OTP"}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {mode === "login"
                    ? "Use your verified email and password to continue."
                    : mode === "forgot"
                      ? "We will send a one-time code to your registered email."
                      : "Create a new password after verifying the email code."}
                </p>
              </div>

              {mode === "login" && (
                <form onSubmit={submitLogin} className="space-y-5">
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</span>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`${inputClass} pl-11`}
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Password</span>
                    <div className="relative">
                      <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`${inputClass} px-11`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className="absolute right-3 top-1/2 rounded-md p-1.5 text-muted-foreground transition-smooth hover:bg-secondary hover:text-foreground"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </label>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Verified bakery account</span>
                    <button type="button" onClick={() => setMode("forgot")} className="font-semibold text-primary hover:underline">
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft transition-smooth hover:bg-primary/95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Signing in..." : "Sign in"} <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              )}

              {mode === "forgot" && (
                <form onSubmit={submitForgot} className="space-y-5">
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</span>
                    <input
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClass}
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft transition-smooth hover:bg-primary/95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Sending OTP..." : "Send OTP"} <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              )}

              {mode === "reset" && (
                <form onSubmit={submitReset} className="space-y-5">
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</span>
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">OTP</span>
                    <input
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className={`${inputClass} text-center text-lg tracking-[0.3em]`}
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">New password</span>
                    <input
                      type="password"
                      autoComplete="new-password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={inputClass}
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft transition-smooth hover:bg-primary/95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Updating..." : "Update password"} <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              )}

              <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5 text-sm">
                {mode === "login" ? (
                  <>
                    <span className="text-muted-foreground">New to {settings?.brandName || "the bakery"}?</span>
                    <Link to="/signup" className="font-semibold text-primary hover:underline">
                      Create account
                    </Link>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => setMode("login")} className="font-semibold text-primary hover:underline">
                      Back to sign in
                    </button>
                    {mode === "reset" && (
                      <button type="button" onClick={() => setMode("forgot")} className="text-muted-foreground hover:text-primary">
                        Resend OTP
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Login;
