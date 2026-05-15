import { ChangeEvent, FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/context/AuthContext";
import { PUBLIC_ERROR_MESSAGE } from "@/lib/api";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2, MailCheck, ShieldCheck, UserRound } from "lucide-react";
import hero from "@/assets/hero.jpg";
import { useSiteSettings } from "@/hooks/useBackendContent";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none transition-smooth focus:border-primary focus:ring-2 focus:ring-ring/20";

const passwordIsStrong = (value: string) =>
  value.length >= 8 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value);

const Signup = () => {
  const { requestSignupOtp, verifySignup } = useAuth();
  const { data: settings } = useSiteSettings();
  const navigate = useNavigate();
  const [step, setStep] = useState<"details" | "otp">("details");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    otp: "",
  });

  const update = (key: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => {
    const value = key === "otp" ? e.target.value.replace(/\D/g, "").slice(0, 6) : e.target.value;
    setForm((current) => ({ ...current, [key]: value }));
  };

  const validateDetails = () => {
    if (!form.name.trim() || !form.email.trim() || !form.password || !form.confirmPassword) {
      toast.error("Please fill in all required fields.");
      return false;
    }
    if (form.phone && !/^\+?[0-9]{10,15}$/.test(form.phone.trim())) {
      toast.error("Please enter a valid phone number.");
      return false;
    }
    if (!passwordIsStrong(form.password)) {
      toast.error("Password needs 8 characters, uppercase, lowercase and a number.");
      return false;
    }
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match.");
      return false;
    }
    return true;
  };

  const requestOtp = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!validateDetails()) return;

    setLoading(true);
    try {
      await requestSignupOtp({
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
      });
      toast.success("OTP sent to your email.");
      setStep("otp");
    } catch {
      toast.error(PUBLIC_ERROR_MESSAGE);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (form.otp.length !== 6) return toast.error("Enter the 6 digit OTP.");

    setLoading(true);
    try {
      await verifySignup({
        email: form.email,
        otp: form.otp,
        password: form.password,
      });
      toast.success("Account verified.");
      navigate("/dashboard");
    } catch {
      toast.error(PUBLIC_ERROR_MESSAGE);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <section className="container py-10 md:py-14">
        <div className="grid overflow-hidden rounded-lg border border-border bg-card shadow-warm lg:grid-cols-[0.95fr_1.05fr]">
          <div className="px-5 py-8 sm:px-8 md:px-12 lg:py-14">
            <div className="mx-auto max-w-lg">
              <div className="mb-8">
                <p className="mb-2 inline-flex items-center gap-2 rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold text-primary">
                  {step === "details" ? <UserRound className="h-3.5 w-3.5" /> : <MailCheck className="h-3.5 w-3.5" />}
                  {step === "details" ? "Create account" : "Email verification"}
                </p>
                <h1 className="font-display text-3xl md:text-4xl">
                  {step === "details" ? `Join ${settings?.brandName || "the bakery"}` : "Check your inbox"}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {step === "details"
                    ? "Your account is verified with an email OTP before it is created."
                    : `Enter the 6 digit code sent to ${form.email}.`}
                </p>
              </div>

              {step === "details" && (
                <form onSubmit={requestOtp} className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block sm:col-span-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Full name</span>
                      <input required autoComplete="name" value={form.name} onChange={update("name")} className={inputClass} />
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</span>
                      <input required type="email" autoComplete="email" value={form.email} onChange={update("email")} className={inputClass} />
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Phone</span>
                      <input type="tel" autoComplete="tel" value={form.phone} onChange={update("phone")} className={inputClass} />
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Password</span>
                      <input required type="password" autoComplete="new-password" value={form.password} onChange={update("password")} className={inputClass} />
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Confirm password</span>
                      <input required type="password" autoComplete="new-password" value={form.confirmPassword} onChange={update("confirmPassword")} className={inputClass} />
                    </label>
                  </div>

                  <div className="rounded-lg border border-border bg-secondary/50 p-4 text-xs text-muted-foreground">
                    <div className="mb-2 flex items-center gap-2 font-semibold text-foreground">
                      <ShieldCheck className="h-4 w-4 text-primary" /> Password requirements
                    </div>
                    <p>Use at least 8 characters with uppercase, lowercase and a number.</p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft transition-smooth hover:bg-primary/95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Sending OTP..." : "Send verification OTP"} <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              )}

              {step === "otp" && (
                <form onSubmit={verifyOtp} className="space-y-5">
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">OTP</span>
                    <input
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      required
                      value={form.otp}
                      onChange={update("otp")}
                      className={`${inputClass} text-center text-lg tracking-[0.3em]`}
                    />
                  </label>

                  <div className="rounded-lg border border-border bg-secondary/50 p-4 text-sm text-muted-foreground">
                    <div className="mb-2 flex items-center gap-2 font-semibold text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary" /> Almost there
                    </div>
                    <p>Your customer account is created only after this OTP is verified.</p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft transition-smooth hover:bg-primary/95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Verifying..." : "Verify and create account"} <ArrowRight className="h-4 w-4" />
                  </button>
                  <div className="flex items-center justify-between text-sm">
                    <button type="button" onClick={() => setStep("details")} className="font-semibold text-primary hover:underline">
                      Edit details
                    </button>
                    <button type="button" onClick={() => requestOtp()} className="text-muted-foreground hover:text-primary">
                      Resend OTP
                    </button>
                  </div>
                </form>
              )}

              <div className="mt-7 border-t border-border pt-5 text-sm">
                <span className="text-muted-foreground">Already have an account? </span>
                <Link to="/login" className="font-semibold text-primary hover:underline">
                  Sign in
                </Link>
              </div>
            </div>
          </div>

          <div className="relative hidden min-h-[680px] lg:block">
            <img src={hero} alt="Freshly baked pastries" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-10 text-background">
              <p className="mb-3 inline-flex items-center gap-2 rounded-lg bg-background/15 px-3 py-2 text-xs font-semibold backdrop-blur">
                <MailCheck className="h-4 w-4" /> OTP verified signup
              </p>
              <h2 className="font-display text-5xl leading-tight">A cleaner account flow for real customers.</h2>
              <p className="mt-4 max-w-md text-sm leading-6 text-background/85">
                A verified account keeps your profile ready for future enquiries.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Signup;
