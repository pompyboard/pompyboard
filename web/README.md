# PompyBoard website

Website for PompyBoard built with Next.js 15 and Convex.

## Tech Stack

- Next.js 15 (App Router)
- Convex (backend & database)
- Tailwind CSS 4
- TypeScript

## Setup

1. [Setup devenv](https://devenv.sh/getting-started)
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Create `.env.local` from `.env.local.example`
4. Start Convex (first time will prompt for login):
   ```bash
   pnpx convex dev
   ```
5. Seed the database:
   ```bash
   pnpx convex run seed:seedProducts
   ```
6. Start dev server:
   ```bash
   pnpm dev
   ```

## Must read

- https://nextjs.org/docs
- https://docs.convex.dev
