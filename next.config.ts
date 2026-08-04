import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// Cloudinary/Unsplash images + Better Auth's own endpoints are the only
// cross-origin sources this app legitimately loads; everything else is
// same-origin only.
//
// 'unsafe-eval' is added in development only -- React's dev-mode debugging
// (reconstructing component stacks, Turbopack HMR) relies on eval(), which
// this CSP otherwise blocks. React never uses eval() in production, so
// production keeps the stricter policy.
//
// connect-src also allows Sentry's ingest endpoint -- without it, the
// browser silently drops every error report client-side (no console
// warning, no thrown error) since Sentry's transport swallows the blocked
// fetch/beacon rather than surfacing it.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV !== "production" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://res.cloudinary.com https://images.unsplash.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.ingest.de.sentry.io https://*.sentry.io",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

// Uploads source maps to Sentry on build so error stack traces are
// de-obfuscated in the dashboard, then deletes the local .map files
// (deleteSourcemapsAfterUpload defaults to true) so unminified source is
// never served publicly. No-ops if SENTRY_AUTH_TOKEN isn't set, so local
// dev and forks without the token still build fine.
export default withSentryConfig(nextConfig, {
  org: "sabir-19",
  project: "javascript-nextjs",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.SENTRY_AUTH_TOKEN,
});
