/**
 * Stage the dsh harness for electron-builder.
 *
 * 1. Ensure the web frontend dist exists (the harness serves it; built by
 *    `pnpm run build:web` from the repository root).
 * 2. Ensure the dsh CLI is compiled (apps/cli/lib; built by `pnpm run
 *    build:lib`).
 * 3. `pnpm deploy` the dsh package with its production dependency closure
 *    into ../../deploy/dsh — a standalone node_modules tree with no
 *    workspace symlinks, which electron-builder ships as resources/harness.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'

/** Windows ships pnpm as a .cmd shim; plain spawn cannot resolve it, so run through the shell. */
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const spawnOptions = { shell: true }

const root = resolve(import.meta.dirname, '..', '..', '..')
const distIndex = resolve(root, 'apps', 'web', 'dist', 'index.html')
const cliBin = resolve(root, 'apps', 'cli', 'lib', 'bin.js')

if (!existsSync(distIndex)) {
  console.log('pack-harness: building the web frontend dist (pnpm run build:web)')
  execFileSync(pnpm, ['--filter', '@deepseek-ai/dsh-web-frontend', 'run', 'build'], { ...spawnOptions, cwd: root, stdio: 'inherit' })
}
if (!existsSync(cliBin)) {
  console.log('pack-harness: building the dsh CLI lib (pnpm run build:lib)')
  execFileSync(pnpm, ['run', 'build:lib'], { ...spawnOptions, cwd: root, stdio: 'inherit' })
}
// pnpm deploy refuses a non-empty target, so a stale tree blocks rebuilds.
const target = resolve(root, 'deploy', 'dsh')
rmSync(target, { recursive: true, force: true })
console.log('pack-harness: deploying the dsh CLI production closure')
execFileSync(pnpm, ['--filter', '@deepseek-ai/dsh', 'deploy', '--prod', '--legacy', target], { ...spawnOptions, cwd: root, stdio: 'inherit' })
console.log('pack-harness: staged harness at deploy/dsh')
