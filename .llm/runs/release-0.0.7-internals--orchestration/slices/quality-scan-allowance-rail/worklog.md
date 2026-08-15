# Worklog — quality-scan-allowance-rail

## Identity

- Worktree: `/home/codex/repos/netscript-007-quality-rail`
- Branch: `chore/quality-scan-allowance-rail`
- Base: `01e0960494c95ce56eb35892c211a095eb13e6ed`
- Issues: #1378 + #1545
- Route requested/observed: OpenAI Codex GPT-5.6 Sol, high
- Draft PR: #1653 — `https://github.com/rickylabs/netscript/pull/1653`

## Design

### Public surface

The product-facing output is the behavior of `quality:scan`, `quality:scan:repo`, and the embedded
consumer copy of the scanner. The rule observes published CLI/workers declarations but does not
change their API shape. Package export maps were inspected with `deno doc` before focused source
reads.

### Domain vocabulary and ports

- `PublicExportGraph` classifies checked-in local exports and re-exports.
- `PublicAnyFinding` identifies a reachable declaration/signature and its export path.
- `QualityAllowance` is a single source location, issue number, and reason.
- `AllowanceIssueResolver` is the injected state boundary; its command adapter is fail closed.
- `AllowancePolicyFailure` covers malformed/unverified registration and budget overflow.

The scanner remains the sole tool/application boundary. No new package layer, CLI spine, feature
axis, plugin extension, or backend protocol is introduced. A narrow GitHub adapter is the external
port. Coordinator commit `874eacc0d` authorizes its exact focused-test, consumer-manifest,
generated-asset, and debt-registry peers; no other widening is permitted.

### Constants and configuration

The measured live population is 7. Both task maxima converge to 7 and may only decrease with removed
allowances. All seven registration comments use open, milestoned #1276 T3 and retain their specific
reason. #1545 is the closing one-time registration issue, never the durable source owner. Syntax and
state enums are named in the scanner; issue owner IDs remain in source comments, not a second table.

### Ordered commit slices

1. Registration rail: RED-first allowance/state tests, seven #1276-linked records with specific
   reasons, fail-closed resolver, budgets at 7; push only once green.
2. Exported-any rail: RED-first public-vs-local/re-export tests, then deterministic export graph and
   token-aware enforcement.
3. Consumer/JSR synchronization: generated asset through checked-in generator, clean second run, CLI
   full-export evidence, Workers strict 20-diagnostic no-increase evidence, and one #1655-linked
   `DEBT_ACCEPTED` entry.
4. Final evidence/sign-off artifacts after Tier-A reviews and global-gate lease; request IMPL-EVAL.

Each implementation slice will name its literal commit SHA and receipts in a structured PR comment.
#1545 registration precedes #1378 exported-any enforcement; no transient pushed red head is
permitted.

### Deferred and excluded work

The #1276 T3 root-cause removal and #1655 Workers private-type repair remain excluded, as do #1278
Inventory B, #1276 T1–T2/T4–T5, #1245, #1249, #1379, and #1380. No type weakening, broad
suppression, `as unknown as`, `as any`, `@ts-ignore`, or unregistered allowance will be introduced
to green a gate.

### Contributor path

A contributor sees one scanner diagnostic that names the source location, public export path or
allowance defect, and the required remediation: remove the unsafe construct, narrow it, or link a
specific reason to a verified open milestoned issue without exceeding the non-increasing budget.

## Gates

### Baseline at dispatch SHA

- Focused structured tests: 19 passed, 0 failed.
- Durable `quality-scan`: PASS, 7 allowances, 0 findings.
- Durable `quality-scan-repo`: PASS, 7 allowances, 0 findings.
- CLI full-export doc lint: PASS.
- Workers full-export doc lint: FAIL with 20 pre-existing private-type-ref diagnostics.

Receipts: `receipts/baseline/quality-tests.json`, `quality-scan.json`, and `quality-scan-repo.json`.

Final proving gates and per-slice structured commands are specified in `plan.md`. Global/expensive
gates require the coordinator's singleton lease.

### Slice 1 — registration rail

The scanner now accepts only `quality-allow: #<issue> — <specific reason>`, counts every
syntactically valid record against the fixed budget, deduplicates issue lookups, and fails closed
for unavailable, malformed, closed, or unmilestoned owner state. All seven source records retain
their existing reasons and bind to #1276 T3. Both task maxima are 7.

The production resolver is fixed to `rickylabs/netscript` on `api.github.com`. It uses
`GITHUB_TOKEN` or `GH_TOKEN` when available and otherwise deliberately uses the anonymous public
API, including in fork PRs and installed consumer copies. Offline, missing-net-permission,
malformed, and rate-limited responses remain failures; they never silently skip ownership
validation. Root tasks declare scoped net/env permissions, the consumer manifest declares
`read`/`env`/`net`, and the generated CLI asset was regenerated only through `gen:assets-barrel`.

| Evidence                                                      | Outcome       | Exit | Receipt                                              |
| ------------------------------------------------------------- | ------------- | ---: | ---------------------------------------------------- |
| RED focused allowance contract                                | expected FAIL |    1 | `receipts/slice-1/red-test.json`                     |
| Focused scanner suite (21 tests)                              | PASS          |    0 | `receipts/slice-1/focused-green-1.json`              |
| Scoped structured check (5 files)                             | PASS          |    0 | `receipts/slice-1/scoped-check.json`                 |
| Scoped structured lint (5 files)                              | PASS          |    0 | `receipts/slice-1/scoped-lint.json`                  |
| Scoped structured format (5 files)                            | PASS          |    0 | `receipts/slice-1/scoped-fmt.json`                   |
| `quality:scan` (7 verified records)                           | PASS          |    0 | `receipts/slice-1/quality-scan.json`                 |
| `quality:scan:repo` (7 verified records)                      | PASS          |    0 | `receipts/slice-1/quality-scan-repo.json`            |
| `quality:gate` (`quality:scan` + `arch:check`)                | PASS          |    0 | `receipts/slice-1/quality-gate.json`                 |
| Allowance budget stash-probe attestation (superseded)         | PASS          |    0 | `receipts/slice-1/allowance-budget.json`             |
| Allowance budget landed-head attestation (8 → 7, no increase) | PASS          |    0 | `receipts/slice-1/allowance-budget-landed-head.json` |
| Generated asset clean second generation                       | PASS          |    0 | `receipts/slice-1/assets-clean.json`                 |

The original allowance-budget receipt is preserved but superseded because its second argv input,
`3136358e484f8df30b778d2ae838dd9103077d10`, is a stash object outside branch history and therefore
is not a durable, independently rerunnable attestation. The binding replacement receipt compares the
immutable base directly with landed Slice 1 commit `586b5513500caa1fd5ce07878f4ba96606064555` and
records exit 0. All other receipts record the pre-commit evaluator head and their exact argv; none
is presented as a clean-worktree or supervisor sign-off receipt.

### Slice 2 — exported/publicly reachable `any`

The scanner now discovers checked-in package export roots, follows deterministic local named/star
re-export and import/export edges, and applies a token-aware `public-any` rule to reachable type
aliases, interfaces, function signatures, class public members, and explicitly typed exported
values. Local-only declarations, comments, strings, private/protected class members, and
implementation bodies remain outside this rule. Each public finding carries its declaration kind and
reachable export path; an unresolvable local public edge fails closed as `public-export-unresolved`.
External package edges remain outside the approved checked-in local graph and are covered from those
packages' own export roots.

Public-only findings use the same verified `quality-allow` record path as the existing line rules:
the marker must parse, its owner must resolve open and milestoned, and the record counts against the
fixed budget. A malformed marker cannot suppress the public rail. The focused suite preserves the
docs-fence and all six soundness-fixture regressions from #1549.

| Evidence                                                           | Outcome       | Exit | Receipt                                              |
| ------------------------------------------------------------------ | ------------- | ---: | ---------------------------------------------------- |
| RED public/local/re-export/unresolved matrix (21 pass, 3 fail)     | expected FAIL |    1 | `receipts/slice-2/red-public-any.json`               |
| First implementation pass; external edges misclassified            | expected FAIL |    1 | `receipts/slice-2/focused-green-1.json`              |
| Focused scanner suite (25 tests)                                   | PASS          |    0 | `receipts/slice-2/focused-green-binding.json`        |
| Scoped structured check (2 files, actually fired)                  | PASS          |    0 | `receipts/slice-2/scoped-check-fired.json`           |
| Root lint selection excluded `.llm` files; false-green refused     | expected FAIL |    2 | `receipts/slice-2/scoped-lint-1.json`                |
| Checked-in lint config found the pre-existing inline import prefix | expected FAIL |    1 | `receipts/slice-2/scoped-lint-committed-config.json` |
| Scoped structured lint with checked-in config (actually fired)     | PASS          |    0 | `receipts/slice-2/scoped-lint-fired.json`            |
| Initial exact-source format check                                  | expected FAIL |    1 | `receipts/slice-2/scoped-fmt-1.json`                 |
| Exact two-source structured format check (actually fired)          | PASS          |    0 | `receipts/slice-2/scoped-fmt-fired.json`             |
| `quality:scan` (7 verified records, zero findings)                 | PASS          |    0 | `receipts/slice-2/quality-scan-binding.json`         |
| `quality:scan:repo` (7 verified records, zero findings)            | PASS          |    0 | `receipts/slice-2/quality-scan-repo-binding.json`    |
| `quality:gate` (`quality:scan` + `arch:check`, zero failures)      | PASS          |    0 | `receipts/slice-2/quality-gate-binding.json`         |

The check/lint/format task cache inputs do not include `.llm/tools/quality/**`; unique harmless
batch-size arguments forced the final wrapper processes to execute instead of accepting a cached
task result. Formatting targeted only the two TypeScript sources and never the receipt directory.
All binding receipts record `actualGitHead` = signed Slice 1 head
`3c398528996a715da8daebe04969e6aba90263e9`; none names a stash or any non-history commit-ish.

## Reconcile notes

- Live #1378 and #1545 are open in milestone 0.0.7; `origin/main` equals the approved baseline.
- #1549 already delivered docs fences, soundness preservation, original budget wiring, and typed
  triggers examples; preserve rather than duplicate it.
- Current allowance population is 7; live #1545 has been reconciled from stale 8 to 7.
- Coordinator comment `5286261678` and central commit `874eacc0d` resolve the former authority
  blockers: #1276 T3 owns all seven records, the four exact coupled surfaces are authorized, and
  #1655 owns Workers lint repair with strict no-increase evidence here.
- Slice 1 live reconcile: PR #1653 remains open, draft, milestone 0.0.7, and exactly `status:impl`;
  both closing keywords remain in its body. Fetched `origin/main` advanced from the immutable base
  to `dd472102d` through merged #1644 only. Its diff does not overlap this leaf's authorized
  scanner/package/plugin/generated surfaces, so the locked base was retained and no rebase or #1644
  worktree/PR mutation occurred.
- Slice 2 live reconcile: PR #1653 remains open and draft at milestone 0.0.7 with exactly
  `status:impl`; its body still carries both closing keywords. Live #1378 and #1545 remain open. No
  label, milestone, issue, base, or readiness mutation was made.

## Activity

- 2026-08-13 — read all required skills, overlays, doctrine, gate, evaluator, and coordinator
  inputs.
- 2026-08-13 — fetched live issue bodies/comments; inspected current scanner/tests/tasks/CI and
  published surfaces; re-measured current-head counts.
- 2026-08-13 — wrote research/design/plan artifacts and a separate evaluator request. No product
  implementation started.
- 2026-08-13 — committed bootstrap as `12f0929f3db0507b37216dcfefa21301f5255399`, pushed by explicit
  refspec, opened draft PR #1653 directly against `main`, applied milestone 0.0.7/taxonomy, posted
  RESEARCH and PLAN comments, and handed off at `status:plan-eval`.
- 2026-08-13 — late Claude-compatible OpenRouter evaluator run (Claude session
  `977b0618-1b0c-4957-8369-698d3c5274c6`, OpenRouter `minimax/minimax-m3` / high; native
  `fable-5`/medium fallback per the lane policy) evaluated the plan at `c573beda9` against leaf base
  `01e096049` and returned `FAIL_PLAN`. At that historical head, three must-resolve-now items
  (`drift.md` D-2, D-3, D-4) were open and listed in `plan-eval.md`; D-1 (#1545 stale prose) was
  editorial. Implementation hard stop remained in force. No product, package, plugin, generated, or
  workflow source was inspected or edited.
- 2026-08-13 — the owner/coordinator classified the late Claude-compatible OpenRouter `FAIL_PLAN` as
  advisory only and stopped all milestone Claude/OpenRouter evaluator work until the 2026-08-15
  00:00 Europe/Zurich reset. Coordinator comment `5286261678` and central commit `874eacc0d`
  resolved D-1 through D-4 without implementation.
- 2026-08-13 — repaired plan/design/evaluator metadata only, removed the two untracked evaluator
  prompts and failed self-referential JSONL, left `.llm/harness/debt/arch-debt.md` untouched, and
  stopped at `status:plan-eval` awaiting a fresh formal post-reset verdict.
- 2026-08-15 — resumed at formal PLAN-EVAL cycle 2 `PASS`; captured the Slice 1 RED receipt, landed
  the fail-closed registration/resolver rail and R-1/R-2 regressions, regenerated the authorized
  consumer asset, ran the named structured gates, and stopped before Slice 2 for Tier-A review.
- 2026-08-15 — substantive Tier-A content review passed in PR comment `5299267431`; reran the sole
  E1 allowance-budget attestation against landed commit `586b5513500caa1fd5ce07878f4ba96606064555`,
  preserved the superseded stash-probe receipt, and stopped before Slice 2 pending supervisor
  sign-off.
- 2026-08-15 — Slice 1 supervisor sign-off landed at `3c398528996a715da8daebe04969e6aba90263e9` (PR
  comment `5299297798`). Captured Slice 2 RED-first proof, implemented the checked-in local export
  graph and public-signature rule, preserved the corrective failed receipts, ran the named
  structured gates, and stopped before Slice 3 for substantive Tier-A review.

## Plan-Gate state

- Historical OpenRouter artifact: advisory `FAIL_PLAN` at `8a4709afe`; its D-2/D-3/D-4 findings are
  resolved by coordinator authority and its D-1 editorial finding is resolved in live #1545.
- Current formal verdict: cycle 2 `PASS` in `plan-eval.md`, evaluator artifact commit `c694cfb311`.
- Slice state: **Slice 1 is signed off. Slice 2 implementation and evidence are complete and await
  substantive Tier-A review.** Slice 3 has not started and is not authorized until supervisor
  sign-off.

## Tier-A sign-off — Slice 1

Signed off by `topic-internals-0.0.7` (Claude session `f7691917-0be2-4bcd-8839-43d3fc809c34`, Opus 5
/ high). This commit is the supervisor's, not the implementer's; no lane self-certified.

Reviewed at the landed content, not from receipts:

- Authorized surface holds — all eight non-run-artifact paths are in the leaf contract
  `fileSurfaces`; no tenth surface.
- Registration is comment-only. Per-file `as unknown as` / `any` counts are unchanged:
  `packages/cli/src/public/public-api.ts` 5 → 5,
  `packages/cli/src/public/features/root/public-command-dependencies.ts` 1 → 1,
  `plugins/workers/streams/producer.ts` 1 → 1. Every source edit appends `#1276 —` to a pre-existing
  `quality-allow` reason. The `as unknown as` occurrences elsewhere in the diff are fixture string
  literals inside `scan-code-quality_test.ts`, where sample violating code is the scanner's test
  input by construction.
- Allowance population independently counted at the landed head: **7**, every record bound to #1276.
  `deno task quality:scan` → `ok:true`, `allowCount: 7`, zero findings, zero `allowanceFailures`.
- R-1 verified behaviourally in both directions rather than accepted as a claim. Permissions are
  narrowly scoped (`--allow-net=api.github.com --allow-env=GITHUB_TOKEN,GH_TOKEN`), not blanket.
  Network denied → exit **1**, `ok:false`, seven `owner-unavailable` failures each naming the exact
  remedy. Network allowed → exit **0**, `ok:true`, resolver verified #1276 live. The rail fails
  closed and does not silently no-op when unconfigured.
- R-2 verified: `scan-code-quality_test.ts:360` pins `Backlog / Triage` owners as accepted, which is
  the milestone shape that would otherwise fail all seven records on day one. Closed, unmilestoned,
  malformed, offline, rate-limited (403 + `x-ratelimit-remaining: 0`), and fork-without-token states
  are also covered.
- RED-first order holds — `red-test.json` exit 1, then `focused-green-1.json` exit 0 across 21
  tests.
- Budgets converge downward to the measured population: `quality:scan:repo` `--max-allow` 8 → 7.
- Lock hygiene holds — no `deno.lock` and no incidental source churn in either commit.
- E1 closed: the binding budget attestation is now
  `receipts/slice-1/allowance-budget-landed-head.json` (`gitHead` = `actualGitHead` =
  `586b5513500caa1fd5ce07878f4ba96606064555`), independently re-run by the supervisor with exit 0.
  The superseded stash-probe receipt is retained on disk and its defect is recorded as D-11 rather
  than hidden.

Noted for IMPL-EVAL, not a slice defect: the slice-1 gate receipts record `actualGitHead` as the
parent `c694cfb311…`. That is the normal pre-commit gate pattern and matches the convention
IMPL-EVAL already accepted on #1644 — receipts attest a process in a working tree at a commit, not
tree cleanliness.

## Tier-A sign-off — Slice 2

Signed off by `topic-internals-0.0.7` (Claude session `f7691917-0be2-4bcd-8839-43d3fc809c34`, Opus 5
/ high) at implementation head `f869a5bfed83a09b67b0725b2679d0aa30ad491c`. Supervisor commit, not
the implementer's; no lane self-certified.

Verified by execution at the landed head, not from receipts:

- **Scope holds.** Only `.llm/tools/quality/scan-code-quality.ts`, its focused test, and this run
  directory changed. No `packages/**` or `plugins/**` edit, no `deno.json`/task change, no
  `deno.lock` churn.
- **The new rail is real and correctly bounded.** Slice 2 adds `public-any` and
  `public-export-unresolved` alongside the pre-existing line-level `explicit-any` classifier. The
  public/local separation is asserted as an **exact** finding set via `assertEquals` over
  `rule:file:line`, with deliberate local controls in the fixture — `type Local`, `function local`,
  `class LocalService`, `private hidden`, and a body-local `const hidden: any` inside an exported
  function. A superset would fail the assertion, so local leakage into `public-any` cannot pass
  silently.
- **Focused suite re-run by the supervisor: 25 passed, 0 failed, exit 0.**
- **`quality:gate` re-run by the supervisor at the landed head: exit 0, `ok:true`, `findings: []`,
  `allowCount: 7`.** The `arch:check` output carries only pre-existing non-blocking F-5/F-6
  `export default` WARNs.
- **RED-first order holds** — `red-public-any.json` exit 1 across the public/local/re-export matrix,
  then `focused-green-binding.json` exit 0.
- **The lint FAIL → PASS sequence is a real fix, not a suppression.** `scoped-lint-committed-config`
  exit 1 caught a pre-existing inline import specifier; the fix replaced
  `import { relative, resolve } from 'jsr:@std/path@^1'` with
  `import { dirname, relative, resolve } from '@std/path'`. No lint config, task, or `deno.json`
  change accompanied it, and `scoped-lint-1` exit 2 was correctly refused as an empty-selection
  false green rather than banked as a pass.
- **No new suppressions in real code.** Every `any` / `as unknown as` added in this diff is a
  fixture string literal inside `scan-code-quality_test.ts`, where sample violating code is the
  scanner's own input by construction.
- **The E1 lesson was applied.** Every slice-2 binding receipt records the signed Slice 1 parent
  `3c398528996a715da8daebe04969e6aba90263e9`; none names a stash or any object outside branch
  history.

Carried to IMPL-EVAL, not a slice defect: `explicit-any` (broad, line-level) and `public-any`
(export-graph reachability) now coexist. Their overlap and precedence is locked plan behaviour that
PLAN-EVAL cycle 2 passed, but IMPL-EVAL should confirm the combination reports each violation once
with the intended rule attribution rather than double-counting.

Slice 3 is authorized.
