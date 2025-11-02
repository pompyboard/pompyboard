import { authTables } from "@convex-dev/auth/server"
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

/**
 * Production-ready schema for PompyBoard e-commerce platform
 * Designed for pre-orders, waitlist management, and content delivery
 */
export default defineSchema({
    // Include Convex Auth tables for authentication
    ...authTables,

    // ============================================================================
    // PRODUCTS & INVENTORY
    // ============================================================================

    /**
     * Product catalog - Different PompyBoard variants (mk.1 Lite, mk.1 Pro, etc.)
     */
    products: defineTable({
        // Basic product info
        name: v.string(), // "PompyBoard mk.1 Pro"
        slug: v.string(), // "mk1pro" - URL-friendly identifier
        description: v.string(), // Marketing description
        shortDescription: v.optional(v.string()), // For cards/lists

        // Pricing
        priceUSD: v.number(), // Price in USD cents (e.g., 24727 = $247.27)
        currency: v.string(), // "USD"
        compareAtPriceUSD: v.optional(v.number()), // Original price if on sale

        // Product status
        status: v.union(
            v.literal("draft"), // Not visible to public
            v.literal("coming_soon"), // Visible but not orderable
            v.literal("pre_order"), // Available for pre-order
            v.literal("active"), // Available for purchase
            v.literal("sold_out"), // Temporarily unavailable
            v.literal("discontinued"), // No longer available
        ),

        // Launch information
        estimatedLaunchDate: v.optional(v.number()), // Unix timestamp
        announcementDate: v.optional(v.number()), // When it was announced

        // Product categorization
        productType: v.string(), // "tablet", "accessory", "bundle"
        tags: v.array(v.string()), // ["pro", "high-polling-rate", "osu"]

        // SEO & metadata
        metaTitle: v.optional(v.string()),
        metaDescription: v.optional(v.string()),

        // Ordering & display
        displayOrder: v.number(), // For sorting products
        isFeatured: v.boolean(), // Show on homepage

        // Audit trail
        createdBy: v.optional(v.id("users")),
        updatedAt: v.number(),
    })
        .index("by_slug", ["slug"])
        .index("by_status", ["status"])
        .index("by_status_and_display_order", ["status", "displayOrder"])
        .index("by_product_type", ["productType"])
        .index("by_is_featured", ["isFeatured"]),

    /**
     * Technical specifications for products
     * Separated for flexibility and reusability
     */
    productSpecs: defineTable({
        productId: v.id("products"),

        // Technical specs
        pollingRate: v.string(), // "8000 Hz"
        activeArea: v.string(), // "180 × 100 mm"
        resolution: v.string(), // "200 lpmm"
        hoverHeight: v.string(), // "20 mm"

        // Additional specs (flexible)
        weight: v.optional(v.string()),
        dimensions: v.optional(v.string()),
        cableLength: v.optional(v.string()),
        compatibility: v.optional(v.array(v.string())), // ["Windows", "macOS", "Linux"]

        // Detailed technical data
        additionalSpecs: v.optional(v.record(v.string(), v.string())), // Flexible key-value pairs
    }).index("by_product_id", ["productId"]),

    /**
     * Product images and media assets
     */
    productImages: defineTable({
        productId: v.id("products"),

        // Image data
        storageId: v.id("_storage"), // Convex file storage reference
        url: v.optional(v.string()), // CDN URL if using external storage
        altText: v.string(), // Accessibility text

        // Image metadata
        type: v.union(
            v.literal("main"), // Primary product image
            v.literal("gallery"), // Additional product shots
            v.literal("lifestyle"), // In-use photos
            v.literal("technical"), // Diagrams, specs
            v.literal("thumbnail"), // Small preview
        ),
        displayOrder: v.number(),

        // Dimensions (for optimization)
        width: v.optional(v.number()),
        height: v.optional(v.number()),
    })
        .index("by_product_id", ["productId"])
        .index("by_product_id_and_type", ["productId", "type"])
        .index("by_product_id_and_display_order", [
            "productId",
            "displayOrder",
        ]),

    /**
     * Inventory tracking
     */
    inventory: defineTable({
        productId: v.id("products"),

        // Stock levels
        quantityAvailable: v.number(), // Current stock
        quantityReserved: v.number(), // In pending orders
        quantityTotal: v.number(), // Total manufactured

        // Pre-order specific
        preOrderLimit: v.optional(v.number()), // Max pre-orders allowed
        preOrderCount: v.number(), // Current pre-orders

        // Thresholds
        lowStockThreshold: v.number(), // Alert when stock is low
        restockDate: v.optional(v.number()), // Expected restock date

        // Warehouse info
        sku: v.optional(v.string()), // Stock keeping unit
        warehouseLocation: v.optional(v.string()),

        // Audit
        lastStockUpdate: v.number(),
    })
        .index("by_product_id", ["productId"])
        .index("by_quantity_available", ["quantityAvailable"]),

    // ============================================================================
    // CUSTOMERS & AUTHENTICATION
    // ============================================================================

    /**
     * User accounts (extends Convex Auth)
     */
    users: defineTable({
        // Basic info
        name: v.optional(v.string()),
        email: v.optional(v.string()),
        emailVerificationTime: v.optional(v.number()),
        image: v.optional(v.string()),
        phone: v.optional(v.string()),
        phoneNumberVerified: v.optional(v.boolean()),
        isAnonymous: v.optional(v.boolean()),

        // User role
        role: v.union(
            v.literal("customer"),
            v.literal("admin"),
            v.literal("support"),
        ),

        // Discord integration
        discordId: v.optional(v.string()),
        discordUsername: v.optional(v.string()),

        // Marketing preferences
        marketingOptIn: v.boolean(),
        notificationPreferences: v.object({
            email: v.boolean(),
            discord: v.boolean(),
        }),

        // Metadata
        lastLoginAt: v.optional(v.number()),
    })
        .index("by_email", ["email"])
        .index("by_discord_id", ["discordId"])
        .index("by_role", ["role"]),

    // ============================================================================
    // WAITLIST & PRE-ORDERS
    // ============================================================================

    /**
     * Waitlist for product launch notifications
     */
    waitlist: defineTable({
        // Contact info
        email: v.string(),
        name: v.optional(v.string()),

        // Product interest
        productId: v.optional(v.id("products")), // Specific product or general interest
        productType: v.optional(v.string()), // "tablet", "all"

        // Source tracking
        source: v.string(), // "homepage", "discord", "reddit", "twitter"
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

    /**
     * Rate limiting for preventing spam and abuse
     */
    rateLimits: defineTable({
        identifier: v.string(),
        action: v.string(),
        attempts: v.number(),
        windowStart: v.number(),
        blockedUntil: v.optional(v.number()),
        lastAttempt: v.number(),
    })
        .index("by_identifier_and_action", ["identifier", "action"])
        .index("by_blocked_until", ["blockedUntil"])
        .index("by_window_start", ["windowStart"]),

    // ============================================================================
    // ORDERS & PAYMENTS
    // ============================================================================

    /**
     * Orders (both pre-orders and regular orders)
     */
    orders: defineTable({
        // Customer
        userId: v.id("users"),
        email: v.string(), // Redundant but useful for queries

        // Order identification
        orderNumber: v.string(), // Human-readable (e.g., "POMPY-2026-0001")

        // Order details
        subtotalUSD: v.number(), // In cents
        shippingCostUSD: v.number(),
        taxUSD: v.number(),
        totalUSD: v.number(),
        currency: v.string(), // "USD"

        // Order type
        orderType: v.union(v.literal("pre_order"), v.literal("standard")),
        expectedShipDate: v.optional(v.number()), // For pre-orders

        // Order status workflow
        status: v.union(
            v.literal("pending_payment"), // Awaiting payment
            v.literal("payment_processing"), // Payment in progress
            v.literal("paid"), // Payment successful
            v.literal("payment_failed"), // Payment failed
            v.literal("processing"), // Order being prepared
            v.literal("shipped"), // Order shipped
            v.literal("delivered"), // Order delivered
            v.literal("cancelled"), // Order cancelled
            v.literal("refunded"), // Order refunded
        ),

        // Fulfillment
        fulfillmentStatus: v.optional(
            v.union(
                v.literal("unfulfilled"),
                v.literal("partially_fulfilled"),
                v.literal("fulfilled"),
            ),
        ),

        // Shipping info
        shippingAddressId: v.id("shippingAddresses"),
        trackingNumber: v.optional(v.string()),
        carrier: v.optional(v.string()), // "USPS", "FedEx", etc.

        // Payment info
        paymentIntentId: v.optional(v.string()), // Stripe payment intent
        paymentMethod: v.optional(v.string()), // "card", "paypal", etc.

        // Notes
        customerNotes: v.optional(v.string()),
        internalNotes: v.optional(v.string()),

        // Audit trail
        paidAt: v.optional(v.number()),
        shippedAt: v.optional(v.number()),
        deliveredAt: v.optional(v.number()),
        cancelledAt: v.optional(v.number()),
        updatedAt: v.number(),
    })
        .index("by_user_id", ["userId"])
        .index("by_email", ["email"])
        .index("by_order_number", ["orderNumber"])
        .index("by_status", ["status"])
        .index("by_order_type", ["orderType"])
        .index("by_payment_intent_id", ["paymentIntentId"]),

    /**
     * Individual items in an order
     */
    orderItems: defineTable({
        orderId: v.id("orders"),
        productId: v.id("products"),

        // Item details (snapshot at time of order)
        productName: v.string(),
        productSlug: v.string(),
        sku: v.optional(v.string()),

        // Pricing (snapshot)
        unitPriceUSD: v.number(), // Price per unit in cents
        quantity: v.number(),
        totalPriceUSD: v.number(), // unitPrice * quantity

        // Fulfillment
        fulfillmentStatus: v.union(
            v.literal("unfulfilled"),
            v.literal("fulfilled"),
        ),

        // Product snapshot for historical accuracy
        productSnapshot: v.optional(v.string()), // JSON stringified product data
    })
        .index("by_order_id", ["orderId"])
        .index("by_product_id", ["productId"]),

    /**
     * Shipping addresses
     */
    shippingAddresses: defineTable({
        userId: v.id("users"),

        // Address details
        fullName: v.string(),
        addressLine1: v.string(),
        addressLine2: v.optional(v.string()),
        city: v.string(),
        stateProvince: v.string(),
        postalCode: v.string(),
        country: v.string(), // ISO country code
        phoneNumber: v.string(),

        // Address metadata
        isDefault: v.boolean(),
        label: v.optional(v.string()), // "Home", "Work", etc.

        // Validation
        validated: v.boolean(), // Address verified via API
        validatedAt: v.optional(v.number()),
    })
        .index("by_user_id", ["userId"])
        .index("by_user_id_and_is_default", ["userId", "isDefault"]),

    // ============================================================================
    // CONTENT MANAGEMENT
    // ============================================================================

    /**
     * FAQ entries
     */
    faqs: defineTable({
        question: v.string(),
        answer: v.string(), // Supports markdown
        category: v.string(), // "product", "shipping", "payment", "technical"

        // Display
        displayOrder: v.number(),
        isPublished: v.boolean(),

        // SEO
        slug: v.string(),

        // Metadata
        views: v.number(), // Track popular questions
        helpfulCount: v.number(), // User feedback
    })
        .index("by_category", ["category"])
        .index("by_is_published", ["isPublished"])
        .index("by_category_and_display_order", ["category", "displayOrder"])
        .index("by_slug", ["slug"]),

    /**
     * Blog posts / Product updates
     */
    blogPosts: defineTable({
        title: v.string(),
        slug: v.string(),
        excerpt: v.string(),
        content: v.string(), // Markdown content
        coverImage: v.optional(v.id("_storage")),

        // Author
        authorId: v.id("users"),
        authorName: v.string(), // Snapshot

        // Status
        status: v.union(
            v.literal("draft"),
            v.literal("published"),
            v.literal("archived"),
        ),

        // Categorization
        category: v.string(), // "announcement", "update", "tutorial", "news"
        tags: v.array(v.string()),

        // Publishing
        publishedAt: v.optional(v.number()),
        scheduledPublishAt: v.optional(v.number()),

        // SEO
        metaTitle: v.optional(v.string()),
        metaDescription: v.optional(v.string()),

        // Engagement
        views: v.number(),

        // Audit
        updatedAt: v.number(),
    })
        .index("by_slug", ["slug"])
        .index("by_status", ["status"])
        .index("by_category", ["category"])
        .index("by_status_and_published_at", ["status", "publishedAt"])
        .index("by_author_id", ["authorId"]),

    /**
     * Product comparisons (e.g., vs Wacom tablets)
     */
    comparisons: defineTable({
        title: v.string(), // "PompyBoard vs Wacom CTL-472"
        productId: v.id("products"), // PompyBoard product
        competitorName: v.string(), // "Wacom CTL-472"

        // Comparison data
        features: v.array(
            v.object({
                feature: v.string(), // "Polling Rate"
                pompyValue: v.string(), // "8000 Hz"
                competitorValue: v.string(), // "133 Hz"
                winner: v.union(
                    v.literal("pompy"),
                    v.literal("competitor"),
                    v.literal("tie"),
                ),
            }),
        ),

        // Display
        displayOrder: v.number(),
        isPublished: v.boolean(),
    })
        .index("by_product_id", ["productId"])
        .index("by_is_published", ["isPublished"]),

    /**
     * Discord announcements log
     */
    discordAnnouncements: defineTable({
        // Announcement details
        title: v.string(),
        content: v.string(),
        announcementType: v.union(
            v.literal("product_launch"),
            v.literal("update"),
            v.literal("sale"),
            v.literal("general"),
        ),

        // Discord data
        channelId: v.string(), // Discord channel ID
        messageId: v.optional(v.string()), // Discord message ID after posting
        webhookUrl: v.optional(v.string()),

        // Status
        status: v.union(
            v.literal("draft"),
            v.literal("scheduled"),
            v.literal("sent"),
            v.literal("failed"),
        ),
        scheduledFor: v.optional(v.number()),
        sentAt: v.optional(v.number()),

        // Related entities
        productId: v.optional(v.id("products")),
        blogPostId: v.optional(v.id("blogPosts")),

        // Error handling
        errorMessage: v.optional(v.string()),
    })
        .index("by_status", ["status"])
        .index("by_scheduled_for", ["scheduledFor"])
        .index("by_product_id", ["productId"]),

    /**
     * Newsletter subscriptions
     */
    newsletterSubscriptions: defineTable({
        email: v.string(),
        name: v.optional(v.string()),

        // Status
        status: v.union(
            v.literal("active"),
            v.literal("unsubscribed"),
            v.literal("bounced"),
        ),

        // Subscription preferences
        frequency: v.union(
            v.literal("weekly"),
            v.literal("monthly"),
            v.literal("major_updates"),
        ),

        // Source
        source: v.string(), // "website", "discord", "checkout"
        subscribedAt: v.number(),
        unsubscribedAt: v.optional(v.number()),

        // Engagement
        lastEmailSentAt: v.optional(v.number()),
        lastEmailOpenedAt: v.optional(v.number()),
    })
        .index("by_email", ["email"])
        .index("by_status", ["status"]),

    // ============================================================================
    // ANALYTICS & TRACKING
    // ============================================================================

    /**
     * Page views and analytics
     */
    pageViews: defineTable({
        // Page info
        path: v.string(), // "/shop/mk1pro"
        referrer: v.optional(v.string()),
        userAgent: v.optional(v.string()),

        // User info
        userId: v.optional(v.id("users")),
        sessionId: v.string(), // Anonymous session tracking
        ipCountry: v.optional(v.string()),

        // Performance
        loadTime: v.optional(v.number()), // Page load time in ms

        // Related entities
        productId: v.optional(v.id("products")),
        blogPostId: v.optional(v.id("blogPosts")),
    })
        .index("by_path", ["path"])
        .index("by_user_id", ["userId"])
        .index("by_session_id", ["sessionId"])
        .index("by_product_id", ["productId"]),

    /**
     * Email campaigns
     */
    emailCampaigns: defineTable({
        name: v.string(),
        subject: v.string(),
        content: v.string(), // Email template

        // Targeting
        targetAudience: v.union(
            v.literal("all"),
            v.literal("waitlist"),
            v.literal("customers"),
            v.literal("pre_orders"),
        ),

        // Status
        status: v.union(
            v.literal("draft"),
            v.literal("scheduled"),
            v.literal("sending"),
            v.literal("sent"),
            v.literal("cancelled"),
        ),

        // Scheduling
        scheduledFor: v.optional(v.number()),
        sentAt: v.optional(v.number()),

        // Stats
        recipientCount: v.number(),
        openCount: v.number(),
        clickCount: v.number(),

        // Related
        productId: v.optional(v.id("products")),
    })
        .index("by_status", ["status"])
        .index("by_scheduled_for", ["scheduledFor"]),
})
