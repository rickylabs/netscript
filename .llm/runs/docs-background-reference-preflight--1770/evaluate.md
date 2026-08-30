# Evaluation History: background-reference startup preflight documentation

## Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `docs-background-reference-preflight--1770` |
| Target | PR #1772, `docs/background-reference-preflight` |
| Archetype | `N/A — docs-only` |
| Scope overlays | `SCOPE-docs.md` |
| Formal evaluator | Supervisor-dispatched native opposite-family evaluator; full record in `impl-eval.md` |

## Formal evaluation history

### Cycle 1 — `d5ba40ebd74da447d2a85885828fbd301240a065`

Verdict: `FAIL_FIX`.

- **B1 — conditional behavior stated as unconditional.** The page and repeated run/PR claims said
  every declared reference is preflighted and required. The generator wraps the entire processor
  block—including preflight—in `Enabled !== false`; an explicitly disabled processor is skipped
  wholesale and its references are not preflighted.
- **B2 — non-formal review presented as settled IMPL-EVAL.** The PR body identified an
  implementation-thread-dispatched session as `IMPL-EVAL: PASS`. Formal evaluator dispatch belongs
  to the supervisor, and the supervisor-dispatched exact-head verdict was this `FAIL_FIX`.

The formal evaluator independently verified that placement, both character-exact message
templates, pre-registration timing, the missing-resource/no-HTTP-endpoint causes, scope,
provenance, and all 13 technical gates were otherwise correct. The implementation-lane
`plan-eval.md` remains as historical internal review evidence; it is not relabelled as a formal
supervisor dispatch, though its load-bearing reasoning was independently re-derived and upheld.

### Cycle 2 — repaired head

Target: the pushed repaired head after S3 `e4f47289b` (conditionality/run history), S4
`14d5aefd` (four regenerated assets only), and the final run-artifact gate-evidence reconciliation.

Verdict: `PENDING`. Tier-A review and a fresh supervisor-dispatched formal IMPL-EVAL occur only
after the implementation thread reports the new pushed SHA. This artifact does not predict or
self-certify that verdict.

## Required repair disposition

| Finding | Repair | Status |
| ------- | ------ | ------ |
| B1 | Qualify every repeated claim to processors that are not explicitly disabled; retain both exact message templates. | Implemented in S3; complete derived chain regenerated in S4; fresh verdict pending. |
| B2 | Remove the formal-PASS claim from the PR body, record cycle-1 `FAIL_FIX`, and leave cycle-2 supervisor verdict pending. | Run history reconciled; PR update follows the pushed repaired head. |

## Verdict

| Field | Value |
| ----- | ----- |
| Current formal verdict | `FAIL_FIX` at `d5ba40ebd74da447d2a85885828fbd301240a065` |
| Repaired-head verdict | `PENDING` supervisor-dispatched evaluation |

---

## Supersession — appended 2026-08-30, history above left intact

Everything above is preserved as written. The two verdict rows in the table immediately preceding
this section were accurate when recorded and are now **superseded**; they are not edited, so the
sequence stays auditable.

| Field | Value |
| ----- | ----- |
| Cycle-1 verdict | `FAIL_FIX` at `d5ba40ebd74da447d2a85885828fbd301240a065` — **superseded, not withdrawn** |
| Cycle-2 verdict | **`PASS`** — supersedes the `PENDING` recorded above |
| Report | `impl-eval-final.md` (this run dir) |
| Evaluated product / evidence head | `0e9fc593cb748d6b5fca781493bc0342cf098d7f` |
| Current evaluator carrier | `c987d110bff533becf2ec66ecee4c66bce9950b0`, and the evidence-only correction that carries this supersession |
| Evaluator | supervisor-dispatched separate session, Claude · Fable 5 (`formal_impl_evaluation`, native opposite-family for Codex-authored work); model-confirmed `claude-fable-5`, effort as-requested and not independently verifiable from inside a session |
| Generator | Codex · OpenAI · `gpt-5.6-sol`, thread `01a052ea-…` — generator ≠ evaluator holds |
| Blocking findings | **none** |

### Disposition of the cycle-1 findings

- **B1 — discharged.** The claim is scoped to *each declared reference for a background processor
  that is not explicitly disabled*, narrowed in the public page, `research.md`, `plan.md`, the PR
  body and the regenerated corpus. Cycle 2 verified the qualifier is faithful to the emitted guard's
  full truth table: `config.BackgroundProcessors['<name>']?.Enabled !== false` skips only a literal
  `Enabled: false`, while `Enabled: true`, an absent `Enabled` key and a wholly absent config entry
  all preflight. Both quoted message templates were confirmed byte-identical across the repair.
- **B2 — discharged.** The self-dispatched formal-PASS claim is retracted from the PR body, cycle 1's
  `FAIL_FIX` is recorded there, and the supervisor dispatched the cycle-2 evaluation. `plan-eval.md`
  remains labelled as internal review evidence, not a supervisor dispatch.

### Head discipline

`c987d110` and this correction are **evaluator-only carriers**. Neither changes a product file, a
derived asset or the run ledger's substantive content:
`git diff 0e9fc593..HEAD -- docs packages .llm/assets` is empty. The cycle-2 `PASS` therefore remains
attached to the evaluated product head `0e9fc593` — nothing it examined has moved.
