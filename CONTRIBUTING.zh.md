# 贡献

[English](CONTRIBUTING.md) | 中文

感谢你为 DeepSeek Harness 作出贡献。本仓库以源码为中心：开发者可以在这里阅读和修改 Electron 外壳、Web UI、CLI、Cordis bundle 以及插件包。普通用户从 GitHub Releases 下载 Windows x64 桌面 ZIP；生成的 `release/` 和 `deploy/` 目录不提交到仓库。

## 开始之前

DeepSeek Harness 当前处于开发者预览阶段。公开 API、包结构、Profile 和本地数据格式都可能变化，不承诺兼容性。修改 `packages/` 前请阅读 [`AGENTS.md`](AGENTS.md)、[`docs/development.md`](docs/development.md) 和 [`docs/architecture.md`](docs/architecture.md)。

不要提交 API key、`.env` 文件、凭据存储、会话数据、生成的构建产物、`deploy/` 或 `apps/electron/release/` 目录。

## 源码工作流

```sh
git clone https://github.com/EDMOK/deepseek-harness-desktop.git
cd deepseek-harness
pnpm install
pnpm run build
pnpm run typecheck
```

从源码运行 Web UI：

```sh
pnpm dsh web
```

从源码运行 Electron 外壳：

```sh
pnpm --filter @deepseek-ai/dsh-electron dev
```

在本地构建公开的 Windows x64 ZIP：

```sh
pnpm run build
pnpm --filter @deepseek-ai/dsh-electron run package:harness
pnpm --filter @deepseek-ai/dsh-electron exec electron-builder --win zip --x64 --publish never
```

产物写入 `apps/electron/release/`。不要提交这些文件；GitHub Actions 会从 `dsh-v*` tag 创建公开 Release 资产。

## 修改代码

1. Fork 仓库并创建专注于单一目标的分支。
2. 阅读所属 package 的 README，以及相关架构文档或 cookbook 页面。
3. 复用已有 Service、扩展点和 package 边界。
4. 为行为变化新增或更新测试。
5. 双语文档发生变化时，同时更新英文和中文版本。
6. 运行覆盖改动范围的最小检查，并在 Pull Request 中报告实际执行的命令。

修改 package 时，请从根目录脚本中选择相关 gates。修改 Electron 打包时，至少运行 Electron typecheck/build，并检查 Windows ZIP 内容，确认没有凭据或生成的源码目录。

## 扩展插件生态

新增能力时请使用以下扩展指南：

- [新增 Package](docs/cookbook/adding-a-package.md)
- [新增工具](docs/cookbook/adding-a-tool.md)
- [新增对话节点](docs/cookbook/adding-a-conversation-node.md)
- [新增 LLM 适配器](docs/cookbook/adding-an-llm-adapter.md)

社区插件可以维护在独立仓库中。为插件仓库添加 [`dsh-plugin`](https://github.com/topics/dsh-plugin) 话题，便于被发现。第三方 bundle 和插件都是可执行代码，请说明它们需要的权限和配置，并只安装你信任的包。

## Pull Request

每个 Pull Request 应聚焦于一个目标。描述中应说明用户或开发者可见的行为、受影响的 package、验证命令，以及兼容性或安全影响。不要附加密钥或私人用户数据。

## 安全报告

不要在公开 Issue 或 Discussion 中披露凭据或尚未修复的安全漏洞。先从日志中移除密钥，并在仓库提供私密安全报告渠道时使用该渠道。
