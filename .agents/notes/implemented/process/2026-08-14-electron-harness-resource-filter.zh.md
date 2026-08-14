# Agent Note: Electron harness 资源过滤

Status: implemented

[English](2026-08-14-electron-harness-resource-filter.md) | 中文

## 问题

Electron 包会把 `pnpm deploy --prod` 生成的完整 `@deepseek-ai/dsh` CLI 闭包放到 `resources/harness`。这个闭包是 profile 启动、插件安装和运行时 `dsh.client` 解析所需的兼容单位，但包内调试载荷仍让桌面产物远大于 harness 可执行文件集合。

## 决策

Electron `afterPack` hook 通过生产资源过滤器复制已部署 harness。它丢弃 source map、PDB 文件以及包内测试或覆盖率目录，同时保留 package manifest、已编译 JavaScript、声明、源码、原生二进制和插件资源。过滤只发生在暂存 `resources/harness` 时；它不修改 `deploy/dsh`，不改变 `pnpm deploy`，也不移除任何 CLI 模式。

## 验证

实现保留现有打包功能审计路径：打包应用仍应能启动 harness、响应 Web API 调用、暴露插件 inventory，并服务 client plugin bundle。体积审计估算第一版过滤会从 deployed harness copy 中移除约 89 MB，主要是 PDB 与 source map 文件。

## 考虑过的替代方案

**裁剪 deployed package manifests 或 TypeScript 源码。** 部分包暴露开发面向文件，构建后的 CLI 闭包仍携带普通包解析元数据。广泛删除源码或声明类别需要逐包证明，并可能破坏已安装插件导入文档化 subpath 的行为。

**把 harness 替换成静态 `file://` Web build。** Web surface 依赖 boot manifest、运行时 `dsh.client` bundle 服务以及 `/api` transport；静态化 shell 会牺牲这个包必须保留的插件生态。

## 后果

桌面产物变小，同时不改变 profile boot 看到的运行时闭包。后续瘦身应是显式 package closure 决策或平台原生裁剪，而不是从 `resources/harness` 广泛删除文件。
