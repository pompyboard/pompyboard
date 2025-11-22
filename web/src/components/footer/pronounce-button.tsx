"use client"

import { Icon } from "@iconify/react"
import { useRef } from "react"

// https://github.com/wonkleio/wonkle/pull/29
export default function PronounceButton() {
    const audioRef = useRef<HTMLAudioElement>(null)

    return (
        <>
            <button
                className="cursor-pointer rounded px-2 py-1"
                onClick={() => audioRef.current?.play()}
            >
                <Icon
                    icon="mdi:speakerphone"
                    className="inline-block h-5 w-5"
                />
            </button>
            <audio ref={audioRef} src="/wonkle.mp3" className="hidden" />
        </>
    )
}
