import { HOUR, type RateLimitConfig, RateLimiter } from "@convex-dev/rate-limiter"
import { v } from "convex/values"

import { components } from "./_generated/api"
import { mutation, query } from "./_generated/server"

const rateLimiter = new RateLimiter(components.rateLimiter, {
    joinWaitlist: {
        kind: "token bucket",
        rate: 60,
        period: HOUR,
        capacity: 5,
    },
} satisfies Record<string, RateLimitConfig>)

// =============================================================================
// PUBLIC MUTATIONS
// =============================================================================

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
        honeypot: v.optional(v.string()),
        formRenderTime: v.optional(v.number()),
        clientIdentifier: v.optional(v.string()),
    },
    returns: v.object({
        success: v.boolean(),
        waitlistId: v.optional(v.id("waitlist")),
        message: v.string(),
    }),
    handler: async (ctx, args) => {
        if (args.honeypot && args.honeypot.length > 0) {
            return {
                success: false,
                message: "Invalid submission detected.",
            }
        }

        if (args.formRenderTime) {
            const submissionTime = Date.now()
            const timeDiff = submissionTime - args.formRenderTime
            if (timeDiff < 2000) {
                return {
                    success: false,
                    message: "Please take a moment to review your submission.",
                }
            }
        }

        const emailRateLimit = await rateLimiter.check(ctx, "joinWaitlist", {
            key: args.email.toLowerCase(),
        })
        if (emailRateLimit.retryAfter) {
            if (!emailRateLimit.ok)
                return {
                    success: false,
                    message: `Too many attempts.`,
                }

            return {
                success: false,
                message: `Too many attempts. Try again in ${Math.floor(emailRateLimit.retryAfter / 1000)} seconds`,
            }
        }

        if (args.clientIdentifier) {
            const ipRateLimit = await rateLimiter.check(ctx, "joinWaitlist", {
                key: args.clientIdentifier,
            })

            if (ipRateLimit.retryAfter) {
                if (!ipRateLimit.ok)
                    return {
                        success: false,
                        message: `Too many attempts.`,
                    }

                return {
                    success: false,
                    message: `Too many attempts. Try again in ${Math.floor(ipRateLimit.retryAfter / 1000)} seconds`,
                }
            }
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(args.email)) {
            return {
                success: false,
                message: "Please enter a valid email address.",
            }
        }

        const emailAlreadyExists = await ctx.db
            .query("waitlist")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first()

        if (emailAlreadyExists) {
            // If they unsubscribed, reactivate them
            if (emailAlreadyExists.status === "unsubscribed") {
                await ctx.db.patch(emailAlreadyExists._id, {
                    status: "active",
                    source: args.source,
                    referrer: args.referrer,
                    campaign: args.campaign,
                })

                return {
                    success: true,
                    waitlistId: emailAlreadyExists._id,
                    message: "Welcome back! You've been re-added to the waitlist.",
                }
            }

            return {
                success: true,
                waitlistId: emailAlreadyExists._id,
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
            message: "Success! You'll be notified when the product launches.",
        }
    },
})

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

// =============================================================================
// PUBLIC QUERIES
// =============================================================================

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
                  .withIndex("by_product_id", (q) => q.eq("productId", args.productId))
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

export const checkIfEmailOnWaitlist = query({
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
