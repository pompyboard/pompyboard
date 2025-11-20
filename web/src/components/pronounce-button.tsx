"use client"

import { Icon } from "@iconify/react"

export default function PronounceButton() {
    const play = () => new Audio("/wonkle.mp3").play()
    return (
        <button
            type="button"
            onClick={play}
            className="cursor-pointer rounded px-2 py-1"
        >
            <Icon
                icon="fluent:speaker-2-32-regular"
                className="inline-block h-5 w-5"
            />
        </button>
    )
}
