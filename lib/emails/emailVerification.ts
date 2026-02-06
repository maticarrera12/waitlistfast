import { sendEmail } from "./sendEmail";
import WelcomeEmail from "@/emails/welcome-email";

interface EmailVerificationData {
  user: {
    name: string;
    email: string;
    language?: string | null;
  };
  url: string;
}

export async function sendEmailVerificationEmail({ user, url }: EmailVerificationData) {
  const locale = user.language || process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "en";

  let localizedUrl = url;
  try {
    const parsed = new URL(url);
    const callbackURL = parsed.searchParams.get("callbackURL") || "/verify-email-success";

    // Ensure callbackURL is locale-aware: /{locale}/verify-email-success
    const normalizedCallback =
      callbackURL.startsWith(`/${locale}/`) || callbackURL === `/${locale}`
        ? callbackURL
        : `/${locale}${callbackURL.startsWith("/") ? callbackURL : `/${callbackURL}`}`;

    parsed.searchParams.set("callbackURL", normalizedCallback);
    localizedUrl = parsed.toString();
  } catch {
    // If URL parsing fails, fall back to original url
    localizedUrl = url;
  }

  return sendEmail({
    to: user.email,
    subject: "Welcome! Verify your email address 🎉",
    react: WelcomeEmail({
      userName: user.name,
      verificationUrl: localizedUrl,
    }),
  });
}
