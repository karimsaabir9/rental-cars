import { createAuthClient } from "better-auth/react";
import type { Role } from "@/lib/auth";

// No baseURL: the client and server are always same-origin, so
// better-auth/react defaults to the browser's current origin. A hardcoded
// baseURL here would need a NEXT_PUBLIC_ var to reach the browser bundle at
// all (plain server env vars aren't inlined client-side).
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;

export type { Role };
