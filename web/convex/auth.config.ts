import { env } from "../src/env"

// Auth configuration for Convex Auth
// This file configures the authentication providers for the application
// Currently using Password provider configured in auth.ts

const authConfig = {
    providers: [
        {
            domain: env.CONVEX_SITE_URL,
            applicationID: "convex",
        },
    ],
}

export default authConfig
