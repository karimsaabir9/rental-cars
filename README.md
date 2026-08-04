# RentalCars

A full-stack car rental platform built with Next.js. Visitors can browse a live fleet and book a car in a few clicks; signed-in users manage their bookings and account from a dedicated dashboard; admins get a separate console for fleet, bookings, and user management.

## Features

- **Public browsing** — searchable, filterable car listings (category, transmission, price) with detail pages, no account required to browse. The listing query caches its DB fetch and invalidates on any fleet change.
- **Authentication** — email/password auth via Better Auth, with session-aware navigation across the entire app (marketing pages, dashboard, and admin console all reflect the current user).
- **Booking flow** — date-range booking with live price calculation and conflict checking, so a car can't be double-booked for overlapping dates, followed by an admin approval step.
- **Payments** — simulated card/cash checkout per booking, with idempotency-key + row-locked mutations so a double-click or retry can't double-charge, PDF invoices/receipts, and admin refund / mark-cash-paid actions.
- **Reviews & ratings** — gated to completed rentals, surfaced on car listings and detail pages.
- **Notifications** — in-app + email (booking and payment lifecycle events), best-effort so a delivery failure never fails the underlying action.
- **User dashboard** — booking history and cancellation, profile/email/security settings, avatar upload with cropping.
- **Admin console** — fleet CRUD with image upload, booking approval workflow, payments, reviews moderation, user management, and an audit log of admin actions — gated by a role-locked authorization model (only the seeded account can ever hold the admin role).
- **Type-safe API layer** — tRPC procedures tiered by access level (public / authenticated / admin), enforced independently of the UI, with rate limiting on booking/payment mutations.
- **Production hardening** — CSP + standard security headers, Sentry error monitoring with source map upload, a `/api/health` endpoint for uptime checks, and CI (typecheck/lint/test) on every push and PR.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, React 19) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| UI primitives | Radix UI |
| Auth | [Better Auth](https://www.better-auth.com) |
| Database | Postgres ([Neon](https://neon.tech)) via [Drizzle ORM](https://orm.drizzle.team) |
| API | [tRPC](https://trpc.io) + TanStack Query |
| Forms & validation | React Hook Form + Zod |
| Image hosting | Cloudinary |
| Email | Nodemailer (Gmail SMTP) |
| Rate limiting | [Upstash Redis](https://upstash.com) |
| Error monitoring | [Sentry](https://sentry.io) |
| PDF generation | [@react-pdf/renderer](https://react-pdf.org) (invoices/receipts) |
| Charts | Recharts (admin stats) |
| Animation | GSAP |
| Testing | Vitest |

## Getting started

### Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io)
- A Postgres database (a free [Neon](https://neon.tech) project works well)
- A [Cloudinary](https://cloudinary.com) account for image uploads

### Setup

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Configure environment variables**

   Copy the example file and fill in your own values:

   ```bash
   cp .env.example .env
   ```

   | Variable | Required | Description |
   |---|---|---|
   | `DATABASE_URL` | Yes | Postgres connection string |
   | `BETTER_AUTH_SECRET` | Yes | Random secret used to sign sessions |
   | `BETTER_AUTH_URL` | Yes | Base URL of the app (e.g. `http://localhost:3000`) |
   | `SEED_ADMIN_NAME` / `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Yes | Credentials for the seeded admin account |
   | `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Yes | Cloudinary credentials for image uploads |
   | `GMAIL_USER` / `GMAIL_APP_PASSWORD` | Optional | Transactional email (booking/payment notifications). Skipped with a warning if unset. App password from [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) (needs 2-Step Verification). |
   | `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Optional | Upstash Redis for rate limiting. Skipped with a warning if unset. |
   | `NEXT_PUBLIC_SENTRY_DSN` | Optional | Enables Sentry error monitoring. Disabled if unset. |
   | `SENTRY_AUTH_TOKEN` | Optional | Uploads source maps at build time for de-obfuscated stack traces. Build just skips uploading if unset. |

3. **Set up the database**

   Push the schema to your database, then seed the admin account:

   ```bash
   pnpm db:push
   pnpm db:seed
   ```

4. **Run the dev server**

   ```bash
   pnpm dev
   ```

   The app is available at [http://localhost:3000](http://localhost:3000). Sign in with the seeded admin credentials to access `/admin`, or create a new account to explore the user dashboard.

## Available scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start the development server |
| `pnpm build` | Build for production |
| `pnpm start` | Run the production build |
| `pnpm lint` | Lint the codebase |
| `pnpm test` | Run the test suite (Vitest) |
| `pnpm db:generate` | Generate a Drizzle migration from schema changes |
| `pnpm db:migrate` | Apply pending migrations |
| `pnpm db:push` | Push the schema directly to the database (dev workflow) |
| `pnpm db:studio` | Open Drizzle Studio to browse the database |
| `pnpm db:seed` | Create the seeded admin account |

## Project structure

```
app/
  (marketing)/     Public pages — landing, car browsing, car detail
  (auth)/          Sign in / sign up
  (user)/          User dashboard — bookings, payments, settings
  (admin)/         Admin console — fleet, bookings, payments, reviews, users, audit log
  api/              Better Auth, tRPC, upload, invoice, and health route handlers
components/         UI components, grouped by feature area
db/                 Drizzle schema (modular, one file per domain), seed script
lib/                Business rules and shared utilities, unit tested independently of the DB/API layer
trpc/               Router definitions and procedure tiers
```

## Authorization model

- **Public** routes (`/`, `/cars`, `/cars/[id]`) require no session.
- **User** routes (`/dashboard/*`) require a valid session.
- **Admin** routes (`/admin/*`) require a valid session with the `admin` role.

Route access is enforced in two layers: an edge check on the session cookie for a fast redirect, and an authoritative server-side session lookup in each route group's layout. The tRPC API enforces the same rules independently, so authorization can't be bypassed by calling the API directly. Only the seeded account can ever hold the admin role — there is no in-app path to grant it.

## License

Licensed under the [MIT License](LICENSE) — Copyright (c) 2026 Sabir Salad.
