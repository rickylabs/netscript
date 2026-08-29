# Aspire 13.5.0

Aspire 13.5 is a developer-experience release focused on a richer, more interactive AppHost, closer C# and TypeScript parity, sharper tooling, more flexible deployment modeling, and a broad set of runtime-stability improvements.

## Highlights

- 💬 **Richer AppHost interactions** — The Interaction Service now works across C# and TypeScript AppHosts with stable prompts and dynamic inputs, file uploads, progress dialogs, notifications, and user-defined resource command arguments that surface as dashboard controls and CLI options.
- 🖥️ **Interactive terminal sessions** — The experimental `WithTerminal()` API lets resources host REPLs, shells, TUIs, and other interactive programs directly in the dashboard, with an opt-in `aspire terminal` CLI command for attaching from your shell.
- 🌐 **TypeScript AppHost is generally available** — Polyglot AppHosts no longer require the `ASPIREATS001` experimental diagnostic and gain custom health checks, container file copying, HTTPS developer certificates, faster startup, and several reliability fixes that further close the gap with C#.
- 🛠️ **CLI installation and reliability** — The Aspire CLI is available through npm and Nix alongside Homebrew, WinGet, mise, and NuGet. New C# AppHosts enable the CLI bundle by default, while `aspire stop --force`, `aspire update --migrate`, `aspire doctor`, docs search, signal handling, and stale-socket cleanup all improve day-to-day workflows.
- 🎨 **Refreshed dashboard** — The dashboard adopts official Aspire branding and a new accessible design-token system, with timestamp and exact numeric telemetry filters, console-log text search, clearer reconnect and health-check experiences, and correct telemetry streaming while filters are active.
- 💻 **Rebranded VS Code extension** — The extension is now named **Aspire** and adds an in-editor dashboard, Bun and MAUI debugging, resource commands in the tree view, discovered AppHosts, improved parameter handling, and more efficient workspace discovery.
- ☸️ **More expressive deployments** — Kubernetes and AKS gain first-class persistent volumes, Azure Container Apps adds deterministic unique resource naming, Azure environments support delegated subnets, and Docker Compose can publish Blazor gateways and configure shared memory.
- ☁️ **Expanded hosting integrations** — Azure resources can be referenced across resource groups, subscriptions, and tenants; the new `Aspire.Hosting.Dotnet` package models .NET projects by path; Radius deployment arrives in preview; and Foundry Local, Redis modules, dev tunnels, Go debugging, and other integrations gain new capabilities.

## ⚠️ Breaking changes

Notable changes include hosting context `ServiceProvider` properties being renamed to `Services`, `PublishAsConnectionString` becoming obsolete in favor of `AddConnectionString`, removal of `aspire ps --resources` and `--include-hidden` in favor of `aspire describe`, earlier proxyless endpoint port allocation, deprecation of the GitHub Models integration, removal of the dashboard AI Assistant, and opt-in rather than automatic dashboard launch from the VS Code extension.

See the full list and migration guidance in the [Aspire 13.5 breaking changes](https://aspire.dev/whats-new/aspire-13-5/#breaking-changes).

## 📖 Learn more

For complete details, examples, migration guidance, and everything new in this release, read [What's new in Aspire 13.5](https://aspire.dev/whats-new/aspire-13-5/).

Thank you to all the community contributors who helped make Aspire 13.5 possible! 💜

---

_Full Changelog: [v13.4.6...v13.5.0](https://github.com/microsoft/aspire/compare/v13.4.6...v13.5.0)_

_Full commit: [e076d8e427cb3afb528dbd605acd74c3aea69f94](https://github.com/microsoft/aspire/commit/e076d8e427cb3afb528dbd605acd74c3aea69f94)_
