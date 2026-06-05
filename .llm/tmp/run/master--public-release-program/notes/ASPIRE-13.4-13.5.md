# Toolchain Note — Aspire 13.4 (now) → 13.5 native Deno apphost

> Sources: `https://devblogs.microsoft.com/aspire/whats-new-aspire-13-4/`,
> `https://github.com/microsoft/aspire/issues/16218`, and local
> `dotnet/AppHost/AppHost.csproj` + `dotnet/global.json`. Feeds supervisor **S4**.

## Current pin (grounding)

From `dotnet/AppHost/AppHost.csproj`:

```
Sdk = "Aspire.AppHost.Sdk/13.2.2"      TargetFramework = net10.0
PackageReference CommunityToolkit.Aspire.Hosting.Deno   13.1.0
PackageReference CommunityToolkit.Aspire.Hosting.SQLite 13.1.0
ProjectReference packages/NetScript.Aspire.Hosting (IsAspireProjectResource=false)
```

`dotnet/global.json`: SDK `10.0.0`, `rollForward: latestMinor`,
`allowPrerelease: true`. Deno services run today via the **CommunityToolkit Deno
hosting integration** (generated-artifact model). The `netscript` CLI already
**scaffolds a TypeScript apphost** for generated workspaces, so this is a version
bump, **not** a C#→TS migration.

## S4-now (Aspire 13.4)

| Task | Detail |
|---|---|
| **Bump SDK** | `Aspire.AppHost.Sdk 13.2.2 → 13.4.x` |
| **Bump CommunityToolkit** | `CommunityToolkit.Aspire.Hosting.Deno` + `…SQLite` `13.1.0 → 13.4.x` |
| **Validate TS apphost GA** | 13.4 promotes the TS apphost to GA: explicit `apphost.mts` entry point, generated SDK modules under `.aspire/modules/`, startup validation before run. Confirm the scaffolded apphost matches the GA shape. |
| **Dashboard commands** | Adopt typed resource-command arguments + `WithProcessCommand()` to expose `netscript` CLI subcommands (scaffold/seed/migrate) as Aspire dashboard commands — a high-value DX flex. |
| **CLI e2e under Aspire** | Wire `netscript init → deno task check → aspire run` against `examples/playground` as the **stack e2e gate** (nightly + release, not per-PR). `aspire logs/otel --search` (13.4) makes log assertions cheaper. |

## S4-later (Aspire 13.5)

Native Deno apphost support is tracked in **`microsoft/aspire#16218`**
(milestone **13.5**, opened by `sebastienros`, with feedback from `rickylabs` —
i.e. us). The 13.5 work replaces the CommunityToolkit generated-artifact path
with a **native Deno toolchain** in the apphost — the "full runtime, less
generated artifact" refactor.

Issue #16218 "work to track" maps directly onto our S4-later sub-branch
`feat/aspire/deno-apphost-readiness`:

- first-pass scope decision: `package.json`-based Deno vs broader
  `deno.json` / task / import-map workflows;
- `TypeScriptAppHostToolchainResolver` gains a `Deno` toolchain
  (detect `packageManager: "deno@…"`, honor `deno.lock` / `deno.json(c)`,
  generate execute/watch commands);
- CLI dependency + `aspire doctor` Deno reporting;
- **validation coverage**: unit tests for toolchain resolution + doctor, and
  **CLI E2E for restore/run/doctor with a configured Deno toolchain**.

**Strategic positioning:** design the 13.4 apphost so it flips cleanly to the
native Deno apphost at 13.5, and make our repo's Aspire e2e the **reference
validation** for that feature. We are the upstream requester; our e2e suite
should mirror #16218's validation checklist so the framework doubles as the
proving ground.

## Gating note

S4-now (13.4) is **self-sufficient** and does not block on 13.5. The native
apphost (13.5) is an **upgrade, not a launch gate** — if it slips, alpha-0 still
ships on the 13.4 generated-artifact path.

## Sources

- `https://devblogs.microsoft.com/aspire/whats-new-aspire-13-4/`
- `https://github.com/microsoft/aspire/issues/16218` (milestone 13.5)
- `dotnet/AppHost/AppHost.csproj`, `dotnet/global.json` (local pins)
