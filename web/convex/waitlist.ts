/**
 * Waitlist management
 * Public API for managing product launch waitlist
 */
import { v } from "convex/values"

import { mutation, query } from "./_generated/server"

// ============================================================================
// PUBLIC MUTATIONS
// ============================================================================

/**
 * Join the waitlist
 */
export const joinWaitlist = mutation({
    args: {
        email: v.string(),
        name: v.optional(v.string()),
        productId: v.optional(v.id("products")),
        productType: v.optional(v.string()),
        source: v.string(),
        referrer: v.optional(v.string()),
        campaign: v.optional(v.string()),
        discordId: v.optional(v.string()),
        userAgent: v.optional(v.string()),
        ipCountry: v.optional(v.string()),
    },
    returns: v.object({
        success: v.boolean(),
        waitlistId: v.id("waitlist"),
        message: v.string(),
    }),
    handler: async (ctx, args) => {
        // Check if email already exists
        const existing = await ctx.db
            .query("waitlist")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first()

        if (existing) {
            // If they unsubscribed, reactivate them
            if (existing.status === "unsubscribed") {
                await ctx.db.patch(existing._id, {
                    status: "active",
                    source: args.source,
                    referrer: args.referrer,
                    campaign: args.campaign,
                })

                return {
                    success: true,
                    waitlistId: existing._id,
                    message:
                        "Welcome back! You've been re-added to the waitlist.",
                }
            }

            return {
                success: true,
                waitlistId: existing._id,
                message: "You're already on the waitlist!",
            }
        }

        // Create new waitlist entry
        const waitlistId = await ctx.db.insert("waitlist", {
            email: args.email,
            name: args.name,
            productId: args.productId,
            productType: args.productType,
            source: args.source,
            referrer: args.referrer,
            campaign: args.campaign,
            status: "active",
            discordId: args.discordId,
            joinedDiscord: !!args.discordId,
            userAgent: args.userAgent,
            ipCountry: args.ipCountry,
        })

        return {
            success: true,
            waitlistId,
            message: "Success! You'll be notified when PompyBoard launches.",
        }
    },
})

/**
 * Unsubscribe from waitlist
 */
export const unsubscribeWaitlist = mutation({
    args: {
        email: v.string(),
    },
    returns: v.object({
        success: v.boolean(),
        message: v.string(),
    }),
    handler: async (ctx, args) => {
        const entry = await ctx.db
            .query("waitlist")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first()

        if (!entry) {
            return {
                success: false,
                message: "Email not found on waitlist.",
            }
        }

        await ctx.db.patch(entry._id, {
            status: "unsubscribed",
        })

        return {
            success: true,
            message: "You've been removed from the waitlist.",
        }
    },
})

// ============================================================================
// PUBLIC QUERIES
// ============================================================================

/**
 * Get waitlist count for a specific product or all products
 */
export const getWaitlistCount = query({
    args: {
        productId: v.optional(v.id("products")),
    },
    returns: v.object({
        total: v.number(),
        active: v.number(),
        notified: v.number(),
        converted: v.number(),
    }),
    handler: async (ctx, args) => {
        const entries = args.productId
            ? await ctx.db
                  .query("waitlist")
                  .withIndex("by_product_id", (q) =>
                      q.eq("productId", args.productId),
                  )
                  .collect()
            : await ctx.db.query("waitlist").collect()

        const stats = {
            total: entries.length,
            active: entries.filter((e) => e.status === "active").length,
            notified: entries.filter((e) => e.status === "notified").length,
            converted: entries.filter((e) => e.status === "converted").length,
        }

        return stats
    },
})

/**
 * Check if an email is on the waitlist
 */
export const checkWaitlistStatus = query({
    args: {
        email: v.string(),
    },
    returns: v.union(
        v.object({
            isOnWaitlist: v.literal(true),
            status: v.union(
                v.literal("active"),
                v.literal("notified"),
                v.literal("converted"),
                v.literal("unsubscribed"),
            ),
            joinedAt: v.number(),
            productId: v.optional(v.id("products")),
        }),
        v.object({
            isOnWaitlist: v.literal(false),
        }),
    ),
    handler: async (ctx, args) => {
        const entry = await ctx.db
            .query("waitlist")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first()

        if (!entry) {
            return { isOnWaitlist: false as const }
        }

        return {
            isOnWaitlist: true as const,
            status: entry.status,
            joinedAt: entry._creationTime,
            productId: entry.productId,
        }
    },
})
