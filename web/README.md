# PompyBoard Website

A production-ready e-commerce platform for PompyBoard built with Next.js 15 and Convex.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Convex (real-time, serverless)
- **Authentication**: Convex Auth
- **Styling**: Tailwind CSS 4
- **3D Graphics**: Three.js, React Three Fiber
- **Language**: TypeScript

## Quick Start

```bash
# Install dependencies
pnpm install

# Start Convex dev server (first time - will prompt for login)
npx convex dev

# In another terminal, seed the database
npx convex run seed:seedProducts

# Start Next.js dev server
pnpm dev
```

Visit http://localhost:3000

## Database Schema

Production-ready schema with 17 tables including:

- Products & inventory management
- Waitlist & pre-orders
- Orders & payments
- Content management (FAQs, blog posts)
- Analytics & tracking

## Key Features

✅ Real-time product catalog  
✅ Waitlist management with Discord integration  
✅ Pre-order system for 2026 launch  
✅ Content management (FAQs, blog, comparisons)  
✅ Production-ready with proper indexes  
✅ Full TypeScript support

## Available Convex Functions

### Products

- `listProducts`, `getProductBySlug`, `getProductImages`
- `getFeaturedProducts`, `getProductInventory`

### Waitlist

- `joinWaitlist`, `unsubscribeWaitlist`
- `getWaitlistCount`, `checkWaitlistStatus`

### Content

- `listFaqs`, `getFaqBySlug`, `getFaqCategories`
- `listBlogPosts`, `getBlogPostBySlug`
- `getProductComparisons`

## Deployment

```bash
# Deploy Convex backend
npx convex deploy

# Deploy Next.js (Vercel, Netlify, etc.)
vercel deploy
```

## Documentation

- [Convex Docs](https://docs.convex.dev)
- [Next.js Docs](https://nextjs.org/docs)
- [Project Discord](https://discord.gg/h27rwcBn73)
