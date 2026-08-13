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
axis, plugin extension, or backend protocol is introduced. A narrow GitHub adapter is the proposed
external port; contract approval is pending because its manifest/generated peers are not currently
declared.

### Constants and configuration

The measured live population is 7. Both task maxima converge to 7 and may only decrease with removed
allowances. Syntax and state enums are named in the scanner; issue owner IDs remain in the source
registration comments, not duplicated in a second budget table.

### Ordered commit slices

1. Registration rail: RED-first allowance/state tests, seven linked records, fail-closed resolver,
   budgets at 7; push only once green.
2. Exported-any rail: RED-first public-vs-local/re-export tests, then deterministic export graph and
   token-aware enforcement.
3. Consumer/JSR synchronization: generated asset through checked-in generator, clean second run,
   full-export doc/publish evidence.
4. Final evidence/sign-off artifacts after Tier-A reviews and global-gate lease; request IMPL-EVAL.

Each implementation slice will name its literal commit SHA and receipts in a structured PR comment.
#1545 registration precedes #1378 exported-any enforcement; no transient pushed red head is
permitted.

### Deferred and excluded work

The casts' root-cause removal, broad JSR private-type repairs, #1278 Inventory B, #1276 T1–T5,
#1245, #1249, #1379, and #1380 are excluded. No type weakening, broad suppression, `as unknown as`,
`as any`, `@ts-ignore`, or unregistered allowance will be introduced to green a gate.

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

## Reconcile notes

- Live #1378 and #1545 are open in milestone 0.0.7; `origin/main` equals the approved baseline.
- #1549 already delivered docs fences, soundness preservation, original budget wiring, and typed
  triggers examples; preserve rather than duplicate it.
- Current allowance population is 7, not the issue's stale 8.
- Required test/generated peers, durable issue ownership/state lookup, and workers JSR baseline are
  escalated in `drift.md`.

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
- 2026-08-13 — bounded opposite-family PLAN-EVAL (Claude session
  `977b0618-1b0c-4957-8369-698d3c5274c6`, OpenRouter `minimax/minimax-m3` / high; native
  `fable-5`/medium fallback per the lane policy) evaluated the plan at `c573beda9` against leaf base
  `01e096049` and returned `FAIL_PLAN`. Three must-resolve-now items (`drift.md` D-2, D-3, D-4)
  remain open and are listed in `plan-eval.md`; D-1 (#1545 stale prose) is editorial and safe to
  defer to implementation alongside D-2. Implementation hard stop remains in force. No product,
  package, plugin, generated, or workflow source was inspected or edited.

## PLAN-EVAL verdict

- Verdict: `FAIL_PLAN` (see `plan-eval.md`).
- Required fixes before a fresh PLAN-EVAL may return `PASS`:
  1. Durable open, milestoned debt owner for the seven allowances (D-2). #1545 closes in this PR and
     cannot be the post-merge owner.
  2. Leaf contract surface amendment for `.llm/tools/quality/scan-code-quality_test.ts`,
     `packages/cli/src/kernel/assets/agent-tools.generated.ts`, and
     `.llm/tools/consumer-tools.json`, or a truthful approved alternative that still proves
     RED-first behaviour and ships a fresh consumer asset (D-3).
  3. Workers JSR baseline decision — explicit no-increase debt baseline with separately owned debt
     or scheduled prerequisite repair (D-4).
  4. Editorial reconciliation of live #1545 acceptance count from stale 8 to measured 7 before the
     PR carries `Closes #1545`.
