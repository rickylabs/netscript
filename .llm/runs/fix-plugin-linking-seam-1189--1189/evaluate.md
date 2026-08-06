# IMPL-EVAL — fix-plugin-linking-seam-1189--1189

## Metadata

| Field | Value |
| ----- | ----- |
| Date | 2026-08-06 |
| Lane | `formal_impl_evaluation` — OpenRouter `qwen/qwen3.8-max`, high effort, separate session |
| Run ID | `fix-plugin-linking-seam-1189--1189` |
| Worktree | `/home/codex/repos/ns005-cachetiers` |
| Branch | `fix/plugin-linking-seam-1189` |
| Evaluated head | `53d6c278d01a1b7ce967078ce94db619a5d8f4a8` |
| Product/evidence commit | `e6c429f4527e02f1dfa8886f0ff66311bbc5a299` |
| Train merge | `ca8f1c76b` ← `canary/0.0.5-canary.14@2508eb8c99c9cfc55e0c9f1d7ab72fea745db492` |
| PR | #1316 — draft, base `canary/0.0.5-canary.14`, labels incl. exactly one `status:` (`status:impl-eval`); closing keyword `Closes #1189` present |
| Issue | #1189 — open, `status:impl-eval` |
| Protected stash | `stash@{0}` = `7eb4ed16d6944c1d1c904895bcb76b4361ad8a57`, diff hash `6f706f8fbaa20262600f625665eabd5610aa4acc` — verified intact pre- and post-validation |
| PLAN-EVAL | D6 composed per milestone ruling; wave plan received separate Minimax M3 PLAN-EVAL PASS (orchestrator context) |

## Process Verification

### Fail-closed preconditions — all held

1. Branch `fix/plugin-linking-seam-1189` at expected head `53d6c278d` — exact match.
2. Working tree clean (`git status --porcelain` empty) before any evaluator validation command.
3. Protected stash: `stash@{0}` commit `7eb4ed16…` and `git stash show -p stash@{0} | git hash-object --stdin` = `6f706f8fbaa20262600f625665eabd5610aa4acc` — unchanged; never popped, applied, or mutated. Re-verified after all gates.
4. Train merge `ca8f1c76b` second parent is exactly `2508eb8c9` (origin/canary/0.0.5-canary.14 tip = merge base) — branch fully merged with its train, no rebase/force.
5. One-AppHost rule: no Aspire/dotnet AppHost process running at preflight or post-smoke; the foreign `postgres-7064afb1` container and the 15 foreign + 3 unproven containers in leak reports were left untouched throughout.

### Lane records

- **C-D9** (recorded, not relabeled): the inherited generator thread `019fcdc4-d0e7-7431-9e30-8eb35360c3f9` was launched Sol low, but its supported resume turns were observed at Sol medium because `agentic:codex-resume` exposes no effort override. Recorded as a tooling gap; the generator's output was evaluated on evidence regardless.
- **C-D12 adjudication**: the generator's first interrupted `scaffold.runtime` attempt is diagnostic only and is not cited as evidence anywhere in the run's gate table. The evaluator independently re-ran the exact one-pass command at the current head; only that completed run (raw exit 0) is treated as admissible.
- **Evidence currency**: `git diff e6c429f45 53d6c278d -- . ':!.llm/runs'` is empty — head adds only worklog text over the product/evidence commit, so all live-proof artifacts tracked at `e6c429f45` are current-head evidence. Runtime artifacts (appsettings, helpers, persisted fixture manifest, RED/GREEN docs, trace JSON) were re-inspected on disk and corroborate the tracked documents.

## Gate Results (independent evaluator runs)

| Gate | Result | Evidence (evaluator-run) |
| ---- | ------ | ------------------------ |
| Preconditions | PASS | Section above |
| Focused protocol/install/dispatch/reconciler/remove suite | PASS | Independent rerun at head: **16 tests / 38 steps, 0 failures, raw exit 0**, incl. `wires a fixture third-party plugin to declared services and apps`, `third-party linking converges when consumers arrive later and cleans up after uninstall`, `public plugin install then bare-name remove restores owned state and leaves doctor clean` (byte-exact appsettings round-trip; no `Apps: {}` materialization), consumer-first install test asserting `persisted.officialSource === undefined` |
| Scoped check wrapper (all changed TS roots) | PASS | `.llm/tools/run-deno-check.ts` over packages/plugin + packages/cli (+tests): 223 files, 0 diagnostics, raw exit 0 (check genuinely covers packages/cli) |
| Scoped lint/fmt wrappers | PASS (vacuous for CLI, adjudicated — Finding 2) | Wrapper exit 0; workspace lint/fmt configs exclude packages/cli by design; isolated-config supplementary run: lint exit 0 on all 7 changed CLI files; fmt style drift only (regime never applied to packages/cli) |
| `quality:scan` | PASS | raw exit 0, 0 findings (7 pre-existing allowances, all in unchanged files) |
| `arch:check` | PASS | raw exit 0; deps:check + check-doctrine across 16 enumerated roots, FAIL=0 everywhere; packages/plugin: FAIL=0, WARN=3/INFO=1 all structural and unchanged by this diff; packages/cli intentionally not a doctrine root (Archetype 6 pending) |
| Docs link accuracy | PASS | `deno task docs:links` raw exit 0 — 102 docs, 0 broken links/anchors |
| Full-export-map doc lint | PASS | `run-deno-doc-lint.ts` for packages/plugin and packages/cli: both raw exit 0, 0 errors, 0 missing JSDoc |
| JSR audit — packages/cli | PASS | `audit-jsr-package.ts` raw exit 0 |
| JSR audit — packages/plugin | PARTIAL (classified — Finding 6) | raw exit 1; exactly 4 `F-JSR-2 module-tag` findings on entrypoints with **zero diff vs train base**; publish dry-run inside audit: `Success Dry run complete` |
| Publish dry run (workspace) | PASS | `deno task publish:dry-run` raw exit 0 twice; 35 packages simulated incl. `@netscript/cli@0.0.4` and `@netscript/plugin@0.0.4`; all deno.json manifests restored (`git diff` empty). See Finding 3 for the inherited lock churn |
| One-pass merge-readiness smoke | PASS | Exact `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` from repo root at head `53d6c278d`: **Summary: passed=73 failed=0, RAW-EXIT:0** — incl. plugin installs, registry generation, generated-workspace type-check, Aspire start/restart, DB init/seed, service health, worker executions, MCP, plugin health, OTEL webhook/stream-consumer/traces/task-traces, `cleanup.aspire-stop` |
| Post-smoke leak reporter | PASS | Read-only `agentic:leak-check`: **zero run-owned resources, zero AppHosts**; same 15 foreign + 3 unproven pre-existing containers as the tracked 15:51 report; none mutated |
| Review threads | PASS | `agentic:review-threads --repo rickylabs/netscript --pr 1316`: `PASS … threads=0 unanswered=0`, raw exit 0 |
| GitHub checks | PASS (draft policy) | 18 contexts, all SKIPPED by draft policy; no failing executed context |
| Lock hygiene | PASS (with Finding 3) | Committed `deno.lock` byte-identical to train base (`git diff 2508eb8c9 HEAD -- deno.lock` empty); tree restored to clean after every evaluator command |
| Protected stash | PASS | Identical pre/post, exact commit + diff hash |

## Acceptance rows — issue #1189 (all eight independently verified)

1. **Declaration schema expresses consuming surfaces** — VERIFIED. `PluginManifestLinking` with `canonicalName`, `resourceConfigKey`, optional `backgroundConfigKey`, `dependencies`, `pluginReferences`, and `consumers { services?, apps? }` added to `packages/plugin/src/protocol/manifest.ts` behind strict zod schemas (`linkingSchema`, `linkingIdentifierSchema`); parser tests accept the ACME manifest.
2. **One shared seam, no plugin-specific branch** — VERIFIED. `reconcilePluginReferences` applies one desired-state pass across Plugins/BackgroundProcessors/Services/Apps; evaluator grep of all changed core/CLI sources found no `fixture`/`acme`/plugin-name/suffix literals or branches.
3. **Third-party equality, no `officialSource` gate** — VERIFIED. `parseDeclaration` tries `parsePluginManifest` → `fromLinkingDeclaration(linking)` first with officialSource only as a compatibility fallback; install no longer synthesizes `officialSource` for third-party persists; live consumer's persisted `plugins/fixture/scaffold.plugin.json` carries `linking` and zero `officialSource` occurrences.
4. **`-api` heuristic removed from the seam** — VERIFIED. `readInstalledDeclarations` directory-scans `[projectRoot, plugins/]` for `scaffold.plugin.json`; no `endsWith('-api')` remains in the reconciler. Residual deploy-path helpers are pre-existing and out of scope (Finding 5).
5. **Runtime row (orchestrator-checked observational row) — the evidence SUPPORTS the acceptance text.** Adversarial verification: RED doc shows catalog HTTP 500 with the exact error string thrown by the generated handler when `services__fixture-api__http__0` is absent (pre-install); GREEN doc shows HTTP 200 after the handler fetched and payload-validated `fixture-api /ping` (env port 46283 in the doc matches the trace request URL); trace `00766def76331c34a3df9fd525bfe3e0` JSON contains catalog server span `819231b2d77516fb`, catalog client span `9c22af7526ff564a`, and fixture-api server span `c7935b1b03518da5` whose parent is the catalog client span — same traceId, all 200 OK, captureCommand recorded. The evidence is a real cross-resource request, not synthetic, and is current-head (tracked in `e6c429f45`, head adds only worklog text). The live consumer's appsettings is pure reconciler output (fixture-api producer, catalog/dashboard `PluginReferences`, no manual edits), and the generated helpers inject `services__fixture-api__http__0` generically.
6. **Install-order independence** — VERIFIED. Producer-first/consumer-later proven by the named converging test (evaluator rerun green); consumer-first proven by the fresh CLI install artifacts.
7. **Uninstall cleans every surface, no absent-map materialization** — VERIFIED. Byte-exact appsettings round-trip remove test (original has no `Apps` key and none appears after remove), reconciler cleanup test, and tracked real `plugin remove fixture` leaving producer maps empty and consumer references absent. `setReconciledRecord` writes a surface only when `netScript[key] !== undefined || Object.keys(record).length > 0`.
8. **New plugin requires no core change** — VERIFIED. The fixture declares arbitrary identifiers (`acme-fixture`/`fixture-api`/`fixture`) and wires end-to-end through the unmodified generic CLI path; no CLI source file keys on fixture identity; fixture permissions (`net/env/read/sys/write`) are declaration-owned test input in the fixture's own manifest — no product permission change in core (drift entry records the under-declaration discovery and fix).

Every PR DoD checklist claim was likewise verified against the evidence above (see Findings 1–3 for the three claims that required adjudication).

## Anti-Pattern Check

Scan of the publishable source diff (run artifacts excluded): **zero** new `deno-lint-ignore`, `@ts-ignore`, `as unknown as`, `as any`, placeholder seams, or generated/source churn. No host-side plugin-name coupling, no hardcoded fixture/service/app names or ports in core/CLI sources. Unknown-user-config preservation confirmed via `ReferenceEntry` index signature; absent-vs-empty handled idempotently on install and uninstall.

## Arch-Debt Delta

`.llm/harness/debt/arch-debt.md` has zero diff in this PR. One pre-existing violation is deepened (Finding 4) and is recommended for a debt entry in a follow-up; no new debt is created by the seam itself.

## Findings

1. **(LOW, process)** Worklog/PR cite "17 tests / 42 steps" for the focused suite; the evaluator's independent rerun at head is 16 tests / 38 steps, 0 failures, with every decisive named test present and green. All behaviors are proven; the count appears to aggregate generator-side iterations. Recommend the orchestrator reconcile the metadata so the next operator is not misled.
2. **(LOW, repo-policy adjudication)** "Scoped check/lint/fmt — zero findings" is fully true only for `check` (223 files, 0 diagnostics, genuinely covers packages/cli). The workspace lint and fmt configs exclude packages/cli by design (root lint exclude, root fmt exclude, no lint/fmt section in `packages/cli/deno.json`), so wrapper lint/fmt runs are vacuous for CLI files; the operative CLI quality gates (`deno check` + `quality:scan`, both exit 0) pass. Evaluator's supplementary isolated-config run on the 7 changed CLI files: `deno lint` exit 0; `deno fmt` flags 5/7 files with style-only drift under a regime that has never applied to packages/cli. Not a defect of this slice; recommend documenting that CLI lint/fmt coverage is intentionally delegated to `quality:scan`.
3. **(MEDIUM, train-attributed)** The committed `deno.lock` at head is byte-identical to the train base lock — the PR introduces zero lock change, and the generator's "lock matches branch baseline" claim is literally true. However, the committed lock is stale against the committed graph (root `deno.json` declares `@tanstack/react-db ^0.1.95` while the lock records `~0.1.86`; `better-auth` peer resolution churns `typescript→react`). `deno task publish:dry-run` exits 0 and restores every manifest but deterministically rewrites 45 lock lines. This staleness exists at `2508eb8c9` itself, affects the whole canary.14 train, and is not caused by this slice. Recommend an orchestrator-scheduled lock refresh (train-level or dedicated lock-hygiene slice); non-blocking here.
4. **(LOW, debt recommendation)** `install-plugin.ts` is 659 LOC, above the 500-LOC F-CLI-2 cap. Pre-existing (627 at train base); this PR adds +32 lines for the linking key selection. F-CLI-* enforcement scripts were deleted in S9, `arch:check` does not enumerate packages/cli, and no debt entry exists. Recommend recording an arch-debt entry in a follow-up; non-blocking for this slice.
5. **(LOW, out-of-scope note)** Residual `endsWith('-api')` helpers (`getPluginApiServiceName`/`getPluginServiceLookupName`) remain in `packages/cli/src/kernel/adapters/config/plugin-registry.ts`, used only by deploy compile-targets/config-resolvers. Pre-existing (#1045 lineage), outside the reconciler path this issue governs; the #1093 discovery work is the appropriate home.
6. **(INFO, classification confirmed)** The plugin JSR audit's exit 1 is exactly the four `F-JSR-2 module-tag` findings on `./abstracts`, `./config`, `./cli`, `./testing` mod files; all four are zero-diff vs train base `2508eb8c9` — a verified unchanged baseline, not a changed-surface regression. PR-touched entrypoints (`.` and `./protocol`) carry `@module`. Publish dry-run inside the audit reports `Success`. CLI audit exits 0.
7. **(INFO, evidence hygiene)** The mandated post-smoke leak-check refreshed the tracked `leak-report.md` in place with time-shifted, content-identical data (same 15 foreign + 3 unproven containers, zero run-owned, zero AppHosts). The evaluator restored the committed copy; the tree ended clean. Foreign/unproven resources were never mutated.

## Lessons

- Wrapper-based scoped gates silently inherit workspace excludes; evidence claims of "lint/fmt clean" for an excluded root should name the operative gate instead (here `quality:scan` + `deno check`).
- Publish/dry-run operations are not lock-fixed-point probes when a train carries a stale lock; lock hygiene claims should distinguish "matches baseline" from "matches the graph."
- `agentic:codex-resume` needs an effort override (C-D9) so resumed generator lanes cannot drift from their routed identity.

## Verdict

All eight issue acceptance rows and every PR DoD claim are backed by current-head, evaluator-independent evidence; the orchestrator-checked observational runtime row (box 5) is **supported** by the RED 500 / GREEN 200 / correlated trace evidence. All findings are LOW/MEDIUM process or train-attributed observations, none requiring a fix within this slice before merge.

`PASS`
