import { CloudflareRunner } from 'start-testing-cloudflare/dist/cloudflare/index.js'
import * as routerTests from '../src/router.test.js'

const tests = {
    ...routerTests,
}

export default new CloudflareRunner('cloudflare tests', tests)

