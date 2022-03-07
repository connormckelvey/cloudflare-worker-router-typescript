import cloudflareRunner from '../test/index.js'
import { LocalRunner } from 'start-testing-cloudflare/dist/local/runner.js'
import { WranglerDev } from 'cloudflare-wrangler-dev'
import * as path from 'path'

async function runTest() {
    const wrangler = new WranglerDev({
        spawn: {
            cwd: path.join(process.cwd(), 'test')
        }
    })
    await wrangler.start()
    const numFailed = await new LocalRunner('tests', cloudflareRunner).runSuite()
    await wrangler.stop()
    process.exit(numFailed)
}

runTest()

