// See https://env.t3.gg/docs/nextjs
import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
    server: {},
    client: {
        NEXT_PUBLIC_CONVEX_URL: z.string().url(),
    },
    experimental__runtimeEnv: {
        NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
    },
})
