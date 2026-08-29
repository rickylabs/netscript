## What's New in Aspire 13.5.1

Patch release for Aspire 13.5 fixing a TypeScript/Java polyglot AppHost compatibility regression
when running the 13.5 SDK under an older (13.4.x) CLI, plus a DCP update and release-pipeline
housekeeping.

### 🐛 Fixes

- 🍎 **Polyglot AppHosts could crash on startup on macOS** — On macOS, polyglot
  (TypeScript/Python/Java/Go/Rust) AppHosts could crash during startup due to an interaction between
  how DCP's Go runtime forks detached processes and how .NET Native AOT installs its signal
  handlers. Updated DCP (Developer Control Plane) to 0.25.13 to resolve the crash.
  ([[#19528](https://github.com/microsoft/aspire/pull/19528)](https://github.com/microsoft/aspire/pull/19528))

- 🔗 **Polyglot AppHosts on the 13.5 SDK crashed under an older CLI with `MissingMethodException`**
  — A TypeScript or Java AppHost built with the 13.5 SDK failed to start when launched by an older
  (13.4.x) CLI, because the newer codegen called `Aspire.TypeSystem` members that don't exist in the
  CLI's older contract. Code generation now probes for these additive capabilities before using
  them, so older CLIs skip only the unsupported feature and startup succeeds. Regression introduced
  in 13.5 by #19365. Fixes #19503.
  ([[#19524](https://github.com/microsoft/aspire/pull/19524)](https://github.com/microsoft/aspire/pull/19524),
  backport of #19506, `@adamint`)

### 🏷️ Housekeeping

- 📦 Updated DCP (Developer Control Plane) to 0.25.13
  ([[#19528](https://github.com/microsoft/aspire/pull/19528)](https://github.com/microsoft/aspire/pull/19528))

- 🔧 Restored WinGet publication using .NET 9 `wingetcreate`
  ([[#19509](https://github.com/microsoft/aspire/pull/19509)](https://github.com/microsoft/aspire/pull/19509))

- 🧹 Removed the pipeline-scoped `Publish-Build-Assets` group from the release pipeline
  ([[#19523](https://github.com/microsoft/aspire/pull/19523)](https://github.com/microsoft/aspire/pull/19523),
  [[#19163](https://github.com/microsoft/aspire/pull/19163)](https://github.com/microsoft/aspire/pull/19163))

- 🚀 Bumped branding to 13.5.1
  ([[#19531](https://github.com/microsoft/aspire/pull/19531)](https://github.com/microsoft/aspire/pull/19531))

_Full Changelog:
[[v13.5.0...v13.5.1](https://github.com/microsoft/aspire/compare/v13.5.0...v13.5.1)](https://github.com/microsoft/aspire/compare/v13.5.0...v13.5.1)_

_Full commit:
[[69db530a4816698cf1d5fa4557933e0ac4f127c6](https://github.com/microsoft/aspire/commit/69db530a4816698cf1d5fa4557933e0ac4f127c6)](https://github.com/microsoft/aspire/commit/69db530a4816698cf1d5fa4557933e0ac4f127c6)_
