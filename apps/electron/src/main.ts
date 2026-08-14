/**
 * dsh Electron shell: boots the dsh web profile in a child harness process
 * and hosts the GUI in a BrowserWindow.
 *
 * Dev mode (`pnpm dev`): spawns `pnpm dsh web --port <n>` from the repository
 * root, so the source tree runs through tsx with no build step.
 * Packaged mode: runs the staged harness CLI with `ELECTRON_RUN_AS_NODE=1`,
 * which makes the Electron binary behave as a plain Node runtime for the
 * child process (no separate Node install needed).
 *
 * The harness picks its own loopback port before the window opens; the window
 * is created only after the harness answers HTTP. Quitting kills the harness
 * process tree.
 */
import { spawn, spawnSync, type ChildProcess } from 'node:child_process'
import { createServer } from 'node:net'
import { join, resolve } from 'node:path'
import { app, BrowserWindow, dialog, Menu, shell } from 'electron'

/** Repository root in dev mode: two levels up from this app directory. */
const REPO_ROOT = resolve(join(app.getAppPath(), '..', '..'))

/** Window title and NSIS start-menu identity. */
const PRODUCT_NAME = 'dsh'

/** How long the window waits for the harness to answer HTTP before failing. */
const READY_TIMEOUT_MS = 90_000

/**
 * The overlay pinned on top of the web profile's bundles: replaces the
 * adaptive directory picker (which would choose the native folder dialog on
 * win32) with the in-app directory browser, so the packaged shell never
 * spawns the native dialog worker.
 */
const PICKER_PATCH = 'picker-browse.patch.yml'

let child: ChildProcess | undefined
let window: BrowserWindow | undefined
let quitting = false

/** Bind a throwaway listener to let the OS hand out a free loopback port. */
function pickFreePort(): Promise<number> {
  return new Promise<number>((resolvePort, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      server.close(() => {
        if (address !== null && typeof address === 'object') resolvePort(address.port)
        else reject(new Error(`${PRODUCT_NAME}: could not pick a free port`))
      })
    })
  })
}

/** The harness launch command for the current mode. */
function harnessLaunch(port: number): { command: string; args: string[]; cwd?: string } {
  if (app.isPackaged) {
    return {
      command: process.execPath,
      // --expose-internals: the HMR service and the Loader's internal module
      // loader require node:internal access; the native fallback
      // (node-addon-require-builtin) targets the ABI of the Node it was built
      // under, which Electron's embedded Node may not match. The flag makes
      // the loader independent of that addon.
      args: [
        '--expose-internals',
        join(process.resourcesPath, 'harness', 'lib', 'bin.js'),
        'web',
        '--patch', join(process.resourcesPath, 'config', PICKER_PATCH),
        '--port', String(port),
      ],
      // A desktop app's natural working directory: relative fs/shell defaults
      // and the <cwd>/.env credentials layer resolve like a CLI run from home.
      cwd: app.getPath('home'),
    }
  }
  return {
    command: process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
    args: ['dsh', 'web', '--patch', join(app.getAppPath(), 'config', PICKER_PATCH), '--port', String(port)],
    cwd: REPO_ROOT,
  }
}

/** Spawn the harness and pipe its output to this process's console. */
function spawnHarness(port: number): ChildProcess {
  const { command, args, cwd } = harnessLaunch(port)
  const env: NodeJS.ProcessEnv = { ...process.env }
  if (app.isPackaged) env.ELECTRON_RUN_AS_NODE = '1'
  const proc = spawn(command, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true })
  proc.stdout.on('data', (chunk: Buffer) => {
    for (const line of chunk.toString().split('\n')) if (line.length > 0) console.log(`[dsh] ${line}`)
  })
  proc.stderr.on('data', (chunk: Buffer) => {
    for (const line of chunk.toString().split('\n')) if (line.length > 0) console.error(`[dsh] ${line}`)
  })
  proc.on('error', (error) => {
    if (quitting) return
    dialog.showErrorBox(`${PRODUCT_NAME} could not start`, `${command} failed to spawn: ${error.message}`)
    app.quit()
  })
  proc.on('exit', (code, signal) => {
    if (quitting) return
    dialog.showErrorBox(`${PRODUCT_NAME} harness exited`, `The harness process stopped unexpectedly (code ${code ?? 'null'}, signal ${signal ?? 'none'}).`)
    app.quit()
  })
  return proc
}

/** Poll the harness until the SPA answers, or throw after the timeout. */
async function waitForHarness(port: number): Promise<void> {
  const deadline = Date.now() + READY_TIMEOUT_MS
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/`)
      if (response.ok) return
    } catch {
      // Not up yet; the webserver binds only after boot completes.
    }
    await new Promise((resolveWake) => { setTimeout(resolveWake, 250) })
  }
  throw new Error(`${PRODUCT_NAME}: harness did not answer on port ${port} within ${READY_TIMEOUT_MS}ms`)
}

/** Terminate the harness process tree; Windows needs taskkill for grandchildren. */
function stopHarness(): void {
  if (child === undefined || child.killed) return
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true })
    return
  }
  child.kill('SIGTERM')
  setTimeout(() => { child?.kill('SIGKILL') }, 3_000).unref()
}

/** Create the window pinned to the harness origin. */
function createWindow(port: number): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 600,
    autoHideMenuBar: true,
    backgroundColor: '#1b1b1f',
    title: PRODUCT_NAME,
    // Packaged builds embed the icon into the exe; dev runs read the repo icon.
    ...(app.isPackaged ? {} : { icon: join(REPO_ROOT, 'black_deepseek.ico') }),
    webPreferences: {
      // The renderer is the harness's own SPA: no Node access, isolated
      // context, and the OS sandbox — the default Electron posture, stated
      // explicitly as the shell's contract.
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  const origin = `http://127.0.0.1:${port}`
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(origin)) return { action: 'allow' }
    void shell.openExternal(url)
    return { action: 'deny' }
  })
  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(origin)) event.preventDefault()
  })
  return win
}

async function main(): Promise<void> {
  const port = await pickFreePort()
  child = spawnHarness(port)
  try {
    await waitForHarness(port)
  } catch (error) {
    dialog.showErrorBox(`${PRODUCT_NAME} failed to start`, error instanceof Error ? error.message : String(error))
    app.quit()
    return
  }
  window = createWindow(port)
  await window.loadURL(`http://127.0.0.1:${port}`)
}

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (window !== undefined && !window.isDestroyed()) {
      if (window.isMinimized()) window.restore()
      window.focus()
    }
  })
  app.setAppUserModelId('ai.deepseek.dsh')
  // The harness UI owns its chrome; the default File/Edit/View/Window menu
  // only adds noise on Windows/Linux. macOS keeps its standard menu bar,
  // where the pattern is expected and the shortcuts belong there.
  if (process.platform !== 'darwin') Menu.setApplicationMenu(null)
  app.on('before-quit', () => {
    quitting = true
    stopHarness()
  })
  app.on('window-all-closed', () => {
    app.quit()
  })
  void app.whenReady().then(() => {
    void main().catch((error: unknown) => {
      dialog.showErrorBox(`${PRODUCT_NAME} failed to start`, error instanceof Error ? error.message : String(error))
      app.quit()
    })
  })
}
