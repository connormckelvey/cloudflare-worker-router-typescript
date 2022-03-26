import { RouterRequest, RouterResponse, RouterHandler } from './types.js'

export class Router {
    private routes: Route[] = []
    private middleware: RouterHandler[] = []

    use(...handlers: RouterHandler[]) {
        this.middleware.push(...handlers)
        return this
    }

    connect(url: string, ...handlers: RouterHandler[]) {
        return this.register('CONNECT', url, handlers)
    }

    delete(url: string, ...handlers: RouterHandler[]) {
        return this.register('DELETE', url, handlers)
    }

    get(url: string, ...handlers: RouterHandler[]) {
        return this.register('GET', url, handlers)
    }

    head(url: string, ...handlers: RouterHandler[]) {
        return this.register('HEAD', url, handlers)
    }

    options(url: string, ...handlers: RouterHandler[]) {
        return this.register('OPTIONS', url, handlers)
    }

    patch(url: string, ...handlers: RouterHandler[]) {
        return this.register('PATCH', url, handlers)
    }

    post(url: string, ...handlers: RouterHandler[]) {
        return this.register('POST', url, handlers)
    }

    put(url: string, ...handlers: RouterHandler[]) {
        return this.register('PUT', url, handlers)
    }

    trace(url: string, ...handlers: RouterHandler[]) {
        return this.register('TRACE', url, handlers)
    }

    any(url: string, ...handlers: RouterHandler[]) {
        return this.register('*', url, handlers)
    }

    async handle<E>(request: Request, env?: E, ctx?: ExecutionContext) {
        try {
            const req: RouterRequest<E> = {
                request,
                headers: request.headers,
                method: request.method,
                params: {},
                query: {},
                body: {},
                env: env,
                ctx: ctx
            }

            const route = this.getRoute(req)
            if (!route) {
                return new Response(null, {
                    status: 404
                })
            }

            const res: RouterResponse = {
                headers: {}
            }

            const handler = this.compose([...this.middleware, ...route.handlers])
            await handler(req, res)

            if (typeof res.body === 'object') {
                res.body = JSON.stringify(res.body)
            }

            if (res.response) {
                return res.response
            }

            return new Response(res.body, {
                status: res.status || (res.body ? 200 : 204),
                headers: res.headers,
                webSocket: res.webSocket,
            })
        } catch (err) {
            console.error(err)
            return new Response(null, { status: 500 })
        }
    }

    private register(method: string, url: string, handlers: RouterHandler[]) {
        this.routes.push(new Route(
            method,
            url,
            handlers
        ))
        return this
    }

    private getRoute(req: RouterRequest) {
        return this.routes.find(r => {
            try {
                const params = r.match(req)
                req.params = params
                return true
            } catch (e) {
                return false
            }
        })
    }

    private compose(handlers: RouterHandler[]) {
        const runner = async (req: RouterRequest, res: RouterResponse, prevIndex: number = -1, index: number = 0) => {
            if (index === prevIndex) {
                throw new Error('next() called multiple times')
            }
            if (typeof handlers[index] === 'function') {
                await handlers[index](req, res, async () => {
                    await runner(req, res, index, index + 1)
                })
            }
        }
        return runner
    }
}


export class Route {
    constructor(readonly method: string, readonly url: string, readonly handlers: RouterHandler[]) { }

    match(req: RouterRequest) {
        if (![req.method, '*'].includes(this.method)) {
            throw new Error("methods don't match")
        }

        const url = new URL(req.request.url)

        const pathParts = url.pathname.split('/').filter(i => i)
        const routeParts = this.url.split('/').filter(i => i)
        if (routeParts.length !== pathParts.length) {
            throw new Error("url pattern doesn't match")
        }

        return routeParts.reduce((params, part, i) => {
            if (part !== pathParts[i] && part[0] !== ':') {
                throw new Error("url pattern doesn't match")
            }
            if (part[0] === ':') {
                return {
                    ...params,
                    [routeParts[i].substring(1)]: pathParts[i]
                }
            }
            return params
        }, {})
    }
}