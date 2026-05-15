import { Resend } from "resend";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Chandigarh Bakery";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const FROM =
  process.env.RESEND_FROM_EMAIL ?? `no-reply@${new URL(APP_URL).hostname}`;

type OtpPurpose = "registration" | "password_reset";

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY is not set");
  }
  return new Resend(key);
}

async function send(to: string, subject: string, html: string): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    console.log("[DEV EMAIL - not sent]");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    if (process.env.LOG_DEV_OTPS === "true") {
      console.log(html.replace(/<[^>]+>/g, "").trim());
    } else {
      console.log("OTP body suppressed. Set LOG_DEV_OTPS=true locally to print development codes.");
    }
    return;
  }

  const resend = getResend();
  const { error } = await resend.emails.send({ from: FROM, to, subject, html });
  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

export async function sendOtpEmail(
  to: string,
  otp: string,
  purpose: OtpPurpose
): Promise<void> {
  const isReset = purpose === "password_reset";
  const subject = isReset
    ? `Reset your ${APP_NAME} password`
    : `Verify your ${APP_NAME} account`;

  await send(
    to,
    subject,
    `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto">
        <h2>${subject}</h2>
        <p>Your one-time password is:</p>
        <p style="font-size:28px;letter-spacing:6px;font-weight:700;margin:20px 0">${otp}</p>
        <p>This code expires in 10 minutes.</p>
        <p style="color:#666;font-size:13px">
          If you did not request this, you can safely ignore this email.
        </p>
      </div>
    `
  );
}
