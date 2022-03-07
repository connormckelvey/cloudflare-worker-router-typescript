
import { build } from 'esbuild'
import glob from 'glob'
import * as fs from 'fs'

fs.rmSync("./test/dist", { recursive: true, force: true })

const entryPoints = glob.sync('./test/index.ts')

build({
  preserveSymlinks: false,
  treeShaking: true,
  entryPoints,
  bundle: true,
  target: 'es2020',
  outbase: './test',
  outdir: './test/dist' ,
  platform: 'browser',
  format: "esm",
  sourcemap: true,
  outExtension: {
      '.js': '.mjs'
  },
  external: [],
  watch: false,
})