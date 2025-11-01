/**
 * Seed data for PompyBoard products
 * Run this once to populate initial product data
 */
import { v } from "convex/values"

import { internalMutation } from "./_generated/server"

export const seedProducts = internalMutation({
    args: {},
    returns: v.null(),
    handler: async (ctx) => {
        // Check if products already exist
        const existing = await ctx.db.query("products").collect()
        if (existing.length > 0) {
            console.log("Products already seeded")
            return null
        }

        const now = Date.now()
        const launchDate = new Date("2026-06-01").getTime()

        // ========================================================================
        // POMPYBOARD MK.1 LITE
        // ========================================================================
        const mk1LiteId = await ctx.db.insert("products", {
            name: "PompyBoard mk.1 Lite",
            slug: "mk1lite",
            description: `The PompyBoard mk.1 Lite is the perfect entry point into high-performance osu! gameplay. With a 1000Hz polling rate and 180×100mm active area, it delivers smooth, accurate tracking at an accessible price point. 

Built with the same quality sensors as our Pro model, the Lite version offers professional-grade precision for players who want to take their gameplay to the next level without breaking the bank.`,
            shortDescription:
                "Professional osu! tablet with 1000Hz polling rate and 180×100mm active area.",
            priceUSD: 14727, // $147.27
            currency: "USD",
            status: "coming_soon",
            estimatedLaunchDate: launchDate,
            announcementDate: now,
            productType: "tablet",
            tags: ["lite", "1000hz", "osu", "affordable", "beginner-friendly"],
            metaTitle: "PompyBoard mk.1 Lite - Professional osu! Tablet",
            metaDescription:
                "Get started with professional osu! gameplay. 1000Hz polling rate, 180×100mm active area, 15mm hover height. Ships 2026.",
            displayOrder: 2,
            isFeatured: true,
            updatedAt: now,
        })

        // Add specifications for Lite
        await ctx.db.insert("productSpecs", {
            productId: mk1LiteId,
            pollingRate: "1000 Hz",
            activeArea: "180 × 100 mm",
            resolution: "200 lpmm",
            hoverHeight: "15 mm",
            weight: "~300g",
            dimensions: "220 × 140 × 8 mm",
            cableLength: "1.8m USB-C",
            compatibility: ["Windows", "macOS", "Linux"],
            additionalSpecs: {
                Sensors: "Infrared LED matrix",
                "Pen Type": "Battery-free passive pen",
                "Pressure Levels": "8192 levels",
                "Connection Type": "USB-C",
                "Driver Required": "No (plug and play)",
            },
        })

        // Add inventory for Lite
        await ctx.db.insert("inventory", {
            productId: mk1LiteId,
            quantityAvailable: 0,
            quantityReserved: 0,
            quantityTotal: 0,
            preOrderLimit: 1000,
            preOrderCount: 0,
            lowStockThreshold: 50,
            restockDate: launchDate,
            sku: "POMPY-MK1-LITE-001",
            lastStockUpdate: now,
        })

        // ========================================================================
        // POMPYBOARD MK.1 PRO
        // ========================================================================
        const mk1ProId = await ctx.db.insert("products", {
            name: "PompyBoard mk.1 Pro",
            slug: "mk1pro",
            description: `Experience the ultimate in osu! performance with the PompyBoard mk.1 Pro. Featuring an industry-leading 8000Hz polling rate, this tablet offers unmatched responsiveness and precision for competitive gameplay.

The mk.1 Pro is engineered for serious players who demand the absolute best. With 20mm hover height and our advanced sensor technology, you'll never miss a beat. Join the ranks of top players who trust PompyBoard for tournament-level performance.`,
            shortDescription:
                "Ultimate osu! tablet with groundbreaking 8000Hz polling rate and professional features.",
            priceUSD: 24727, // $247.27
            currency: "USD",
            status: "coming_soon",
            estimatedLaunchDate: launchDate,
            announcementDate: now,
            productType: "tablet",
            tags: ["pro", "8000hz", "osu", "competitive", "high-performance"],
            metaTitle: "PompyBoard mk.1 Pro - 8000Hz Professional osu! Tablet",
            metaDescription:
                "The world's fastest osu! tablet. 8000Hz polling rate, 180×100mm active area, 20mm hover height. For competitive players. Ships 2026.",
            displayOrder: 1,
            isFeatured: true,
            updatedAt: now,
        })

        // Add specifications for Pro
        await ctx.db.insert("productSpecs", {
            productId: mk1ProId,
            pollingRate: "8000 Hz",
            activeArea: "180 × 100 mm",
            resolution: "200 lpmm",
            hoverHeight: "20 mm",
            weight: "~320g",
            dimensions: "220 × 140 × 8 mm",
            cableLength: "1.8m USB-C (braided)",
            compatibility: ["Windows", "macOS", "Linux"],
            additionalSpecs: {
                Sensors: "Infrared LED matrix (high-density)",
                "Pen Type": "Battery-free passive pen (premium)",
                "Pressure Levels": "8192 levels",
                "Connection Type": "USB-C",
                "Driver Required": "No (plug and play)",
                "Extra Features": "RGB lighting, premium build quality",
            },
        })

        // Add inventory for Pro
        await ctx.db.insert("inventory", {
            productId: mk1ProId,
            quantityAvailable: 0,
            quantityReserved: 0,
            quantityTotal: 0,
            preOrderLimit: 500,
            preOrderCount: 0,
            lowStockThreshold: 25,
            restockDate: launchDate,
            sku: "POMPY-MK1-PRO-001",
            lastStockUpdate: now,
        })

        // ========================================================================
        // COMPARISON DATA
        // ========================================================================

        // Compare mk.1 Pro vs Wacom CTL-472
        await ctx.db.insert("comparisons", {
            title: "PompyBoard mk.1 Pro vs Wacom CTL-472",
            productId: mk1ProId,
            competitorName: "Wacom CTL-472",
            features: [
                {
                    feature: "Polling Rate",
                    pompyValue: "8000 Hz",
                    competitorValue: "133 Hz",
                    winner: "pompy",
                },
                {
                    feature: "Active Area",
                    pompyValue: "180 × 100 mm",
                    competitorValue: "152 × 95 mm",
                    winner: "pompy",
                },
                {
                    feature: "Resolution",
                    pompyValue: "200 lpmm",
                    competitorValue: "100 lpmm",
                    winner: "pompy",
                },
                {
                    feature: "Hover Height",
                    pompyValue: "20 mm",
                    competitorValue: "17 mm",
                    winner: "pompy",
                },
                {
                    feature: "Price",
                    pompyValue: "$247.27",
                    competitorValue: "$39.95",
                    winner: "competitor",
                },
            ],
            displayOrder: 1,
            isPublished: true,
        })

        // Compare mk.1 Pro vs Wacom Intuos Pro Small
        await ctx.db.insert("comparisons", {
            title: "PompyBoard mk.1 Pro vs Wacom Intuos Pro Small (PTK-470)",
            productId: mk1ProId,
            competitorName: "Wacom Intuos Pro Small",
            features: [
                {
                    feature: "Polling Rate",
                    pompyValue: "8000 Hz",
                    competitorValue: "300 Hz",
                    winner: "pompy",
                },
                {
                    feature: "Active Area",
                    pompyValue: "180 × 100 mm",
                    competitorValue: "187 × 105 mm",
                    winner: "tie",
                },
                {
                    feature: "Resolution",
                    pompyValue: "200 lpmm",
                    competitorValue: "200 lpmm",
                    winner: "tie",
                },
                {
                    feature: "Price",
                    pompyValue: "$247.27",
                    competitorValue: "$249.95",
                    winner: "pompy",
                },
            ],
            displayOrder: 2,
            isPublished: true,
        })

        // Compare mk.1 Lite vs Wacom CTL-472
        await ctx.db.insert("comparisons", {
            title: "PompyBoard mk.1 Lite vs Wacom CTL-472",
            productId: mk1LiteId,
            competitorName: "Wacom CTL-472",
            features: [
                {
                    feature: "Polling Rate",
                    pompyValue: "1000 Hz",
                    competitorValue: "133 Hz",
                    winner: "pompy",
                },
                {
                    feature: "Active Area",
                    pompyValue: "180 × 100 mm",
                    competitorValue: "152 × 95 mm",
                    winner: "pompy",
                },
                {
                    feature: "Resolution",
                    pompyValue: "200 lpmm",
                    competitorValue: "100 lpmm",
                    winner: "pompy",
                },
                {
                    feature: "Hover Height",
                    pompyValue: "15 mm",
                    competitorValue: "17 mm",
                    winner: "competitor",
                },
                {
                    feature: "Price",
                    pompyValue: "$147.27",
                    competitorValue: "$39.95",
                    winner: "competitor",
                },
            ],
            displayOrder: 1,
            isPublished: true,
        })

        // ========================================================================
        // FAQ DATA
        // ========================================================================

        const faqData = [
            {
                category: "product",
                question: "What makes PompyBoard different from other tablets?",
                answer: `PompyBoard features the highest polling rate available in any osu! tablet at 8000Hz (Pro model), providing unmatched responsiveness. Our absolute positioning system eliminates cursor drift, and our open-source design means full transparency and community-driven improvements.`,
                displayOrder: 1,
            },
            {
                category: "product",
                question: "What's the difference between Lite and Pro?",
                answer: `The main differences are:
- **Polling Rate**: Lite has 1000Hz, Pro has 8000Hz
- **Hover Height**: Lite has 15mm, Pro has 20mm  
- **Build Quality**: Pro features premium materials and RGB lighting
- **Price**: Lite is $147.27, Pro is $247.27

Both share the same active area (180×100mm) and resolution (200 lpmm).`,
                displayOrder: 2,
            },
            {
                category: "shipping",
                question: "When will PompyBoard ship?",
                answer: `We're targeting a launch in mid-2026. Join our waitlist to be notified the moment pre-orders open! Early supporters will get special discounts.`,
                displayOrder: 1,
            },
            {
                category: "shipping",
                question: "Do you ship internationally?",
                answer: `Yes! We plan to ship worldwide. Shipping costs and times will vary by region, but we're committed to making PompyBoard accessible globally.`,
                displayOrder: 2,
            },
            {
                category: "technical",
                question: "Does PompyBoard require drivers?",
                answer: `No! PompyBoard works plug-and-play with Windows, macOS, and Linux. Just connect via USB-C and start playing. However, we'll provide optional configuration software for advanced customization.`,
                displayOrder: 1,
            },
            {
                category: "technical",
                question: "Is PompyBoard compatible with my operating system?",
                answer: `Yes! PompyBoard works with Windows 10/11, macOS 10.15+, and most Linux distributions. It uses standard HID protocols for maximum compatibility.`,
                displayOrder: 2,
            },
            {
                category: "payment",
                question: "What payment methods do you accept?",
                answer: `We accept all major credit cards, PayPal, and various regional payment methods through our secure payment processor Stripe.`,
                displayOrder: 1,
            },
            {
                category: "payment",
                question: "Can I cancel my pre-order?",
                answer: `Yes! You can cancel your pre-order anytime before shipping for a full refund. Once your order ships, our standard return policy applies.`,
                displayOrder: 2,
            },
        ]

        for (const faq of faqData) {
            const slug = faq.question
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "")

            await ctx.db.insert("faqs", {
                question: faq.question,
                answer: faq.answer,
                category: faq.category,
                displayOrder: faq.displayOrder,
                isPublished: true,
                slug,
                views: 0,
                helpfulCount: 0,
            })
        }

        console.log(
            "Successfully seeded products, specs, comparisons, and FAQs!",
        )
        return null
    },
})
