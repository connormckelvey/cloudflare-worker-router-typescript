import * as testing from 'start-testing'
import { chaiAssert } from 'start-testing/dist/extra/testUtils.js'
import { bodyParser } from './middleware/bodyParser.js'
import { queryParser } from './middleware/queryParser.js'

import { Route, Router } from './router.js'
import { RouterHandler, RouterRequest, RouterResponse } from './types.js'

type TestResponse = {
    pathname: string
    method: string
    body: any
}

type HandlerRegister = (url: string, ...handlers: RouterHandler[]) => void
type HandlerRegisterFactory = (router: Router) => HandlerRegister

export async function testHttpMethodHandlers(t: testing.Context) {
    const tests: { method: keyof Router, register: HandlerRegisterFactory, body?: any }[] = [
        // { method: 'connect', register: r => r.connect },
        { method: 'delete', register: r => r.delete },
        { method: 'get', register: r => r.get },
        { method: 'head', register: r => r.head },
        { method: 'options', register: r => r.options },
        // { method: 'patch', register: r => r.patch },
        { method: 'post', register: r => r.post },
        { method: 'put', register: r => r.put },
        // { method: 'trace', register: r => r.trace },
        // { method: 'any', register: r => r.any }
    ]

    await Promise.all(tests.map(async test => {
        t.run(test.method, async (t) => {
            const assert = chaiAssert(t)
            const router = new Router()
            const register: HandlerRegister = test.register(router).bind(router)

            register(`/${test.method}`, async (req: RouterRequest, res: RouterResponse) => {
                const { pathname } = new URL(req.request.url)
                const method = req.method.toLowerCase()

                res.status = 200
                res.body = {
                    pathname,
                    method,
                }
            })

            const req = new Request(`http://127.0.0.1/${test.method}`, {
                method: test.method.toUpperCase(),
            })

            const res = await router.handle(req)
            assert.equal(res.status, 200)

            const body = await res.json<TestResponse>()
            assert.equal(body.pathname, `/${test.method}`)
            assert.equal(body.method, test.method)
            if (test.body) {
                assert.deepEqual(body.body, test.body)
            }
        })
    }))
}

export async function testMiddlewareBodyParser(t: testing.Context) {
    const assert = chaiAssert(t)
    const router = new Router()
    router.use(bodyParser)

    router.post('/middleware', async (req, res) => {
        assert.deepEqual(req.body, { foo: 'bar' })
        res.status = 200
    })

    const req = new Request(`http://127.0.0.1/middleware`, {
        method: 'post',
        headers: new Headers({
            'Content-Type': 'application/json'
        }),
        body: JSON.stringify({ foo: 'bar' })
    })

    const res = await router.handle(req)
    assert.equal(res.status, 200)
}

export async function testMiddlewareQueryParser(t: testing.Context) {
    const assert = chaiAssert(t)
    const router = new Router()
    router.use(queryParser)

    router.post('/middleware', async (req, res) => {
        assert.equal(req.query.foo, 'bar')
        res.status = 200
    })

    const req = new Request(`http://127.0.0.1/middleware?foo=bar`, {
        method: 'post'
    })

    const res = await router.handle(req)
    assert.equal(res.status, 200)
}

export async function testCustomMiddleware(t: testing.Context) {
    const tests = [
        { name: 'fail', headers: null, expectedCode: 403 },
        { name: 'pass', headers: { 'X-Auth-Token': 'secret' }, expectedCode: 200 }
    ]

    await Promise.all(tests.map((test) => {
        return t.run(test.name, async t => {
            const assert = chaiAssert(t)
            const router = new Router()
            router.use(async (req, res, next) => {
                const token = req.headers.get('X-Auth-Token')
                if (token !== "secret") {
                    res.status = 403
                    res.body = 'no token'
                    return
                }
                await next()
               
            })

            router.get('/secrets', (req, res) => {
                res.body = { foo: 'bar' }
                res.status = 200
            })

            const req = new Request(`http://127.0.0.1/secrets`, {
                method: 'get',
                headers: new Headers(test.headers || {})
            })

            const res = await router.handle(req)
            assert.equal(res.status, test.expectedCode)
        })
    }))
}

export async function testRouteMatch(t: testing.Context) {
    const tests = [
        { method: 'delete', route: '/foo/:id', path: '/foo/bar', pass: true, params: { id: 'bar' } },
        { method: 'get', route: '/foo/:id', path: '/foo/bar', pass: true, params: { id: 'bar' } },
        { method: 'head', route: '/foo/:id', path: '/foo/bar', pass: true, params: { id: 'bar' } },
        { method: 'options', route: '/foo/:id', path: '/foo/bar', pass: true, params: { id: 'bar' } },
        { method: 'post', route: '/foo/:id', path: '/foo/bar', pass: true, params: { id: 'bar' } },
        { method: 'get', route: '/foo/:id', path: '/foo/bar/baz', pass: false, params: {} },
    ]

    await Promise.all(tests.map(async test => {
        const name = `${test.method} ${test.path}`

        return t.run(name, async t => {
            const assert = chaiAssert(t)
            const route = new Route(test.method, test.route, [])

            try {
                const params = route.match({ 
                    request: new Request(`http://127.0.0.1:8787${test.path}`, { 
                        method: test.method 
                    }),  
                    method: test.method,
                    params: {},
                    query: {},
                    headers: new Headers({}),
                    body: null
                }) as any

                assert.deepEqual(params, test.params)
            } catch(e) {
                if (test.pass) {
                    t.error('should not be in catch block')
                    t.log(e)
                    return
                } else if (e instanceof Error) {
                    assert.include(e.message, 'url pattern doesn\'t match')
                    return
                }
                throw e
            }
        })
    }))
}