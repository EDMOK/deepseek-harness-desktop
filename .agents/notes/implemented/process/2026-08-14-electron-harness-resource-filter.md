# Agent Note: Electron harness resource filter

Status: implemented

English | [中文](2026-08-14-electron-harness-resource-filter.zh.md)

## Problem

The Electron package ships a `pnpm deploy --prod` copy of the full `@deepseek-ai/dsh` CLI closure under `resources/harness`. That closure is the right compatibility unit for profile boot, plugin installation, and runtime `dsh.client` resolution, but package debug payloads still made the desktop artifact much larger than the files the harness can execute.

## Decision

The Electron `afterPack` hook copies the deployed harness through a production resource filter. It drops source maps, PDB files, and package test or coverage directories while preserving package manifests, compiled JavaScript, declarations, sources, native binaries, and plugin assets. The filter runs only while staging `resources/harness`; it does not mutate `deploy/dsh`, change `pnpm deploy`, or remove any CLI mode.

## Verification

The implementation keeps the existing packaged functional audit path: a packed app can still boot the harness, answer Web API calls, expose plugin inventory, and serve client plugin bundles. Size auditing estimated that the first filter removes about 89 MB from the deployed harness copy, mostly PDB and source map files.

## Alternatives considered

**Trim the deployed package manifests or TypeScript sources.** Some packages expose development-facing files, and the built CLI closure still carries ordinary package resolution metadata. Removing broad source or declaration classes would need package-by-package proof and could break installed plugins that import documented subpaths.

**Replace the harness with a static `file://` Web build.** The Web surface depends on the boot manifest, runtime `dsh.client` bundle serving, and the `/api` transport, so staticizing the shell would trade away the plugin ecosystem this package is required to preserve.

## Consequences

Desktop artifacts are smaller without changing the runtime closure that profile boot sees. Further reductions should be explicit package-closure decisions or platform-native pruning, not broad deletion from `resources/harness`.
