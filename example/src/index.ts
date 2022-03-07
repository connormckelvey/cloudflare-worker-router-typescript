import { Router, RouterRequest, RouterResponse } from 'cloudflare-worker-router-typescript'

const router = new Router()

interface Env {
    FOO_OBJ: DurableObjectNamespace
}

router.get('/echo/:foo/:bar', async (req: RouterRequest<Env>, res: RouterResponse) => {
    res.status = 200
    res.body = { id: req.params }
})

export default {
    async fetch(req: Request, env: Env, ctx: ExecutionContext) {
        return router.handle(req, env, ctx)
    }
}