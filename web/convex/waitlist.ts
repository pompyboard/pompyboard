import { v } from "convex/values"

import { MutationCtx, mutation, query } from "./_generated/server"

const RATE_LIMIT_CONFIG = {
    maxAttempts: 5,
    windowMinutes: 60,
    blockDurationMinutes: 60,
}

async function checkRateLimit(
    ctx: MutationCtx,
    identifier: string,
    action: string,
): Promise<{ allowed: boolean; message?: string; waitMinutes?: number }> {
    const now = Date.now()
    const windowStart = now - RATE_LIMIT_CONFIG.windowMinutes * 60 * 1000

    const rateLimit = await ctx.db
        .query("rateLimits")
        .withIndex("by_identifier_and_action", (q) =>
            q.eq("identifier", identifier).eq("action", action),
        )
        .first()

    if (rateLimit?.blockedUntil && rateLimit.blockedUntil > now) {
        const waitMinutes = Math.ceil((rateLimit.blockedUntil - now) / 60000)
        return {
            allowed: false,
            message: `Too many attempts. Please try again in ${waitMinutes} minutes.`,
            waitMinutes,
        }
    }

    if (!rateLimit || rateLimit.windowStart < windowStart) {
        if (rateLimit) {
            await ctx.db.patch(rateLimit._id, {
                attempts: 1,
                windowStart: now,
                lastAttempt: now,
                blockedUntil: undefined,
            })
        } else {
            await ctx.db.insert("rateLimits", {
                identifier,
                action,
                attempts: 1,
                windowStart: now,
                lastAttempt: now,
            })
        }
        return { allowed: true }
    }

    const newAttempts = rateLimit.attempts + 1

    if (newAttempts > RATE_LIMIT_CONFIG.maxAttempts) {
        const blockedUntil =
            now + RATE_LIMIT_CONFIG.blockDurationMinutes * 60 * 1000
        await ctx.db.patch(rateLimit._id, {
            attempts: newAttempts,
            lastAttempt: now,
            blockedUntil,
        })
        return {
            allowed: false,
            message: `Too many signup attempts. Please try again in ${RATE_LIMIT_CONFIG.blockDurationMinutes} minutes.`,
            waitMinutes: RATE_LIMIT_CONFIG.blockDurationMinutes,
        }
    }

    await ctx.db.patch(rateLimit._id, {
        attempts: newAttempts,
        lastAttempt: now,
    })

    return { allowed: true }
}

// ============================================================================
// PUBLIC MUTATIONS
// ============================================================================

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

        const emailRateLimit = await checkRateLimit(
            ctx,
            args.email.toLowerCase(),
            "waitlist_signup",
        )
        if (!emailRateLimit.allowed) {
            return {
                success: false,
                message: emailRateLimit.message || "Too many attempts.",
            }
        }

        if (args.clientIdentifier) {
            const ipRateLimit = await checkRateLimit(
                ctx,
                args.clientIdentifier,
                "waitlist_signup",
            )
            if (!ipRateLimit.allowed) {
                return {
                    success: false,
                    message: ipRateLimit.message || "Too many attempts.",
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
                    message:
                        "Welcome back! You've been re-added to the waitlist.",
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
            message: "Success! You'll be notified when PompyBoard launches.",
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
