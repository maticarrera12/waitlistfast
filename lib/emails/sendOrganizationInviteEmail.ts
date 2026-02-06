import { sendEmail } from "./sendEmail";
import OrganizationInviteEmail from "@/emails/organization-invite-email";

export async function sendOrganizationInviteEmail({
  email,
  organization,
  inviter,
  invitation,
}: {
  email: string;
  organization: { name: string };
  inviter:
    | { user?: { name?: string; language?: string | null } | null }
    | { name?: string; language?: string | null };
  invitation: { id: string };
}) {
  const baseURL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const defaultLocale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "en";

  // Get locale from inviter's user language, fallback to default
  const locale =
    ("user" in inviter && inviter.user?.language) ||
    ("language" in inviter && inviter.language) ||
    defaultLocale;

  // Ensure URL includes locale: /{locale}/settings/organization/invites/{id}
  const invitationUrl = `${baseURL}/${locale}/settings/organization/invites/${invitation.id}`;

  // Handle both possible structures from Better Auth
  const inviterName =
    "user" in inviter && inviter.user?.name
      ? inviter.user.name
      : "name" in inviter && inviter.name
        ? inviter.name
        : "a team member";

  return sendEmail({
    to: email,
    subject: `You're invited to join ${organization.name} 👥`,
    react: OrganizationInviteEmail({
      inviterName,
      organizationName: organization.name,
      invitationUrl,
    }),
  });
}
