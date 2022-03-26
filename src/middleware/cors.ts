import { RouterHandler } from '../types.js'

export type RouterCorsConfig = {
    allowOrigin?: string
    allowMethods?: string
    allowHeaders?: string
    maxAge?: number
    optionsSuccessStatus?: number
}

export const cors = (config: RouterCorsConfig): RouterHandler => {
    const corsHeaders: HeadersInit = {
        'Access-Control-Allow-Origin': config.allowOrigin || '*',
        'Access-Control-Allow-Methods': config.allowMethods || '*',
        'Access-Control-Allow-Headers': config.allowHeaders || '*, Authorization',
        'Access-Control-Max-Age': `${config.maxAge || 86400}`
    }

    return async (req, res, next) => {
        if (req.method === 'OPTIONS') {
            res.response = new Response(null, {
                headers: corsHeaders,
                status: config.optionsSuccessStatus
            })
            return
        }

        await next()
        res.headers = {
            ...res.headers,
            ...corsHeaders,
        }
    }
}