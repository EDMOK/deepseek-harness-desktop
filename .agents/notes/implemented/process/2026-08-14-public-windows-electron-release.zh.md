# Agent Note: 公开 Windows Electron 发行版

Status: implemented

[English](2026-08-14-public-windows-electron-release.md) | 中文

## 问题

仓库需要两个不同的公开入口：供开发者阅读和编辑的源码树，以及供用户直接运行的桌面成品。把生成的 Electron 目录或多个平台变体放在源码旁边会增加仓库噪声，也无法明确哪个成品是支持下载的目标。

## 决策

公开桌面发行版只提供 Windows x64 ZIP。`.github/workflows/electron-windows-release.yml` 在 `dsh-v*` tag 或手动指定的 tag 上运行，在 Windows runner 中构建 workspace、暂存 production harness，使用 electron-builder 的 Windows ZIP target，生成 `SHA256SUMS.txt`，并创建包含 ZIP 与校验文件的 GitHub Release。仓库保留 Electron、Web UI、CLI、Cordis bundle 和插件源码供开发者使用；生成的 `deploy/`、`apps/electron/release/` 和本地 tarball 继续被忽略。

根 README 是产品入口，分别承载 Windows 下载说明、源码地图、开发者构建命令、插件扩展链接、预览版限制和安全提示。`apps/electron/README.md` 负责桌面打包流程，并说明目录包和其他平台目标不是公开下载目标。

## 验证

Workflow 使用 frozen pnpm 安装、Node 24、`pnpm run build`、`package:harness`、带 `--publish never` 的 Windows x64 ZIP 打包，以及 PowerShell SHA-256 计算。README 和贡献指南链接到 workflow、源码路径、构建命令和已有文档归属位置。

## 考虑过的替代方案

**发布 electron-builder 的所有 target。** macOS、Linux、安装程序、portable 可执行文件和目录包会扩大维护与发行验证范围，而当前公开用户只需要一个 Windows 成品。

**把 Electron 解包目录提交到仓库。** 生成文件会重复源码和 production closure，难以审查改动，也可能意外包含本地状态。GitHub Release 资产可以提供二进制下载，同时不污染源码历史。

**只提供二进制而隐藏实现。** 项目定位是可编辑、可扩展的；Electron 外壳、Web UI、CLI 和插件源码仍保留在仓库，并从首页提供入口。

## 后果

用户拥有一个明确记录的 Windows x64 ZIP 下载和校验文件。开发者拥有一个以源码为中心的仓库，并能从首页找到 Electron 与 harness 的入口。增加其他公开平台或安装程序时，需要单独作出发行决策并提供对应的验证 workflow。
