# Contributing

English | [中文](CONTRIBUTING.zh.md)

Thank you for contributing to DeepSeek Harness. The repository is source-first: developers can inspect and modify the Electron shell, Web UI, CLI, Cordis bundles, and plugin packages here. End users download the Windows x64 desktop ZIP from GitHub Releases; generated `release/` and `deploy/` trees are not committed.

## Before you start

DeepSeek Harness is a developer preview. Public APIs, package layouts, profiles, and local data formats may change without a compatibility guarantee. Read [`AGENTS.md`](AGENTS.md), [`docs/development.md`](docs/development.md), and [`docs/architecture.md`](docs/architecture.md) before changing packages.

Do not commit API keys, `.env` files, credential stores, session data, generated build output, or the `deploy/` and `apps/electron/release/` directories.

## Source workflow

```sh
git clone https://github.com/EDMOK/deepseek-harness-desktop.git
cd deepseek-harness
pnpm install
pnpm run build
pnpm run typecheck
```

Run the Web UI from source:

```sh
pnpm dsh web
```

Run the Electron shell from source:

```sh
pnpm --filter @deepseek-ai/dsh-electron dev
```

Build the public Windows x64 ZIP locally:

```sh
pnpm run build
pnpm --filter @deepseek-ai/dsh-electron run package:harness
pnpm --filter @deepseek-ai/dsh-electron exec electron-builder --win zip --x64 --publish never
```

The output is written to `apps/electron/release/`. Do not commit it; GitHub Actions creates the public Release asset from a `dsh-v*` tag.

## Making a change

1. Fork the repository and create a focused branch.
2. Read the owning package README and the relevant architecture or cookbook page.
3. Reuse existing services, extension points, and package boundaries.
4. Add or update tests for behavior changes.
5. Update affected English and Chinese documentation together when the document is a bilingual pair.
6. Run the smallest checks that cover the changed surface, then report the exact commands in the pull request.

For package changes, run the relevant gates from the root scripts. For Electron packaging changes, at minimum run the Electron typecheck/build and verify the Windows ZIP contents without including credentials or generated source trees.

## Extending the ecosystem

Use the extension guides for new capabilities:

- [Add a package](docs/cookbook/adding-a-package.md)
- [Add a tool](docs/cookbook/adding-a-tool.md)
- [Add a conversation node](docs/cookbook/adding-a-conversation-node.md)
- [Add an LLM adapter](docs/cookbook/adding-an-llm-adapter.md)

Community plugins can be maintained in separate repositories. Add the [`dsh-plugin`](https://github.com/topics/dsh-plugin) topic to make them discoverable. Treat third-party bundles and plugins as executable code and document their permissions and configuration requirements.

## Pull requests

Keep each pull request focused. The description should explain the user-visible or developer-visible behavior, affected packages, validation commands, and any compatibility or security consequences. Do not attach secrets or private user data.

## Security reports

Do not disclose credentials or unpatched security vulnerabilities in a public Issue or Discussion. Remove secrets from logs and use the repository's private security-reporting channel when one is available.
