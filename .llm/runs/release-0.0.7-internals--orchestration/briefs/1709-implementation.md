use harness

## SKILL

Continue under the skills already loaded for this leaf (`netscript-harness`, `netscript-pr`,
`netscript-tools`, `netscript-deno-toolchain`, `rtk`) plus
`.llm/harness/gates/implementation-gate.md`.

# Brief — #1709 bounded IMPLEMENTATION grant (coordinator-authorized)

## Status: the plan gate is closed. You are cleared to implement.

Your F4 amendment at `fc00aed0f507ae2fac1d9ce03972a80d246b3611` passed a fresh independent
internals Tier-A. There was **no third PLAN-EVAL** — the ordinary allowance was exhausted at cycle
2 and the owner accepted F4 directly. The coordinator has now granted **bounded implementation**.

The plan at `.llm/runs/release-0.0.7-internals--orchestration/slices/lint-partial-exclusion-fail-closed/plan.md`
is **the contract**, not a starting point. Implement it as written. It is locked: D1–D10, the
selected-vs-processed identity rule, the shared `CoverageReport` wire contract, the precedence
`coverage refusal ≥ crash ≥ ordinary finding`, the exact 1/2/200 crash-plus-drop and crash-only
JSON, and the three fmt completion forms with the third scoped **write-only**.

## Scope — the six authorized product paths, and nothing else

1. `.llm/tools/run-deno-lint.ts`
2. `.llm/tools/run-deno-lint_test.ts`
3. `.llm/tools/run-deno-fmt.ts`
4. `.llm/tools/run-deno-fmt_test.ts`
5. `deno.json`
6. `packages/cli/src/kernel/assets/agent-tools.generated.ts` — **canonical regeneration only**
   (`deno task gen:assets-barrel`; never hand-edited)

Plus leaf harness evidence under
`.llm/runs/release-0.0.7-internals--orchestration/slices/lint-partial-exclusion-fail-closed/`.

**A seventh source, generated, config, or workflow path is an immediate rescope stop.** Do not
create a shared helper module — the plan prohibits it explicitly and the fmt suite carries the
cross-wrapper assertion instead. Stop and report rather than widening.

## Ordered slices — strict S1 → S2 → S3 → S4

Commit each slice separately, in order, with its proving evidence recorded before starting the
next. The ordering is load-bearing: S1 corrects coverage before either guard tightens, and the
parser evidence forces distinct S2/S3 rather than assumed symmetry.

- **S1** `deno.json` — remove only `packages/mcp/tests/fixtures/doctor/` from the **root lint
  task's wrapper `--exclude`**. Prove `2037/35/0 → 2041/36/0` exit 0, and `--batch-size 1` at
  `2041/2041/0` exit 0.
- **S2** lint wrapper + test — establish the common contract through the lint adapter via the
  existing `BatchRunner` seam.
- **S3** fmt wrapper + test — introduce the **equivalent injectable runner seam inside
  `run-deno-fmt.ts`** (this is what makes malformed-summary and inconsistent-probe fixtures
  possible without a seventh file), route both original batches and probes through it, and pin all
  three completion forms. Write-mode mismatch probes are **non-mutating `deno fmt --check`**.
- **S4** canonical regeneration only; run `gen:assets-barrel` twice, second run no diff, delta
  limited to `agent-tools.generated.ts`. The embedded delta is **lint-driven only** — `run-deno-fmt.ts`
  is not in `consumer-tools.json` and carries no publish claim.

## Validation — run the plan's 14-row validation table

Do not substitute or narrow it. Use the structured wrappers, not raw CLI, for verdicts; raw Deno
invocations are parser controls only (F-19). Specifically required:

- Focused lint and fmt suites through `.llm/tools/run-deno-test.ts`.
- Frozen gates: `check`, `test`, `quality:scan` (**must retain `allowCount: 7`**), `arch:check`,
  `check:assets-barrel`, CLI `publish-dry-run`, per-member CLI JSR audit (**disclose the existing
  19-WARN baseline — never report it warning-free**).
- Behavioral batch invariant at sizes **1, 2, 200** for both wrappers.
- Row 14 scope proof: `git diff --name-only cf648f1ff...HEAD` shows exactly the six authorized
  paths plus leaf harness evidence — no lock, cache, or workflow churn.

Reproduce the per-file baseline rows rather than inferring coverage from a default-batch green.

## Delivery requirements — these are gate conditions, not preferences

1. **Atomic clean explicit push.** Working tree clean, then push with an explicit refspec to
   `fix/lint-partial-exclusion-fail-closed`. Local == remote == PR #1710 head.
2. **Focused exact-head receipts.** Every gate receipt must be produced at the **final pushed
   head** — not at an intermediate slice commit. A receipt from an earlier head does not prove the
   head under evaluation. State the exact 40-character SHA in your handoff.
3. Record drift honestly in the leaf `drift.md`. If reality diverges from the plan — either
   adapter lacks a reconcilable terminal processed count, root lint does not retain `2041/36/0`,
   the generator touches another output, quality allowances shift, the audit gains a new finding —
   **stop and report**; do not absorb it silently.
4. Post the exact head and slice evidence to draft PR #1710.

## Bounds

- **Do not merge, flip `status:ready-merge`, close #1709, take a runtime lease, or publish.**
- `scaffold.runtime`, `e2e:cli`, Aspire, Docker, browser/Playwright, MCP JSR audit, and docs-site
  gates are **coordinator-waived N/A**. Keep Docker and Aspire empty; do not request them.
- Do not touch `plan-eval.md` or `plan-eval-cycle-1.md` — both are preserved evaluator history.
- Do not issue your own evaluator verdict. A **formal separate-session IMPL-EVAL** follows your
  push, because this is a critical fail-closed tooling contract; it is generated by a different
  family and you are not it.
- Do not touch any other lane, topic queue, or worktree.

## Transport note

`codex-app-server` is currently unavailable, so **mobile visibility is degraded** for this leaf.
The runtime repair is correctly refused by its safety guard because other lanes hold active
sessions, and repairing would disturb them. Your resume/exec transport is unaffected. Do not
attempt the repair yourself.
