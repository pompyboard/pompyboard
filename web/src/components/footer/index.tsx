import { Icon } from "@iconify/react"
import Link from "next/link"

import PronounceButton from "./pronounce-button"

export default function Footer() {
    return (
        <footer className="border-t border-slate-200 bg-slate-50 px-4 py-12">
            <div className="mx-auto max-w-6xl">
                <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
                    {/* Brand and Attribution */}
                    <div className="text-center md:text-left">
                        <p className="text-sm text-slate-600">
                            Wonkle • /ˈwɑːŋkəl/
                            <PronounceButton />
                        </p>
                        <p className="text-sm text-slate-600">Made with ❤️ by gamers</p>
                    </div>

                    {/* Social Links */}
                    <div className="flex items-center gap-4">
                        <Link
                            title="Join our Discord community"
                            href="https://discord.com/invite/h27rwcBn73"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm transition-all hover:bg-[#5865F2] hover:text-white hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5865F2]"
                            aria-label="Discord"
                        >
                            <Icon icon="simple-icons:discord" className="h-6 w-6" />
                        </Link>
                        <Link
                            title="Support us on Open Collective"
                            href="https://opencollective.com/wonkle"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm transition-all hover:bg-[#7FADF2] hover:text-white hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7FADF2]"
                            aria-label="Open Collective"
                        >
                            <Icon icon="simple-icons:opencollective" className="h-5 w-5" />
                        </Link>
                        <Link
                            title="Follow us on BlueSky"
                            href="https://bsky.app/profile/wonkle.io"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm transition-all hover:bg-[#1185FE] hover:text-white hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7FADF2]"
                            aria-label="BlueSky"
                        >
                            <Icon icon="simple-icons:bluesky" className="h-5 w-5" />
                        </Link>
                        <Link
                            title="View source code on GitHub"
                            href="https://github.com/wonkleio/wonkle"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm transition-all hover:bg-slate-900 hover:text-white hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                            aria-label="GitHub"
                        >
                            <Icon icon="simple-icons:github" className="h-6 w-6" />
                        </Link>
                        <Link
                            title="Send us an email"
                            href="mailto:pompydev@proton.me"
                            className="group flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm transition-all hover:bg-[#6D4AFF] hover:text-white hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6D4AFF]"
                            aria-label="Email"
                        >
                            <Icon icon="simple-icons:protonmail" className="h-6 w-6" />
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
