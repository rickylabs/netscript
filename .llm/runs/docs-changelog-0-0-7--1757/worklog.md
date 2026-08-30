# Worklog: provisional CLI changelog for 0.0.7

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-changelog-0-0-7--1757` |
| Branch | `docs/changelog-0-0-7` |
| Archetype | N/A — docs artifact only |
| Scope overlays | `SCOPE-docs.md` |

## Design

### Public Surface

- `packages/cli/CHANGELOG.md` — published-package consumer release history.

### Domain Vocabulary

- **Include** — behavior, generated output, CLI/plugin behavior, or published API a consumer can observe.
- **Exclude** — harness, CI-only, repository tooling, run artifacts, internal refactor, future RFC,
  corpus-only refresh, or prose that does not ship a behavior change.
- **Provisional** — accurate for the fixed baseline, explicitly requiring a top-up before release cut.

### Ports

- Git history and diffs — authoritative shipped-change evidence.
- Derived-asset generators — authoritative input-boundary evidence.

### Constants

- Baseline: `v0.0.6..13878a80a50c55b9662099fed64555f2310ae4a3`.
- Expected commit count: 33.
- Release-artifact boundary: no introduction, notes file, version bump, cut, or publish.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Add the traceable provisional 0.0.7 changelog and complete harness evidence. | Required five gates plus diff/lock review | `packages/cli/CHANGELOG.md`; `.llm/runs/docs-changelog-0-0-7--1757/*.md` |

### Deferred Scope

- Unmerged 0.0.7 work and the final milestone top-up.
- Changelog freshness automation.

### Contributor Path

For a later top-up, compare the then-current release baseline to the last commit represented here,
repeat the same consumer-observability test, and add plain bullets without internal identifiers.

## Commit Triage — pinned `v0.0.6..13878a80`

| Commit | Decision | Reason |
| --- | --- | --- |
| `624e1d73` | Exclude | Release-pipeline verifier classification only; no published product behavior. |
| `f7ad44dc` | Include | Besides harness orchestration, the shipped `agent init` check wrapper now surfaces silent non-selection-mode failures. |
| `cd720529` | Exclude | Stale run pruning and CI/E2E maintenance; no shipped user surface. |
| `01e09604` | Include | Generated workspace quality runner gains `--skip-apphost`, while installed tool wrappers gain atomic report output and generated-directory exclusions. |
| `dd472102` | Exclude | Harness evidence/verdict diagnostics only. |
| `0b3ed5d5` | Include | `plugin auth session list` now requires an explicit streams URL instead of assuming localhost. |
| `473e8d75` | Include | The shipped `agent init` scanner adds public-API quality rules and fail-closed allowance-owner verification, including its required env/network permission. |
| `da574111` | Include | Generated database workspaces now emit provider-specific helpers, truthful seeds, and defined missing-row behavior. |
| `7737d890` | Exclude | Repository quality-scan coverage enforcement only. |
| `e090f894` | Exclude | Positioning/comparison docs; no shipped behavior change. |
| `6917c656` | Include | Generated design registry now contains the complete manifest catalog and collection membership. |
| `284dda90` | Exclude | RFC for future typed plugin CLI contributions, not shipped implementation. |
| `729386c5` | Exclude | Comparison-site content and presentation only. |
| `05fc3132` | Exclude | OpenHands dispatch claim/refusal enforcement is agentic infrastructure. |
| `3fc0f2f9` | Include | Prisma MySQL exposes its connected adapter contract and reports classified connection failures through the public hook. |
| `baf1cdf6` | Include | AI MCP pools isolate per-server failures, expose status snapshots, and propagate cancellation across resource and shutdown operations. |
| `3e8e146a` | Include | SDK cache reads survive cache-write failures and telemetry now has bounded namespace/incomplete-topology behavior. |
| `0ef48c2e` | Include | SDK stale-while-revalidate honors fresh cached entries and deduplicates refresh persistence. |
| `2dd1a75e` | Exclude | Export-drift gate, Fresh UI reference repair, generated corpus cascade, and corrected JSDoc import paths; no behavior change. |
| `8ab438d4` | Exclude | ScriptC benchmark/RFC only; no shipped adapter. |
| `aac320d7` | Exclude | Rust benchmark/RFC only; no shipped worker behavior. |
| `43f4c1ff` | Exclude | .NET benchmark/RFC only; no shipped runtime path. |
| `9634735b` | Exclude | Go benchmark/RFC only; no shipped runtime path. |
| `61bfd858` | Exclude | Regeneration of a stale MCP export-surface corpus only. |
| `c73d361e` | Include | SDK service clients preserve exact contract errors through `safe()` and `isDefinedError`; the published breaks cover the failure payload/default/thenable contract, literal `SafeFailure` arms, and `baseContract`'s closed six-code key space. |
| `cf648f1f` | Include | The shipped `agent init` lint wrapper honors subtree ignore markers and batches files by their nearest Deno config. |
| `3b32d162` | Include | The shipped `agent init` lint wrapper fails closed when Deno processes fewer files than the wrapper selected. |
| `211e8257` | Exclude | Harness review-surface wording only. |
| `5bb112dd` | Exclude | Polyglot task protocol RFC/benchmarks only; no runtime implementation. |
| `21d51622` | Include | AI requests carry application context to tools without forwarding it to providers and propagate cancellation to tool dispatch. |
| `3561bb64` | Include | Prisma MySQL ships an executable Prisma 7/mysql2 example, tighter public types, and a deprecation for misleading legacy TLS selection. |
| `8b1e42f7` | Include | Generated background processor registration fails fast when declared service/plugin HTTP references cannot resolve. |
| `13878a80` | Include | `agent init` installs canonical cross-host skills and writes accurate project guidance into `AGENTS.md`. |

Summary: **17 included, 16 excluded**. The decision rule is consumer observability on the shipped
baseline, never the conventional-commit prefix.

### Post-evaluation baseline reconciliation

The changelog content remains pinned to the evaluated 33-commit range ending at
`13878a80a50c55b9662099fed64555f2310ae4a3`. At implementation time `origin/main` was
`f8b4f804cc5fe77054d4f220974eae66becf090c`; both later commits were checked under the same
consumer-observability rule and do not change the locked eleven-bullet map.

| Commit | Decision | Reason |
| --- | --- | --- |
| `625447f1` | Exclude | Aspire 13.5.3 verification receipts: the architecture-debt ledger and `.llm/runs/**` run/receipt artifacts only; no consumer-visible surface. |
| `f8b4f804` | Exclude | Explanatory agent-tooling docs plus their generated corpus and publish assets; documents already-shipped behavior without changing consumer behavior. |

The live 35-commit range therefore reconciles to **17 included, 18 excluded**, while the
implementation deliberately retains the independently evaluated `13878a80` content pin. The PR
must state both that pin and the provisional top-up requirement.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-30 | 1 | Bootstrap/research | Branch and 33-commit baseline verified; issue read in full; all ambiguous diffs inspected. |
| 2026-08-30 | 1 | Plan | PLAN-EVAL selected because grouping and omission decisions are substantive editorial judgment. |
| 2026-08-30 | 1 | PLAN-EVAL cycle 1 | `FAIL_PLAN`: shipped `agent init` tool deltas were under-triaged and draft bullet wording/mapping was not locked. Repaired to 17/16 with an eleven-bullet map. |
| 2026-08-30 | 1 | PLAN-EVAL cycle 2 | `FAIL_PLAN`: B11 omitted two declared breaking changes and B1 omitted the scanner's new permission requirement. Both clauses repaired; two-failure limit reached, so implementation is blocked pending owner authorization for cycle 3 or a written waiver. |
| 2026-08-30 | 1 | PLAN-EVAL post-escalation | `PASS_PLAN`: independent source verification confirmed all 33 triage decisions and all eleven locked bullets; implementation authorized after mechanical baseline reconciliation. |
| 2026-08-30 | 1 | Baseline reconciliation | `origin/main` advanced by two commits to `f8b4f804`; both are excluded above, and the evaluated `13878a80` content pin is retained. |
| 2026-08-30 | 1 | Implementation | Added `## 0.0.7` from the locked eleven-row map with no release introduction or version bump. |
| 2026-08-30 | 1 | IMPL-EVAL at `15c262e4` | Separate-session evaluator returned `PASS`, but verified the scanner's declared permission change without testing whether the changelog's word "needs" described a runtime requirement; this verdict is superseded by the repair below. |
| 2026-08-30 | 1 | B1 wording repair | Augment review correctly distinguished the bundle declaration from runtime behavior. Source verification showed environment access is optional and network access occurs only when resolving a `quality-allow` issue; changed only B1's parenthetical and recorded the medium-requested/high-observed resume-route drift in `drift.md`. |

## Gate Results

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| PLAN-EVAL cycle 1 | FAIL_PLAN | `plan-eval-cycle-1.md` | Repaired shipped-tool triage and missing bullet map. |
| PLAN-EVAL cycle 2 | FAIL_PLAN | `plan-eval.md` | Repaired two wording-completeness findings; harness loop limit reached. |
| PLAN-EVAL post-escalation | PASS_PLAN | `plan-eval-cycle-2.md` | Coordinator-authorized independent evaluation; implementation may proceed after reconciliation. |
| `deno task docs:links` | PASS (exit 0) | `broken-links=0 broken-anchors=0 orphans=0` | Required link-integrity gate. |
| `deno task docs:readme:check` | BASELINE RED (exit 1) | `packages/bench/README.md`: missing `## Install` | Reproduced with the same exit and sole finding in a clean archive of current `origin/main` at `f8b4f804cc5fe77054d4f220974eae66becf090c`; unrelated to this changelog diff. |
| `deno task check:publish-assets` | PASS (exit 0) | No stale publish asset reported | Required even though the changelog is not a generator input. |
| `deno task check:assets-barrel` | PASS (exit 0) | Generator completed; generated-file diff check clean | Required even though the changelog is not a generator input. |
| `deno task check:agent-docs-prose` | PASS (exit 0) | Site build/render checks passed; corpus reported `fresh: true`, `stalePaths: []` | Confirms no agent-docs prose regeneration is needed. |
| `git diff --exit-code -- deno.lock` | PASS (exit 0) | No diff | Lock hygiene boundary. |
| `git diff --exit-code -- packages/cli/deno.json` | PASS (exit 0) | No diff; parsed version remains `0.0.6` | Version bump remains release-cut scope. |
| B1 repair: `deno task docs:links` | PASS (exit 0) | `broken-links=0 broken-anchors=0 orphans=0` | Repair-tree rerun. |
| B1 repair: `deno task docs:snippets` | PASS (exit 0) | `PASS scanned=581 ... checked=22 exempt=14 ... malformed=0` | Repair-tree rerun. |
| B1 repair: `deno task check:publish-assets` | PASS (exit 0) | No stale publish asset reported | Changelog remains outside generator inputs. |
| B1 repair: `deno task check:assets-barrel` | PASS (exit 0) | Generator completed; generated-file diff check clean | No derived asset churn. |
| B1 repair: `deno task check:agent-docs-prose` | PASS (exit 0) | Site build/render checks passed; corpus reported `fresh: true`, `stalePaths: []` | No agent-docs prose regeneration required. |
| B1 repair: `git diff --exit-code -- deno.lock` | PASS (exit 0) | No diff | Lock remains unchanged. |
| B1 repair: `git diff --exit-code -- packages/cli/deno.json` | PASS (exit 0) | No diff | Version file remains unchanged at `0.0.6`. |
| B1 repair: `deno task docs:readme:check` | BASELINE RED (exit 1) | `packages/bench/README.md`: missing `## Install` | Same sole pre-existing finding previously reproduced in a clean `origin/main` archive; this repair does not touch `packages/bench/`. |

### Explicit N/A gates

| Gate | Status | Reason |
| --- | --- | --- |
| `deno task docs:accuracy` | N/A | Its locked corpus is `docs/site/reference/cli/commands.md` and `docs/site/cli-reference.md` (`check-accuracy-and-discoverability.ts:44-50`); the package changelog is outside that scanner's inputs. |
| Dedicated `docs/site` verification | N/A | The only edited prose is outside `docs/site/`; `check:agent-docs-prose` nevertheless ran the site build, source-format, and rendered-output checks successfully as a subtask. |
| `deno task --cwd docs/site diagrams:check` | N/A | No diagram source or asset changed, and the environment has no Chromium executable. |
| Root `fmt:check` / `lint` | N/A | Root tasks select only `packages/**/*.ts{,x}` and `plugins/**/*.ts{,x}` (`deno.json:140-160`), not Markdown; this slice changes no TypeScript. |
| CLI E2E / scaffold runtime | N/A | No CLI implementation, scaffold template, plugin, database wiring, Aspire helper, or generated source changed. |

## Handoff Notes

- The changelog is provisional at the evaluated `13878a80` pin and requires a top-up before the
  0.0.7 release cut.
- Tier-A review and a separate IMPL-EVAL are intentionally deferred to the coordinator after this
  implementation handoff.
- The prior IMPL-EVAL applies only to `15c262e4`; the B1 wording repair requires the coordinator's
  renewed exact-head IMPL-EVAL before any status advance.
