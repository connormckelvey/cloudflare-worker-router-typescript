import { RouterHandler } from "../types.js"

export const debugMode = (enabled = true): RouterHandler => async (req, res, next) => {
    try {
        await next()
    } catch (e) {
        res.response = new Response(enabled ? e.stack : '', { status: 500 })
    }
}