/**
 * Content management
 * Public API for FAQs, blog posts, and product comparisons
 */
import { v } from "convex/values"

import { query } from "./_generated/server"

// ============================================================================
// FAQ QUERIES
// ============================================================================

/**
 * Get all published FAQs
 */
export const listFaqs = query({
    args: {
        category: v.optional(v.string()),
    },
    returns: v.array(
        v.object({
            _id: v.id("faqs"),
            question: v.string(),
            answer: v.string(),
            category: v.string(),
            displayOrder: v.number(),
            slug: v.string(),
            views: v.number(),
            helpfulCount: v.number(),
        }),
    ),
    handler: async (ctx, args) => {
        const faqs = args.category
            ? await ctx.db
                  .query("faqs")
                  .withIndex("by_category_and_display_order", (q) =>
                      q.eq("category", args.category!),
                  )
                  .collect()
            : await ctx.db
                  .query("faqs")
                  .withIndex("by_is_published", (q) =>
                      q.eq("isPublished", true),
                  )
                  .collect()

        // Filter to only published
        const published = faqs.filter((faq) => faq.isPublished)

        // Sort by display order
        return published.sort((a, b) => a.displayOrder - b.displayOrder)
    },
})

/**
 * Get a single FAQ by slug
 */
export const getFaqBySlug = query({
    args: { slug: v.string() },
    returns: v.union(
        v.object({
            _id: v.id("faqs"),
            question: v.string(),
            answer: v.string(),
            category: v.string(),
            displayOrder: v.number(),
            slug: v.string(),
            views: v.number(),
            helpfulCount: v.number(),
        }),
        v.null(),
    ),
    handler: async (ctx, args) => {
        const faq = await ctx.db
            .query("faqs")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .first()

        if (!faq || !faq.isPublished) {
            return null
        }

        return faq
    },
})

/**
 * Get FAQ categories with counts
 */
export const getFaqCategories = query({
    args: {},
    returns: v.array(
        v.object({
            category: v.string(),
            count: v.number(),
        }),
    ),
    handler: async (ctx) => {
        const faqs = await ctx.db
            .query("faqs")
            .withIndex("by_is_published", (q) => q.eq("isPublished", true))
            .collect()

        // Group by category
        const categoryMap = new Map<string, number>()
        for (const faq of faqs) {
            categoryMap.set(
                faq.category,
                (categoryMap.get(faq.category) || 0) + 1,
            )
        }

        // Convert to array
        const categories: Array<{ category: string; count: number }> = []
        categoryMap.forEach((count, category) => {
            categories.push({ category, count })
        })

        return categories.sort((a, b) => a.category.localeCompare(b.category))
    },
})

// ============================================================================
// BLOG POST QUERIES
// ============================================================================

/**
 * List published blog posts
 */
export const listBlogPosts = query({
    args: {
        category: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    returns: v.array(
        v.object({
            _id: v.id("blogPosts"),
            title: v.string(),
            slug: v.string(),
            excerpt: v.string(),
            coverImage: v.optional(v.id("_storage")),
            authorName: v.string(),
            category: v.string(),
            tags: v.array(v.string()),
            publishedAt: v.optional(v.number()),
            views: v.number(),
        }),
    ),
    handler: async (ctx, args) => {
        let posts = args.category
            ? await ctx.db
                  .query("blogPosts")
                  .withIndex("by_category", (q) =>
                      q.eq("category", args.category!),
                  )
                  .collect()
            : await ctx.db
                  .query("blogPosts")
                  .withIndex("by_status_and_published_at", (q) =>
                      q.eq("status", "published"),
                  )
                  .collect()

        // Filter to only published
        posts = posts.filter((post) => post.status === "published")

        // Sort by published date (newest first)
        posts.sort((a, b) => {
            const aDate = a.publishedAt ?? 0
            const bDate = b.publishedAt ?? 0
            return bDate - aDate
        })

        // Apply limit if provided
        if (args.limit) {
            posts = posts.slice(0, args.limit)
        }

        return posts
    },
})

/**
 * Get a single blog post by slug
 */
export const getBlogPostBySlug = query({
    args: { slug: v.string() },
    returns: v.union(
        v.object({
            _id: v.id("blogPosts"),
            title: v.string(),
            slug: v.string(),
            excerpt: v.string(),
            content: v.string(),
            coverImage: v.optional(v.id("_storage")),
            authorId: v.id("users"),
            authorName: v.string(),
            status: v.union(
                v.literal("draft"),
                v.literal("published"),
                v.literal("archived"),
            ),
            category: v.string(),
            tags: v.array(v.string()),
            publishedAt: v.optional(v.number()),
            metaTitle: v.optional(v.string()),
            metaDescription: v.optional(v.string()),
            views: v.number(),
            updatedAt: v.number(),
        }),
        v.null(),
    ),
    handler: async (ctx, args) => {
        const post = await ctx.db
            .query("blogPosts")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .first()

        if (!post || post.status !== "published") {
            return null
        }

        return post
    },
})

/**
 * Get recent blog posts for homepage/sidebar
 */
export const getRecentBlogPosts = query({
    args: {
        limit: v.number(),
    },
    returns: v.array(
        v.object({
            _id: v.id("blogPosts"),
            title: v.string(),
            slug: v.string(),
            excerpt: v.string(),
            category: v.string(),
            publishedAt: v.optional(v.number()),
        }),
    ),
    handler: async (ctx, args) => {
        const posts = await ctx.db
            .query("blogPosts")
            .withIndex("by_status_and_published_at", (q) =>
                q.eq("status", "published"),
            )
            .order("desc")
            .take(args.limit)

        return posts
    },
})

// ============================================================================
// PRODUCT COMPARISON QUERIES
// ============================================================================

/**
 * Get product comparisons
 */
export const getProductComparisons = query({
    args: {
        productId: v.id("products"),
    },
    returns: v.array(
        v.object({
            _id: v.id("comparisons"),
            title: v.string(),
            productId: v.id("products"),
            competitorName: v.string(),
            features: v.array(
                v.object({
                    feature: v.string(),
                    pompyValue: v.string(),
                    competitorValue: v.string(),
                    winner: v.union(
                        v.literal("pompy"),
                        v.literal("competitor"),
                        v.literal("tie"),
                    ),
                }),
            ),
            displayOrder: v.number(),
        }),
    ),
    handler: async (ctx, args) => {
        const comparisons = await ctx.db
            .query("comparisons")
            .withIndex("by_product_id", (q) =>
                q.eq("productId", args.productId),
            )
            .collect()

        // Filter to only published
        const published = comparisons.filter((c) => c.isPublished)

        // Sort by display order
        return published.sort((a, b) => a.displayOrder - b.displayOrder)
    },
})

/**
 * Get all published comparisons for comparison page
 */
export const getAllComparisons = query({
    args: {},
    returns: v.array(
        v.object({
            _id: v.id("comparisons"),
            title: v.string(),
            productId: v.id("products"),
            competitorName: v.string(),
            displayOrder: v.number(),
        }),
    ),
    handler: async (ctx) => {
        const comparisons = await ctx.db
            .query("comparisons")
            .withIndex("by_is_published", (q) => q.eq("isPublished", true))
            .collect()

        return comparisons.sort((a, b) => a.displayOrder - b.displayOrder)
    },
})
