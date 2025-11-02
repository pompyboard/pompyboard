import ShopItem from "@/components/shop-item"
import { Icon } from "@iconify/react"

export default async function Home() {
    return (
        <div className="w-full">
            <section className="relative overflow-hidden px-4 pt-16 pb-24 sm:pt-24 sm:pb-32">
                <div className="mx-auto max-w-6xl">
                    <div className="animate-fade-in mb-8 flex justify-center">
                        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition-all hover:ring-slate-300">
                            <span>Made for osu! players</span>
                        </div>
                    </div>

                    <div
                        className="animate-fade-in text-center"
                        style={{ animationDelay: "0.1s" }}
                    >
                        <h1 className="mb-6 text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl md:text-7xl lg:text-8xl">
                            Dominate osu! with
                            <br />
                            <span className="gradient-text">precision</span>
                        </h1>
                        <p className="mx-auto mb-12 max-w-2xl text-lg text-slate-600 sm:text-xl md:text-2xl">
                            The world&apos;s most advanced open-source tablet
                            designed specifically for osu! players. Experience
                            unmatched speed, accuracy, and control.
                        </p>

                        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                            <a
                                href="#products"
                                className="inline-flex items-center justify-center rounded-full bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                            >
                                Explore products
                                <Icon
                                    icon="mdi:arrow-right"
                                    className="ml-2 h-5 w-5"
                                />
                            </a>
                            <a
                                href="https://discord.gg/h27rwcBn73"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center rounded-full border-2 border-slate-300 bg-white px-8 py-4 text-base font-semibold text-slate-900 transition-all hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                            >
                                Join Discord
                                <Icon
                                    icon="fa-brands:discord"
                                    className="ml-2 h-5 w-5"
                                />
                                <Icon
                                    icon="mdi:open-in-new"
                                    className="ml-1 h-4 w-4"
                                />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="absolute top-0 left-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-br from-blue-100 via-purple-50 to-transparent opacity-60 blur-3xl" />
            </section>

            <section className="bg-slate-50 px-4 py-20">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-16 text-center">
                        <h2 className="mb-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                            Engineered for osu! dominance
                        </h2>
                        <p className="mx-auto max-w-2xl text-lg text-slate-600">
                            Every feature optimized for competitive rhythm
                            gaming
                        </p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-3">
                        <div className="group rounded-2xl bg-white p-8 shadow-sm transition-all hover:shadow-xl">
                            <div className="mb-4 inline-flex rounded-xl bg-blue-100 p-3">
                                <Icon
                                    icon="mdi:speedometer"
                                    className="h-8 w-8 text-blue-600"
                                />
                            </div>
                            <h3 className="mb-2 text-xl font-semibold text-slate-900">
                                Lightning-fast 8000Hz
                            </h3>
                            <p className="text-slate-600">
                                Ultra-low latency polling for instant response.
                                Hit every jump and stream with perfect timing
                            </p>
                        </div>

                        {/* Yes, we measure in lines per millimeter. Because we're cool */}
                        <div className="group rounded-2xl bg-white p-8 shadow-sm transition-all hover:shadow-xl">
                            <div className="mb-4 inline-flex rounded-xl bg-purple-100 p-3">
                                <Icon
                                    icon="mdi:target"
                                    className="h-8 w-8 text-purple-600"
                                />
                            </div>
                            <h3 className="mb-2 text-xl font-semibold text-slate-900">
                                Pixel-perfect aim
                            </h3>
                            <p className="text-slate-600">
                                200 lpmm resolution for surgical precision on
                                even the trickiest patterns and jumps
                            </p>
                        </div>

                        <div className="group rounded-2xl bg-white p-8 shadow-sm transition-all hover:shadow-xl">
                            <div className="mb-4 inline-flex rounded-xl bg-green-100 p-3">
                                <Icon
                                    icon="mdi:open-source-initiative"
                                    className="h-8 w-8 text-green-600"
                                />
                            </div>
                            <h3 className="mb-2 text-xl font-semibold text-slate-900">
                                Open source
                            </h3>
                            <p className="text-slate-600">
                                Full transparency and community control. Built
                                by the osu! community, for the community
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Comparison Section */}
            <section className="bg-white px-4 py-20">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-16 text-center">
                        <h2 className="mb-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                            How we compare
                        </h2>
                        <p className="mx-auto max-w-2xl text-lg text-slate-600">
                            Pompyboard vs popular alternatives
                        </p>
                    </div>

                    <div className="mx-auto max-w-4xl space-y-12">
                        {/* Polling Rate Comparison */}
                        <div>
                            <h3 className="mb-6 text-2xl font-bold text-slate-900">
                                Polling Rate
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-700">
                                            Wacom CTL-472
                                        </span>
                                        <span className="text-sm font-semibold text-slate-900">
                                            133Hz
                                        </span>
                                    </div>
                                    <div className="h-8 w-full overflow-hidden rounded-lg bg-slate-100">
                                        <div
                                            className="h-full bg-slate-400 transition-all"
                                            style={{ width: "1.66%" }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-700">
                                            Wacom PTK-470
                                        </span>
                                        <span className="text-sm font-semibold text-slate-900">
                                            200Hz
                                        </span>
                                    </div>
                                    <div className="h-8 w-full overflow-hidden rounded-lg bg-slate-100">
                                        <div
                                            className="h-full bg-slate-400 transition-all"
                                            style={{ width: "2.5%" }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-700">
                                            Pompyboard mk.1 Lite
                                        </span>
                                        <span className="text-sm font-semibold text-blue-900">
                                            1000Hz
                                        </span>
                                    </div>
                                    <div className="h-8 w-full overflow-hidden rounded-lg bg-blue-50">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                                            style={{ width: "12.5%" }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-700">
                                            Pompyboard mk.1 Pro
                                        </span>
                                        <span className="text-sm font-semibold text-purple-900">
                                            8000Hz ⚡
                                        </span>
                                    </div>
                                    <div className="h-8 w-full overflow-hidden rounded-lg bg-purple-50">
                                        <div
                                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                                            style={{ width: "100%" }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Resolution Comparison */}
                        <div>
                            <h3 className="mb-6 text-2xl font-bold text-slate-900">
                                Resolution
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-700">
                                            Wacom CTL-472
                                        </span>
                                        <span className="text-sm font-semibold text-slate-900">
                                            100 lpmm
                                        </span>
                                    </div>
                                    <div className="h-8 w-full overflow-hidden rounded-lg bg-slate-100">
                                        <div
                                            className="h-full bg-slate-400 transition-all"
                                            style={{ width: "50%" }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-700">
                                            Wacom PTK-470
                                        </span>
                                        <span className="text-sm font-semibold text-slate-900">
                                            200 lpmm
                                        </span>
                                    </div>
                                    <div className="h-8 w-full overflow-hidden rounded-lg bg-slate-100">
                                        <div
                                            className="h-full bg-slate-400 transition-all"
                                            style={{ width: "100%" }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-700">
                                            Pompyboard mk.1 (Both)
                                        </span>
                                        <span className="text-sm font-semibold text-purple-900">
                                            200 lpmm
                                        </span>
                                    </div>
                                    <div className="h-8 w-full overflow-hidden rounded-lg bg-purple-50">
                                        <div
                                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                                            style={{ width: "100%" }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Active Area Comparison */}
                        <div>
                            <h3 className="mb-6 text-2xl font-bold text-slate-900">
                                Active Area
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-700">
                                            Wacom CTL-472
                                        </span>
                                        <span className="text-sm font-semibold text-slate-900">
                                            152 × 95 mm
                                        </span>
                                    </div>
                                    <div className="h-8 w-full overflow-hidden rounded-lg bg-slate-100">
                                        <div
                                            className="h-full bg-slate-400 transition-all"
                                            style={{ width: "80%" }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-700">
                                            Wacom PTK-470
                                        </span>
                                        <span className="text-sm font-semibold text-slate-900">
                                            157 × 98 mm
                                        </span>
                                    </div>
                                    <div className="h-8 w-full overflow-hidden rounded-lg bg-slate-100">
                                        <div
                                            className="h-full bg-slate-400 transition-all"
                                            style={{ width: "85%" }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-700">
                                            Pompyboard mk.1 (Both)
                                        </span>
                                        <span className="text-sm font-semibold text-purple-900">
                                            180 × 100 mm
                                        </span>
                                    </div>
                                    <div className="h-8 w-full overflow-hidden rounded-lg bg-purple-50">
                                        <div
                                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                                            style={{ width: "100%" }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="products" className="px-4 py-20">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-12 text-center">
                        <h2 className="mb-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                            Choose your weapon
                        </h2>
                        <p className="mx-auto max-w-2xl text-lg text-slate-600">
                            Professional-grade tablets built for competitive
                            osu! play
                        </p>
                    </div>

                    <div className="grid gap-8 lg:grid-cols-2">
                        <ShopItem
                            name="Pompyboard mk.1 Lite"
                            price="147.27"
                            pollingRate="1000Hz"
                            activeArea="180 × 100 mm"
                            resolution="200 lpmm"
                            hoverHeight="15mm"
                        />
                        <ShopItem
                            name="Pompyboard mk.1 Pro"
                            price="247.27"
                            pollingRate="8000Hz"
                            activeArea="180 × 100 mm"
                            resolution="200 lpmm"
                            hoverHeight="20mm"
                        />
                    </div>
                </div>
            </section>

            <section className="bg-slate-900 px-4 py-20">
                <div className="mx-auto max-w-4xl text-center">
                    <h2 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                        Join the osu! tablet community
                    </h2>
                    <p className="mb-8 text-lg text-slate-300">
                        Connect with top players, share your plays, and get
                        early access to new products
                    </p>
                    <a
                        href="https://discord.gg/h27rwcBn73"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-full bg-[#5865F2] px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-[#4752C4] hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5865F2]"
                    >
                        Join our Discord
                        <Icon
                            icon="fa-brands:discord"
                            className="ml-2 h-5 w-5"
                        />
                        <Icon icon="mdi:open-in-new" className="ml-1 h-4 w-4" />
                    </a>
                </div>
            </section>
        </div>
    )
}
