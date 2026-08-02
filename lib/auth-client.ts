import { createAuthClient } from "better-auth/react";
import type { Role } from "@/lib/auth";

export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
});

export const { signIn, signUp, signOut, useSession } = authClient;

export type { Role };
