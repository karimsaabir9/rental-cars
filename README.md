# RentalCars

A full-stack car rental platform built with Next.js. Visitors can browse a live fleet and book a car in a few clicks; signed-in users manage their bookings and account from a dedicated dashboard; admins get a separate console for fleet, bookings, and user management.

## Features

- **Public browsing** — searchable, filterable car listings (category, transmission, price) with detail pages, no account required to browse.
- **Authentication** — email/password auth via Better Auth, with session-aware navigation across the entire app (marketing pages, dashboard, and admin console all reflect the current user).
- **Booking flow** — date-range booking with live price calculation and conflict checking, so a car can't be double-booked for overlapping dates.
- **User dashboard** — booking history and cancellation, profile/email/security settings, avatar upload with cropping.
- **Admin console** — fleet CRUD with image upload, booking oversight, and user management, gated by a role-locked authorization model (only the seeded account can ever hold the admin role).
- **Type-safe API layer** — tRPC procedures tiered by access level (public / authenticated / admin), enforced independently of the UI.

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
| Animation | GSAP |

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

   | Variable | Description |
   |---|---|
   | `DATABASE_URL` | Postgres connection string |
   | `BETTER_AUTH_SECRET` | Random secret used to sign sessions |
   | `BETTER_AUTH_URL` | Base URL of the app (e.g. `http://localhost:3000`) |
   | `SEED_ADMIN_NAME` / `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Credentials for the seeded admin account |
   | `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Cloudinary credentials for image uploads |

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
  (user)/          User dashboard — bookings, settings
  (admin)/         Admin console — fleet, bookings, users, settings
  api/              Better Auth, tRPC, and upload route handlers
components/         UI components, grouped by feature area
db/                 Drizzle schema, seed script
lib/                Auth config, shared utilities
trpc/               Router definitions and procedure tiers
```

## Authorization model

- **Public** routes (`/`, `/cars`, `/cars/[id]`) require no session.
- **User** routes (`/dashboard/*`) require a valid session.
- **Admin** routes (`/admin/*`) require a valid session with the `admin` role.

Route access is enforced in two layers: an edge check on the session cookie for a fast redirect, and an authoritative server-side session lookup in each route group's layout. The tRPC API enforces the same rules independently, so authorization can't be bypassed by calling the API directly. Only the seeded account can ever hold the admin role — there is no in-app path to grant it.
