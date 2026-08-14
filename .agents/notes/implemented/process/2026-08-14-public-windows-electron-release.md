# Agent Note: Public Windows Electron release

Status: implemented

English | [中文](2026-08-14-public-windows-electron-release.zh.md)

## Problem

The repository needs two distinct public entry points: a source tree that developers can inspect and edit, and a ready-to-run desktop artifact for users. Publishing generated Electron directories or platform variants beside the source would make the repository noisy and would not define which artifact is supported for download.

## Decision

The public desktop distribution is Windows x64 ZIP only. `.github/workflows/electron-windows-release.yml` runs for `dsh-v*` tags or an explicitly selected tag, builds the workspace on a Windows runner, stages the production harness, invokes electron-builder with the Windows ZIP target, writes `SHA256SUMS.txt`, and creates a GitHub Release containing the ZIP and checksum. The repository keeps Electron, Web UI, CLI, Cordis bundle, and plugin source files for developers; generated `deploy/`, `apps/electron/release/`, and local tarballs remain ignored.

The root README is the product entry point: it separates Windows download instructions, a source map, developer build commands, plugin extension links, preview limitations, and security guidance. `apps/electron/README.md` owns the desktop packaging procedure and states that directory builds and other platform targets are not public download targets.

## Verification

The workflow uses frozen pnpm installation, Node 24, `pnpm run build`, `package:harness`, Windows x64 ZIP packaging with `--publish never`, and a PowerShell SHA-256 calculation. README and contributor documentation link to the workflow, source paths, build commands, and existing documentation owners.

## Alternatives considered

**Publish every electron-builder target.** macOS, Linux, installers, portable executables, and unpacked directories increase maintenance and release validation scope while the requested public audience currently needs one Windows artifact.

**Commit the unpacked Electron directory to the repository.** Generated files duplicate the source and production closure, make edits difficult to review, and can accidentally include local state. GitHub Release assets provide the binary download without mixing it into source history.

**Provide only the binary and hide the implementation.** The project is intended to be editable and extensible; the Electron shell, Web UI, CLI, and plugin source remain visible and linked from the homepage.

## Consequences

Users have one documented Windows x64 ZIP download and a checksum. Developers have a source-first repository with explicit Electron and harness entry points. Adding another public platform or installer requires a deliberate release decision and a separate tested workflow.
