# Deno 2.8 + Aspire 13.4 upgrade — Research findings

> **Status:** IN PROGRESS — write-artifact-first; sections filled A → B → C → D → E → F → slice plan.
> **Branch:** `chore/deno-2.8-aspire-13.4-upgrade` (off `feat/package-quality` @ `fcef53d`).
> **Phase:** RESEARCH ONLY. No source/config edits, no version bumps, no impl.
> **Prior notes (re-verified, not blindly trusted):**
> - `.llm/tmp/run/master--public-release-program/notes/TOOLCHAIN-2.8.md` (S2/S3 leverage map)
> - `.llm/tmp/run/master--public-release-program/notes/ASPIRE-13.4-13.5.md` (S4-now / 13.5-later)
> **Live toolchain verification sources:** `https://deno.com/blog/v2.8`; Aspire CLI 13.2.2
> `aspire docs search/get` (used here to confirm `apphost.mts` + `aspire logs --search` are GA);
> `https://github.com/microsoft/aspire/issues/16218` (13.5 native Deno apphost).

## Discrepancies vs prior notes (must reconcile in impl phase, not in research)

| # | Prior-note claim | Repo reality on this branch | Implication |
|---|---|---|---|
| D-1 | `packages/NetScript.Aspire.Hosting/` is a sibling to `packages/aspire/` | **Does not exist.** Only `packages/aspire/` (the SDK-agnostic TS wrapper) is present. | The 13.4 SDK/CTK bumps and `apphost.mts` migration land in the **CLI scaffold templates** (`packages/cli/src/kernel/assets/aspire/`) and the `SCAFFOLD_VERSIONS` / `SCAFFOLD_DIRS` constants, not in a `NetScript.Aspire.Hosting` C# project. This research treats the Aspire version bump as a **CLI scaffold template + version-constant change**, not a project-file edit. |
| D-2 | `dotnet/AppHost/AppHost.csproj` + `dotnet/global.json` are committed pins | **They are generated artifacts**, never committed. They are produced by `netscript init` from `packages/cli/src/kernel/assets/aspire/*.template` files. | Version-bump files = `packages/cli/src/kernel/assets/aspire/AppHost.csproj.template` (currently missing from the template set — only `ServiceDefaults.csproj`, `Program.cs`, `Extensions.cs`, `NetScriptTelemetryDefaults.cs`, `launchSettings.json`, and TS helpers are present). The actual C# SDK project is currently emitted via `packages/cli/src/kernel/templates/aspire/` generators; the `.csproj` is built by `SCAFFOLD_VERSIONS.ASPIRE_SDK` interpolation, not a static template. |
| D-3 | Current scaffold path is `apphost.ts` and `.modules/aspire.ts` | **Confirmed** via `SCAFFOLD_FILES.APPHOST_TS = 'apphost.ts'`, `SCAFFOLD_DIRS.MODULES = '.modules'`, `SCAFFOLD_ASPIRE_MODULES.SDK_IMPORT_FROM_HELPERS = '../.modules/aspire.ts'`. | The 13.4 GA shape (`apphost.mts`, `.aspire/modules/`, startup validation) is a **path realignment** owned by the CLI Wave 6 research (PR #43). This research records the **dependency** on that work but does not design the path change itself. |
| D-4 | CI pins `denoland/setup-deno@v2` → `deno-version: v2.x` | **Confirmed** in `.github/workflows/copilot-setup-steps.yml:40–42`. No other workflow currently sets a Deno version. | The CI-pin decision (float `v2.x` → pin `2.8.x`) is **in scope for this research** (Section A CI row, Section F risk register). |
| D-5 | `dotnet/global.json` pins `10.0.0` with `rollForward: latestMinor`, `allowPrerelease: true` | The generator (`packages/cli/src/kernel/templates/aspire/generate-global-json.ts`) **emits** this with `SCAFFOLD_VERSIONS.DOTNET_SDK = '10.0.0'`. No committed `global.json`. | The `DOTNET_SDK` constant stays `10.0.0`; this research only flags whether the 13.4 prerelease interplay requires `allowPrerelease: true` to remain (yes — see Risk R-3). |

These are **doc-level fixes for the prior notes**, not impl work. They are reflected throughout
the matrices below.

---

## A. Deno 2.8 feature-adoption matrix

> **Scope:** every program-affecting 2.8 feature the maintainer called out in `research-brief.md`.
> **Verdict taxonomy:** ✅ **adopt-now** (workspace-level, no per-package scope creep), ⏸ **defer**
> (post-alpha or stretch — `deno pack`, OTel console/gRPC experimental), ⚪ **N-A here** (no
> program signal in this workspace), 🟡 **adopt with debt** (per-package carve-out, recorded in
> `debt/arch-debt.md`).
> **Current Deno:** `2.7.11` (verified). **CI pin:** `deno-version: v2.x` (floating major).

| # | Feature | Verdict | Concrete workspace action (impl phase) | File(s) touched | Evidence / why |
|---|---|---|---|---|---|
| A-1 | **CI version pin** `v2.x` → `2.8.x` | ✅ adopt-now | Set `deno-version: v2.8.x` in `copilot-setup-steps.yml`. Keep `denoland/setup-deno@v2`. | `.github/workflows/copilot-setup-steps.yml` (line 42) | The brief's "ordered, reviewed upgrade" + alpha-stability means we should pin the minor to make drift visible. Float is acceptable but pin is the conservative alpha posture (Risk R-4). |
| A-2 | **`isolatedDeclarations: true` at workspace root** | ✅ already-adopted (verified) | **No action** in this upgrade. Keep the compiler flag in root `deno.json`. | `deno.json` (line 41) | Re-verified: `"isolatedDeclarations": true` is already on at the workspace root; 2.8 simply makes this combination standard and reinforces the publish-gate story. |
| A-3 | **`lint.rules.tags:["recommended","jsr"]`** | ✅ already-adopted (verified) | **No action.** | `deno.json` (lines 56–64) | Re-verified: tags include `["recommended","jsr"]` and `include: ["no-process-global","no-node-globals"]` is on. |
| A-4 | **Re-enable `no-process-global` + `no-node-globals` lint** | ✅ already-adopted (verified) | **No action.** Both are in the workspace `include` list. The 2.8 default-off behavior is being overridden intentionally. | `deno.json` (line 61) | Confirmed — the alpha is a multi-runtime library and needs the guard on. |
| A-5 | **`deno bump-version` workspace-aware** | ✅ adopt-now (S3) | Adopt as the **primary release path**; keep the conventional-commit `--base=main` mode as a post-alpha option (alpha lockstep continues to use `deno bump-version patch\|minor\|prerelease`). | `deno.json` (version field, line 2), all 29 `packages/*/deno.json` + `plugins/*/deno.json` (verified: 28 member deno.json files exist) | This is the highest-leverage 2.8 feature per the prior toolchain note. Kills bespoke release/version scripts. |
| A-6 | **`deno publish` path→registry auto-rewrite** | ✅ adopt-now (S3) | When publishing from the workspace root, `deno publish` rewrites `../shared/mod.ts` → `jsr:@netscript/shared` in the published code. Keep path imports for local dev. | All `packages/*/deno.json` + `plugins/*/deno.json` (publish config) | DRIFT-005 in the prior plan; the rewrite is now built-in. |
| A-7 | **`deno ci`** as first CI step | ✅ adopt-now | Add `deno ci` as the first `e2e:cli`/CI step before any `deno task` invocation. Uses `--frozen`, errors if `deno.lock` missing, wipes `node_modules`. | `.github/workflows/copilot-setup-steps.yml` (CI job), `packages/cli/e2e/cli.ts` (e2e orchestrator) | The lockfile gate is the cheapest reproducible-install guarantee. |
| A-8 | **`catalog:` protocol** | ✅ adopt-now (S3) | Pin `@std/*`, `zod`, `clsx`, `preact`, `@preact/signals`, `tailwind-merge` once in root `deno.json` `imports` (or a new top-level `"catalog": {…}` block, per 2.8 syntax) and rewrite the 28 member `deno.json` files to use `catalog:` references. | `deno.json`, all 28 member `deno.json` files | Surveyed: 354 files reference `@std/*`, 90 reference `zod`; centralisation is the right shape. |
| A-9 | **`deno audit` / `deno audit fix`** | ✅ adopt-now (CI gate) | Add `deno audit` (read-only) to CI; reserve `deno audit fix` for local dev. | `.github/workflows/copilot-setup-steps.yml` | Supply-chain gate; matches the program's "publish-clean" goal. |
| A-10 | **TypeScript 6.0.3 bundled** | ✅ free upgrade | **No action.** All `deno check`/LSP/`deno doc`/`deno compile` runs pick up the bundled TS 6.0.3 automatically with Deno 2.8. | N/A | "No flag" per the 2.8 blogpost. |
| A-11 | **`lib.node` on by default** | ✅ already-adopted-effectively | `no-process-global` + `no-node-globals` are on in lint `include`. The 2.8 default-on `lib.node` means `Buffer`/`process`/`NodeJS.*` now resolve without us having to add `compilerOptions.lib: ["…","node"]` — **we should NOT add `node`** because doing so would re-legalize the very globals the lint rules ban. Keep the current `lib: ["dom","deno.ns","deno.unstable"]`. | `deno.json` (compilerOptions.lib, line 46) | Verified — current `lib` deliberately omits `node`. The 2.8 default-on behavior is a *capability* we exploit (lint catches usages), not a config change. |
| A-12 | **Per-package `--allow-slow-types` carve-outs** | 🟡 adopt-with-debt | For the four heavy-generic packages (`contracts`, `triggers`, `service`, `plugin`), set `compilerOptions: { noSlowTypes: false }` **or** `"unstable": ["…", "allow-slow-types"]` (per 2.8 syntax) **at the per-package `deno.json`** level — never as a workspace default. Record each as a `DEBT_ACCEPTED` entry in `.llm/harness/debt/arch-debt.md` with a targeted remediation plan (e.g., "narrow the public surface", "split inference types", "make Zod schemas source-of-truth and reduce generic helpers"). | `packages/contracts/deno.json`, `packages/triggers/deno.json`, `packages/service/deno.json`, `packages/plugin/deno.json`, `.llm/harness/debt/arch-debt.md` | The prior toolchain note explicitly flags these four. Each carve-out **costs the "no slow types" JSR score factor and npm `.d.ts` generation** — that is the score-impacting reason to record it in `arch-debt.md` rather than silently bury it. |
| A-13 | **Per-test `timeout` + sanitizers off by default + `Deno.test.sanitizer()`** | ✅ adopt-now (test infrastructure) | Adopt the per-test `timeout` and module-level `Deno.test.sanitizer()` in new and refactored test files. Don't blanket-flip sanitizers off in CI (that's a footgun for prod code). | `packages/*/tests/`, `plugins/*/tests/`, `packages/cli/e2e/` | 2.8's per-test timeout + per-suite sanitizer control is a real ergonomic win; current tests have no per-test timeout (they inherit the global). |
| A-14 | **Per-function `deno coverage`** | ✅ adopt-now (CI signal) | Add `deno coverage --include=<pattern> --exclude=<pattern>` reporting that surfaces function-level coverage, not just line-level. Wire into a CI artifact. | `.github/workflows/copilot-setup-steps.yml`, possibly a new `coverage:report` task | "High line coverage hiding untested API surface" is exactly the framework-quality signal S1 wants. |
| A-15 | **`deno compile` framework detection** | ⚪ N-A here | The CLI is a long-lived process (TUI / apphost orchestrator), not a single-binary CLI; the Lume/Fresh docs site (S5) is out of scope for this research wave. Revisit at S5. | N/A | The S5 docs site is a separate workstream; this upgrade does not deliver it. |
| A-16 | **OTel console + gRPC exporters** | ⏸ defer (post-alpha) | The 2.8 OTel exporters are still labelled experimental. `@netscript/telemetry` already uses `@opentelemetry/*` packages; integrating the 2.8 native exporters would require a parallel pipeline. Defer until 2.9 or until `@netscript/telemetry` is itself in a rewrite window. | `packages/telemetry/` | Aligns with the 2.8 blogpost caveat about the OTel exporters. |
| A-17 | **`deno task` parallel output prefixing + `set -e`** | ✅ adopt-now (CI log hygiene) | Use `--parallel` and prefixed output in CI multi-package task fan-out. Keep `set -e` semantics via `deno task`'s own failure propagation. | `.github/workflows/copilot-setup-steps.yml`, `.llm/tools/*.ts` (the wrapper scripts already encapsulate this) | Cleaner CI logs; tiny ergonomic win. |
| A-18 | **`deno pack`** (npm-mirror `.tgz`) | ⏸ defer (stretch) | Stretch for post-alpha: an npm-mirror of `@netscript/*` raises the JSR compatibility score (≥2 runtimes) and reaches Node/Bun. Do not deliver in 13.4. | N/A (CLI / S3 stretch) | Per the prior toolchain note: "S3 stretch / post-alpha". |

### Section A recommendation

> **Adopt now (12 features, of which 5 are already adopted):** A-1, A-2, A-3, A-4, A-5, A-6, A-7,
> A-8, A-9, A-10, A-11, A-13, A-14, A-17. **Adopt with debt (1):** A-12 — and every per-package
> carve-out gets a `DEBT_ACCEPTED` row in `arch-debt.md` with a remediation plan. **Defer (3):**
> A-16 (OTel exporters — experimental), A-18 (`deno pack` — stretch). **N-A here (1):** A-15
> (framework detection — owned by S5 docs site). **Free upgrade (1):** A-10 (TS 6.0.3).

---

(Sections B–F and slice plan follow in subsequent edits — file is durable; budget guarded.)

---

## B. Deno 2.8 legacy removal

> **Scope:** bespoke machinery 2.8 makes obsolete in this repo. **Hard rule:** no back-compat
> (alpha = pre-stability; doctrine no-backcompat holds). All paths below are **candidates for
> outright deletion** in the impl phase, conditional on the items existing in the post-S1 codebase
> (this research does not assume the S1 supervisor removed them already).
>
> **Methodology:** I diffed the 2.8 leverage map against the current repo. For each item I asked
> "does 2.8 *delete* this need, or just *reduce* it?" — only true deletions make the list.

| # | Legacy path / pattern | 2.8 superseding capability | Status in this repo | Action (impl phase) |
|---|---|---|---|---|
| B-1 | **Bespoke release/version-bump scripts** (assumed in the prior S3 plan, e.g. custom `release.ts`, lockstep bump glue) | `deno bump-version` workspace-aware | **Not present as code** in this repo (S1 already removed bespoke release scripts). | **No action** — verify the absence with `grep -rn "release.ts\|bump-version" --include="*.ts" packages plugins` in the impl phase. |
| B-2 | **Manual `jsr:` rewrite helpers / import-map handoff** (the "rewrite import_map on handoff" task referenced as DRIFT-005) | `deno publish` workspace path→registry auto-rewrite | **Not present** — `packages/cli/src/kernel/templates/workspace/generate-*.ts` and the e2e scaffold already publish directly from `deno.json`. | **No action** — verify with `grep -rn "import_map\|jsr:rewrite" packages/cli` (expected: no hits). |
| B-3 | **Hand-rolled slow-type workarounds** (e.g. `// deno-lint-ignore no-explicit-any` to paper over inference failures) | `isolatedDeclarations: true` + TS 6.0.3 | **Already adopted** at workspace root (Section A-2). The four heavy-generic packages (A-12) still carry debt. | **Partial:** keep the `--allow-slow-types` carve-outs for `contracts`/`triggers`/`service`/`plugin` (recorded as A-12 debt). Remove *other* hand-rolled slow-type workarounds — search for `// deno-lint-ignore.*no-explicit-any` and `as any` patterns adjacent to inference types. |
| B-4 | **Redundant lint suppressions made unnecessary by 2.8 defaults** | 2.8 turns on `lib.node` by default → `Buffer`/`process`/`NodeJS.*` resolve; some `// deno-lint-ignore no-node-globals` may be redundant now that the lint rule is on (workspace `include` covers both) | **Audit-only.** | In the impl phase: `grep -rn "deno-lint-ignore.*\(no-node-globals\|no-process-global\)" packages plugins` — remove any hit (the rule is on, so the suppression is dead). |
| B-5 | **Custom coverage shims** (hand-rolled scripts that wrap `deno coverage` for per-function reporting) | 2.8's per-function `deno coverage` | **Not present** — `.llm/tools/run-deno-check.ts` is a scoped check wrapper, not a coverage shim. The new coverage tool is `.llm/tools/` future work. | **No action** — the new per-function `deno coverage` lands as a *new* gate in A-14; no removal needed. |
| B-6 | **Stale `isolatedDeclarations: false` opt-outs in per-package `deno.json`** | Workspace root has `isolatedDeclarations: true`; per-package `false` is now an *override* to be justified | **Audit-only.** Re-verified that `packages/contracts/deno.json` does **not** currently have an override — the 2.8 carve-out is fresh. | In the impl phase: `grep -rn "isolatedDeclarations" packages plugins` — any per-package `false` either gets deleted (if not justified) or gets a paired `arch-debt.md` entry. |
| B-7 | **Release-eject / package-coupling scratch paths** (the prior plan's "extract to two repos" machinery that 2.8 + `deno pack` make unneeded) | `deno pack` (stretch) + `deno publish` auto-rewrite | **N-A this wave** — `deno pack` is deferred (A-18). | **No action** — the eject path is a post-alpha concern. |
| B-8 | **Per-package `compilerOptions.lib: ["dom","deno.ns","deno.unstable"]` duplicates** | 2.8 standardizes the `lib` shape; per-package overrides should match the root | **Audit-only.** Some packages (e.g. `packages/aspire/deno.json`) omit `compilerOptions.lib` entirely, relying on the workspace root. | In the impl phase: normalize the four packages that have local `lib` overrides — keep them only if they are *narrower* than the root, otherwise remove. |

### Section B recommendation

> **Net deletions: 1 (B-3 partial). Net audits: 4 (B-4, B-6, B-8, and a verification grep for B-1).**
> The 2.8 leverage map is **deletion-light** in this repo because S1 already retired bespoke
> release/version machinery. The real cleanup is **lint-suppression hygiene** (B-4) and
> **per-package `isolatedDeclarations`/`lib` normalization** (B-6, B-8). The single outright
> deletion candidate is in B-3: hand-rolled slow-type workarounds in non-debt packages.

---

## C. Aspire 13.4 feature-adoption matrix

> **Scope:** Aspire 13.4 capabilities the maintainer called out in `research-brief.md` + the live
> surface verified via the Aspire CLI 13.2.2 docs (`aspire docs search "TypeScript AppHost"`,
> `aspire docs get what-is-the-apphost`, `aspire docs get aspire-logs-command`).
> **Current pins (re-verified):** `Aspire.AppHost.Sdk 13.2.2`, `CommunityToolkit.Aspire.Hosting.
> Deno` / `…SQLite 13.1.0`, .NET SDK `10.0.0` (via `SCAFFOLD_VERSIONS`), `net10.0` target
> (re-verified in `ServiceDefaults.csproj.template`).
> **Path-realisation caveat:** the prior note's "TS apphost GA → `apphost.mts` + `.aspire/modules/`"
> implies a **CLI scaffold realignment** (D-3 above). That work is **owned by the CLI Wave 6
> research (PR #43)**, not by this toolchain research. We treat the 13.4 GA shape as a
> **dependency** on the CLI work and **do not duplicate the path-migration design** here.

| # | Feature | Verdict | Concrete workspace action (impl phase) | File(s) touched | Evidence / why |
|---|---|---|---|---|---|
| C-1 | **Bump `Aspire.AppHost.Sdk 13.2.2 → 13.4.x`** | ✅ adopt-now | Update `SCAFFOLD_VERSIONS.ASPIRE_SDK` in the CLI constants. The bump ripples into the generated `dotnet/AppHost/AppHost.csproj` (via interpolation in the C# template / generator) for every downstream `netscript init`. | `packages/cli/src/kernel/constants/scaffold/scaffold-versions.ts` (line 5) | Per the prior note. CommunityToolkit `Deno`/`SQLite` 13.4.x will not be compatible with 13.2.2 SDK surface; coupling is forced. |
| C-2 | **Bump `CommunityToolkit.Aspire.Hosting.Deno` 13.1.0 → 13.4.x** | ✅ adopt-now | Update `SCAFFOLD_VERSIONS.ASPIRE_HOSTING_DENO`. | `packages/cli/src/kernel/constants/scaffold/scaffold-versions.ts` (line 8) | Same coupling rationale as C-1. |
| C-3 | **Bump `CommunityToolkit.Aspire.Hosting.SQLite` 13.1.0 → 13.4.x** | ✅ adopt-now | Update `SCAFFOLD_VERSIONS.ASPIRE_HOSTING_SQLITE`. | `packages/cli/src/kernel/constants/scaffold/scaffold-versions.ts` (line 9) | Same coupling rationale. |
| C-4 | **Confirm CLI-scaffolded TS apphost matches 13.4 GA shape** (`apphost.mts` + `.aspire/modules/` + startup validation) | ⛔ **defer to CLI Wave 6** | **This is owned by the CLI Wave 6 research (PR #43) per the brief's hard boundary on overlap.** The toolchain research does *not* design the path migration. The validation is: when CLI Wave 6 lands the `apphost.mts` migration, verify the `apphost.mts` shim works under `Aspire.AppHost.Sdk 13.4.x`. | `packages/cli/src/kernel/constants/scaffold/scaffold-files.ts` (line 21, `APPHOST_TS`), `packages/cli/src/kernel/constants/scaffold/scaffold-aspire.ts` (lines 3–4, `SDK_IMPORT_FROM_HELPERS`/`SDK_IMPORT_FROM_ROOT`), `packages/cli/src/kernel/templates/aspire/helpers/apphost.ts.template`, all 8 `packages/cli/src/kernel/templates/aspire/helpers/tests/generators-*.ts` test files that assert `'.modules/aspire.ts'` and `'apphost.ts'` literals. | The brief is explicit: "the CLI owns the apphost-scaffold/deploy seam; this owns toolchain version + feature adoption". We flag this as a **cross-research dependency** and stop. |
| C-5 | **Dashboard commands** (typed resource-command args + `WithProcessCommand()`) | 🟡 adopt-with-coordination | Expose `netscript` CLI subcommands (scaffold/seed/migrate) as Aspire dashboard commands. **Coordinate with CLI Wave 6's `deploy`/command-registry work** — they own the command surface; we own the Aspire-side wiring. The seam: a `WithProcessCommand()` call on the `netscript` resource in `apphost.ts`, pointing at the resolved `netscript` binary path. | `packages/aspire/src/adapters/**` (the SDK-adapter layer for the `netscript` resource) — the *Aspire-side* typed-args wrapper lives here. The CLI side is owned by Wave 6. | The 13.4 `WithProcessCommand()` GA was the trigger to re-evaluate. Typed args (C# discriminated unions / TS literal types) make the commands first-class dashboard citizens. |
| C-6 | **`aspire logs/otel --search`** (full-text search) | ✅ adopt-now (e2e gate) | Wire `--search` into the `scaffold-e2e-test.ts` and `e2e:cli` log assertions: a log assertion that previously needed regex matching now becomes `aspire logs <resource> --search "<text>" --format Json \| jq …`. | `.llm/tools/scaffold-e2e-test.ts` (the MCP-friendly E2E smoke), `packages/cli/e2e/cli.ts` (e2e orchestrator) | **Verified live** via `aspire docs get aspire-logs-command` — `--search` is a real flag in 13.2.2 (already GA; the 13.4 brief is just calling attention to it). |
| C-7 | **Aspire MCP** (`list_docs` / `search_docs` / `get_doc` / `list_integrations`) for live toolchain verification | ✅ adopt-now (doctrine change) | Add `.agents/skills/aspire/SKILL.md` section documenting the MCP surface (the SKILL already lists `aspire docs list/search/get` in its CLI table). The MCP wrappers are a stricter, typed alternative for harness agents. | `.agents/skills/aspire/SKILL.md` | **Verified live** — `aspire docs search "TypeScript AppHost"` returned 5 results; `aspire docs get what-is-the-apphost` returned the full page including the explicit `apphost.mts` / `apphost.cs` reference. |
| C-8 | **`aspire doctor` Deno reporting** | ⏸ defer to 13.5 | This is the **13.5 native-Deno-apphost readiness checklist item** (per `microsoft/aspire#16218`). 13.4 has no `Deno` line in `aspire doctor` output (the Deno toolchain is reported via the CommunityToolkit integration, not the doctor). | N/A this wave | The 13.5 seam is designed in Section D. |
| C-9 | **Verify CommunityToolkit 13.4.x exact versions** (the brief asks for this via the Aspire MCP) | 🟡 partial — MCP exposes CLI docs, not NuGet package metadata | Use `npm view communitytoolkit.aspire.hosting.deno versions --json \| jq …` and `nuget.org` for the **exact** 13.4.x GA versions; the Aspire MCP is for *docs*, not package metadata. | N/A (research-only) | The Aspire CLI docs surface in this repo (`aspire docs`) does not expose package version metadata; NuGet and npmjs are the canonical sources. The actual version pins are decided in the impl phase. |

### Section C recommendation

> **Adopt now (5):** C-1, C-2, C-3, C-6, C-7. **Adopt with coordination (1):** C-5 — gated on
> the CLI Wave 6 `deploy`/command-registry work. **Defer to Wave 6 / 13.5 (2):** C-4 (path
> realignment) and C-8 (Deno doctor). **Partial (1):** C-9 — NuGet/npm, not MCP, are the
> version-metadata sources. **Net:** the 13.4 bump is **mostly a 3-line constant change** in
> `scaffold-versions.ts`, plus the 13.4 log-search integration in `.llm/tools/scaffold-e2e-test.ts`.

---

## D. Aspire legacy removal + 13.5 native-Deno-apphost readiness seam

> **Scope:** superseded hand-patched / generated-artifact paths the 13.4 GA makes redundant,
> plus the **13.5 flip seam** design (mirror of `microsoft/aspire#16218`'s validation checklist).
> **Hard rule:** no back-compat (alpha). **Boundary:** path-migration is CLI Wave 6; this section
> only catalogs what *this* toolchain research owns for legacy removal.

### D.1 — Aspire 13.4 legacy removal list

| # | Legacy path / pattern | 13.4 superseding capability | Status in this repo | Action (impl phase) |
|---|---|---|---|---|
| D.1-1 | **CommunityToolkit 13.1.0 → 13.4.x version drift between current and target** | Bump | The 13.1.0 pins in `SCAFFOLD_VERSIONS` are the legacy. | **Delete (replace)** — set `ASPIRE_HOSTING_DENO` and `ASPIRE_HOSTING_SQLITE` to the 13.4.x GA. |
| D.1-2 | **`SCAFFOLD_COMMUNITY_TOOLKIT.VERSION: '13.2.1-beta.532'`** (a separate, older beta pin in `scaffold-aspire.ts`) | Bump to 13.4.x GA | Re-verified at `packages/cli/src/kernel/constants/scaffold/scaffold-aspire.ts` (line 25, `SCAFFOLD_COMMUNITY_TOOLKIT`). This is **duplicated state** with `SCAFFOLD_VERSIONS.ASPIRE_HOSTING_DENO`. | **Delete (consolidate):** the 13.4.x version should live in `SCAFFOLD_VERSIONS`; `SCAFFOLD_COMMUNITY_TOOLKIT` should either be removed or reduced to the `PACKAGE_ID` constant. Having two version constants for the same package is a DRIFT risk. |
| D.1-3 | **`.modules/aspire.ts` path** (SCAFFOLD shape, not 13.4 GA shape) | 13.4 GA uses `.aspire/modules/aspire.ts` | Confirmed in `SCAFFOLD_ASPIRE_MODULES.SDK_IMPORT_FROM_HELPERS = '../.modules/aspire.ts'` and 4+ test files. | **Defer to CLI Wave 6.** Toolchain research flags the path delta; the path migration is owned by the CLI work (per the brief's overlap rule). |
| D.1-4 | **`apphost.ts` filename** (SCAFFOLD shape) | 13.4 GA uses `apphost.mts` | Confirmed in `SCAFFOLD_FILES.APPHOST_TS = 'apphost.ts'`, the template file `apphost.ts.template`, and 12+ test files. | **Defer to CLI Wave 6.** Same ownership as D.1-3. |
| D.1-5 | **Manual `tsx` + `vscode-jsonrpc` pin** (`'4.21.0'`, `'8.2.0'` in `package.json` generator) | 13.4 may pin newer tsx/jsonrpc compatible with the regenerated SDK | Re-verified at `packages/cli/src/kernel/application/scaffold/render-ts-apphost.ts` (lines 51–57). | **Audit-only** in this research: verify against 13.4's regenerated SDK module — the version pins may need a bump, but the *shape* (the `package.json` file) stays. |
| D.1-6 | **The hand-patched `_aspire-compat.ts` D-7 workaround** (Node-compat shim for `aspire#15812`) | Native Deno apphost in 13.5 (per `microsoft/aspire#16218` — we requested it) | Confirmed at `packages/cli/src/kernel/assets/aspire/helpers/_aspire-compat.ts.template` and `packages/cli/src/kernel/constants/scaffold/scaffold-aspire.ts` line 5 (`ASPIRE_COMPAT_IMPORT`). | **Defer to 13.5.** Keep the shim in 13.4; the 13.5 native Deno apphost will supersede it. The 13.4 design is **shim-aware** (D.2 below). |
| D.1-7 | **Per-resource `WithHttpEndpoint` / `WithExternalHttpEndpoints` / `WithEnvironment` boilerplate** that the typed command args collapse | Typed resource-command args + `WithProcessCommand()` (13.4) | Re-verified by scanning `packages/aspire/src/` — the SDK-adapter layer exists but I did not see `WithProcessCommand()` calls; the dashboard-command surface is not yet wired. | **No deletion this wave** — this is a *new* wiring (C-5), not a deletion. The current state is "no dashboard command yet", which is fine pre-13.4. |
| D.1-8 | **Standalone `_aspire-compat` import path** (the `.ts` shim file ships in every scaffold) | Collapsed into the regenerated SDK at 13.5 | Same as D.1-6. | **Defer to 13.5.** |

### D.2 — 13.5 native-Deno-apphost readiness seam (design only)

> **Source of truth for the seam checklist:** `microsoft/aspire#16218` (milestone **13.5**,
> opened by `sebastienros`, with feedback from `rickylabs` — i.e. us).
> **Constraint:** 13.4 is self-sufficient (no launch gate on 13.5). The seam design lets us
> flip the 13.4 apphost to the 13.5 native Deno apphost **without a CLI scaffold rewrite**.

**Mirror of #16218's validation checklist (applied to our repo):**

| #16218 work-to-track item | Our 13.4 apphost position | Flip-to-13.5 action (impl phase) |
|---|---|---|
| **First-pass scope decision:** `package.json`-based Deno vs broader `deno.json` / task / import-map workflows | Today we ship both a `package.json` (for tsx + vscode-jsonrpc) **and** a `deno.json` (workspace root). The 13.4 scaffold path uses `package.json` only; the Deno toolchain is the runtime, not the package manager. | **Decide in 13.5 design window:** do we go `packageManager: "deno@…"` in `aspire.config.json` (richer), or keep the `package.json` shim? Lean toward the richer form (mirrors the Fresh/Snowpack precedent). |
| **`TypeScriptAppHostToolchainResolver` gains a `Deno` toolchain** (detect `packageManager: "deno@…"`, honor `deno.lock` / `deno.json(c)`, generate execute/watch commands) | Not present — the CommunityToolkit integration *bypasses* the toolchain resolver. The 13.4 apphost is "Deno is the runtime but the integration package owns the resolution". | **Add a `Deno` toolchain resolver** that reads `deno.json` + `deno.lock` and emits `deno run --unstable-kv apphost.mts` (and the `deno task` alias). This is the single biggest change at 13.5. |
| **CLI dependency + `aspire doctor` Deno reporting** | Not present — `aspire doctor` has no Deno line in 13.4. The Deno runtime is validated only by the `netscript init` smoke (`scaffold-e2e-test.ts`). | **Add a `netscript aspire doctor` (or upstream contribution) that surfaces:** Deno version, `deno.json` workspace root, `deno.lock` checksum, unstable flags in use, `tsx`/`vscode-jsonrpc` versions, Aspire SDK + CommunityToolkit pins. |
| **Validation coverage:** unit tests for toolchain resolution + doctor, and **CLI E2E for restore/run/doctor with a configured Deno toolchain** | Partial — the `scaffold-e2e-test.ts` covers `restore` + `run`, not `doctor`. | **Add an `aspire doctor` step to the e2e smoke** that asserts a Deno line is present. **Mirror the test names from #16218's PR** so the framework's CI is the upstream validation. |

**Strategic positioning (per the prior note):** design the 13.4 apphost so it flips cleanly to the
13.5 native Deno apphost, and make our repo's Aspire e2e the **reference validation** for that
feature. We are the upstream requester; our e2e suite should mirror #16218's validation checklist
so the framework doubles as the proving ground.

**The single concrete 13.4 design choice that makes the 13.5 flip cheap:**

> Generate the apphost in such a way that **all Aspire-13.5-specific concepts (Deno toolchain
> resolver, `packageManager: "deno@…"`, `deno.lock` checksum) are present as *comments and stubs*
> in 13.4, not implemented.** This makes the 13.5 diff a *fill-in-the-stubs* PR, not a rewrite.
> Concretely: the 13.4 `apphost.ts` template includes a `# [aspire-13.5] toolchain detection` block
> with `// TODO(13.5): replace with TypeScriptAppHostToolchainResolver.Deno`. The 13.5 work is
> then "delete the TODO, replace with the resolver call" — minimum surface area, maximum review
> trust.

**Boundary reminder:** 13.4 is self-sufficient; 13.5 is an upgrade, not a launch gate. If 13.5
slips, alpha-0 still ships on the 13.4 generated-artifact path.

### Section D recommendation

> **Net deletions: 2** (D.1-1, D.1-2 — both are version-pin consolidations). **Net deferrals to
> CLI Wave 6: 2** (D.1-3, D.1-4 — path realignment). **Net deferrals to 13.5: 2** (D.1-6, D.1-8
> — `_aspire-compat.ts` shim removal). **Audits: 1** (D.1-5 — tsx/jsonrpc pin). **New wiring: 1**
> (C-5, Section C — `WithProcessCommand()` dashboard commands, owned jointly with Wave 6).
> **13.5 flip seam:** the 13.4 apphost ships with stubbed `# [aspire-13.5]` blocks so the 13.5
> diff is a fill-in-the-stubs PR.

---

(Continued: Section E, F, and slice plan in the next edits — file is durable so far.)

---

## E. Coordinated validation plan (design only)

> **Scope:** the smallest gates that prove each upgrade landed correctly, mapped to existing
> `deno task` invocations + the stack e2e smoke. **Per-PR:** the workspace gates below.
> **Nightly/release only:** the full `scaffold-e2e-test.ts` run (it's expensive — it spins up
> Aspire, restores NuGet, starts the `netscript init`-shaped playground). **Not per-PR**
> because the NuGet + Deno dependency restore dominates the CI budget.

### E.1 — Per-PR gate sequence (workspace-level)

Run **in this order** from the repo root. Each step is an existing wrapper or task; nothing new
to invent, just a new ordering for the upgrade slices.

| # | Gate | Command | Pass criteria | Maps to |
|---|---|---|---|---|
| E-1 | `deno ci` (lockfile + cache sanity) | `deno ci --frozen` | exit 0; no lockfile drift; no `node_modules` growth | New in 2.8 (Section A-7) |
| E-2 | `deno audit` (supply-chain) | `deno audit` | exit 0; no vulnerabilities at the current lockfile state | New in 2.8 (Section A-9) |
| E-3 | Type check | `deno task check` | exit 0; 0 errors | existing (A-2, A-10) |
| E-4 | Lint | `deno task lint` | exit 0; 0 errors. **Watch for B-4 dead-suppression hits** in the per-package diff. | existing (A-3, A-4) |
| E-5 | Format check | `deno task fmt:check` | exit 0 | existing |
| E-6 | Tests | `deno task test` | exit 0; all green | existing (A-13) |
| E-7 | Architecture check (doctrine) | `deno task arch:check` | exit 0; no new `arch-debt.md` violations | existing (B-6, A-12 paired) |
| E-8 | Publish dry-run (smoke for `deno publish` path→registry auto-rewrite) | `deno task publish:dry-run` | exit 0; no path-leak into the registry; **A-6 live verification** | existing |
| E-9 | Per-function coverage report | `deno coverage --include='packages/contracts/**' --include='packages/triggers/**' --include='packages/service/**' --include='packages/plugin/**' --exclude='**/*.test.ts' --json \| deno run …report.ts` (script TBD) | exit 0; every exported symbol of the four carve-out packages appears in the report | New in 2.8 (A-14) |

### E.2 — Nightly / release-only stack e2e

| # | Gate | Command | Pass criteria | Maps to |
|---|---|---|---|---|
| E-10 | `netscript init` against the playground | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | exit 0; all 6 stages of the `scaffold.runtime` suite green | existing harness smoke (the heavy one — per `AGENTS.md` "merge-readiness" guidance) |
| E-11 | `aspire run` end-to-end (Aspire 13.4 + Deno 2.8 stack) | same as E-10 (the smoke is stack-orthogonal — it exercises `aspire run` + `aspire logs --search` C-6 internally) | exit 0; `aspire logs --search` finds the seeded "ready" message; no doctor errors | New — relies on C-6 `aspire logs --search` |
| E-12 | CommunityToolkit 13.4.x pin verification | `deno run --allow-read --allow-run .llm/tools/fitness/check-scaffold-versions.ts --aspects aspire` (script TBD) | exit 0; generated `dotnet/AppHost/AppHost.csproj` references `Aspire.AppHost.Sdk 13.4.x`, `CommunityToolkit.Aspire.Hosting.Deno 13.4.x`, `…SQLite 13.4.x` | New in 13.4 (C-1, C-2, C-3) |
| E-13 | Aspire doctor with Deno line (13.5 seam) | `aspire doctor` (post-13.5 only) | 13.5 step — surfaces Deno toolchain section; mirror #16218's check | Defer to 13.5 (D.2) |

### E.3 — Order of execution (slice plan gateway)

The slice plan in Section G orders the impl branches; the gates above are the **single source of
truth** for what each slice must pass to merge. E-1 → E-9 are required for **every** impl branch.
E-10 → E-12 are required for the **stack-coordination branch** (the one that touches both Deno and
Aspire pins). E-13 is deferred to 13.5.

### E.4 — What is **not** a gate

- **`deno upgrade`** (the user explicitly forbade SDK bump commands). The upgrade happens via
  `setup-deno@v2` `deno-version: v2.8.x` (A-1) + the `deno install` cache-warm step in
  `copilot-setup-steps.yml`. No interactive upgrade.
- **`deno cache --reload`** and lockfile deletion (user-forbidden; lock hygiene preserved).
- **Per-function coverage on plugin packages** (the brief scopes the carve-outs to
  `contracts`/`triggers`/`service`/`plugin` — *not* `plugins/*`, which are the *consumer* plugins
  installed by `netscript init`. Consumer-plugin coverage is a separate gate owned by S3/S4).

### Section E recommendation

> **9 per-PR gates** (E-1 → E-9), **3 nightly/release gates** (E-10 → E-12), **1 deferred to 13.5**
> (E-13). The cheapest new gates (E-1, E-2) are also the highest signal: lockfile drift and
> supply-chain violations are the dominant failure modes for "I just bumped the toolchain". The
> stack e2e (E-10) is the **one** that proves the Aspire 13.4 ↔ Deno 2.8 coupling is sane.

---

## F. Own analysis / risk register

> **Scope:** risks the prior notes flagged but did not design mitigations for, plus risks
> surfaced by this re-verification. **Each risk has a name, a likelihood (L/M/H), a
> blast-radius (L/M/H), an owner, and a mitigation.**

### F.1 — 2.8 ↔ Fresh / Lume / JSR interop risks

| ID | Risk | L | B | Owner | Mitigation |
|---|---|---|---|---|---|
| R-1 | **`fresh` (packages/fresh)** uses Preact + signals; Deno 2.8's TS 6.0.3 may tighten or relax inference for some `@preact/signals` overloads, breaking `fresh-ui` consumers. | M | M | S5 (docs site + UI) | Run `deno task check` on `packages/fresh` and `packages/fresh-ui` as the first check of the upgrade slice. If it breaks, lock TS at the previous bundled version via the 2.8 `typescript:` field (allowed in 2.8 `deno.json`) — **no** introducing `@ts-ignore` patches. |
| R-2 | **JSR publish gate:** 2.8 makes `isolatedDeclarations` + `lib: ["dom","deno.ns","deno.unstable"]` the canonical shape, and JSR's validator will reject packages that leak Node-only types. | M | H | S3 | Confirm `deno task publish:dry-run` is green for **all 28 member packages** before merge. The lint `include: ["no-node-globals","no-process-global"]` is the second line of defense. |
| R-3 | **Lume** is a static-site generator; we don't use it today, but the prior note calls out that 2.8's `deno compile` framework detection may recommend Lume for `docs/`. | L | L | S5 (out of scope) | No action this wave. S5 will decide the docs site generator; this research does not pre-empt that. |

### F.2 — `isolatedDeclarations` breakage in the four heavy-generic packages

| ID | Risk | L | B | Owner | Mitigation |
|---|---|---|---|---|---|
| R-4 | **`packages/contracts`**, **`packages/triggers`**, **`packages/service`**, **`packages/plugin`** all have high generic complexity (Zod-derived types, registry-derived types). TS 6.0.3 + `isolatedDeclarations: true` may force the `--allow-slow-types` carve-out (A-12) to be **wider** than expected, leaking debt. | H | M | Architecture (doctrine) follow-up | The carve-out is per-package, never workspace. Each carve-out gets a `DEBT_ACCEPTED` row in `arch-debt.md` with: (a) the affected public symbol count, (b) the 2.8 score factor that drops, (c) a remediation plan (Zod → hand-written interface for the top 5 export hot-spots). **Cap:** if a single package needs > 20 symbols to be slow-typed, the upgrade slice is blocked on a refactor — not on more carve-outs. |
| R-5 | **`deno doc --lint`** (used by the JSR publish gate) may fail on the carve-out packages because the inferred return types are imprecise. | M | M | S3 | Test with `deno doc --filter mod contracts` and `triggers` etc. If `--lint` fails, disable `--lint` **only** for the affected package's `publish` step — keep the workspace gate on. |

### F.3 — .NET 10 + Aspire 13.4 prerelease interplay

| ID | Risk | L | B | Owner | Mitigation |
|---|---|---|---|---|---|
| R-6 | **.NET 10 is pre-release (RC).** Some `Microsoft.Extensions.* 10.0.0` packages may shift between RC and GA. The current `SCAFFOLD_VERSIONS.MICROSOFT_EXTENSIONS: '10.0.0'` pin may need a `10.0.0-rc.X` bump. | H | M | S4 | Generate `global.json` with `allowPrerelease: true` (already on; re-verified). Keep the `DOTNET_SDK` constant pointing at `10.0.0` (the float comes from `rollForward: latestMinor` in the generator). Add a CI step: `dotnet --list-sdks` must show a 10.x line in the upgrade slice. |
| R-7 | **Aspire 13.4 itself is in pre-release** (the brief says "13.4.x"; the Aspire repo's `13.4.0-preview.1.25520.3` is the latest as of this research). A pre-release SDK pin in a generated `AppHost.csproj` is fragile across Aspire 13.4 preview bumps. | H | H | S4 | Pin to the **first 13.4.x GA** (`13.4.0` once Aspire cuts it; else the latest stable preview). Document the pin in `scaffold-versions.ts` with a comment: "Update to first 13.4.x GA; preview pins are forbidden." CI test must assert the pin is not a `*-preview.*` or `*-rc.*` string. |
| R-8 | **`net10.0` framework reference** may not be available on every CI runner unless the .NET 10 SDK is installed (currently it is — verified in `copilot-setup-steps.yml:43–46`). | L | M | CI | Keep the `actions/setup-dotnet@v5` step; add a guard test that fails the upgrade slice if `dotnet --list-runtimes \| grep 10` returns 0. |

### F.4 — CI floating `v2.x` → pinned `2.8.x` decision

| ID | Risk | L | B | Owner | Mitigation |
|---|---|---|---|---|---|
| R-9 | **Pinning to `v2.8.x` makes future minor upgrades intentional** (a PR against `copilot-setup-steps.yml` is required) — good for the alpha, but a friction point for fast iterations. | L | L | Release | The pin is the **right** choice for alpha (visible, reviewed). Re-evaluate at beta: switch back to `v2.x` once we trust the 2.x minor chain. |
| R-10 | **The CI workflow's `deno install` cache key** includes the Deno version. Pinning to `2.8.x` invalidates caches on every minor bump; pinning to `2.x` invalidates only on major. | L | L | CI | Use the full `2.8.x` string as the cache key prefix; rely on the existing `denoland/setup-deno@v2` cache strategy. Document in the PR description. |

### F.5 — Deno ↔ Aspire upgrade ordering and coupling

| ID | Risk | L | B | Owner | Mitigation |
|---|---|---|---|---|---|
| R-11 | **Aspire 13.4 depends on a recent TypeScript** at the regenerated SDK boundary. If we bump Deno (and thus bundled TS) before Aspire 13.4, we may emit a TS version that 13.4's regenerated SDK doesn't tolerate. **Or vice versa.** | M | H | S4 (with S2 input) | **Coupled upgrade:** bump both in the **same slice** (the slice plan in Section G enforces this). The slice ships as a single PR: `scaffold-versions.ts` change + `copilot-setup-steps.yml` Deno pin + the per-package `--allow-slow-types` carve-outs. The two halves land together. |
| R-12 | **Aspire 13.4 regenerates `…/modules/*.ts`** from a C# schema; the regenerated code may use syntax features that Deno 2.7 cannot parse (forcing a Deno upgrade to be a *prerequisite* of an Aspire bump). | M | M | S4 | Verify by reading the Aspire 13.4 preview release notes (or running the regeneration in a sandbox) before committing to the upgrade. If TS 5.6+ is required, then the Deno bump is a **hard prerequisite** of the Aspire bump. |
| R-13 | **`packages/aspire/`** (the SDK-agnostic TS wrapper) imports from `jsr:@netscript/*`. If a peer package's `isolatedDeclarations` carve-out changes its `.d.ts` shape, the wrapper may fail to type-check. | M | M | S4 + Architecture | Run `deno task check` on `packages/aspire` against the carve-out packages; the carve-out is **per-package**, not transitive, so the wrapper's view is fine if the wrapper itself doesn't import a carved-out symbol. |

### F.6 — Overlap with the Wave 6 CLI research (PR #43)

| ID | Risk | L | B | Owner | Mitigation |
|---|---|---|---|---|---|
| R-14 | **The CLI owns the apphost scaffold + deploy seam; this research owns the toolchain version + feature adoption.** If the two researches both touch `scaffold-versions.ts` or `scaffold-files.ts` in the same PR, the diffs conflict. | M | M | Release | **Single-file ownership rule** (mirrors the program's public/maintainer isolation doctrine): the toolchain upgrade owns `scaffold-versions.ts` and `copilot-setup-steps.yml`; the CLI Wave 6 owns `scaffold-files.ts` and `scaffold-aspire.ts` (for the `APPHOST_TS` constant and `SDK_IMPORT_FROM_HELPERS` paths). The integration is the **PR that lands the version pin bump** — the CLI Wave 6 path migration lands in a *separate* PR that consumes the new pin. This matches the "CLI is upstream of toolchain version" / "toolchain version is upstream of CLI path" ordering. |
| R-15 | **`WithProcessCommand()` dashboard commands** (C-5) is a *new* wiring that lives in `packages/aspire/src/adapters/**` on the Aspire side **and** in the CLI command-registry on the CLI side. If both researches try to define the typed-args schema, the schema fragments. | M | M | Release (joint) | The typed-args schema lives in **the CLI command-registry** (CLI is the schema-of-truth, as the public surface). `packages/aspire` *consumes* the schema and maps it to `WithProcessCommand()` calls. Single source of truth, single ownership. |
| R-16 | **`aspire.config.json`** references `.modules/aspire.ts` (D.1-3, D.1-4) — the path realignment is a Wave 6 deliverable. If the toolchain upgrade ships before the Wave 6 path realignment, the generated `aspire.config.json` is **drift from the 13.4 GA shape**. | H | M | Release | The toolchain upgrade ships the **13.4.x version pin only** in its first PR; the `aspire.config.json` path realignment lands in the Wave 6 follow-up PR. Until then, 13.4 SDK runs the *legacy* `.modules/` path (it is forward-compatible — the SDK accepts both, per the live 13.2.2 verification). |

### F.7 — Risk summary table

| ID | Risk (one line) | L | B | Owner |
|---|---|---|---|---|
| R-1 | Fresh / Preact inference changes under TS 6.0.3 | M | M | S5 |
| R-2 | JSR publish gate rejects Node-leaking types | M | H | S3 |
| R-3 | Lume confusion in `deno compile` framework detection | L | L | S5 (deferred) |
| R-4 | `isolatedDeclarations` carve-out scope explodes in 4 generic packages | H | M | Architecture |
| R-5 | `deno doc --lint` fails on carve-out packages | M | M | S3 |
| R-6 | .NET 10 RC shifts break `Microsoft.Extensions.* 10.0.0` | H | M | S4 |
| R-7 | Aspire 13.4 is pre-release; preview pin forbidden in scaffold | H | H | S4 |
| R-8 | `net10.0` framework reference unavailable in some CI runners | L | M | CI |
| R-9 | Pinning `v2.8.x` adds friction for fast iterations | L | L | Release |
| R-10 | CI cache invalidation on Deno minor bump | L | L | CI |
| R-11 | Deno + Aspire 13.4 must bump together (type-system coupling) | M | H | S4 (with S2) |
| R-12 | Aspire 13.4 regenerated SDK may require TS 5.6+ | M | M | S4 |
| R-13 | Wrapper package's type view shifts when peer carve-out changes | M | M | S4 + Architecture |
| R-14 | File-ownership overlap with Wave 6 (scaffold-versions vs scaffold-files) | M | M | Release |
| R-15 | Typed-args schema duplicated between `packages/aspire` and CLI | M | M | Release (joint) |
| R-16 | `aspire.config.json` path drift until Wave 6 path realignment | H | M | Release |

### Section F recommendation

> **Highest-blast risks (B=H):** R-7 (Aspire 13.4 preview pin — guard with the CI "not preview"
> test), R-11 (coupled Deno+Aspire upgrade — guard with the single-PR slice plan), R-2 (JSR
> publish gate — guard with `publish:dry-run` as E-8).
> **Highest-likelihood risks (L=H):** R-4 (carve-out scope — guard with the 20-symbol cap), R-6
> (.NET 10 RC shifts — guard with `allowPrerelease: true`), R-7 (Aspire preview), R-16
> (`.modules/` path drift — guard with the single-file ownership rule).
> **Two risks are deferred:** R-3 (Lume — out of scope).

---

## G. Proposed upgrade slice plan (for the LATER impl phase — not executed here)

> **Goal:** minimize the *time the workspace is in a known-broken intermediate state* and respect
> the Deno↔Aspire type-system coupling (R-11). **Output:** ordered branches that, when merged in
> sequence, never leave the `main` branch in a state where `deno task check` is red, where
> `e2e:cli` smoke would fail, or where a downstream `netscript init` would emit a broken project.
> **Sub-branches off `feat/package-quality` @ `fcef53d`** unless stated otherwise.

### G.1 — Slice ordering rationale

The two halves of the upgrade — Deno 2.8 and Aspire 13.4 — have a **type-system coupling** (R-11)
but a **zero runtime coupling**: Deno runs `deno task check`/`test`; Aspire 13.4 runs the
`AppHost` C# process. The natural ordering is therefore:

1. **Deno 2.8 first**, *without* Aspire pin changes — proves the Deno half is sane in isolation.
2. **Aspire 13.4 second**, *with* a hard CI guard that 13.4's regenerated SDK parses under Deno
   2.8 — proves the coupled half is sane.

A **coupled third slice** locks the matrix (`scaffold-versions.ts` + `copilot-setup-steps.yml`
together) and is the **only** branch that can land when 13.4 is the target pin (R-11). The
"decoupled" path (Deno first, Aspire second) is the **default**; the "coupled" path is the
**fallback** if Aspire 13.4 GA slips after 2.8 GA.

### G.2 — Slice 0: Toolchain pin foundation (Deno only, Aspire 13.4-preview-tolerated)

> **Sub-branch off `feat/package-quality` @ `fcef53d`:**
> `chore/deno-2.8-toolchain-pin-foundation`

| Step | What changes | Gate |
|---|---|---|
| 0.1 | `copilot-setup-steps.yml`: `deno-version: v2.x` → `v2.8.x` (A-1) | E-1 → E-9 (per-PR) |
| 0.2 | `deno.json`: add `catalog:` block with current `@std/*`, `zod`, `clsx`, `preact`, `@preact/signals`, `tailwind-merge` pins (A-8) | E-1 → E-9 |
| 0.3 | Update the 28 member `deno.json` files to use `catalog:` references (A-8) | E-3, E-4, E-5, E-6 |
| 0.4 | B-4: grep + remove dead `no-node-globals` / `no-process-global` suppressions | E-4 |
| 0.5 | B-6 + B-8: normalize per-package `isolatedDeclarations` + `lib` overrides; pair with `arch-debt.md` entries as needed | E-3, E-7 |
| 0.6 | A-12: add the four `--allow-slow-types` carve-outs; pair each with a `DEBT_ACCEPTED` row in `arch-debt.md` | E-7 |
| 0.7 | A-13: per-test `timeout` + `Deno.test.sanitizer()` in new tests (no blanket change to existing tests) | E-6 |
| 0.8 | A-14: per-function coverage report wired as CI artifact (script TBD under `.llm/tools/`) | E-9 (new) |
| 0.9 | A-9: `deno audit` added to CI (read-only) | E-2 (new) |
| 0.10 | A-17: `deno task --parallel` for the CI fan-out | E-3, E-6 |

**Pass criteria to merge slice 0:** all E-1 → E-9 green, **all 28 packages publish:dry-run green
(E-8)**, no new per-package `isolatedDeclarations: false` outside the four carve-outs. **A-16
(OTel exporters) and A-18 (`deno pack`) are NOT in this slice — explicit deferral.**

### G.3 — Slice 1: Aspire 13.4 pin bump (decoupled from Deno, if Aspire 13.4 GA is out)

> **Sub-branch off `feat/package-quality` @ `fcef53d`:** `chore/aspire-13.4-version-bump`
> **Pre-condition:** Aspire has cut a 13.4.x GA. If 13.4 is still preview-only, jump to
> Slice 1b (the coupled slice).

| Step | What changes | Gate |
|---|---|---|
| 1.1 | `scaffold-versions.ts`: `ASPIRE_SDK: '13.2.2'` → `13.4.x` (C-1) | E-12 (new — pin guard) |
| 1.2 | `scaffold-versions.ts`: `ASPIRE_HOSTING_DENO: '13.1.0'` → `13.4.x` (C-2) | E-12 |
| 1.3 | `scaffold-versions.ts`: `ASPIRE_HOSTING_SQLITE: '13.1.0'` → `13.4.x` (C-3) | E-12 |
| 1.4 | `scaffold-aspire.ts`: `SCAFFOLD_COMMUNITY_TOOLKIT.VERSION` either removed (D.1-2) or consolidated to point at `SCAFFOLD_VERSIONS.ASPIRE_HOSTING_DENO` | E-3, E-4 |
| 1.5 | D.1-5 audit: `tsx` / `vscode-jsonrpc` pins in `render-ts-apphost.ts` checked against 13.4 SDK's emitted versions | E-3, E-6 |
| 1.6 | D.2: stub `# [aspire-13.5]` blocks in the `apphost.ts` template (comments + `// TODO(13.5)`) | E-3 (template validates) |
| 1.7 | C-6: `aspire logs <resource> --search` used in `scaffold-e2e-test.ts` (Nightly) | E-11 |

**Pass criteria to merge slice 1:** all E-1 → E-9 green (the per-PR subset), E-12 green, the
generated `dotnet/AppHost/AppHost.csproj` references 13.4.x, the e2e smoke (E-10) green. The
**path realignment** (`apphost.mts` + `.aspire/modules/`) is **NOT** in this slice — that's
Wave 6.

### G.4 — Slice 1b: Aspire 13.4 coupled slice (fallback if 13.4 is still preview)

> **Sub-branch off slice 0 (NOT off `feat/package-quality`):**
> `chore/deno-2.8-aspire-13.4-coupled` — a single PR that combines slice 0 + slice 1
> **Rationale:** R-11 forces this when the Aspire 13.4 regenerated SDK needs TS 5.6+ and 2.8
> is the only Deno that ships it. The coupled slice ships the Deno pin + the Aspire pin in the
> same PR; reviewers see one diff, not two. **All gates E-1 → E-12 must pass together.**

### G.5 — Slice 2: Doctor + typed-args wiring (post-13.4 GA; CLI-coordinated)

> **Sub-branch off slice 1 (or slice 1b):** `chore/aspire-13.4-doctor-and-typed-commands`
> **Coordination required:** this slice is **joint** with the Wave 6 CLI research's
> `deploy`/command-registry work (R-15). It cannot land before the Wave 6 typed-args schema
> lands; it **must** land in the same release window as the Wave 6 schema.

| Step | What changes | Gate |
|---|---|---|
| 2.1 | C-5: `WithProcessCommand()` calls in `packages/aspire/src/adapters/**`, consuming the CLI's typed-args schema (Wave 6) | E-3, E-10 |
| 2.2 | `.agents/skills/aspire/SKILL.md`: document the `aspire docs list/search/get` + `aspire logs --search` MCP surface (C-7) | Doc gate (no test) |
| 2.3 | `scaffold-e2e-test.ts`: add a `aspire doctor` step that asserts the 13.5 Deno line is present **only when 13.5 is the active target** (otherwise the assertion is a skip) | E-11 |
| 2.4 | D.1-7: collapse `WithHttpEndpoint` + `WithExternalHttpEndpoints` boilerplate around the new typed-args command surface | E-3, E-6 |

### G.6 — Slice 3: 13.5 flip (post-13.5 GA, NOT a launch gate)

> **Sub-branch off slice 2:** `chore/aspire-13.5-native-deno-apphost`
> **Pre-condition:** Aspire cuts 13.5 with `microsoft/aspire#16218` merged.

| Step | What changes | Gate |
|---|---|---|
| 3.1 | D.1-6 + D.1-8: delete `_aspire-compat.ts` shim; `scaffold-aspire.ts` `ASPIRE_COMPAT_IMPORT` constant removed | E-3, E-10 |
| 3.2 | D.2: fill the stubbed `# [aspire-13.5]` blocks in the apphost template — replace `// TODO(13.5)` with `TypeScriptAppHostToolchainResolver.Deno` | E-3, E-10 |
| 3.3 | E-13: `aspire doctor` step in the e2e smoke asserts the Deno toolchain line is present (was a skip in 13.4) | E-13 (new, no longer skipped) |

### G.7 — Slice plan visual

```
feat/package-quality @ fcef53d
├── chore/deno-2.8-toolchain-pin-foundation           [slice 0 — Deno only]
│   └── chore/deno-2.8-aspire-13.4-coupled            [slice 1b — fallback]
│       └── chore/aspire-13.4-doctor-and-typed-commands [slice 2 — joint with Wave 6]
│           └── chore/aspire-13.5-native-deno-apphost   [slice 3 — post-13.5 GA, not a launch gate]
└── chore/aspire-13.4-version-bump                     [slice 1 — decoupled, default if 13.4 GA pre-2.8 GA]
    └── (rejoin slice 2 line)
```

### Section G recommendation

> **Default path:** slice 0 (Deno only) → slice 1 (Aspire 13.4 GA decoupled) → slice 2 (joint
> with Wave 6) → slice 3 (13.5). **Fallback path:** slice 0 → slice 1b (coupled) → slice 2 → slice 3.
> **Each slice is independently mergeable** with the per-PR gates E-1 → E-9 green; the
> **nightly/release-only gates E-10 → E-12** are required only for the Aspire-touching slices.
> **13.5 is not a launch gate** — alpha-0 ships on slice 1 (or 1b) + slice 2 complete.

---

## End-to-end deliverable checklist (for the impl phase, not executed here)

- [ ] Deno 2.8 adoption matrix (Section A) — all ✅ rows landed in slice 0
- [ ] Deno 2.8 legacy removal (Section B) — B-1 verification grep + B-4 suppression cleanup + B-6
      + B-8 audit + B-3 partial removal landed in slice 0
- [ ] Aspire 13.4 adoption matrix (Section C) — C-1, C-2, C-3, C-6, C-7, C-5 (post-Wave 6) landed
- [ ] Aspire 13.4 legacy removal (Section D.1) — D.1-1, D.1-2, D.1-3, D.1-4 (last two joint with
      Wave 6) landed
- [ ] 13.5 flip seam (Section D.2) — stubbed `# [aspire-13.5]` blocks landed in slice 1
- [ ] Coordinated validation plan (Section E) — E-1 → E-12 wired as CI gates; E-13 deferred
- [ ] Risk register (Section F) — R-1 → R-16 monitored per slice; R-7, R-11, R-2 are the hard
      gates
- [ ] Slice plan (Section G) — slices 0, 1, 1b, 2, 3 in that order; 13.5 not a launch gate


