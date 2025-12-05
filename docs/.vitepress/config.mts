import { defineConfig } from "vitepress"

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "Wonkle",
    description: "Wonkle documentation & blog",
    head: [
        ["link", { rel: "icon", href: "/favicon.svg" }],
        [
            "script",
            {
                defer: "",
                src: "https://rybbit.pompy.dev/api/script.js",
                "data-site-id": "ac57acf9b33e",
            },
        ],
    ],
    sitemap: {
        hostname: "https://docs.wonkle.io",
    },
    themeConfig: {
        logo: "/favicon.svg",

        search: {
            provider: "local",
        },

        nav: [
            { text: "FAQ", link: "/faq" },
            { text: "Manual", link: "/manual" },
            { text: "Docs", link: "/docs" },
            { text: "Blog", link: "/blog" },
        ],

        sidebar: {
            "/manual/": [
                {
                    text: "User Manual",
                    items: [{ text: "Index", link: "/manual" }],
                },
            ],

            "/docs/": [
                {
                    text: "Documentation",
                    items: [
                        { text: "Index", link: "/docs" },
                        { text: "Contribution guide", link: "/docs/contribution-guide" },
                    ],
                },
            ],

            "/blog/": [
                {
                    text: "Blog",
                    items: [{ text: "Index", link: "/blog" }],
                },
            ],
        },

        socialLinks: [
            { icon: "discord", link: "https://discord.com/invite/h27rwcBn73" },
            { icon: "bluesky", link: "https://bsky.app/profile/wonkle.io" },
            { icon: "github", link: "https://github.com/wonkleio/wonkle" },
        ],
    },
})
