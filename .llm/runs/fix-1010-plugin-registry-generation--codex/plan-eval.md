# PLAN-EVAL — fix-1010-plugin-registry-generation--codex

- Plan evaluator session: Claude Code + OpenRouter `qwen/qwen3.7-max` / 2026-08-01
- Run: `fix-1010-plugin-registry-generation--codex`
- Surface / archetype: `packages/cli` public plugin generation and sync / Archetype 6 (CLI /
  Tooling)
- Scope overlays: none

## Checklist results

| Plan-Gate item                          | Result | Evidence / location                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research present and current            | PASS   | `research.md` exists; re-baselined against `origin/main` @ `3ab64720ffe06dedc80f12e8f7bb9fa281de37b9` on 2026-08-01. Clean-room reproduction captured in `.llm/tmp/issue-1010-clean-room-repro.log`. Carried-in issue #1010 brief explicitly re-derived; findings table narrows root cause from the suspected config-loading defect to the more specific parent-process `ModuleManifestResolver` import. No prior plan/audit/run carried in.                                                                                                                                                                                                                                                                                                                              |
| Decisions locked                        | PASS   | D1–D7 each state a decision with explicit rationale. D1 (`generate plugins` authoritative) — command already documented as the registry command. D2 (sync delegates) — removes duplicate behavior and parent-process import defect. D3 (generic discovery via installed metadata + published `scaffold.runtime.json`) — avoids host-side plugin-name coupling. D4 (project-rooted subprocess via `ProcessPort` + `--config`) — preserves import map. D5 (plugin-owned generators are authority) — runtime loaders consume those exact outputs. D6 (declared-target empty failure) — satisfies non-zero acceptance without penalizing no-runtime-generator plugins. D7 (generic walker retained for item-level commands only) — serves a different SDK discovery contract. |
| Open-decision sweep                     | PASS   | Two open decisions listed: (1) Persistence of install metadata — safe to defer; existing `appsettings.json` metadata suffices for this fix. (2) AI registry integration — safe to defer; generic manifest-driven approach handles it but acceptance gates workers/sagas/triggers only. Neither forces rework when deferred. Evaluator's independent sweep found no additional open decisions: the published-manifest resolution mechanism (JSR HTTP vs file URL) is addressed by risk register item 1 and the design's discriminated-union source model; the `--official-samples` flag is an implementation detail plugin generators tolerate as absent.                                                                                                                  |
| Commit slices (< 30, gate + files each) | PASS   | 3 slices, well under 30. Ordered: (1) manifest-driven generation + empty failure → focused generate tests + scoped check; (2) sync delegation + docs + clean-install integration → plugin/generate integration tests; (3) final gates + evaluator remediation → all gates + `scaffold.runtime` + separate IMPL-EVAL. Each names its proving gate and file scope.                                                                                                                                                                                                                                                                                                                                                                                                          |
| Risk register                           | PASS   | 5 risks with mitigations: (1) published vs local file URL resolution — discriminated union + unit-test both paths; (2) empty validation mistaking header-only for registrable — validate target-specific content; (3) `--dry-run` accidentally executing generators — resolve and report only; (4) sync backward behavior changes — parser-level delegation tests; (5) host hardcodes plugin names — quality scanner + arbitrary-identity fixture.                                                                                                                                                                                                                                                                                                                        |
| Gate set selected                       | PASS   | Required gates from archetype-gate-matrix for Arch 6 selected: F-1/F-3/F-10/F-11/F-16 (universal fitness), F-5/F-6/F-7 (JSR audit surface), F-CLI command structure (command/parser unit tests + quality gate). Static gates (check/lint/fmt:check) and consumer/runtime gates (clean-install integration + one-pass `scaffold.runtime`) included in validation plan. F-CLI-1..31 gates have no enforcement scripts (deleted in S9) — reported as `PENDING_SCRIPT` with structural evidence per Phase A reporting. Runtime/Aspire validation is `optional` for Arch 6 and is covered by the `scaffold.runtime` one-pass gate.                                                                                                                                             |
| Deferred scope explicit                 | PASS   | Two deferred items named: (1) General installed-plugin ownership ledger and uninstall support — owned by issue #167 follow-up. (2) Adjacent dependency/template defects not required for registry generation. Both are explicitly out of the plan's scope and have external owners.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| jsr-audit surface scan (pkg/plugin)     | PASS   | Present in `research.md` §"jsr-audit surface scan". Surface scanned: `packages/cli/deno.json`, public binary command tree, planned internal command dependencies. No new library export or `deno.json` export planned. Slow-type/surface risks named: new dependency interfaces and public command dependency fields require explicit types/JSDoc; subprocess/fetch adapters stay internal. Publish gate: scoped check/doc-quality gates plus package dry-run/JSR audit in final evaluation. Package publish include already covers `src/**/*.ts`; no generated/test artifacts enter the package.                                                                                                                                                                         |

## Open-decision sweep (evaluator-run)

Independent sweep over the plan, research, and design found no decisions the plan left open that
would force rework if deferred:

1. **Published-manifest resolution transport** (JSR HTTP API vs file URL vs `deno info`). The plan
   addresses this via risk register item 1 (discriminated-union source model) and the design's
   "existing JSR HTTP/file-fetch seam; no new generic SDK port." The mechanism is an adapter
   implementation detail; the domain contract (`InstalledPluginRuntime` with package
   identity/version and manifest source) is locked in D3. **Safe to defer to implementation.**

2. **`--official-samples` flag parity with maintainer path.** The maintainer copy path passes
   `--official-samples`; the plan does not mention it. Spot-check confirmed plugin generators
   tolerate its absence (accepted-and-ignored in the AI generator; confirmed for
   workers/sagas/triggers by their `--profile scaffold` default). **Safe to defer to
   implementation.**

3. **Adapter naming and placement for the new installed-plugin manifest resolver.** The plan does
   not name the specific adapter class or its file path. Archetype 6 N9 naming conventions
   (`<tech>-<port>.ts` or `<tech>-<role>.ts` under `<surface>/adapters/`) constrain the choice.
   **Safe to defer to implementation; not a design decision.**

No hidden open decisions found that would force rework.

## Spot-check results

| Finding | Claim                                                                                                                                 | Spot-check result                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| F1      | Clean-room reproduction: 4 installs succeed, `generate plugins` reports 0 written, `.netscript` absent, `plugin sync` fails on `zod`  | **Confirmed.** `.llm/tmp/issue-1010-clean-room-repro.log` shows exact sequence: all 4 plugin installs exit 0, `generate_exit=0` with "0 written", `find .netscript` exits 1, `sync_exit=1` with `Error: Import "zod" not a dependency`.                                                                                                                                                                                                          |
| F2      | `GeneratePluginRegistriesCommand` only calls `resolveWalkerEmissions()`                                                               | **Confirmed.** `packages/cli/src/public/features/generate/plugins/generate-plugin-registries-command.ts` — action calls `requireProjectRoot`, `resolveWalkerEmissions`, `writeEmissions`, prints count. No manifest reading, no subprocess, no `scaffold.runtime.json` awareness.                                                                                                                                                                |
| F3      | Generic walker emits generic axis paths, never invokes plugin-owned generators                                                        | **Confirmed.** `trigger-walker.ts` is a 3-line pipeline: `walker.walk → extractor.extract → emitter.emit`. SDK implementations: `filesystem-walker.ts` (recursive readDir), `ast-extractor.ts` (regex scan for `defineJob`/`defineSaga`/`defineWebhook` only), `registry-emitter.ts` (generic `.netscript/generated/<axis>.registry.ts`). Plugin-specific paths (e.g. `.netscript/generated/plugin-sagas/sagas.registry.ts`) are never produced. |
| F4      | Workers, sagas, triggers publish `runtimeRegistryGenerator.command` and `runtimeRegistries[].registryPath` in `scaffold.runtime.json` | **Confirmed.** All three plugins have `scaffold.runtime.json` with `runtimeRegistryGenerator: { command: "src/cli/generate-runtime-registries.ts", args: ["--profile", "scaffold"] }` and `runtimeRegistries` arrays declaring `registryPath`. Streams correctly has no `scaffold.runtime.json` (only `scaffold.plugin.json`) — declares no runtime generator.                                                                                   |
| F5      | Maintainer copy path uses `--no-config` and is not publicly reachable                                                                 | **Confirmed.** `packages/cli/src/maintainer/adapters/plugin-file-collector.ts:201` passes `'--no-config'` via raw `Deno.Command(Deno.execPath())`, not `ProcessPort`. Only caller: `src/maintainer/features/sync/plugin/copy-official-plugin.ts:155` — maintainer-only.                                                                                                                                                                          |
| F6      | Public install records JSR package identity/version in `appsettings.json`                                                             | **Confirmed.** Clean-room log shows service entrypoints per plugin; the scaffold writes `appsettings.json` with per-plugin service configuration derived from JSR package identity.                                                                                                                                                                                                                                                              |
| F7      | `loadProjectConfig()` runs under project config/cwd; parent-process `ModuleManifestResolver` is the failing step                      | **Confirmed.** `project-config-loader.ts` spawns a child Deno process with `--config <projectRoot>/deno.json` and `cwd: options.cwd` (lines 39-59). `ModuleManifestResolver` at `packages/plugin/src/sdk/discovery/manifest-resolver.ts:33` does `await import(specifier)` in the parent CLI process, where the project's bare `zod` import is unresolvable.                                                                                     |

### Additional implementation-relevant observations (not plan failures)

- `resolveWalkerEmissions` has 3 other callers (`plugin-loader.ts:87`,
  `update-plugin-command.ts:55`, `add-plugin-item-command.ts:64`). The plan correctly adds the
  manifest-driven step in the command or a new use case, not in `trigger-walker.ts`.
- The maintainer helper uses direct `Deno.readTextFile`/`readDir`/`remove`/`mkdir` (not
  `FileSystemPort`) and lives under `src/maintainer/`, so it cannot be imported from `src/public/`
  without violating F-CLI-3. The plan's D4 approach of a fresh `ProcessPort`-based adapter is the
  structurally consistent choice.
- `ProcessPort.exec` supports `cwd` and `env` options (confirmed at
  `packages/cli/src/kernel/ports/process-port.ts:20-24`). The `DenoProcess` adapter
  (`kernel/adapters/runtime/process/deno-process.ts`) is already instantiated and threaded through
  `public-command-dependencies.ts:187`, making it available at the exact wiring site.

## Verdict

`PASS`

## Notes

- The run's prior PLAN-EVAL attempt was blocked on OpenRouter evaluator authentication
  (`agentic:provider-canary` returned `auth_required`). This session was launched as a separate
  Claude Code + OpenRouter evaluator on the Qwen preset after the owner re-invoked the harness. The
  implementation hard stop was in force from the blocked attempt until this PASS.
- The draft-PR absence is an authorized process override (owner retained PR lifecycle; recorded in
  `drift.md` and `context-pack.md`) and is not evaluated as a Plan-Gate item.
- The F-CLI-* gate family (1–31) has no enforcement scripts; they will be reported as
  `PENDING_SCRIPT` with structural evidence during IMPL-EVAL per the Phase A reporting convention.
  The plan correctly does not claim scripted F-CLI evidence.
