import { authTables } from "@convex-dev/auth/server"
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
    ...authTables,

    // =========================================================================
    // PRODUCTS
    // =========================================================================

    products: defineTable({
        // Basic product info
        name: v.string(),
    }),

    // =========================================================================
    // USERS
    // =========================================================================

    waitlist: defineTable({
        // Contact info
        email: v.string(),
        name: v.optional(v.string()),

        // Product interest
        productId: v.optional(v.id("products")), // Specific product or general interest
        productType: v.optional(v.string()),

        // Source tracking
        source: v.string(),
        referrer: v.optional(v.string()), // UTM or referral code
        campaign: v.optional(v.string()), // Marketing campaign

        // Status
        status: v.union(
            v.literal("active"), // On waitlist
            v.literal("notified"), // Launch notification sent
            v.literal("converted"), // Made a purchase
            v.literal("unsubscribed"), // Opted out
        ),

        // Notifications
        notifiedAt: v.optional(v.number()),
        convertedAt: v.optional(v.number()),

        // Discord integration
        discordId: v.optional(v.string()),
        joinedDiscord: v.boolean(),

        // Metadata
        userAgent: v.optional(v.string()),
        ipCountry: v.optional(v.string()), // For regional insights
    })
        .index("by_email", ["email"])
        .index("by_status", ["status"])
        .index("by_product_id", ["productId"])
        .index("by_source", ["source"])
        .index("by_discord_id", ["discordId"]),
})
