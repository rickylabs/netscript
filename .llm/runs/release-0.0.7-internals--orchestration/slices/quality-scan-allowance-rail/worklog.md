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
API, including in fork PRs and installed consumer copies. Offline, missing-net-permission, malformed,
and rate-limited responses remain failures; they never silently skip ownership validation. Root
tasks declare scoped net/env permissions, the consumer manifest declares `read`/`env`/`net`, and
the generated CLI asset was regenerated only through `gen:assets-barrel`.

| Evidence | Outcome | Exit | Receipt |
| --- | --- | ---: | --- |
| RED focused allowance contract | expected FAIL | 1 | `receipts/slice-1/red-test.json` |
| Focused scanner suite (21 tests) | PASS | 0 | `receipts/slice-1/focused-green-1.json` |
| Scoped structured check (5 files) | PASS | 0 | `receipts/slice-1/scoped-check.json` |
| Scoped structured lint (5 files) | PASS | 0 | `receipts/slice-1/scoped-lint.json` |
| Scoped structured format (5 files) | PASS | 0 | `receipts/slice-1/scoped-fmt.json` |
| `quality:scan` (7 verified records) | PASS | 0 | `receipts/slice-1/quality-scan.json` |
| `quality:scan:repo` (7 verified records) | PASS | 0 | `receipts/slice-1/quality-scan-repo.json` |
| `quality:gate` (`quality:scan` + `arch:check`) | PASS | 0 | `receipts/slice-1/quality-gate.json` |
| Allowance budget (8 → 7, no increase) | PASS | 0 | `receipts/slice-1/allowance-budget.json` |
| Generated asset clean second generation | PASS | 0 | `receipts/slice-1/assets-clean.json` |

The allowance-budget receipt compares the immutable base with probe tree
`3136358e484f8df30b778d2ae838dd9103077d10`, created from the staged Slice 1 diff, because the
checker requires two committed tree-ish inputs. All other receipts record the pre-commit evaluator
head and their exact argv; none is presented as a clean-worktree or supervisor sign-off receipt.

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
  scanner/package/plugin/generated surfaces, so the locked base was retained and no rebase or
  #1644 worktree/PR mutation occurred.

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

## Plan-Gate state

- Historical OpenRouter artifact: advisory `FAIL_PLAN` at `8a4709afe`; its D-2/D-3/D-4 findings are
  resolved by coordinator authority and its D-1 editorial finding is resolved in live #1545.
- Current formal verdict: cycle 2 `PASS` in `plan-eval.md`, evaluator artifact commit `c694cfb311`.
- Slice state: Slice 1 implementation and structured evidence complete; BLOCKED awaiting
  substantive Tier-A topic review before supervisor sign-off or Slice 2.
