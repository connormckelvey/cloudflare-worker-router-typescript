import { RouterHandler } from "../types";

export const queryParser: RouterHandler = async (req, res, next) => {
    const url = new URL(req.request.url)
    req.query = Array.from(url.searchParams.entries())
        .reduce((query, [key, value]) => {
            return {
                ...query,
                [key]: value
            }
        }, {})
        
    await next()
}