import nextVitals from "eslint-config-next/core-web-vitals"
import nextTypescript from "eslint-config-next/typescript"
import { defineConfig } from "eslint/config"

export default defineConfig([
    ...nextVitals,
    ...nextTypescript,
    {
        ignores: [
            "node_modules/**",
            ".next/**",
            "out/**",
            "build/**",
            "next-env.d.ts",
            "convex/_generated/**",
        ],
    },
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
            },
        },
    },
    {
        rules: {
            "@typescript-eslint/no-deprecated": "warn",
        },
    },
])
