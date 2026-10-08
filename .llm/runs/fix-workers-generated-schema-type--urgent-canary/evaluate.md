# Evaluation: PR #2035 fix(workers): type generated payload schemas — issues #2034 / #2069

IMPL-EVAL verdict for the existing workers implementation on branch `fix/workers-generated-schema-type`,
evaluated read-only in this checkout. No implementation or git/PR state was modified by the evaluator.

## Metadata

| Field          | Value |
| -------------- | ----- |
| Run ID         | `fix-workers-generated-schema-type--urgent-canary` |
| Target         | PR #2035 head `6a8a4de3e00d09237e0b3bbc1664f9a7c40afbe7` (branch `fix/workers-generated-schema-type`, base `main`, 9 commits; PR diff = 14 files, exactly matching the checkout's `main..HEAD` file set) |
| Archetype      | 5 — Plugin Package (thin glue over `@netscript/plugin-workers-core` contracts; entrypoint-level used: package is JSR-published so doc/publish gates still apply) |
| Scope overlays | none (no frontend, not docs-only, not a release cut) |
| Evaluator      | Separate session from the generator. Requested (owner override recorded in `supervisor.md`/`drift.md`): headless OpenCode Go, model `opencode-go/glm-5.3-flash`, effort max; fallback Google Gemini 3.8 Flash high. Observed: this session ran on `opencode-go/glm-5.3-flash` — requested route satisfied, fallback unused. Generator was `gpt-6.1-sol` (high, Lane C API session) — different session and different vendor family, so independence holds. |

Exact git HEAD at evaluation: `6a8a4de3e00d09237e0b3bbc1664f9a7c40afbe7` (main `6f6cbdf030d7595d1730272d0a74aedd66225069` is an ancestor; branch is up to date with `origin`; PR head OID equals this HEAD).

## Issue-contract evaluation

**#2034 (generated payload registry vs real `RegisterJobInput`).** PASS on the contract:

- Both emitters now import `JobPayloadSchema` from the workers runtime and constrain the generated
  preamble as `SchemaBackedJobHandler & Readonly<{ payloadSchema: JobPayloadSchema<unknown> }>` with
  `payloadSchema: THandler["payloadSchema"]` (generator `plugins/workers/src/cli/runtime-registry-generator.ts:389-400`,
  compiler `plugins/workers/src/cli/registry-compiler.ts:64-66,104-108`). On main the same preamble
  carried `payloadSchema: unknown` — the TS2322 crash the issue records.
- `GeneratedJobDefinition` types `jobDefinitionsById` through `Readonly<RegisterJobInput & {...}>`, so
  the real runtime contract constrains every emitted definition.
- The conformance fixture feeds the generated map to `createWorkersContract<GeneratedJobPayloadMap>()`
  and asserts **exact literal payload equality** (`Equal<A,B> = true`) for configured-local, unconfigured-local,
  configured-plugin, unconfigured-plugin and alternate-compiler output, plus `@ts-expect-error` **negative**
  assertions proving a wrong job's payload does not type-check for another trigger. No `any`, `@ts-ignore`,
  `as unknown as`, or consumer-side cast was introduced anywhere in the diff (grep-checked).
- The regression cannot recur silently: emitted output is type-checked against the **real**
  `RegisterJobInput`/`JobPayloadSchema` shapes (local core sources wired through the test's import map)
  by real `deno check`, and the compiler golden test locks emitted bytes.

**#2069 (doctor vs policy-configured job definitions).** PASS on the contract:

- The doctor's definition-count regexes now match all three generated forms
  `create(?:Local|Configured|Plugin)JobDefinition\(` and the broadened declared-import pattern
  (`plugins/workers/src/adapter/plugin.ts:104-115`), so a fully policy-configured registry no longer
  reports "Registry is incomplete".
- `compile-registry` now preserves the authored policy: it loads normalized project policy
  (`load-workers-config.ts` → `WorkersConfigSchema.parse`) and shares the generator's matcher
  (`configured-job-policies.ts`: path/id/source conflict rejection, grouped-wholly-shadows-flat
  precedence via console warning), emitting `createLocalJobDefinition(..., policy)` with grouped
  precedence and full `JobConfig` settings retained — the two supported producers now agree
  (real fixture asserts grouped `topic`, `maxRetries: 0`, `maxConcurrency: 0`, `timeout: 4321`,
  `enabled/persist: false`, tags, metadata survive; golden test locks `JobConfig` key parity).
- Real doctor runs passed over generated registries covering local + plugin and fully-policy-configured
  forms (`runDoctorCommand` in the focused suite with the real generated registry text).

## Process Verification

| Check | Result | Evidence |
| ----- | ------ | -------- |
| Plan-Gate passed before implementation | PASS (N/A recorded) | `plan.md` records "PLAN-EVAL: N/A for bounded evidence/CI repair with the issue contract already fixed" with `worklog.md` phase 4; mechanical evidence refresh of a carried-in implementation, consistent with harness rules |
| Design section exists in worklog | PASS | `worklog.md` `## Design`: public surface (generated registry + compile-registry), domain (literal handler schemas, normalized policy), ports (existing `ProjectFiles` seam), constants (existing vocabularies), slices, contributor path, deferred scope |
| Commit slices match design plan | PASS with recorded drift | 9 commits; `drift.md` truthfully states the implementation predates the harness run and the run is an evidence refresh — no retroactive phase claim; no force-push (origin == local == PR head), main integrated by `6a8a4de3e` |
| Each slice has a passing gate | PASS at HEAD (see Static/Fitness gates) | all scoped gates independently re-run green at exact HEAD; runtime gate blocked (see Runtime Gates) |
| No speculative seams (unused files) | PASS | both new CLI helpers are consumed by generator and compiler entrypoints; no dead exports; diff adds no unused public surface |
| Constants used for finite vocabularies | PASS | `'local' \| 'plugin'` and policy vocabularies reuse core `JobConfig`/config schema types; emitted registry vocabularies are locked by golden tests |
| SKILL chapter in evaluator brief | PASS | `impl-eval-brief.md` carries `## SKILL` naming harness/PR/doctrine/jsr-audit skills |

## Static Gates (all independently re-run at HEAD `6a8a4de3e` in this session)

| Gate | Command | Result | Evidence |
| ---- | ------- | ------ | -------- |
| Scoped typecheck | `run-deno-check.ts --root plugins/workers --ext ts` | PASS | exit 0, 106 files, 0 occurrences |
| Scoped lint | `run-deno-lint.ts --root plugins/workers --ext ts` | PASS | exit 0, 0 occurrences |
| Scoped format | `run-deno-fmt.ts --root plugins/workers --ext ts` | PASS | exit 0, 106 files, 0 findings |
| Focused tests | `run-deno-test.ts -- --allow-all plugins/workers/tests/cli/` | PASS | exit 0, 21 passed / 0 failed |
| Workers test suite | `run-deno-test.ts -- --allow-all plugins/workers/tests/` | PASS | exit 0, 38 passed / 0 failed (matches PR claim exactly) |
| Lock hygiene | `git status` after gates | PASS | incidental lock/config writes by audit/generator tooling were restored; checkout clean apart from this run dir |

## Fitness Gates

| Gate | Check | Result | Evidence |
| ---- | ----- | ------ | -------- |
| quality:scan | `deno task quality:scan` | PASS | exit 0; 0 new findings; 7 pre-existing allowances unchanged (incl. `plugins/workers/streams/producer.ts:52`, untouched here) |
| arch:check (doctrine fitness) | `deno task arch:check` | PASS | exit 0; FAIL=0; warnings are pre-existing repo-wide (A13 in `test-api.ts`, F-5/F-6 `export default`, F-16 on untouched dirs) |
| F-16 folder cardinality | arch:check F-16 | WARN (see Finding F3) | `plugins/workers/src/cli` grew 11 → 13 immediate children (cap 12) via the two new helper files; tool-level F-16 is warn-only (exit 0) |
| F-5/F-6/F-7 doc lint (debt `workers-private-type-ref-1655`) | `run-deno-doc-lint.ts --root plugins/workers` | PASS within debt allowance | 19 `private-type-ref`, 0 `missing-jsdoc`, 0 other across 13 export targets — identical count re-measured on main (zero delta; allowance is ≤20/0/0) |
| F-6 publish dry-run | `deno publish --dry-run --allow-dirty` in `plugins/workers` | PASS | exit 0, no slow types; 3 pre-existing `unanalyzable-dynamic-import` warnings |
| verify-plugin (archetype 5 CoD) | `deno run --allow-all plugins/workers/verify-plugin.ts` | PASS | exit 0, manifest `0.0.7`, 9 contribution groups, 0 findings |
| Consumer/contract gates | real generated consumer fixtures | PASS | generator + compiler emit real registries that import the generated payload map into `createWorkersContract<GeneratedJobPayloadMap>()`; real `deno check` green inside the focused suite; golden byte-identity green |
| JSR audit (jsr-audit skill) | diff review + doc/publish gates | PASS | no new package export; `plugins/workers/deno.json` untouched by the diff (metadata/export map preserved) |
| Generated-carrier freshness | `check:agent-docs-prose`, `check:assets-barrel`, `check:publish-assets` | PASS | all exit 0; prose bundle reports `fresh:true` at sourceCommit `93f724daa`; no tracked-file drift after restore |

## Runtime Gates

| Gate | Validation | Result | Evidence |
| ---- | ---------- | ------ | -------- |
| `scaffold.runtime` (both tiers) | local run | NOT_RUN | Docker daemon confirmed unreachable in this evaluator session (Docker daemon unreachable); the worklog's Docker-preflight exit-1 record is corroborated. No runtime pass is claimed, per brief |
| `scaffold.runtime` (CI tier) | current-head CI | PENDING | `scaffold-runtime (aspire + docker + postgres)` statusCheckRollup = IN_PROGRESS at evaluation time; `scaffold-runtime-sqlite` lane pending earlier in the rollup |
| Current-head CI (other lanes) | `gh pr checks` + `agentic:pr-checks` classification | FAIL | `quality` is a **current-fail** at HEAD (see Finding F2); `check-test`, `agent`, `close-gate`, `code-quality`, `build`, `scaffold-static` current-pass/passed; review gate `check:review-threads` = PASS (0 threads, 0 unanswered) |

## Anti-Pattern Check (AP list per archetype 5; run scope = plugin CLI gluing)

AP-1 CLEAR (no mod.ts/contracts.ts accumulation; no surface touched), AP-3 CLEAR (no contract redefinition
in the diff), AP-8 CLEAR, AP-9 CLEAR (`@netscript/*` + `jsr:@std/*` imports used), AP-10 CLEAR, AP-11 CLEAR
(generator/compiler remain explicit CLI entrypoints), AP-13 CLEAR (errors thrown with typed messages + cause;
A13 warning pre-existing on main), AP-14 CLEAR (workers-core contracts imported, not redefined),
AP-16 CLEAR (folder is `src/cli` with named modules), AP-19 CLEAR (permissions vocabularies untouched),
AP-20 CLEAR, AP-22 CLEAR (no contribution-folder barrels touched), AP-23 CLEAR, AP-24 CLEAR, AP-25 CLEAR
(adapter entry gets registry text through the injected `PluginCommandContext.fileSystem` port).

## Arch-Debt Delta

| Metric | Count | Evidence |
| ------ | ----- | -------- |
| New entries | 0 | `.llm/harness/debt/arch-debt.md` unchanged; plan recorded "No new debt accepted" |
| Resolved entries | 0 | — |
| Deepened violations | 0 | workers doc-lint debt allowance honored exactly at its recorded baseline (19 ≤ 20, 0/0) with zero source-level drift vs main |
| Unrecorded violations | 0 debt-grade | one warn-level F-16 cardinality crossing recorded as Finding F3 (arch:check remains green; mirror-precedent bookkeeping suggested) |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| medium | F1 — Required runtime gate has no evidence at exact HEAD. Local `scaffold.runtime` NOT_RUN (Docker daemon unavailable, re-verified here); only the CI runtime tier is pending. | worklog "Docker preflight exit 1"; rollup `scaffold-runtime` IN_PROGRESS at evaluation time | Owner provides a working runtime or explicitly authorizes the gate exception (plan foresees exactly this decision: "No exception inferred"). No runtime pass may be claimed before either |
| medium | F2 — CI `quality` is a current-fail at HEAD through the `Critical advisory audit` step: `deno audit --level critical` exits 1 (reproduced locally: 39 advisories incl. 1 critical, `proxy-addr@2.0.7` pinned in `deno.lock`, advisory GHSA-jqcg-44mw-7w3h, fix at 2.0.8). Independent of this PR's diff (no dependency files touched; main is ancestor with the same advisory) but it blocks a green current-head CI. | job run 37678538059, step "Critical advisory audit"; local reproduction in the untracked temp transcript | Separate dependency-maintenance PR bumping/pinning `proxy-addr` past 2.0.8; do NOT bundle into #2035 |
| low | F3 — `plugins/workers/src/cli` moved 11 → 13 immediate children against the F-16 cap of 12 via `configured-job-policies.ts` and `load-workers-config.ts`. | arch:check F-16 WARN; `git ls-tree` 11 files at base vs 13 at HEAD | Record a matching arch-debt note (precedent: `telemetry-attributes-f16-1562`) or consolidate the helpers into a bounded subfolder in a follow-up slice |
| info | F4 — Doctrine file 09 states F-16 "Fails any directory >12 children" while the runner is warn-only repo-wide (19-children directories pass with exit 0). Pre-existing checker/doctrine drift, out of scope for this run. | `.llm/tools/fitness/check-doctrine.ts` F-16 branch emits level WARN; doctrine §F-16 text | Track under the doctrine/checker drift lane, not this PR |

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| Generated-registry correctness should be proven by `deno check` against the real core contract types, not by matching a local test stub | consumer-fixture-over-stub | Archetypes 3/5 (generators emitting contract-typed artifacts) | high |
| Dtype drift between two emitters of the same artifact class is preventable by sharing the matcher/policy loader module | shared-normalizer-over-parallel-code | Archetype 5 plugins with paired generators/compilers | medium |

## Verdict

| Field | Value |
| ----- | ----- |
| Verdict | FAIL_FIX |
| Rationale | The implementation itself satisfies both issue contracts and every independently re-run static, focused-test, consumer, fitness, doc-lint-debt, and publish gate at exact head `6a8a4de3e` — plan valid, code complete. The PASS bar also requires required runtime/consumer gate evidence: the plan-listed `scaffold.runtime` gate has no evidence anywhere (Docker daemon unavailable locally, CI runtime tier still running) and no owner-decided gate exception exists, and current-head CI is not green (`quality` current-fail). Per the brief, no runtime pass may be claimed. Nothing in the code needs to change; the run needs runtime evidence (or an explicit owner exception), the pending CI lanes to resolve, and the `proxy-addr` critical advisory fixed in a separate dependency PR before merge readiness. |

## Next

- Resolve Finding F1: owner-provided runtime for `scaffold.runtime` or an explicit recorded gate exception; then read the current-head CI `scaffold-runtime`/`scaffold-runtime-sqlite` lanes.
- Resolve Finding F2 in a separate `fix/` dependency PR (`proxy-addr` ≥ 2.0.8), not inside #2035.
- Optionally bookkeep Finding F3 as arch debt or a consolidation follow-up.

Evidence transcripts for this evaluation ran under the session's provided DENO_DIR/TMPDIR and are
untracked-by-design; this file records exact commands, exit codes, and counts so every row is re-runnable.
