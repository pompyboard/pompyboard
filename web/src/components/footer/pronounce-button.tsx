"use client"

import { Icon } from "@iconify/react"

export default function PronounceButton() {
    // See https://github.com/wonkleio/wonkle/pull/29
    return (
        <button
            onClick={() => new Audio("/wonkle.mp3").play()}
            className="cursor-pointer rounded px-2 py-1"
        >
            <Icon icon="mdi:speakerphone" className="inline-block h-5 w-5" />
        </button>
    )
}
