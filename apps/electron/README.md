# apps/electron — dsh 桌面版外壳

Electron 外壳：以子进程方式启动 dsh harness 的 web profile（`dsh web`），
在沙箱化 BrowserWindow 里承载其 Web GUI。不改动 harness 的产品代码，
GUI 本身是仓库里 `apps/web` + `packages/client/*` + `packages/host/*` 的同一套实现，
因此打包版与 CLI 版功能一致。

## 架构

```
DeepSeek Harness Desktop
├── Electron Main
│   ├── 单实例窗口（requestSingleInstanceLock + second-instance 聚焦）
│   ├── Harness 子进程生命周期（退出时 taskkill /T 终止整棵进程树）
│   ├── 随机 127.0.0.1 回环端口 + HTTP 就绪检测（就绪后才建窗口）
│   └── 平台菜单（win/linux 移除默认菜单栏，macOS 保留）与外链安全
│       （setWindowOpenHandler / will-navigate 只允许 harness 源）
│
├── Harness Child Process
│   └── @deepseek-ai/dsh web（--expose-internals + --patch picker 覆盖）
│       └── http://127.0.0.1:<random-port>
│
└── Sandboxed BrowserWindow（sandbox + contextIsolation + 无 nodeIntegration）
    └── DeepSeek Harness Web UI
```

- **开发模式**：仓库根执行 `pnpm dsh web --port <n>`（源码经 tsx 直跑）。
- **打包模式**：`ELECTRON_RUN_AS_NODE=1` 让 Electron 二进制充当 Node 运行时，
  直接执行 `resources/harness/lib/bin.js`，无需额外安装 Node。附加
  `--expose-internals`：HMR 与 Loader 内部模块需要 `node:internal` 访问，
  原生回退模块（node-addon-require-builtin）的 ABI 与 Electron 内嵌 Node 不一定匹配，
  该参数让 Loader 不再依赖它。

## 与 CLI 版的功能一致性

- **数据与配置**：`$DSH_HOME` 默认 `~/.dsh`（绝对路径），开发态与打包态共享
  会话、设置、凭据、agent presets；`DSH_HOME` 环境变量两边同样生效。
- **API Key**：解析链为 受管凭据存储（Models 设置页写入）> `<cwd>/.env` >
  `$DSH_HOME/.env`。打包态在设置页里配置即可。
- **cwd**：打包态子进程 cwd 固定为用户主目录，与终端里从主目录启动一致。
- **目录选择器**：打包态通过 `--patch config/picker-browse.patch.yml` 固定
  应用内目录浏览器（browse 后端），替代原生文件夹对话框——原生 worker 以
  `process.execPath` 派生，打包环境下可能不稳。patch 在 afterPack 时随包分发
  到 `resources/config/`。
- **Web 服务仅监听随机本地回环端口**，不暴露到局域网。

## 发行目标

公开桌面发行版只构建并发布 Windows x64 ZIP。ZIP 内包含 `dsh.exe` 与完整的 Electron/harness 运行时，用户解压后即可运行；源码仓库仍保留 Electron、Web UI、CLI 和插件包，供开发者阅读、修改和自行构建。

应用图标使用仓库根 `black_deepseek.ico`（Windows 嵌入 exe，dev 模式窗口图标同源）。

GitHub Actions 在推送 `dsh-v*` tag 后构建 Windows ZIP，并把 ZIP 与 `SHA256SUMS.txt` 上传到 GitHub Release。macOS、Linux 和 Windows 目录包不是公开下载目标。

## 发行手册

1. 在已通过检查的提交上创建 `dsh-v<version>` tag。
2. 推送 tag，`.github/workflows/electron-windows-release.yml` 在 Windows runner 上安装依赖、构建 workspace、暂存 production harness，并生成 x64 ZIP。
3. Workflow 计算 SHA-256 校验值并创建 GitHub Release。
4. Release 页面只保留 Windows x64 ZIP 和校验文件；源码通过仓库 Code 页面下载。

工作流与本地构建命令都使用 `electron-builder` 的 ZIP target，不上传 `release/win-unpacked` 目录。

## 使用

```sh
# 首次：构建 web GUI dist（harness 通过 dsh-web-frontend 包提供 SPA）
pnpm run build:web

# 开发（源码直跑）
pnpm --filter @deepseek-ai/dsh-electron dev

# 构建公开 Windows x64 ZIP
pnpm --filter @deepseek-ai/dsh-electron run package:harness
pnpm --filter @deepseek-ai/dsh-electron exec electron-builder --win zip --x64 --publish never

# 本地调试目录包（不作为公开下载目标）
pnpm --filter @deepseek-ai/dsh-electron run pack

# 构建 electron-builder 配置中的本地发行目标；公开 Release 仍只上传 ZIP
pnpm --filter @deepseek-ai/dsh-electron run dist
```

产物在 `apps/electron/release/`。`pack`/`dist` 前需 `pnpm install` 且
`apps/cli/lib`、`apps/web/dist` 就绪（`package:harness` 会按需自动构建）。
`afterPack` 复制 `deploy/dsh` 时会过滤 source map、PDB 和包内测试/覆盖率目录；
`deploy/dsh` 本身仍是完整 production closure，CLI profile、plugin 安装和 `dsh.client`
运行时解析路径不变。

## 已知限制

- 窗口关闭即退出（macOS 也如此）：harness 是子进程，不与窗口分离。
- 打包态凭据走设置页或 `$DSH_HOME/.env`，仓库根的 `.env` 不适用。
- 进程内装配 + IPC carrier（去端口形态）是后续演进，见
  [GUI layering note](../../.agents/notes/implemented/architecture/2026-07-19-gui-layering-and-rpc-protocol.md)。
