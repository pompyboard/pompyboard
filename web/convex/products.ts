/**
 * Product queries and mutations
 * Public API for product catalog management
 */
import { v } from "convex/values"

import { query } from "./_generated/server"

// ============================================================================
// PUBLIC QUERIES
// ============================================================================

/**
 * Get all published products with optional filtering
 */
export const listProducts = query({
    args: {
        status: v.optional(
            v.union(
                v.literal("coming_soon"),
                v.literal("pre_order"),
                v.literal("active"),
            ),
        ),
        productType: v.optional(v.string()),
    },
    returns: v.array(
        v.object({
            _id: v.id("products"),
            _creationTime: v.number(),
            name: v.string(),
            slug: v.string(),
            description: v.string(),
            shortDescription: v.optional(v.string()),
            priceUSD: v.number(),
            currency: v.string(),
            compareAtPriceUSD: v.optional(v.number()),
            status: v.union(
                v.literal("draft"),
                v.literal("coming_soon"),
                v.literal("pre_order"),
                v.literal("active"),
                v.literal("sold_out"),
                v.literal("discontinued"),
            ),
            estimatedLaunchDate: v.optional(v.number()),
            productType: v.string(),
            tags: v.array(v.string()),
            displayOrder: v.number(),
            isFeatured: v.boolean(),
            updatedAt: v.number(),
        }),
    ),
    handler: async (ctx, args) => {
        const products = args.status
            ? await ctx.db
                  .query("products")
                  .withIndex("by_status", (q) => q.eq("status", args.status!))
                  .collect()
            : await ctx.db.query("products").collect()

        // Filter by product type if provided
        const filtered = args.productType
            ? products.filter((p) => p.productType === args.productType)
            : products

        // Sort by display order
        return filtered.sort((a, b) => a.displayOrder - b.displayOrder)
    },
})

/**
 * Get a single product by slug with specifications
 */
export const getProductBySlug = query({
    args: { slug: v.string() },
    returns: v.union(
        v.object({
            _id: v.id("products"),
            _creationTime: v.number(),
            name: v.string(),
            slug: v.string(),
            description: v.string(),
            shortDescription: v.optional(v.string()),
            priceUSD: v.number(),
            currency: v.string(),
            compareAtPriceUSD: v.optional(v.number()),
            status: v.union(
                v.literal("draft"),
                v.literal("coming_soon"),
                v.literal("pre_order"),
                v.literal("active"),
                v.literal("sold_out"),
                v.literal("discontinued"),
            ),
            estimatedLaunchDate: v.optional(v.number()),
            announcementDate: v.optional(v.number()),
            productType: v.string(),
            tags: v.array(v.string()),
            metaTitle: v.optional(v.string()),
            metaDescription: v.optional(v.string()),
            displayOrder: v.number(),
            isFeatured: v.boolean(),
            updatedAt: v.number(),
            // Specifications
            specs: v.optional(
                v.object({
                    _id: v.id("productSpecs"),
                    pollingRate: v.string(),
                    activeArea: v.string(),
                    resolution: v.string(),
                    hoverHeight: v.string(),
                    weight: v.optional(v.string()),
                    dimensions: v.optional(v.string()),
                    cableLength: v.optional(v.string()),
                    compatibility: v.optional(v.array(v.string())),
                    additionalSpecs: v.optional(
                        v.record(v.string(), v.string()),
                    ),
                }),
            ),
        }),
        v.null(),
    ),
    handler: async (ctx, args) => {
        const product = await ctx.db
            .query("products")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .unique()

        if (!product) {
            return null
        }

        // Fetch specifications
        const specs = await ctx.db
            .query("productSpecs")
            .withIndex("by_product_id", (q) => q.eq("productId", product._id))
            .first()

        return {
            ...product,
            specs: specs ?? undefined,
        }
    },
})

/**
 * Get product images
 */
export const getProductImages = query({
    args: {
        productId: v.id("products"),
        type: v.optional(
            v.union(
                v.literal("main"),
                v.literal("gallery"),
                v.literal("lifestyle"),
                v.literal("technical"),
                v.literal("thumbnail"),
            ),
        ),
    },
    returns: v.array(
        v.object({
            _id: v.id("productImages"),
            productId: v.id("products"),
            storageId: v.id("_storage"),
            url: v.optional(v.string()),
            altText: v.string(),
            type: v.union(
                v.literal("main"),
                v.literal("gallery"),
                v.literal("lifestyle"),
                v.literal("technical"),
                v.literal("thumbnail"),
            ),
            displayOrder: v.number(),
            width: v.optional(v.number()),
            height: v.optional(v.number()),
        }),
    ),
    handler: async (ctx, args) => {
        const images = await ctx.db
            .query("productImages")
            .withIndex("by_product_id_and_display_order", (q) =>
                q.eq("productId", args.productId),
            )
            .collect()

        // Filter by type if provided
        const filtered = args.type
            ? images.filter((img) => img.type === args.type)
            : images

        // Already sorted by display order from index
        return filtered
    },
})

/**
 * Get featured products for homepage
 */
export const getFeaturedProducts = query({
    args: {},
    returns: v.array(
        v.object({
            _id: v.id("products"),
            name: v.string(),
            slug: v.string(),
            shortDescription: v.optional(v.string()),
            priceUSD: v.number(),
            currency: v.string(),
            status: v.union(
                v.literal("draft"),
                v.literal("coming_soon"),
                v.literal("pre_order"),
                v.literal("active"),
                v.literal("sold_out"),
                v.literal("discontinued"),
            ),
            productType: v.string(),
            displayOrder: v.number(),
        }),
    ),
    handler: async (ctx) => {
        const products = await ctx.db
            .query("products")
            .withIndex("by_is_featured", (q) => q.eq("isFeatured", true))
            .collect()

        // Filter to only show published products
        const published = products.filter((p) =>
            ["coming_soon", "pre_order", "active"].includes(p.status),
        )

        return published.sort((a, b) => a.displayOrder - b.displayOrder)
    },
})

/**
 * Get inventory status for a product
 */
export const getProductInventory = query({
    args: { productId: v.id("products") },
    returns: v.union(
        v.object({
            _id: v.id("inventory"),
            productId: v.id("products"),
            quantityAvailable: v.number(),
            quantityReserved: v.number(),
            quantityTotal: v.number(),
            preOrderLimit: v.optional(v.number()),
            preOrderCount: v.number(),
            lowStockThreshold: v.number(),
            restockDate: v.optional(v.number()),
            isLowStock: v.boolean(),
            isAvailable: v.boolean(),
            lastStockUpdate: v.number(),
        }),
        v.null(),
    ),
    handler: async (ctx, args) => {
        const inventory = await ctx.db
            .query("inventory")
            .withIndex("by_product_id", (q) =>
                q.eq("productId", args.productId),
            )
            .first()

        if (!inventory) {
            return null
        }

        const isLowStock =
            inventory.quantityAvailable <= inventory.lowStockThreshold
        const isAvailable = inventory.quantityAvailable > 0

        return {
            ...inventory,
            isLowStock,
            isAvailable,
        }
    },
})
