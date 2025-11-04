import MailingListForm from "@/components/mailing-list-form"
import SpecCard from "@/components/spec-card"
import { Icon } from "@iconify/react"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
    title: "Pompyboard mk.1 Lite - Professional 1000Hz osu! Tablet",
    description:
        "High-performance osu! tablet with 1000Hz polling rate, 200 lpmm resolution, and 15mm hover height. Professional quality at an accessible price.",
}

export default async function Mk1LitePage() {
    return (
        <div className="w-full">
            {/* Hero Section - Lead with value proposition */}
            <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 px-4 pt-8 pb-4">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-8">
                        <Link
                            aria-label="Back to products"
                            href="/#products"
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
                            <span className="gradient-text">Lite</span>
                        </h1>

                        {/* Social proof */}
                        <div className="mb-8 flex items-center justify-center gap-2 text-sm text-slate-600">
                            <Icon
                                icon="mdi:account-group"
                                className="h-5 w-5 text-blue-600"
                            />
                            <span>Join players on the waitlist</span>
                        </div>

                        {/* Value-focused pricing */}
                        <div className="mb-2 flex flex-col items-center justify-center">
                            <div className="text-5xl font-bold text-slate-900">
                                $147
                            </div>
                            <p className="mt-1 text-sm font-medium text-green-700">
                                Launch special pricing
                            </p>
                        </div>

                        {/* Primary CTA */}
                        <div className="mb-6 flex justify-center">
                            <div className="w-full max-w-md">
                                <p className="mb-3 text-sm font-medium text-slate-700">
                                    Get notified when we launch
                                </p>
                                <MailingListForm variant="compact" />
                            </div>
                        </div>

                        {/* Secondary actions */}
                        <div className="mt-12 flex justify-center">
                            <Link
                                href="#specs"
                                className="text-sm font-medium text-blue-600 underline decoration-2 underline-offset-4 transition-colors hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                            >
                                View full specifications ↓
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="absolute top-0 left-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-br from-slate-100 via-blue-50 to-transparent opacity-60 blur-3xl" />
            </section>

            {/* Benefits first - emotion before specs */}
            <section className="px-4 py-20">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-16 text-center">
                        <h2 className="mb-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                            Pro-level performance
                        </h2>
                        <p className="mx-auto max-w-2xl text-lg text-slate-600">
                            Without the premium price tag
                        </p>
                    </div>

                    <div className="grid gap-8 lg:grid-cols-3">
                        <div className="group rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 p-8 transition-all hover:shadow-lg">
                            <div className="mb-4 inline-flex rounded-xl bg-blue-600 p-3">
                                <Icon
                                    icon="mdi:speedometer"
                                    className="h-8 w-8 text-white"
                                />
                            </div>
                            <h3 className="mb-3 text-2xl font-bold text-slate-900">
                                1000Hz polling rate
                            </h3>
                            <p className="mb-2 text-slate-600">
                                Smooth, responsive input for competitive play.
                                Hit your patterns with confidence.
                            </p>
                            <p className="text-sm font-semibold text-blue-700">
                                1ms response time vs 5ms standard
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
                                Precision you can feel
                            </h3>
                            <p className="mb-2 text-slate-600">
                                200 lpmm resolution captures every movement
                                accurately. Perfect for improving your aim and
                                consistency.
                            </p>
                            <p className="text-sm font-semibold text-purple-700">
                                High-precision tracking
                            </p>
                        </div>

                        <div className="group rounded-2xl bg-gradient-to-br from-green-50 to-green-100/50 p-8 transition-all hover:shadow-lg">
                            <div className="mb-4 inline-flex rounded-xl bg-green-600 p-3">
                                <Icon
                                    icon="mdi:wrench"
                                    className="h-8 w-8 text-white"
                                />
                            </div>
                            <h3 className="mb-3 text-2xl font-bold text-slate-900">
                                Make it yours
                            </h3>
                            <p className="mb-2 text-slate-600">
                                Customize settings and tweak performance to
                                match your style. Open-source firmware means
                                full transparency and community control.
                            </p>
                            <p className="text-sm font-semibold text-green-700">
                                Fully customizable
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Simplified specs */}
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
                            value="1000Hz"
                            label="Polling Rate"
                            description="The tablet reports your pen position 1000 times per second. This professional-grade polling rate ensures smooth, responsive tracking for competitive gameplay with minimal input lag."
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
                            value="15mm"
                            label="Hover Height"
                            description="The pen works up to 15mm above the surface without touching. This generous range accommodates most playstyles, whether you prefer hovering or lifting between movements."
                            color="orange"
                        />
                    </div>
                </div>
            </section>

            {/* Comparison Section */}
            <section className="px-4 py-20">
                <div className="mx-auto max-w-4xl">
                    <div className="mb-12 text-center">
                        <h2 className="mb-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                            Lite or Pro?
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
                                        <th className="bg-gradient-to-br from-blue-100 to-blue-200 p-6 text-center text-sm font-semibold text-slate-900">
                                            Lite{" "}
                                            <span className="text-xs font-normal text-slate-700">
                                                (You&apos;re here)
                                            </span>
                                        </th>
                                        <th className="p-6 text-center text-sm font-semibold text-slate-900">
                                            Pro
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    <tr>
                                        <td className="p-6 text-sm font-medium text-slate-900">
                                            Polling Rate
                                        </td>
                                        <td className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 text-center text-sm font-semibold text-slate-900">
                                            1000Hz
                                            <br />
                                            <span className="text-xs font-normal text-slate-700">
                                                Lite
                                            </span>
                                        </td>
                                        <td className="p-6 text-center text-sm text-slate-600">
                                            8000Hz
                                            <br />
                                            <span className="text-xs">
                                                8× faster
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="p-6 text-sm font-medium text-slate-900">
                                            Hover Height
                                        </td>
                                        <td className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 text-center text-sm font-semibold text-slate-900">
                                            15mm
                                        </td>
                                        <td className="p-6 text-center text-sm text-slate-600">
                                            20mm
                                            <br />
                                            <span className="text-xs">
                                                +33% range
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="p-6 text-sm font-medium text-slate-900">
                                            Best for
                                        </td>
                                        <td className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 text-center text-sm font-semibold text-slate-900">
                                            All serious players
                                        </td>
                                        <td className="p-6 text-center text-sm text-slate-600">
                                            Top competitors
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="p-6 text-sm font-medium text-slate-900">
                                            Price
                                        </td>
                                        <td className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 text-center text-sm font-semibold text-slate-900">
                                            $147
                                        </td>
                                        <td className="p-6 text-center text-sm font-semibold text-slate-900">
                                            $247
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="text-center">
                        <Link
                            href="/shop/mk1pro"
                            className="inline-flex items-center gap-2 rounded-full border-2 border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition-all hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                        >
                            View mk.1 Pro
                            <Icon icon="mdi:arrow-right" className="h-5 w-5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* CTA with urgency */}
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
                        experience the Lite.
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
