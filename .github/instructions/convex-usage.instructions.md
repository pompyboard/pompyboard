---
description: Always use Convex for all backend operations in this project. This file ensures AI assistants write Convex-compatible code following best practices.
applyTo: **/*.{ts,tsx,js,jsx}
---

# Convex Backend Usage Rules

## Project Setup

This project uses **Convex** as the primary backend. DO NOT use:

- ❌ Direct PostgreSQL/Drizzle queries
- ❌ Next.js API routes for data operations
- ❌ Server actions that bypass Convex
- ❌ Any other database or backend system

**ALWAYS use Convex** for:

- ✅ All data queries and mutations
- ✅ Authentication (via `@convex-dev/auth`)
- ✅ File storage
- ✅ Real-time updates
- ✅ Scheduled jobs (crons)

## Function Syntax (CRITICAL)

### Always Use New Function Syntax

```typescript
// ✅ CORRECT - New syntax with args, returns, handler
import { query } from "./_generated/server";
import { v } from "convex/values";

export const getProduct = query({
  args: { productId: v.id("products") },
  returns: v.union(
    v.object({
      _id: v.id("products"),
      name: v.string(),
      priceUSD: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.productId);
  },
});

// ❌ WRONG - Old syntax
export const getProduct = query(async (ctx, args) => {
  return await ctx.db.get(args.productId);
});
```

### Always Include Validators

```typescript
// ✅ CORRECT - Has args and returns validators
export const createProduct = mutation({
  args: {
    name: v.string(),
    priceUSD: v.number(),
    status: v.union(v.literal("active"), v.literal("draft")),
  },
  returns: v.id("products"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("products", args);
  },
});

// ✅ CORRECT - Functions that return nothing use v.null()
export const deleteProduct = mutation({
  args: { productId: v.id("products") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.productId);
    return null;
  },
});
```

## Using Convex in React Components

### Client Components

```tsx
"use client";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function ProductList() {
  // ✅ CORRECT - Use useQuery for data fetching
  const products = useQuery(api.products.listProducts, {
    status: "active",
  });

  // ✅ CORRECT - Use useMutation for data changes
  const joinWaitlist = useMutation(api.waitlist.joinWaitlist);

  if (products === undefined) return <div>Loading...</div>;

  const handleJoin = async (email: string) => {
    await joinWaitlist({ email, source: "homepage" });
  };

  return (
    <div>
      {products.map((p) => (
        <div key={p._id}>{p.name}</div>
      ))}
    </div>
  );
}
```

### Server Components (Preloading)

```tsx
import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { ProductListClient } from "./product-list-client";

export default async function ProductsPage() {
  // ✅ CORRECT - Preload data in server component
  const preloadedProducts = await preloadQuery(api.products.listProducts, {
    status: "active",
  });

  return <ProductListClient preloadedProducts={preloadedProducts} />;
}
```

## Database Operations

### Queries (Read Data)

```typescript
// ✅ Use indexes for filtering
const product = await ctx.db
  .query("products")
  .withIndex("by_slug", (q) => q.eq("slug", args.slug))
  .unique();

// ✅ Use .first() for optional single result
const product = await ctx.db
  .query("products")
  .withIndex("by_slug", (q) => q.eq("slug", args.slug))
  .first();

// ❌ WRONG - Don't use .filter() without index
const products = await ctx.db
  .query("products")
  .filter((q) => q.eq(q.field("status"), "active"))
  .collect();
```

### Mutations (Write Data)

```typescript
// ✅ Insert
const productId = await ctx.db.insert("products", {
  name: "PompyBoard mk.1 Pro",
  priceUSD: 24727,
  status: "active",
  updatedAt: Date.now(),
});

// ✅ Update (patch - partial update)
await ctx.db.patch(productId, {
  priceUSD: 22727,
  updatedAt: Date.now(),
});

// ✅ Replace (full replacement)
await ctx.db.replace(productId, {
  name: "PompyBoard mk.1 Pro",
  priceUSD: 22727,
  status: "active",
  updatedAt: Date.now(),
});

// ✅ Delete
await ctx.db.delete(productId);
```

## Function References

### Calling Other Convex Functions

```typescript
import { api, internal } from "./_generated/api";

// ✅ CORRECT - Use api for public functions
export const processOrder = mutation({
  args: { orderId: v.id("orders") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const product: string = await ctx.runQuery(api.products.getProductBySlug, {
      slug: "mk1pro",
    });
    return null;
  },
});

// ✅ CORRECT - Use internal for internal functions
export const notifyUsers = mutation({
  args: { productId: v.id("products") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.notifications.sendEmails, {
      productId: args.productId,
    });
    return null;
  },
});

// ❌ WRONG - Don't pass function directly
await ctx.runQuery(getProductBySlug, { slug: "mk1pro" });
```

## Actions (External APIs)

```typescript
"use node";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

// ✅ Use actions for external API calls
export const sendWelcomeEmail = action({
  args: { email: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Call external email service
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({ to: args.email }),
    });

    // Update database via query/mutation
    await ctx.runMutation(api.users.markEmailSent, {
      email: args.email,
    });

    return null;
  },
});
```

## Authentication

```typescript
import { auth } from "./auth";

// ✅ Check authentication in queries/mutations
export const getMyOrders = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("orders"),
      orderNumber: v.string(),
      totalUSD: v.number(),
    })
  ),
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db
      .query("orders")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .collect();
  },
});
```

## Common Validators

```typescript
import { v } from "convex/values";

// Basic types
v.string(); // string
v.number(); // number (float64)
v.int64(); // bigint
v.boolean(); // boolean
v.null(); // null
v.id("tableName"); // document ID

// Complex types
v.optional(v.string()); // string | undefined
v.array(v.string()); // string[]
v.object({ name: v.string() }); // { name: string }
v.union(v.literal("a"), v.literal("b")); // "a" | "b"
v.record(v.string(), v.number()); // Record<string, number>

// Example: Discriminated union
v.union(
  v.object({
    type: v.literal("email"),
    email: v.string(),
  }),
  v.object({
    type: v.literal("phone"),
    phone: v.string(),
  })
);
```

## DO NOT Use These Anti-Patterns

```typescript
// ❌ WRONG - Don't use filter without index
const products = await ctx.db
  .query("products")
  .filter((q) => q.eq(q.field("status"), "active"))
  .collect();

// ❌ WRONG - Don't call .delete() on query
await ctx.db.query("products").delete(); // This doesn't exist!

// ❌ WRONG - Don't access ctx.db in actions
export const myAction = action({
  handler: async (ctx) => {
    await ctx.db.insert("products", {}); // ERROR: ctx.db not available in actions
  },
});

// ❌ WRONG - Don't forget validators
export const myQuery = query({
  handler: async (ctx, args) => {
    // Missing args and returns!
    return await ctx.db.query("products").collect();
  },
});
```

## This Project's Tables

Available tables in this project:

- `products` - Product catalog
- `productSpecs` - Product specifications
- `productImages` - Product images
- `inventory` - Stock tracking
- `users` - User accounts (with Convex Auth)
- `waitlist` - Waitlist signups
- `orders` - Order management
- `orderItems` - Order line items
- `shippingAddresses` - User addresses
- `faqs` - FAQ content
- `blogPosts` - Blog/news posts
- `comparisons` - Product comparisons
- `newsletterSubscriptions` - Newsletter subs
- `pageViews` - Analytics
- `emailCampaigns` - Email campaigns
- `discordAnnouncements` - Discord integration

Always use proper indexes and validators when working with these tables.

## Quick Checklist

Before writing Convex code, ensure:

- [ ] Using new function syntax (args, returns, handler)
- [ ] All arguments have validators
- [ ] Return type has validator (use v.null() if no return)
- [ ] Using indexes for queries (not filter)
- [ ] Using api/internal objects for function references
- [ ] "use node" directive for actions with Node APIs
- [ ] Client components marked with "use client"
- [ ] useQuery/useMutation from "convex/react"
