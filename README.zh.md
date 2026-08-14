# DeepSeek Harness

English | [中文](README.md)

<div align="center">
  <h3>A composable agent runtime where everything is a plugin.</h3>
  <p>Web UI · CLI · Cordis composition · extensible developer surface</p>
  <p>
    <a href="#download">Download for Windows</a> ·
    <a href="#source-map">Explore the source</a> ·
    <a href="#developer-quickstart">Build from source</a>
  </p>
</div>

> DeepSeek Harness (`dsh`) is an open-source agent harness developed by [DeepSeek AI](https://deepseek.com). It is currently a **developer preview**: interfaces, package layouts, profiles, and on-disk data may change without a compatibility guarantee.

## What you get

DeepSeek Harness separates the desktop experience from the runtime that powers it. The Windows desktop build is an Electron shell around the same `dsh web` profile that developers can run from the CLI and inspect in this repository.

| Layer | What it provides |
| --- | --- |
| Electron desktop shell | A sandboxed BrowserWindow, local harness lifecycle, safe external-link handling, and a ready-to-run Windows application. |
| DeepSeek Harness runtime | Sessions, models, tools, permissions, persistence, profiles, subagents, workflows, and the agent loop. |
| Web UI | The browser surface for sessions, settings, models, workspaces, plugin inventory, tools, plans, goals, and other runtime projections. |
| Plugin ecosystem | Cordis bundles, profile patch layers, host plugins, and `dsh.client` browser plugins that can be composed, replaced, or extended. |
| CLI | Profile boot, `web`, `headless`, configuration dumps, patch overlays, and profile plugin management. |

The product follows an explicit rule: **everything is a plugin**. The runtime is assembled from ordered Cordis layers, so the desktop app is not a separate feature fork of the harness.

## Download

### Windows x64 desktop build

The public binary distribution currently provides **Windows x64 only**. Download the ZIP from the latest GitHub Release, extract it, and run `dsh.exe`.

<a href="https://github.com/deepseek-ai/deepseek-harness/releases/latest"><strong>Download the latest Windows ZIP</strong></a>

Each release ZIP contains the complete desktop application and its embedded harness runtime. No separate Node.js or pnpm installation is required to run the extracted desktop build.

> The public download is a ZIP containing `dsh.exe`, not a source archive. The source tree below is the editable developer distribution.

### First launch

1. Extract the downloaded ZIP to a directory you control.
2. Start `dsh.exe`.
3. Configure the model provider and API credentials in the Web UI settings.
4. Sessions, settings, credentials, and profiles are stored under the harness home. Do not place real credentials in the repository or commit them to Git.

## Source map

The repository intentionally includes the Electron shell, the Web UI entry, the CLI, and the plugin packages that make the desktop build work. Start with the path that matches the change you want to understand.

| If you want to inspect... | Start here |
| --- | --- |
| Electron main process | [`apps/electron/src/main.ts`](apps/electron/src/main.ts) |
| Electron packaging and harness staging | [`apps/electron/electron-builder.yml`](apps/electron/electron-builder.yml), [`apps/electron/scripts/pack-harness.mjs`](apps/electron/scripts/pack-harness.mjs), [`apps/electron/scripts/after-pack.mjs`](apps/electron/scripts/after-pack.mjs) |
| Web UI entry and browser bundling | [`apps/web`](apps/web), [`packages/client/web`](packages/client/web), [`packages/client/web-react`](packages/client/web-react) |
| Browser plugin loading and `dsh.client` | [`packages/client/modules`](packages/client/modules), [`packages/client/runtime`](packages/client/runtime) |
| Host API, RPC, HTTP, and event streams | [`packages/host`](packages/host), [`packages/api`](packages/api) |
| CLI dispatch and profiles | [`apps/cli`](apps/cli), [`packages/boot/app-boot`](packages/boot/app-boot) |
| Built-in bundles and profile composition | [`packages/bundle`](packages/bundle) |
| Tools, models, sessions, permissions, and agent loop | [`packages/core`](packages/core), [`packages/llm`](packages/llm), [`packages/interaction`](packages/interaction), [`packages/session`](packages/session) |

## Run

### Run from source

The source Web UI is served locally by the `dsh web` profile.

### Run the Web UI from source

Requirements: Node.js `^22.19.0 || >=24.0.0` and pnpm `11.7.0`.

```sh
git clone https://github.com/deepseek-ai/deepseek-harness.git
cd deepseek-harness
pnpm install
pnpm run build
pnpm dsh web
```

The source Web UI is served locally by the `dsh web` profile. For client-plugin development, run the source launcher together with the client bundle watcher (`pnpm run dev:web`).

### Run the Electron shell from source

```sh
pnpm install
pnpm --filter @deepseek-ai/dsh-electron dev
```

The Electron shell starts a local harness child process and opens the Web UI only after the loopback HTTP server is ready. The renderer runs with `sandbox`, `contextIsolation`, and `nodeIntegration: false`.

### Build the Windows ZIP

```sh
pnpm run build
pnpm --filter @deepseek-ai/dsh-electron run package:harness
pnpm --filter @deepseek-ai/dsh-electron exec electron-builder --win zip --x64
```

The local output is written to `apps/electron/release/`. The public release workflow builds the same Windows x64 ZIP from a `dsh-v*` tag and uploads it to GitHub Releases together with `SHA256SUMS.txt`.

### Check the runtime

```sh
pnpm run typecheck
pnpm run test
pnpm --filter @deepseek-ai/dsh-electron typecheck
```

Use the smallest relevant check for a change. The repository's full gates and platform policy are documented in [`CLAUDE.md`](CLAUDE.md).

## Plugin ecosystem

A profile is an ordered composition of bundles and patch layers. A bundle contributes Cordis configuration rows; later layers can replace or insert rows without modifying the bundle itself. Browser plugins declare a `dsh.client` entry and are loaded through the Web UI module system rather than being hard-coded into the main shell bundle.

Community plugins can use the [`dsh-plugin`](https://github.com/topics/dsh-plugin) topic for discoverability.

## Community and support

- Report bugs and discuss product behavior in [GitHub Discussions](https://github.com/deepseek-ai/deepseek-harness/discussions).
- Read [`CONTRIBUTING.md`](CONTRIBUTING.md) before proposing repository changes.
- Join the [DeepSeek Harness Discord community](https://discord.gg/Ycq5dCaS4).

## Security and trust

The desktop build runs the harness as a local child process and keeps the renderer isolated from Node.js. Third-party Cordis bundles and plugins are executable code: install only packages you trust, review their configuration, and do not expose a profile or Web server beyond the intended network scope.

Never commit API keys, credential files, session data, or local storage. See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) for dependency notices and licenses.

## License

[MIT](LICENSE)
