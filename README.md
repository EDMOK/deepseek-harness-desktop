# DeepSeek Harness

[English](README.zh.md) | 中文

<div align="center">
  <h3>一切皆插件的可组合 Agent 运行时。</h3>
  <p>Web UI · CLI · Cordis 组合 · 面向开发者的扩展能力</p>
  <p>
    <a href="#下载">下载 Windows 版本</a> ·
    <a href="#源码地图">查看源码</a> ·
    <a href="#开发者快速开始">从源码构建</a>
  </p>
</div>

> DeepSeek Harness（`dsh`）是由 [DeepSeek AI](https://deepseek.com) 开发的开源 agent harness（智能体框架）。当前版本处于**开发者预览**阶段：接口、包结构、Profile 和本地数据格式都可能发生变化，不承诺兼容性。

## 你将获得什么

DeepSeek Harness 将桌面体验与运行时分开。Windows 桌面成品是一个 Electron 外壳，内部运行与开发者可以通过 CLI 启动、并能在本仓库中阅读的同一套 `dsh web` Profile。

| 层次 | 提供内容 |
| --- | --- |
| Electron 桌面外壳 | 沙箱化 BrowserWindow、本地 harness 生命周期管理、安全的外链处理，以及开箱即用的 Windows 应用。 |
| DeepSeek Harness 运行时 | 会话、模型、工具、权限、持久化、Profile、子 Agent、工作流和 Agent loop。 |
| Web UI | 会话、设置、模型、工作区、插件清单、工具、计划、目标以及其他运行时投影的浏览器界面。 |
| 插件生态 | Cordis bundle、Profile patch layer、Host 插件和 `dsh.client` 浏览器插件，可组合、替换和扩展。 |
| CLI | Profile 启动、`web`、`headless`、配置导出、patch overlay 以及 Profile 插件管理。 |

项目遵循一条明确规则：**一切皆插件**。运行时由有序的 Cordis 层组合而成，因此桌面应用不是一套与 harness 分叉的独立功能实现。

## 下载

### Windows x64 桌面成品

当前公开二进制发行版**只提供 Windows x64**。请从最新 GitHub Release 下载 ZIP，解压后运行 `dsh.exe`。

<a href="https://github.com/deepseek-ai/deepseek-harness/releases/latest"><strong>下载最新 Windows ZIP</strong></a>

每个 Release ZIP 都包含完整桌面应用及其内置 harness 运行时。运行解压后的桌面成品不需要另行安装 Node.js 或 pnpm。

> 公开下载的是包含 `dsh.exe` 的 ZIP，不是源码压缩包。下面的源码树是面向开发者的可编辑版本。

### 首次启动

1. 将下载的 ZIP 解压到你有权限管理的目录。
2. 启动 `dsh.exe`。
3. 在 Web UI 设置中配置模型提供方和 API 凭据。
4. 会话、设置、凭据和 Profile 保存在 harness home 中。不要把真实凭据写入仓库或提交到 Git。

## 源码地图

本仓库包含 Electron 外壳、Web UI 入口、CLI 以及构成桌面成品的插件包。根据你想了解的部分，从对应路径开始阅读。

| 如果你想查看…… | 从这里开始 |
| --- | --- |
| Electron 主进程 | [`apps/electron/src/main.ts`](apps/electron/src/main.ts) |
| Electron 打包与 harness 暂存 | [`apps/electron/electron-builder.yml`](apps/electron/electron-builder.yml)、[`apps/electron/scripts/pack-harness.mjs`](apps/electron/scripts/pack-harness.mjs)、[`apps/electron/scripts/after-pack.mjs`](apps/electron/scripts/after-pack.mjs) |
| Web UI 入口与浏览器打包 | [`apps/web`](apps/web)、[`packages/client/web`](packages/client/web)、[`packages/client/web-react`](packages/client/web-react) |
| 浏览器插件加载与 `dsh.client` | [`packages/client/modules`](packages/client/modules)、[`packages/client/runtime`](packages/client/runtime) |
| Host API、RPC、HTTP 与事件流 | [`packages/host`](packages/host)、[`packages/api`](packages/api) |
| CLI 分发与 Profile | [`apps/cli`](apps/cli)、[`packages/boot/app-boot`](packages/boot/app-boot) |
| 内置 bundle 与 Profile 组合 | [`packages/bundle`](packages/bundle) |
| 工具、模型、会话、权限与 Agent loop | [`packages/core`](packages/core)、[`packages/llm`](packages/llm)、[`packages/interaction`](packages/interaction)、[`packages/session`](packages/session) |

## 运行

### 从源码运行

源码 Web UI 由 `dsh web` Profile 在本地提供。

### 从源码运行 Web UI

环境要求：Node.js `^22.19.0 || >=24.0.0`，pnpm `11.7.0`。

```sh
git clone https://github.com/deepseek-ai/deepseek-harness.git
cd deepseek-harness
pnpm install
pnpm run build
pnpm dsh web
```

源码 Web UI 由 `dsh web` Profile 在本地提供。开发 Client 插件时，请同时运行源码 launcher 与 Client bundle watcher（`pnpm run dev:web`）。

### 从源码运行 Electron 外壳

```sh
pnpm install
pnpm --filter @deepseek-ai/dsh-electron dev
```

Electron 外壳会启动本地 harness 子进程，等待 loopback HTTP 服务就绪后再打开 Web UI。Renderer 使用 `sandbox`、`contextIsolation`，并关闭 `nodeIntegration`。

### 构建 Windows ZIP

```sh
pnpm run build
pnpm --filter @deepseek-ai/dsh-electron run package:harness
pnpm --filter @deepseek-ai/dsh-electron exec electron-builder --win zip --x64
```

本地产物写入 `apps/electron/release/`。公开 Release workflow 会从 `dsh-v*` tag 构建同样的 Windows x64 ZIP，并同时上传 `SHA256SUMS.txt`。

### 检查运行时

```sh
pnpm run typecheck
pnpm run test
pnpm --filter @deepseek-ai/dsh-electron typecheck
```

请针对改动选择最小的相关检查。完整 gates 和平台策略见 [`CLAUDE.md`](CLAUDE.md)。

## 插件生态

Profile 是 bundle 和 patch layer 的有序组合。Bundle 提供 Cordis 配置行，后续层可以替换或插入配置，而不需要修改 bundle 本身。浏览器插件声明 `dsh.client` 入口，由 Web UI 模块系统动态加载，而不是硬编码进主 Shell bundle。

社区插件可以添加 [`dsh-plugin`](https://github.com/topics/dsh-plugin) 话题，便于被发现。

## 社区与支持

- 在 [GitHub Discussions](https://github.com/deepseek-ai/deepseek-harness/discussions) 讨论产品行为或报告 bug。
- 提交仓库改动前请阅读 [`CONTRIBUTING.md`](CONTRIBUTING.md)。
- 加入 [DeepSeek Harness Discord 社区](https://discord.gg/Ycq5dCaS4)。

<details>
  <summary>加入中文社区</summary>
  <br>
  <table>
    <thead>
      <tr>
        <th align="center">企微小助手</th>
        <th align="center">入群问卷</th>
        <th align="center">微信公众号</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td align="center"><img src="assets/community-wecom-assistant.png" alt="DeepSeek Harness 企微小助手二维码" width="180" height="180"></td>
        <td align="center"><a href="https://trtgsjkv6r.feishu.cn/share/base/form/shrcnIt5twSVdLGD52KJBckGCgg"><img src="assets/community-wecom-survey.png" alt="DeepSeek Harness 入群问卷二维码" width="180" height="180"></a></td>
        <td align="center"><img src="assets/community-wechat-official-account.png" alt="DeepSeek Harness 团队微信公众号二维码" width="180" height="180"></td>
      </tr>
    </tbody>
  </table>
</details>

## 安全与信任

桌面成品将 harness 作为本地子进程运行，并保持 Renderer 与 Node.js 隔离。第三方 Cordis bundle 和插件都是可执行代码：只安装你信任的包，审查它们的配置，不要把 Profile 或 Web 服务暴露到预期网络范围之外。

不要提交 API key、凭据文件、会话数据或本地存储。第三方依赖声明与许可证见 [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)。

## 许可证

[MIT](LICENSE)
