import * as Sentry from "@sentry/nextjs";

// NEXT_PUBLIC_SENTRY_DSN is safe to expose client-side by design -- a DSN
// only allows sending events in, it can't be used to read data out.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
});

// Required for Sentry to trace client-side route transitions.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
