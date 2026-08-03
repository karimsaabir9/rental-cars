import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { TRPCError } from "@trpc/server";

// Guards tRPC mutations that are cheap to spam but expensive to us or to
// other users (booking creation blocks calendar dates and pages admins;
// payment attempts simulate a gateway call). Not configured yet in most
// environments -- see README for the two-step Upstash setup -- so this
// degrades to "no limiting" rather than breaking requests when the env
// vars are absent.
// KV_REST_API_* is what Vercel's Upstash Marketplace integration injects;
// UPSTASH_REDIS_REST_* is the name Upstash's own docs use for a
// self-provisioned database. Accept either so this works regardless of how
// the database was created.
const restUrl = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const restToken = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = restUrl && restToken ? new Redis({ url: restUrl, token: restToken }) : null;

if (!redis) {
  console.warn(
    "[rate-limit] KV_REST_API_URL/TOKEN (or UPSTASH_REDIS_REST_URL/TOKEN) not set -- tRPC mutation rate limiting is disabled.",
  );
}

const limiters = {
  // 5 booking requests per 10 minutes per user.
  bookingCreate: redis
    ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "10 m"), prefix: "rl:booking" })
    : null,
  // 10 payment attempts per 10 minutes per user.
  paymentAttempt: redis
    ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "10 m"), prefix: "rl:payment" })
    : null,
} as const;

export async function enforceRateLimit(limiter: keyof typeof limiters, identifier: string) {
  const rl = limiters[limiter];
  if (!rl) return;
  const { success, reset } = await rl.limit(identifier);
  if (!success) {
    const retryAfterSeconds = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Too many requests. Please try again in ${retryAfterSeconds}s.`,
    });
  }
}
