import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
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
