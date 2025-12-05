"use client"

import { Icon } from "@iconify/react"
import confetti from "canvas-confetti"
import { useMutation } from "convex/react"
import { useState } from "react"

import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"

interface MailingListFormProps {
    variant?: "default" | "compact"
    source:
        | "homepage"
        | "product-tablet-mk1-lite"
        | "product-tablet-mk1-lite-cta"
        | "product-tablet-mk1-pro"
        | "product-tablet-mk1-pro-cta"
        | "product-tablet-mk1-x"
        | "product-tablet-mk1-x-cta"
    productId?: Id<"products">
}

export default function MailingListForm({
    variant = "default",
    source,
    productId,
}: MailingListFormProps) {
    const [email, setEmail] = useState("")
    const [name, setName] = useState("")
    const [honeypot, setHoneypot] = useState("")
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
    const [message, setMessage] = useState("")

    const joinWaitlist = useMutation(api.waitlist.joinWaitlist)

    const getClientIdentifier = () => {
        const ua = navigator.userAgent
        const screen = `${window.screen.width}x${window.screen.height}`
        return btoa(`${ua}-${screen}`).substring(0, 32)
    }

    const triggerConfetti = (origin: { x: number; y: number }) => {
        confetti({
            particleCount: 70,
            spread: 60,
            origin,
            startVelocity: 60,
            ticks: 200,
            gravity: 1.2,
            zIndex: 9999,
        })
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setStatus("loading")

        const formElement = e.currentTarget
        const rect = formElement.getBoundingClientRect()
        const confettiOrigin = {
            x: (rect.left + rect.width / 2) / window.innerWidth,
            y: (rect.top + rect.height / 2) / window.innerHeight,
        }

        try {
            const result = await joinWaitlist({
                email: email.trim(),
                name: name.trim() || undefined,
                productId,
                source,
                referrer: typeof document !== "undefined" ? document.referrer : undefined,
                userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
                honeypot,
                formRenderTime: Date.now(),
                clientIdentifier: getClientIdentifier(),
            })

            if (result.success) {
                setStatus("success")
                setMessage(result.message)
                setEmail("")
                setName("")

                triggerConfetti(confettiOrigin)

                setTimeout(() => {
                    setStatus("idle")
                    setMessage("")
                }, 5000)
            } else {
                setStatus("error")
                setMessage(result.message)

                setTimeout(() => {
                    setStatus("idle")
                    setMessage("")
                }, 5000)
            }
        } catch (error) {
            console.error("Mailing list signup error:", error)
            setStatus("error")
            setMessage("Oops! Something went wrong. Please try again.")

            setTimeout(() => {
                setStatus("idle")
                setMessage("")
            }, 5000)
        }
    }

    if (variant === "compact") {
        return (
            <div className="mx-auto w-full max-w-md">
                <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
                    <input
                        type="text"
                        name="website"
                        value={honeypot}
                        onChange={(e) => setHoneypot(e.target.value)}
                        tabIndex={-1}
                        autoComplete="off"
                        style={{
                            position: "absolute",
                            left: "-9999px",
                            width: "1px",
                            height: "1px",
                            opacity: 0,
                        }}
                        aria-hidden="true"
                    />

                    <div className="relative flex-1">
                        <label htmlFor="email-compact" className="sr-only">
                            Email address
                        </label>
                        <Icon
                            icon="mdi:email-outline"
                            className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            id="email-compact"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            disabled={status === "loading" || status === "success"}
                            className="w-full rounded-full border-2 border-slate-300 bg-white py-3 pr-4 pl-12 text-slate-900 transition-all placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                            aria-describedby={
                                status === "success" || status === "error"
                                    ? "form-message"
                                    : undefined
                            }
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={status === "loading" || status === "success"}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-8 py-3 font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label={
                            status === "loading" ? "Subscribing..." : "Subscribe to mailing list"
                        }
                    >
                        {status === "loading" ? (
                            <>
                                <Icon icon="mdi:loading" className="h-5 w-5 animate-spin" />
                                Subscribing...
                            </>
                        ) : status === "success" ? (
                            <>
                                <Icon icon="mdi:check-circle" className="h-5 w-5" />
                                Subscribed!
                            </>
                        ) : (
                            <>
                                Subscribe
                                <Icon icon="mdi:arrow-right" className="h-5 w-5" />
                            </>
                        )}
                    </button>
                </form>

                {message && (
                    <div
                        id="form-message"
                        className={`mt-3 flex items-start gap-2 rounded-lg p-3 ${
                            status === "success"
                                ? "bg-green-50 text-green-800"
                                : "bg-red-50 text-red-800"
                        }`}
                        role={status === "error" ? "alert" : "status"}
                        aria-live="polite"
                    >
                        <Icon
                            icon={status === "success" ? "mdi:check-circle" : "mdi:alert-circle"}
                            className="mt-0.5 h-5 w-5 shrink-0"
                        />
                        <p className="text-sm font-medium">{message}</p>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="w-full max-w-lg">
            <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-lg">
                <input
                    type="text"
                    name="website"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                    style={{
                        position: "absolute",
                        left: "-9999px",
                        width: "1px",
                        height: "1px",
                        opacity: 0,
                    }}
                    aria-hidden="true"
                />

                <div className="mb-4">
                    <label
                        htmlFor="name-default"
                        className="mb-2 block text-sm font-semibold text-slate-900"
                    >
                        Name (optional)
                    </label>
                    <div className="relative">
                        <Icon
                            icon="mdi:account-outline"
                            className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            id="name-default"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your name"
                            disabled={status === "loading" || status === "success"}
                            className="w-full rounded-xl border-2 border-slate-300 bg-white py-3 pr-4 pl-12 text-slate-900 transition-all placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                        />
                    </div>
                </div>

                <div className="mb-4">
                    <label
                        htmlFor="email-default"
                        className="mb-2 block text-sm font-semibold text-slate-900"
                    >
                        Email address
                    </label>
                    <div className="relative">
                        <Icon
                            icon="mdi:email-outline"
                            className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            id="email-default"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            disabled={status === "loading" || status === "success"}
                            className="w-full rounded-xl border-2 border-slate-300 bg-white py-3 pr-4 pl-12 text-slate-900 transition-all placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                            aria-describedby={
                                status === "success" || status === "error"
                                    ? "form-message-default"
                                    : undefined
                            }
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={status === "loading" || status === "success"}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label={
                        status === "loading" ? "Subscribing..." : "Subscribe to mailing list"
                    }
                >
                    {status === "loading" ? (
                        <>
                            <Icon icon="mdi:loading" className="h-5 w-5 animate-spin" />
                            Subscribing...
                        </>
                    ) : status === "success" ? (
                        <>
                            <Icon icon="mdi:check-circle" className="h-5 w-5" />
                            Subscribed!
                        </>
                    ) : (
                        <>
                            Get launch updates
                            <Icon icon="mdi:arrow-right" className="h-5 w-5" />
                        </>
                    )}
                </button>

                {message && (
                    <div
                        id="form-message-default"
                        className={`mt-4 flex items-start gap-2 rounded-lg p-3 ${
                            status === "success"
                                ? "bg-green-50 text-green-800"
                                : "bg-red-50 text-red-800"
                        }`}
                        role={status === "error" ? "alert" : "status"}
                        aria-live="polite"
                    >
                        <Icon
                            icon={status === "success" ? "mdi:check-circle" : "mdi:alert-circle"}
                            className="mt-0.5 h-5 w-5 shrink-0"
                        />
                        <p className="text-sm font-medium">{message}</p>
                    </div>
                )}

                <p className="mt-4 text-center text-xs text-slate-500">
                    We&apos;ll only send you launch announcements and product updates. No spam,
                    ever.
                </p>
            </form>
        </div>
    )
}
