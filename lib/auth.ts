import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin as adminPlugin, organization } from "better-auth/plugins";

import { sendChangeEmailVerification } from "./emails/sendChangeEmailVerification";
import { sendDeleteAccountVerification } from "./emails/sendDeleteAccountVerification";
import { sendOrganizationInviteEmail } from "./emails/sendOrganizationInviteEmail";
import { sendPasswordResetEmail } from "./emails/sendPasswordResetEmail";
import { prisma } from "./prisma";

async function assignAdminRole(userId: string, email: string) {
  const adminEmails = process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim().toLowerCase()) || [];
  const isAdmin = adminEmails.includes(email.toLowerCase());

  if (isAdmin) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { role: "admin" },
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message ? error.message : "Failed to update user role";
      throw new Error(message);
    }
  }
}

export const auth = betterAuth({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailVerification: async ({ user, url, newEmail }) => {
        await sendChangeEmailVerification({
          user,
          newEmail,
          url,
        });
      },
    },
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification: async ({ user, url }) => {
        await sendDeleteAccountVerification({
          user,
          url,
        });
      },
    },
    additionalFields: {
      credits: {
        type: "number",
        required: false,
      },
      plan: {
        type: "string",
        required: false,
      },
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false,
      },
    },
  },
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail({ user, url });
    },
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
      scope: ["repo", "read:user", "user:email"],
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [
    nextCookies(),
    adminPlugin({
      adminRoles: ["admin"],
      defaultRoles: ["user"],
    }),
    organization({
      sendInvitationEmail: async ({ email, organization, inviter, invitation }) => {
        await sendOrganizationInviteEmail({
          email,
          organization,
          inviter,
          invitation,
        });
      },
      async onActiveOrganizationChange({
        session,
        activeOrganizationId,
      }: {
        session: any;
        activeOrganizationId: any;
      }) {
        if (!session?.userId || !activeOrganizationId) return;

        try {
          await prisma.member.update({
            where: {
              organizationId_userId: {
                organizationId: activeOrganizationId,
                userId: session.userId,
              },
            },
            data: {
              updatedAt: new Date(),
            },
          });
        } catch (error) {
          console.error("Error updating member activity:", error);
        }
      },
    }),
  ],
  callbacks: {
    session: async ({ session, user }: { session: any; user: any }) => {
      const activeOrgId = session.activeOrganizationId;
      if (!activeOrgId) return session;

      const member = await prisma.member.findUnique({
        where: {
          organizationId_userId: {
            organizationId: activeOrgId,
            userId: user.id,
          },
        },
        select: { role: true },
      });

      return {
        ...session,
        user: {
          ...session.user,
          orgRole: member?.role || "member",
        },
      };
    },
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const lastMembership = await prisma.member.findFirst({
            where: {
              userId: session.userId,
            },
            orderBy: {
              createdAt: "desc",
            },
            select: {
              organizationId: true,
            },
          });

          return {
            data: {
              ...session,

              activeOrganizationId: lastMembership?.organizationId ?? null,
            },
          };
        },
      },
    },
  },
});

export { prisma, assignAdminRole };
