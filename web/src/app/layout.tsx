import { ConvexClientProvider } from "@/components/convex-client-provider"
import Footer from "@/components/footer"
import Navbar from "@/components/navbar"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Script from "next/script"

import "./globals.css"

const inter = Inter({
    subsets: ["latin"],
    display: "swap",
})

export const metadata: Metadata = {
    title: "Wonkle",
    description: "Made by gamers, for gamers.",
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en" className="scroll-smooth">
            <head>
                <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
            </head>

            <body className={`${inter.className} min-h-screen bg-white text-slate-900 antialiased`}>
                <ConvexClientProvider>
                    <div className="flex min-h-screen flex-col">
                        <Navbar />
                        <main className="grow">{children}</main>
                        <Footer />
                    </div>
                </ConvexClientProvider>

                <Script src="/api/script.js" data-site-id="6" strategy="afterInteractive" />
            </body>
        </html>
    )
}
