/**
 * electron-builder afterPack hook: stage the deployed harness under
 * resources/harness.
 *
 * extraResources cannot be used for this tree: electron-builder's file
 * matcher drops node_modules from extraResources copies, and the harness is
 * useless without its dependency closure. Copying in afterPack is
 * deterministic — no matcher involvement.
 */
import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'

const HARNESS_EXCLUDED_DIRECTORIES = new Set(['__tests__', 'coverage', 'test', 'tests'])
const HARNESS_EXCLUDED_EXTENSIONS = new Set(['.map', '.pdb'])

/**
 * Keep only files needed to run the deployed CLI closure from Electron.
 * @param src - The source path electron-builder is about to copy.
 * @returns false for debug artifacts and package test payloads that never
 * participate in package export resolution at runtime.
 */
export function shouldCopyHarnessResource(src) {
  const leaf = basename(src).toLowerCase()
  if (HARNESS_EXCLUDED_EXTENSIONS.has(leaf.slice(leaf.lastIndexOf('.')))) return false
  return !src.split(/[\\/]+/).some(part => HARNESS_EXCLUDED_DIRECTORIES.has(part.toLowerCase()))
}

/** @param {import('electron-builder').AfterPackContext} context */
export default async function afterPack(context) {
  const { appOutDir } = context
  const repoRoot = resolve(import.meta.dirname, '..', '..', '..')
  const harnessSource = join(repoRoot, 'deploy', 'dsh')
  const harnessTarget = join(appOutDir, 'resources', 'harness')
  if (!existsSync(harnessSource)) {
    throw new Error(`after-pack: harness staging missing at ${harnessSource}; run pnpm run package:harness first`)
  }
  mkdirSync(harnessTarget, { recursive: true })
  cpSync(harnessSource, harnessTarget, {
    recursive: true,
    filter: shouldCopyHarnessResource,
  })
  // The composition overlay the Electron main passes to `dsh web --patch`.
  const configTarget = join(appOutDir, 'resources', 'config')
  mkdirSync(configTarget, { recursive: true })
  cpSync(join(import.meta.dirname, '..', 'config', 'picker-browse.patch.yml'), join(configTarget, 'picker-browse.patch.yml'))
  console.log(`after-pack: staged harness -> ${harnessTarget} and overlays -> ${configTarget}`)
}
