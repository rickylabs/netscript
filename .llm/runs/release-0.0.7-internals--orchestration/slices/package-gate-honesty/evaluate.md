# Evaluation: package-gate-honesty (#1663) — IMPL-EVAL

Formal, mandatory, separate-session implementation evaluation of leaf #1663
`fix/package-gate-honesty` (`Closes #1604`, `#1618`, `#1622`). Everything below was re-derived by
this session on `git archive` copies under `$CLAUDE_JOB_DIR/tmp` (`base/`, `head/`, `mut/`,
`gapmut/`) or read-only in the worktree; no receipt or supervisor table was accepted on trust.

## Metadata

| Field          | Value                                                                       |
| -------------- | --------------------------------------------------------------------------- |
| Run ID         | `release-0.0.7-internals--orchestration` / slice `package-gate-honesty`     |
| Target         | PR #1663, head `cf31de902e530a5874fdd074338cb6f7b16167f9`                   |
| Immutable base | `05fc3132b6800a85eb6152691a961b658962571b`                                  |
| Archetype      | Leaf profile (CLI A6 / MCP A2 shapes preserved); tooling + tests + fixtures |
| Scope overlays | none (docs/runtime not in scope; `scaffold.runtime` coordinator-waived)     |
| Evaluator      | Claude Code session `99fea668-e784-4438-a529-a72044913932`, 2026-08-23      |

## Identity, independence, route

Recorded before any mutation from `$CLAUDE_JOB_DIR/state.json`
(`/home/codex/.claude/jobs/99fea668`):

| Field                 | Observed                                                                                                                               |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| sessionId             | `99fea668-e784-4438-a529-a72044913932`                                                                                                 |
| bridgeSessionId       | `cse_01NVjLWd1SSvj1fAsUn17Eoh` (non-empty)                                                                                             |
| backend               | `daemon`                                                                                                                               |
| respawnFlags          | `--effort medium --remote-control --permission-mode bypassPermissions --name "NetScript 0.0.7 #1663 IMPL-EVAL" --model claude-fable-5` |
| providerEnv           | `{}`                                                                                                                                   |
| cwd                   | `/home/codex/repos/netscript-007-package-gate`                                                                                         |
| CLI version           | `2.1.241 (Claude Code)`                                                                                                                |
| Requested route       | `formal_impl_evaluation` → native Anthropic Claude Fable 5, effort medium, remote-control                                              |
| Observed route        | native Anthropic (`providerEnv {}`), `claude-fable-5`, `medium`, `--remote-control`                                                    |
| Requested == observed | **yes**                                                                                                                                |

Independence: this session id matches none of the Codex author thread
`01a004ec-86a6-7c21-8886-81c09de099f5`, topic supervisor `f7691917-0be2-4bcd-8839-43d3fc809c34`, or
plan evaluators `9078ecb6-…`, `517ac0e7-…`, `0f7c4fdf-…`; it is a freshly launched bg job with no
shared state.

## Target verification

| Check                                                      | Value                                               | Result     |
| ---------------------------------------------------------- | --------------------------------------------------- | ---------- |
| local `git rev-parse HEAD`                                 | `cf31de902e530a5874fdd074338cb6f7b16167f9`          | match      |
| `git ls-remote origin refs/heads/fix/package-gate-honesty` | `cf31de902e530a5874fdd074338cb6f7b16167f9`          | match      |
| PR #1663 `headRefOid` / `baseRefOid`                       | `cf31de902…` / `05fc3132b…`                         | match      |
| `git merge-base HEAD main`                                 | `05fc3132b…`                                        | match      |
| PR state / milestone / labels                              | draft, `0.0.7`, `type:fix status:impl area:tooling` | as briefed |
| `git status --short` at start                              | empty                                               | clean      |

## Process verification

| Check                           | Result                      | Evidence                                                                                                                                                                                                                                       |
| ------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plan-Gate before implementation | PASS (by owner disposition) | three `FAIL_PLAN` cycles preserved (`plan-eval-cycle-1.md`, `-cycle-2.md`, `plan-eval.md`); owner-granted amendment `62811a9dd` with supervisor Tier-A stand-in, recorded in `drift.md` §2026-08-15 / §2026-08-23. Not re-litigated per brief. |
| Design section in worklog       | PASS                        | `worklog.md:12 ## Design`; checkpoint row `worklog.md:84` (2026-08-15)                                                                                                                                                                         |
| Commit slices match design plan | PASS                        | S1 `4b988a381`, S2 `22dc3906e`, S3 `fd508978c`, S4 `cf31de902` — four slices in plan order                                                                                                                                                     |
| Each slice has a passing gate   | PASS                        | re-derived below; S4 receipts attest `fd508978c` by design (no product change in S4)                                                                                                                                                           |
| Briefs carry `## SKILL` chapter | PASS                        | all seven `briefs/1663-*.md` on the orchestrator branch contain `## SKILL`                                                                                                                                                                     |
| Surface discipline (13 paths)   | PASS                        | `git diff --stat 05fc3132b..cf31de902 -- . ':!.llm/runs'` = exactly 13 files; run-dir diff = 10 files under the slice dir only                                                                                                                 |
| arch-debt delta                 | none                        | `git diff --stat 05fc3132b..cf31de902 -- .llm/harness/debt/` empty                                                                                                                                                                             |

## Per-obligation results (executed evidence)

### 1. The three issues are actually fixed

| Issue | Command (executed on archive copy)                                                                                           | Base `05fc3132b`                                                                                                                                    | Head `cf31de902`                                                                                 | Result                                           |
| ----- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| #1604 | `deno task --cwd packages/cli test`                                                                                          | exit 1 — 825 passed / **3 failed**: `run-documented-stream-example_test.ts:4`, `service-env-gates_test.ts:96`, `quickstart-command-drift_test.ts:4` | exit 0 — **828 passed / 0 failed (533 steps), 0 ignored**                                        | PASS                                             |
| #1604 | same three test files run from repo root (`deno test --allow-all <3 files>`)                                                 | —                                                                                                                                                   | `ok \| 6 passed \| 0 failed`                                                                     | PASS (cwd-independent both ways)                 |
| #1618 | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/mcp --ext ts,tsx` (exact, no extra flags)      | exit 1 — `filesSelected 115, batches 1, failedBatches 1` (parse crash on `broken/deno.json`)                                                        | **exit 0 — `filesSelected 114, batches 2, failedBatches 0, findings 0`**                         | PASS                                             |
| #1622 | `deno test --allow-all packages/mcp/tests/guidance-retrieval_test.ts` with `closeScoreGap` mutated in `guidance-index.ts:44` | widened 0.75 → 7/0 **green** (unpinned); narrowed 0.4 → 7/0 **green** (unpinned)                                                                    | widened 0.75 → **FAILED 6/1**; narrowed 0.49 / 0.4 / 0.25 → **FAILED 6/1**; unmodified 0.5 → 7/0 | PASS (see F1 for the width of the widening band) |

### 2. No false green

| Check                                                        | Evidence                                                                                                                                                                                                                                                           | Result |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| `deno check` still covers all five doctor fixture files      | `run-deno-check.ts --root packages/mcp --ext ts,tsx --include fixtures/doctor` → `filesSelected 5, batches 1, failedBatches 0`, exit 0; full `--root packages/mcp` → 115 selected. No `No matching files` string in stdout/stderr (grep count 0).                  | PASS   |
| `deno check` genuinely type-checks the marked `broken/` file | scratch copy: appended `const bad: number = "str"` to `broken/netscript.config.ts` → wrapper exit 1, `failedBatches 1`, TS2322 reported                                                                                                                            | PASS   |
| Four healthy TS files selected by **fmt** wrapper            | `--include fixtures/doctor` → `filesSelected 4`; scratch copy with mis-formatted `healthy/netscript.config.ts` and `healthy/.netscript/generated/plugin-workers/job-registry.ts` → exit 1, `findings 2` naming both paths                                          | PASS   |
| Four healthy TS files selected by **lint** wrapper           | `--include fixtures/doctor` → `filesSelected 4`; scratch copy with `var` added to `job-registry.ts` → exit 1, `no-var` at that path line 3                                                                                                                         | PASS   |
| Marker removes exactly one file                              | 115 (base) → 114 (head); the only repo marker is `packages/mcp/tests/fixtures/doctor/broken/.deno-fmt-lint-ignore` (`git ls-files` count 1)                                                                                                                        | PASS   |
| No pass by empty selection                                   | scratch copy with a marker placed at `packages/mcp/` → fmt exit 2 and lint exit 2, `refusing a false-green gate`                                                                                                                                                   | PASS   |
| No pass by task cache                                        | every gate above was run via the direct wrapper/binary command on a fresh `git archive` extraction, never via a `files`-cached `deno task`                                                                                                                         | PASS   |
| Root `fmt:check` command (direct, head)                      | `filesSelected 2038, batches 36, failedBatches 0, findings 0`, exit 0 — doctor family now flows through the wrapper and is excluded only by root `fmt.exclude` for the root config while nearest-config batching handles scoped runs                               | PASS   |
| Root `lint` command (direct, head)                           | `filesSelected 2034, batches 35, failedBatches 0`, 0 occurrences, exit 0                                                                                                                                                                                           | PASS   |
| Wrapper unit tests                                           | worktree `deno task gates:test` → `ok \| 56 passed \| 0 failed` (base had 52; +4 new marker/config-batch tests). Archive copies report one failure `run-gate_test.ts:27` = `Cannot resolve git HEAD` — environmental (archives have no `.git`), identical at base. | PASS   |
| `packages/mcp` suite incl. `doctor-families_test.ts`         | `deno test --allow-all packages/mcp/tests/` → `ok \| 136 passed \| 0 failed`                                                                                                                                                                                       | PASS   |

### 3. Nothing weakened to pass

| Check                                                                                             | Evidence                                                                                                                                                                                   | Result |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| No new `deno-lint-ignore` / `ts-ignore` / `any` / `as unknown as` / `.skip` / `ignore:` / `only:` | grep over all `+` lines of the 12 non-generated product files → zero hits                                                                                                                  | PASS   |
| No deleted assertion                                                                              | only removed `assert`/`Deno.test` line is the renamed guidance test header (same test, new fixture); test count 259 → 263 across touched test roots                                        | PASS   |
| `quality:scan` allowCount                                                                         | `deno task quality:scan` → `ok:true, findings:[], allowCount:7` (all 7 allowances pre-existing, issue #1276)                                                                               | PASS   |
| `broken/deno.json` byte-identical                                                                 | sha256 `6815999dbd68bd1ab5bb137b59808cb1f1a38fb3393c9133721f439c0ad37361` at head and at base                                                                                              | PASS   |
| healthy fixture change is formatting-only                                                         | `healthy/netscript.config.ts` diff is quote style + line break only; parsed value `{ plugins: ['workers'] }` unchanged; reformatted under its effective nearest config `healthy/deno.json` | PASS   |

### 4. Publish honesty

| Check                                                                          | Evidence                                                                                                                                                                                                                      | Result |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| CLI barrel reproducible, not hand-edited                                       | head archive: `deno task gen:assets-barrel` → `agent-tools.generated.ts` sha256 prefix `d201847b7ed3bffa` before and after, `cmp` identical to worktree; the other three CLI barrels unchanged                                | PASS   |
| CLI publish delta = embedded lint text + hash only                             | `EMBEDDED_AGENT_TOOL_BUNDLE_HASH` `746673d9…` → `500b6940…`; embedded `run-deno-lint.ts` now carries the marker/nearest-config text; `agent-tools.generated.ts` is in the publish file list; no export/API change in the diff | PASS   |
| `@netscript/cli` publish dry-run                                               | `deno publish --dry-run --allow-dirty --no-check` exit 0 (pre-existing `unanalyzable-dynamic-import` warnings only)                                                                                                           | PASS   |
| `@netscript/mcp` publish dry-run + only-a-comment delta                        | exit 0; publish file list base vs head: 79 files both, single differing line `src/domain/docs/guidance-index.ts (9.32KB → 9.51KB)`; `tests/**` and fixtures not published (0 `tests/` entries)                                | PASS   |
| CLI `isolatedDeclarations: false` + doc-completeness debt reported as baseline | `worklog.md:489-490` states both as baseline, not greened; `arch-debt.md:870` entry `cli/public-api-doc-completeness` untouched                                                                                               | PASS   |

### 5. Surface discipline

Exactly thirteen product paths in `05fc3132b..cf31de902` (listed in the Process table); no
fourteenth in any intermediate commit (`git log --stat` of the four slices reconciles to the same
set). Run-artifact diff is confined to the slice dir.

### 6. `scaffold.runtime`

Recorded as coordinator-waived `n/a` in `worklog.md`; no Aspire/Docker/`e2e:cli`/runtime smoke
appears in the worklog, and this evaluation ran none.

## Known-red baseline — disposition

`deno doc --lint` on `packages/mcp` export entrypoints, re-derived on separate archive copies:

| Ref              | `./cli.ts`                    | `./mod.ts`                    | `./openapi-projection.ts` | Diagnostic                                                                                                                           |
| ---------------- | ----------------------------- | ----------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| base `05fc3132b` | exit 1 (1 `private-type-ref`) | exit 1 (1 `private-type-ref`) | exit 0                    | `GetOperationSchemaResult["view"]` references private `SchemaViewName` at `src/application/flows/get-operation-schema-flow.ts:21:36` |
| head `cf31de902` | exit 1 (1)                    | exit 1 (1)                    | exit 0                    | byte-identical stderr after path normalisation                                                                                       |

Unchanged, pre-existing, not caused or deepened by this PR — **not** scored as a regression.
`.llm/harness/debt/arch-debt.md` has no `private-type-ref` entry for `packages/mcp`. The
supervisor's escalation to the coordinator/owner is **adequate for this leaf**: the verdict
definitions reserve `FAIL_DEBT` for debt _introduced or deepened_ by the run, and the red predates
the base. The registration should nonetheless land (arch-debt entry with owner/target/reason/linked
plan) before `status:ready-merge` on #1663 or at the latest before the 0.0.7 milestone close, so the
next run does not re-discover it.

## Findings

### F1 — `closeScoreGap` widening band is coarser than the recorded real-corpus headroom (advisory; does not block)

- Where: `packages/mcp/tests/guidance-retrieval_test.ts:77-82` — outside control
  `pages/00-outside#just-outside` at `9.75`, i.e. leader `10.5 − 0.75` (`0.5 + 0.25`).
- Reproduction (head archive, `sed` mutation of `guidance-index.ts:44`, then the suite):

  | `closeScoreGap` | result     |
  | --------------- | ---------- |
  | 0.25, 0.4, 0.49 | FAILED 6/1 |
  | 0.5             | ok 7/0     |
  | 0.51, 0.6       | **ok 7/0** |
  | 0.75, 5         | FAILED 6/1 |

- Narrowing is pinned exactly. Widening is pinned only at `≥ 0.75`; any value in `(0.5, 0.75)` is
  undetected. The rationale comment recorded by this very PR (`guidance-index.ts:42-43`) states the
  real headroom is `≈0.198` and one regeneration moves scores by `≈0.075` — so the concrete threat
  #1622 names ("widening it to absorb a new flip") would, at e.g. `0.6` or `0.7`, still pass green.
- Why not blocking: #1622's acceptance boxes are met as written (widened `0.5 → 5` fails with raw
  exit 1; narrowing fails; element renamed to state what it checks; rationale recorded), and
  `plan.md:102` (L5) plus the risk row at `plan.md:188` explicitly authorise "a deliberately larger
  outside epsilon" for float safety. The guard can fire; it is coarse, not dead.
- Recommended follow-up (coordinator's call, separate issue or S5 if the owner wants it in this PR):
  move the outside case to an exactly representable `0.5 + 0.0625` (score `9.9375`), or add a second
  outside control at `9.9375` while keeping `9.75`, so the widening band shrinks below the recorded
  headroom.

### O1 — root `lint` task and root `lint.exclude` still exclude the whole doctor family (observation)

`deno.json:151` (`lint` task `--exclude … packages/mcp/tests/fixtures/doctor/ …`) and
`deno.json:186` (`lint.exclude`) are unchanged from base, so the four healthy fixture files are
linted only through the scoped `--root packages/mcp` wrapper form, not through root
`deno task lint`. Pre-existing and outside the plan's thirteen-path surface (the plan moved only the
`fmt:check` exclusion); noted for the coordinator, not a finding against this PR.

### O2 — `gates:test` on `git archive` copies is environmentally red

`run-gate_test.ts:27` needs a `.git` to resolve HEAD; it fails identically on base and head archives
and passes in the worktree (`56 passed / 0 failed`). Evaluators using archive copies should expect
this.

## Anti-pattern check

| Pattern                              | Status | Evidence                                                                                      |
| ------------------------------------ | ------ | --------------------------------------------------------------------------------------------- |
| Guard that cannot fire (#1622 class) | CLEAR  | all repaired guards fired under negative control (tables above); F1 notes residual coarseness |
| Gate green by empty selection        | CLEAR  | both wrappers exit 2 on zero selection                                                        |
| Gate green by task cache             | CLEAR  | all evidence from direct commands on fresh extractions                                        |
| Hand-edited generated asset          | CLEAR  | barrel reproduces byte-for-byte                                                               |
| Fixture "repaired" to pass           | CLEAR  | `broken/deno.json` sha unchanged; healthy change formatting-only                              |
| Ambient cwd in tests (A7)            | CLEAR  | three tests now anchor on `import.meta.url`; pass from both cwds                              |
| New doctrine debt introduced         | CLEAR  | `arch:check:repo` exit 0 with only pre-existing F-5/F-6 warnings                              |

## Verdict

`PASS`

Implementation satisfies the approved plan and the three issues' acceptance as written, with every
gate re-derived from commands rather than receipts. F1 is recorded as an advisory follow-up for the
coordinator; the known-red `deno doc --lint` baseline is unchanged and its debt registration is
correctly escalated rather than silently greened.

## Notes

- Evaluated on `git archive` extractions of `05fc3132b` and `cf31de902` under
  `/home/codex/.claude/jobs/99fea668/tmp/{base,head,mut,gapmut}`; no product or config path in the
  worktree was modified; the only file this session adds is this `evaluate.md`.
- `scaffold.runtime`, Aspire, Docker and `e2e:cli` were not run (coordinator-waived `n/a`).
- Close-gate state at evaluation time (read-only): #1604 0/3, #1618 0/4, #1622 0/4 acceptance boxes
  checked; PR DoD has S0 only checked. That is consistent with `status:impl`; the close-gate governs
  `status:ready-merge`, which this pass does not flip.
