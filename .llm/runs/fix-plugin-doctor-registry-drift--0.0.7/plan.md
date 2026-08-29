# Plan: plugin doctor registry/source drift

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-plugin-doctor-registry-drift--0.0.7` |
| Branch | `fix/plugin-doctor-registry-drift` |
| Phase | `plan` |
| Target | `packages/cli` plugin doctor and installed runtime registry discovery |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none |

## Archetype

Archetype 6 is the smallest fit because this slice changes the user-run `netscript plugin doctor`
flow. It preserves the existing vertical `plugins/doctor` and `generate/plugins` features and uses
constructor/factory injection at the public composition root. No package export or command
vocabulary changes.

## Current Doctrine Verdict

`packages/cli` is **Keep** at `origin/main` @ `13878a80a`: preserve the Archetype-6 kernel/surface
split. This slice does not address unrelated open CLI debt.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A1 | The discovery evidence and doctor result contract are defined before implementation. |
| A6/A7 | Reuse generator manifest discovery and `@std/path`; do not create a second walker policy. |
| A8 | Put the non-trivial comparison in one focused doctor module rather than enlarge the existing monolith. |
| A10 | The composition root injects the generator's read-only discovery function into doctor. |
| A14 | Red-before/green-after plus reverse-drift coverage is the primary fitness evidence. |

## Goal

Make `netscript plugin doctor` fail when manifest-discoverable runtime definition files and a
generated registry disagree in either direction, name the affected files, prescribe
`netscript generate plugins`, and state the exact manifest-backed source surface verified.

## Scope — Locked Product Ceiling

Only the following product/test paths are authorized:

1. `packages/cli/src/public/features/generate/plugins/generate-installed-plugin-registries.ts`
2. `packages/cli/src/public/features/generate/plugins/installed-runtime-registry-generator.ts`
3. `packages/cli/src/public/features/plugins/doctor/runtime-registry-drift.ts` (new)
4. `packages/cli/src/public/features/plugins/doctor/doctor-plugin-use-case.ts`
5. `packages/cli/src/public/features/plugins/doctor/doctor-plugin-registry-drift_test.ts` (new)
6. `packages/cli/src/public/features/root/public-command-dependencies.ts`

Any product path beyond this set is a rescope requiring supervisor approval before editing.

## Non-Scope

- #1366 AppHost `declareHealthChecks`, #1574 package-version truthfulness, and #1365 saga-publisher
  behavior.
- Creating a streams runtime registry that current `main` does not define.
- Changing plugin-owned doctor checks, registry generator output syntax, templates, embedded assets,
  docs, public exports, dependencies, or command names/options.
- `e2e:cli`, Aspire, Docker, and browser execution.
- Merge, ready-for-review transition, label changes, issue edits/closure, or self-certification.

## Hidden Scope

- The generator's dry-run result must carry normalized per-registry source file evidence, not only a
  count.
- Reverse comparison must ignore package/type imports and must distinguish an imported-but-unused
  definition from a real registry entry.
- Doctor must still emit registry evidence when no `netscript.config.ts` plugins are configured but
  `appsettings.json` declares installed runtime registries.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Installed runtime manifests remain the only discovery authority. | It is the contract that generates the shipped registries and avoids hard-coded plugin names/AP-9. |
| D2 | Extend internal `GeneratedPluginRegistry` with `sourceFiles` per registry. | Gives doctor verifiable file-level evidence without changing a public export. |
| D3 | Compare normalized relative import bindings against the discovered source set. | Supports every manifest-declared registry kind without parsing saga/job/trigger semantics. |
| D4 | Report a workspace registry check for every manifest target, plus a bounded no-target statement. | “Healthy” says exactly what was checked and cannot imply non-registry topology coverage. |
| D5 | Keep discovery optional in `PluginDoctorDependencies` for focused legacy unit seams; production composition always supplies it. | Avoids mechanically weakening unrelated tests while keeping the production contract wired and regression-tested. |
| D6 | PLAN-EVAL is `N/A`. | The issue and current tree close contract, scope, acceptance, and gate decisions; a ceremonial planning evaluator adds no decision value. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Stream registry semantics | safe to defer | Current streams plugin has no registry manifest; inventing one is outside #1673's bounded CLI fix. Doctor explicitly limits its claim. |
| Recursive source discovery | safe to defer | Runtime manifests currently declare flat directories; this slice preserves generator semantics exactly. |
| Parsing arbitrary handwritten registries | safe to defer | The command verifies generator-owned relative import/binding shape, not arbitrary module formats. |

No “must resolve now” decision remains.

## Commit Slices

| # | Slice | Proving gate | Files |
| - | ----- | ------------ | ----- |
| 1 | Bootstrap research, locked plan/design, and draft PR | plan-gate manual checklist; `PLAN-EVAL: N/A` recorded | run artifacts only |
| 2 | Red regression: generate a saga registry, add a late saga, assert doctor exits 1 | focused structured test must fail on baseline because the command exits 0 | new regression test + worklog/context |
| 3 | Manifest-backed bidirectional comparison and production wiring | focused regression + reverse-drift test green | six ceiling paths + run artifacts |
| 4 | Scoped quality/JSR evidence and evaluator handoff | selected gates below; receipts at final head | run artifacts only |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| False positives from package/type imports | Only relative imports resolve into the project source set. |
| A source import exists but is not registered | Require the imported binding to occur in the registry body after its import declaration. |
| Windows separator drift | Normalize discovered and resolved project-relative paths to `/`. |
| Manifest lookup/network failure hides plugin reports | Convert inspection failure into a named workspace error report while preserving other reports. |
| Empty or no-target projects overclaim health | Message states zero manifest-declared runtime registries and makes no stronger claim. |
| Existing oversized doctor file worsens | New comparison policy lives in `runtime-registry-drift.ts`; use-case change is orchestration only. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-1 | existing risk | Do not add comparison logic to the 774-LOC use case; add a focused module. |
| AP-9 | risk | Reuse generator manifest discovery; no plugin-kind switch/table. |
| AP-18 | risk | Assert exit status, check IDs, filenames, and remediation; no whole-registry snapshots. |
| AP-23 | avoid | Composition only injects the existing generator closure. |
| AP-25 | avoid | All reads use `FileSystemPort`; production effects remain in adapters. |

## Fitness and Validation Gates — Locked Before Implementation

| Order | Gate | Command or check | Why / expected result |
| --- | --- | --- | --- |
| 1 | Red regression | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts --pretty -- --allow-all packages/cli/src/public/features/plugins/doctor/doctor-plugin-registry-drift_test.ts` | Must exit non-zero on baseline because doctor incorrectly succeeds; output captured in worklog before product edits. |
| 2 | Focused green regression | same structured test wrapper | Late source and reverse orphan both exit red through doctor, while aligned registry remains healthy. |
| 3 | Related tests | structured test wrapper over the new regression, `doctor-plugin-command_test.ts`, `doctor-plugin-invariants_test.ts`, `installed-runtime-registry-generator_test.ts`, and `installed-runtime-registry-integration_test.ts` | Proves doctor, discovery, and generator behavior without live services. |
| 4 | Scoped type check | `run-deno-check.ts` with `--file` for every ceiling `.ts` path | Type-checks exactly the touched source/test graph with `--unstable-kv` default. |
| 5 | Scoped lint | `run-deno-lint.ts` with the same `--file` set | No lint regressions; explicit non-empty selection. |
| 6 | Scoped format | `run-deno-fmt.ts` with the same `--file` set | Non-mutating source-format proof for owned TypeScript. |
| 7 | Code quality + doctrine | `deno task quality:gate` through `run-gate.ts` receipt | Required for `packages/**`; catches casts/`any`, hard-coded plugin names, and doctrine fitness. |
| 8 | JSR doc surface | `deno task doc:lint --root packages/cli --pretty` | Full unchanged export-map bar; any pre-existing documented debt is reported. |
| 9 | JSR package dry run | `deno publish --dry-run --allow-dirty` from `packages/cli` | Confirms internal change adds no slow/public type or publish-file regression. |
| 10 | Lock hygiene | raw `git diff --exit-code -- deno.lock` against baseline | Must remain unchanged. |

### Generated cascade applicability

- `check:assets-barrel`: **N/A** — no template or `kernel/assets` path is in the ceiling.
- `check:agent-docs-prose`: **N/A** — no docs corpus changes.
- `check:mcp-export-corpus`: **N/A** — no MCP/public export surface changes.
- `check:publish-assets`: **N/A** — no publish asset inputs change.
- `e2e:cli`, Aspire, Docker, browser: **NOT AUTHORIZED** by the slice brief and not required for the
  focused no-backend seam.

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `.llm/harness/debt/arch-debt.md` | none | No new/deepened violation and no existing debt closed. |

## Dependencies

- Existing `FileSystemPort`, `@std/path`, installed runtime manifests, and production generator
  closure only. No dependency or lockfile change.

## Drift Watch

- Any need to edit a seventh product path, plugin manifest, generated asset, docs/export surface, or
  lockfile is significant rescope and stops implementation pending supervisor approval.
