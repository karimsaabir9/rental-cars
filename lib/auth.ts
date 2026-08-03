import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { emailLayout, sendEmail } from "@/lib/email";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your RentalCars password",
        html: emailLayout({
          heading: "Reset your password",
          body: `Hi ${user.name}, we received a request to reset your password. This link expires in 1 hour. If you didn't request this, you can safely ignore this email.`,
          ctaLabel: "Reset password",
          ctaUrl: url,
        }),
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    // Verification is sent but not required to sign in -- there's no
    // migration path to retroactively verify every existing account, so
    // enforcing this would lock out real users who signed up before this
    // feature existed.
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your email for RentalCars",
        html: emailLayout({
          heading: "Verify your email",
          body: `Hi ${user.name}, please confirm this is your email address to finish setting up your RentalCars account.`,
          ctaLabel: "Verify email",
          ctaUrl: url,
        }),
      });
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
        input: false, // never trust a role passed in from the client
      },
    },
    changeEmail: {
      enabled: true,
      // No email provider is configured in this app, so update directly
      // rather than sending a verification link to the new address.
      updateEmailWithoutVerification: true,
    },
  },
});

export type Role = "user" | "admin";
