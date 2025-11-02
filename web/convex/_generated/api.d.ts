/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */
import type {
    ApiFromModules,
    FilterApi,
    FunctionReference,
} from "convex/server"

import type * as auth from "../auth.js"
import type * as content from "../content.js"
import type * as http from "../http.js"
import type * as products from "../products.js"
import type * as seed from "../seed.js"
import type * as waitlist from "../waitlist.js"

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
    auth: typeof auth
    content: typeof content
    http: typeof http
    products: typeof products
    seed: typeof seed
    waitlist: typeof waitlist
}>
declare const fullApiWithMounts: typeof fullApi

export declare const api: FilterApi<
    typeof fullApiWithMounts,
    FunctionReference<any, "public">
>
export declare const internal: FilterApi<
    typeof fullApiWithMounts,
    FunctionReference<any, "internal">
>

export declare const components: {}
