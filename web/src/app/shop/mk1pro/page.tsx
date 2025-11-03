import MailingListForm from "@/components/mailing-list-form"
import SpecCard from "@/components/spec-card"
import { Icon } from "@iconify/react"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
    title: "Pompyboard mk.1 Pro - Professional 8000Hz osu! Tablet",
    description:
        "The ultimate osu! tablet with 8000Hz polling rate, 200 lpmm resolution, and 20mm hover height. Professional-grade performance for competitive players.",
}

export default async function Mk1ProPage() {
    return (
        <div className="w-full">
            {/* Hero Section - Lead with emotion and value */}
            <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-slate-50 px-4 pt-16 pb-20 sm:pt-24 sm:pb-28">
                <div className="mx-auto max-w-6xl">
                    {/* Back to all products - top left */}
                    <div className="mb-8">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-sm text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                        >
                            <Icon icon="mdi:arrow-left" className="h-4 w-4" />
                            All products
                        </Link>
                    </div>

                    <div className="animate-fade-in text-center">
                        <h1 className="mb-8 text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl md:text-7xl">
                            Pompyboard mk.1
                            <br />
                            <span className="gradient-text">Pro</span>
                        </h1>

                        {/* Social proof */}
                        <div className="mb-8 flex items-center justify-center gap-2 text-sm text-slate-600">
                            <Icon
                                icon="mdi:account-group"
                                className="h-5 w-5 text-blue-600"
                            />
                            <span>Join players on the waitlist</span>
                        </div>

                        {/* Reframed pricing - value anchor */}
                        <div className="mb-2 flex flex-col items-center justify-center">
                            <div className="text-5xl font-bold text-slate-900">
                                $247
                            </div>
                            <p className="mt-1 text-sm font-medium text-green-700">
                                Launch special pricing
                            </p>
                        </div>

                        {/* Primary CTA - mailing list first (lower friction) */}
                        <div className="mb-6 flex justify-center">
                            <div className="w-full max-w-md">
                                <p className="mb-3 text-sm font-medium text-slate-700">
                                    Get notified when we launch
                                </p>
                                <MailingListForm variant="compact" />
                            </div>
                        </div>

                        {/* Secondary actions */}
                        <div className="flex justify-center">
                            <Link
                                href="#specs"
                                className="text-sm font-medium text-blue-600 underline decoration-2 underline-offset-4 transition-colors hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                            >
                                View full specifications ↓
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="absolute top-0 left-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-br from-blue-100 via-purple-50 to-transparent opacity-60 blur-3xl" />
            </section>

            {/* Benefits before specs - emotion before logic */}
            <section className="px-4 py-20">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-16 text-center">
                        <h2 className="mb-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                            Why players choose the Pro
                        </h2>
                        <p className="mx-auto max-w-2xl text-lg text-slate-600">
                            Built for players who demand the absolute best
                        </p>
                    </div>

                    <div className="grid gap-8 lg:grid-cols-3">
                        {/* Leading with user benefits */}
                        <div className="group rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 p-8 transition-all hover:shadow-lg">
                            <div className="mb-4 inline-flex rounded-xl bg-blue-600 p-3">
                                <Icon
                                    icon="mdi:lightning-bolt"
                                    className="h-8 w-8 text-white"
                                />
                            </div>
                            <h3 className="mb-3 text-2xl font-bold text-slate-900">
                                Never miss a beat
                            </h3>
                            <p className="mb-2 text-slate-600">
                                8000Hz polling means your every move registers
                                instantly. Hit streams and jumps you thought
                                were impossible.
                            </p>
                            <p className="text-sm font-semibold text-blue-700">
                                0.125ms response time vs 5ms standard
                            </p>
                        </div>

                        <div className="group rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100/50 p-8 transition-all hover:shadow-lg">
                            <div className="mb-4 inline-flex rounded-xl bg-purple-600 p-3">
                                <Icon
                                    icon="mdi:target-variant"
                                    className="h-8 w-8 text-white"
                                />
                            </div>
                            <h3 className="mb-3 text-2xl font-bold text-slate-900">
                                Pixel-perfect control
                            </h3>
                            <p className="mb-2 text-slate-600">
                                200 lpmm resolution captures micro-movements
                                other tablets miss. Your aim, perfected.
                            </p>
                            <p className="text-sm font-semibold text-purple-700">
                                Professional-grade precision
                            </p>
                        </div>

                        <div className="group rounded-2xl bg-gradient-to-br from-green-50 to-green-100/50 p-8 transition-all hover:shadow-lg">
                            <div className="mb-4 inline-flex rounded-xl bg-green-600 p-3">
                                <Icon
                                    icon="mdi:tune-vertical"
                                    className="h-8 w-8 text-white"
                                />
                            </div>
                            <h3 className="mb-3 text-2xl font-bold text-slate-900">
                                Play your way
                            </h3>
                            <p className="mb-2 text-slate-600">
                                20mm hover height accommodates any style: hover,
                                drag, or tap. Fully customizable firmware adapts
                                to you.
                            </p>
                            <p className="text-sm font-semibold text-green-700">
                                Open-source and customizable
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Key specs - simplified, scannable */}
            <section id="specs" className="bg-slate-50 px-4 py-20">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-12 text-center">
                        <h2 className="mb-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                            Spec Summary
                        </h2>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        <SpecCard
                            icon="mdi:speedometer"
                            value="8000Hz"
                            label="Polling Rate"
                            description="The tablet reports your pen position 8000 times per second. That's 8× faster than standard tablets, ensuring every micro-movement is captured instantly with virtually zero latency."
                            color="blue"
                        />

                        <SpecCard
                            icon="mdi:resize"
                            value="180×100mm"
                            label="Active Area"
                            description="The drawing surface measures 180mm wide by 100mm tall, roughly the size of a smartphone. Perfect for most players. Sorry xooty, you'll need something bigger for that monster area of yours."
                            color="purple"
                        />

                        <SpecCard
                            icon="mdi:grid"
                            value="200 lpmm"
                            label="Resolution"
                            description="The tablet can detect 200 distinct positions per millimeter of movement. This surgical precision means even the tiniest adjustments in your hand position are accurately captured."
                            color="green"
                        />

                        <SpecCard
                            icon="mdi:arrow-expand-vertical"
                            value="20mm"
                            label="Hover Height"
                            description="The pen works up to 20mm above the surface without touching. This extended range gives you maximum flexibility, whether you hover lightly or lift higher between movements."
                            color="orange"
                        />
                    </div>
                </div>
            </section>

            {/* Comparison Section - Decision making aid */}
            <section className="bg-slate-50 px-4 py-20">
                <div className="mx-auto max-w-4xl">
                    <div className="mb-12 text-center">
                        <h2 className="mb-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                            Pro or Lite?
                        </h2>
                    </div>

                    <div className="mb-8 overflow-hidden rounded-2xl bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50">
                                        <th className="p-6 text-left text-sm font-semibold text-slate-900">
                                            Feature
                                        </th>
                                        <th className="p-6 text-center text-sm font-semibold text-slate-900">
                                            Lite
                                        </th>
                                        <th className="bg-gradient-to-br from-purple-100 to-purple-200 p-6 text-center text-sm font-semibold text-slate-900">
                                            Pro{" "}
                                            <span className="text-xs font-normal text-slate-700">
                                                (You&apos;re here)
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    <tr>
                                        <td className="p-6 text-sm font-medium text-slate-900">
                                            Polling Rate
                                        </td>
                                        <td className="p-6 text-center text-sm text-slate-600">
                                            1000Hz
                                            <br />
                                            <span className="text-xs">
                                                Fast
                                            </span>
                                        </td>
                                        <td className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 text-center text-sm font-semibold text-slate-900">
                                            8000Hz
                                            <br />
                                            <span className="text-xs font-normal text-slate-700">
                                                8× faster
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="p-6 text-sm font-medium text-slate-900">
                                            Hover Height
                                        </td>
                                        <td className="p-6 text-center text-sm text-slate-600">
                                            15mm
                                        </td>
                                        <td className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 text-center text-sm font-semibold text-slate-900">
                                            20mm
                                            <br />
                                            <span className="text-xs font-normal text-slate-700">
                                                +33% range
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="p-6 text-sm font-medium text-slate-900">
                                            Best for
                                        </td>
                                        <td className="p-6 text-center text-sm text-slate-600">
                                            All players
                                        </td>
                                        <td className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 text-center text-sm font-semibold text-slate-900">
                                            Serious competitors
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="p-6 text-sm font-medium text-slate-900">
                                            Price
                                        </td>
                                        <td className="p-6 text-center text-sm font-semibold text-slate-900">
                                            $147
                                        </td>
                                        <td className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 text-center text-sm font-semibold text-slate-900">
                                            $247
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="text-center">
                        <Link
                            href="/shop/mk1lite"
                            className="inline-flex items-center gap-2 rounded-full border-2 border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition-all hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                        >
                            View mk.1 Lite
                            <Icon icon="mdi:arrow-right" className="h-5 w-5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* CTA - Create urgency with FOMO */}
            <section className="bg-slate-900 px-4 py-20">
                <div className="mx-auto max-w-4xl text-center">
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
                        <Icon icon="mdi:clock-outline" className="h-4 w-4" />
                        Limited launch allocation
                    </div>
                    <h2 className="mb-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                        Don&apos;t miss launch day
                    </h2>
                    <p className="mb-8 text-lg text-slate-300">
                        Get notified the moment we launch. Be among the first to
                        experience the Pro.
                    </p>
                    <div className="mb-6 flex justify-center">
                        <MailingListForm variant="compact" />
                    </div>
                    <p className="mb-8 text-sm text-slate-400">
                        Plus: Connect with osu! players in our Discord community
                    </p>
                    <a
                        href="https://discord.gg/h27rwcBn73"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#5865F2] px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-[#4752C4] hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5865F2]"
                    >
                        <Icon icon="fa-brands:discord" className="h-5 w-5" />
                        Join Discord Community
                        <Icon icon="mdi:open-in-new" className="h-4 w-4" />
                    </a>
                </div>
            </section>
        </div>
    )
}
