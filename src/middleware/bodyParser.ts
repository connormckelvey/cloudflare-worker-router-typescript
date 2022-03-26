import { RouterHandler } from '../types.js'

export const bodyParser: RouterHandler = async (req, res, next) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        if (req.headers.has('Content-Type') && req.headers.get('Content-Type')!.includes('json')) {
            try {
                req.body = await req.request.json()
            } catch {
                req.body = {}
            }
        } else {
            try {
                req.body = await req.request.text()
            } catch {
                req.body = ''
            }
        }
    }
    await next()

    if (typeof res.body === 'object') {                
        if (!res.headers['Content-Type']) {
            res.headers['Content-Type'] = 'application/json'
        }
        res.body = JSON.stringify(res.body)
    }
}