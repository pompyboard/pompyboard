"use client"

import { Icon } from "@iconify/react"
import { OrbitControls } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import Link from "next/link"
import { useEffect, useState } from "react"
import { NearestFilter, type Texture, TextureLoader } from "three"

export default function ShopItem({
    name,
    price,
    pollingRate,
    activeArea,
    resolution,
    hoverHeight,
}: {
    name: string
    price: string
    pollingRate: string
    activeArea: string
    resolution: string
    hoverHeight: string
}) {
    const [texture, setTexture] = useState<Texture | undefined>(undefined)
    const isPro = name.includes("Pro")

    useEffect(() => {
        // Loading textures like it's 2005... it works tho lmao
        const texture_ = new TextureLoader().load(
            "/streamline-pixel--interface-essential-question-help-square.png",
        )
        texture_.magFilter = NearestFilter
        texture_.minFilter = NearestFilter
        setTexture(texture_)
    }, [])

    return (
        <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-50 to-white shadow-xl transition-all">
            <div className="relative h-72 overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-slate-50">
                {isPro && (
                    <div className="absolute top-6 right-6 z-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-bold text-white shadow-lg backdrop-blur-sm">
                        <Icon icon="mdi:star" className="mr-1 inline h-4 w-4" />
                        PRO
                    </div>
                )}

                <Canvas camera={{ position: [3, 3, 3], fov: 25 }}>
                    <ambientLight intensity={3} />
                    <OrbitControls
                        enableZoom={false}
                        rotateSpeed={0.5}
                        autoRotate
                        autoRotateSpeed={0.2}
                    />
                    <mesh>
                        <boxGeometry />
                        <meshPhongMaterial map={texture} />
                    </mesh>
                </Canvas>

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-50" />
            </div>

            <div className="p-8">
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                            {name}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                            Professional osu! tablet
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-slate-900">
                            ${price}
                        </div>
                        <div className="text-xs text-slate-500">USD</div>
                    </div>
                </div>

                <div className="mb-6 grid grid-cols-2 gap-3 *:duration-100">
                    <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 transition-colors hover:from-blue-100 hover:to-blue-200/50">
                        <div className="mb-1 flex items-center gap-2">
                            <Icon
                                icon="mdi:speedometer"
                                className="h-5 w-5 text-blue-600"
                            />
                            <span className="text-xs font-medium text-blue-900">
                                Polling Rate
                            </span>
                        </div>
                        <div className="text-xl font-bold text-blue-900">
                            {pollingRate}
                        </div>
                    </div>

                    <div className="rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 p-4 transition-colors hover:from-purple-100 hover:to-purple-200/50">
                        <div className="mb-1 flex items-center gap-2">
                            <Icon
                                icon="mdi:resize"
                                className="h-5 w-5 text-purple-600"
                            />
                            <span className="text-xs font-medium text-purple-900">
                                Active Area
                            </span>
                        </div>
                        <div className="text-xl font-bold text-purple-900">
                            {activeArea}
                        </div>
                    </div>

                    <div className="rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 p-4 transition-colors hover:from-green-100 hover:to-green-200/50">
                        <div className="mb-1 flex items-center gap-2">
                            <Icon
                                icon="mdi:grid"
                                className="h-5 w-5 text-green-600"
                            />
                            <span className="text-xs font-medium text-green-900">
                                Resolution
                            </span>
                        </div>
                        <div className="text-xl font-bold text-green-900">
                            {resolution}
                        </div>
                    </div>

                    <div className="rounded-xl bg-gradient-to-br from-orange-50 to-orange-100/50 p-4 transition-colors hover:from-orange-100 hover:to-orange-200/50">
                        <div className="mb-1 flex items-center gap-2">
                            <Icon
                                icon="mdi:arrow-expand-vertical"
                                className="h-5 w-5 text-orange-600"
                            />
                            <span className="text-xs font-medium text-orange-900">
                                Hover Height
                            </span>
                        </div>
                        <div className="text-xl font-bold text-orange-900">
                            {hoverHeight}
                        </div>
                    </div>
                </div>

                <Link
                    href={isPro ? "/shop/mk1pro" : "/shop/mk1lite"}
                    className="group/btn relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-slate-900 px-8 py-4 text-base font-semibold text-white shadow-lg transition-all duration-50 hover:scale-[1.02] hover:bg-slate-800 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                >
                    <span className="relative z-10">Learn more</span>
                    <Icon
                        icon="mdi:arrow-right"
                        className="relative z-10 h-5 w-5 transition-transform group-hover/btn:translate-x-1"
                    />

                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover/btn:translate-x-full" />
                </Link>
            </div>
        </div>
    )
}
