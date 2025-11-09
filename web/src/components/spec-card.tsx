"use client"

import { Icon } from "@iconify/react"
import { useState } from "react"

interface SpecCardProps {
    icon: string
    value: string
    label: string
    description: string
    color: "blue" | "purple" | "green" | "orange"
}

const colorClasses = {
    blue: {
        icon: "text-blue-600",
        bg: "bg-blue-600",
        modal: "from-blue-50 to-blue-100/50",
        text: "text-blue-900",
    },
    purple: {
        icon: "text-purple-600",
        bg: "bg-purple-600",
        modal: "from-purple-50 to-purple-100/50",
        text: "text-purple-900",
    },
    green: {
        icon: "text-green-600",
        bg: "bg-green-600",
        modal: "from-green-50 to-green-100/50",
        text: "text-green-900",
    },
    orange: {
        icon: "text-orange-600",
        bg: "bg-orange-600",
        modal: "from-orange-50 to-orange-100/50",
        text: "text-orange-900",
    },
}

export default function SpecCard({
    icon,
    value,
    label,
    description,
    color,
}: SpecCardProps) {
    const [isOpen, setIsOpen] = useState(false)
    const colors = colorClasses[color]

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="group relative w-full rounded-2xl bg-white p-6 text-left shadow-sm transition-all hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                aria-label={`Learn more about ${label}`}
            >
                <div className="absolute top-4 right-4 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100">
                        <Icon
                            icon="mdi:information"
                            className="h-4 w-4 text-slate-600"
                        />
                    </div>
                </div>
                <Icon icon={icon} className={`mb-4 h-10 w-10 ${colors.icon}`} />
                <h3 className="mb-2 text-3xl font-bold text-slate-900">
                    {value}
                </h3>
                <p className="text-sm font-medium text-slate-600">{label}</p>
                <div className="mt-3 flex items-center gap-1 text-xs font-medium text-slate-500 opacity-0 transition-opacity group-hover:opacity-100">
                    <span>Tap to learn more</span>
                    <Icon icon="mdi:arrow-right" className="h-3 w-3" />
                </div>
            </button>

            {/* Modal */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="spec-modal-title"
                >
                    <div
                        className={`animate-fade-in-scale relative w-full max-w-md overflow-hidden rounded-3xl bg-gradient-to-br ${colors.modal} p-8 shadow-2xl`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm transition-all hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                            aria-label="Close dialog"
                        >
                            <Icon
                                icon="mdi:close"
                                className="h-5 w-5 text-slate-700"
                            />
                        </button>

                        <div
                            className={`mb-4 inline-flex rounded-xl ${colors.bg} p-3`}
                        >
                            <Icon icon={icon} className="h-8 w-8 text-white" />
                        </div>

                        <h3
                            id="spec-modal-title"
                            className={`mb-2 text-3xl font-bold ${colors.text}`}
                        >
                            {value}
                        </h3>
                        <p
                            className={`mb-4 text-base font-semibold ${colors.text}`}
                        >
                            {label}
                        </p>

                        <p className="text-base leading-relaxed text-slate-700">
                            {description}
                        </p>
                    </div>
                </div>
            )}
        </>
    )
}
