# IMPL-EVAL — PR #777 (docs: name the local evaluator transport) · reconcile-with-advanced-base

- **Verdict:** `PASS` (conditional on merge ordering — see Finding 1)
- **Evaluator:** Claude · Opus 4.8 · high — opposite-family IMPL-EVAL, supervisor-dispatched
  (`review_codex_light`). Separate session from the Codex generator and the Sol·low reconcile slice.
- **Subject:** worktree `/home/codex/repos/b10-evaldoc`, branch `docs/evaluator-claude-codex` @
  `3d2a3a43` (merge of `origin/feat/beta10-integration` @ `3265b516` into the PR branch).
- **Diff:** `git diff origin/feat/beta10-integration...HEAD` — 13 files, **all `.md`**, +391/−133,
  **zero `.ts` touched** (matches the docs-only claim).
- **Scope evaluated:** accuracy of the evaluator-transport prose after #794's review-pairing ladder
  landed; reconcile fidelity (nothing dropped silently); no new suppressions; internal-wording;
  re-run of cheap validation.

## Summary

The reconcile is faithful and the doctrine is internally coherent. The merged `lane-policy.md`
cleanly separates two distinct lanes — the **#794 review-pairing ladder** (ordinary/opposite-family
review, Claude-family Fable/Opus) and the **new local formal evaluator lane** (PLAN-EVAL/IMPL-EVAL,
open-model-only, closed prohibited). No PR statement contradicts `lane-policy.md` as merged; the
brief's explicit blocking bar is **not** tripped. Every verification the brief requested passes.

The one real accuracy soft-spot is a **self-disclosed coordinated-landing dependency on #776** (the
machine binding the doc describes is not in the base). It is pre-existing, explicitly hedged in the
prose ("the two land together; the doc is not a substitute for the binding"), was graded *minor* by
the original open-model eval, and was not regressed by the reconcile. It becomes blocking **only** if
#777 merges to base/main ahead of #776.

## Findings

### 1 — Machine binding describes companion #776, which is NOT in the integration base *(blocking-on-merge-ordering; otherwise minor, self-disclosed)*

`lane-policy.md:127-133` ("Machine binding") states the table "is the rendered view of
`CANONICAL_ROUTE_POLICY`" and that a companion slice "binds the formal open-model evaluator route…,
adds `qwen/qwen3.7-max` to `OPENROUTER_MODEL_IDS`, and makes `resolveCanonicalFormalEvaluatorRoute()`
**throw**… enforced **in code, not in a comment**." Invariant 6 (`lane-policy.md:181-185`) leans on
the same code-enforcement. Verified against the merged base:

- `resolveCanonicalFormalEvaluatorRoute` — **absent** (`grep` over `.llm/tools/agentic/`, no hit).
- `OPENROUTER_MODEL_IDS` (`config/models.ts:48`) = `{ minimax, glm, grok }` — **no `qwen`**. `qwen`
  appears only in an OpenHands-dispatch allowlist in `no-hardcoded-volatile_test.ts:79`, not as a
  bound preset model.
- `#776` is **not merged** into `origin/feat/beta10-integration` (recent base commits: #794, #793,
  #790, #789, #788, #787, #786, #770 — no #776 / no evaluator-route binding).
- Consistent with the run's own `drift.md` (2026-07-13, "Evaluator lane is prose-only"): today a
  `purpose:'evaluation'` selection for Codex-authored work resolves to
  `blocked: opposite_family_unavailable`; there is no open-model evaluator route in the runtime.

Impact: if #777 merges standalone, the "rendered view of `CANONICAL_ROUTE_POLICY`" claim is false for
the evaluator row, the closed-model prohibition is **not** code-enforced (contrary to the prose), and
an agent told to select the open-model evaluator route cannot express it in the runtime. The doc
discloses this ("Companion to #776 — the two land together"), so this is a **merge-gate condition**,
not a content defect. **Condition:** #776 lands first or in the same merge. If the supervisor cannot
guarantee that, this flips to `FAIL_FIX` and the machine-binding paragraph + invariant-6
code-enforcement claim should be softened to future tense until #776 is in.

### 2 — Formal-evaluator vs ordinary-review taxonomy is subtle and easy to conflate *(minor; owner-confirm)*

The merged doc routes PLAN-EVAL/IMPL-EVAL to open models (row 36, invariants 1 & 6) while the #794
ladder routes "Review of Codex/OpenAI … implementation" (`review_codex_*`) to Claude-family
Fable/Opus. These coexist **only** under the doc's asserted split between the *formal evaluator pass*
and *ordinary (non-formal) review*. That split is stated consistently across all edited surfaces and
does not contradict itself — but it is easy to conflate in practice: **this very IMPL-EVAL was
dispatched on `review_codex_light` = Opus 4.8 (a closed model)**, i.e. an "IMPL-EVAL" running the
ordinary-review ladder route, which the PR's own doctrine would place on an open model. Not a defect
in the PR's prose (the PR explicitly warns "do not conflate it with the formal evaluator pass"), but
worth an explicit owner ratification that the two-lane split is intended, since the dispatch pattern
in the field currently mixes them.

### 3 — Reconcile fidelity: nothing dropped silently *(pass)*

Compared the PR's stated intent (body) against the merged result:

- Local PLAN-EVAL/IMPL-EVAL → Claude Code + OpenRouter, open model — present in all 6 doctrine
  surfaces (lane-policy, protocol, plan-protocol, netscript-harness, openhands-handoff, CLAUDE.md).
- OpenHands retained as automated cloud agent (row 37; openhands-handoff intact) — present.
- Cost-protection rule restated in prohibitory language in ≥5 places — present (lane-policy row 36 /
  §named-transport / invariant 6; protocol.md; plan-protocol.md; netscript-harness; openhands-handoff;
  CLAUDE.md).
- D-4 retraction (per-model capability; zero-reasoning is GLM-only) — present (capability tables in
  protocol.md and lane-policy.md; `drift.md` retraction entry L50 correctly amends base D-4 @ L206 and
  the D-4 AMENDMENT @ L315).
- The reconcile's **"Deliberately superseded / dropped"** items (stale pre-#784 Fable-unavailable
  framing; older canonical-route table where it conflicted with the #794 ladder) are legitimately
  superseded by base and are **explicitly called out** in the reconcile comment — satisfying the
  "anything dropped must be surfaced" requirement. No evaluator-specific behavior dropped.

### 4 — No new suppressions *(pass)*

`git diff … | grep` for `deno-lint-ignore | ts-ignore | ts-nocheck | eslint-disable |
@ts-expect-error | no-verify` over added lines → **none**. Docs-only diff, no code paths.

## Independent verification (re-ran cheap gates)

| Check | Result | Matches claim |
| --- | --- | --- |
| `deno task agentic:sync-claude:check` | OK — 17 skills, 21 mirrored | yes |
| `deno task docs:links` | docs=96, broken-links=0, broken-anchors=0, orphans=0 | yes |
| `git diff --check` (base…HEAD) | clean | yes |
| `.claude/` mirror parity (per-file diff-body md5 vs `.agents/`) | MATCH ×4 (claude-manager, codex-wsl-remote, netscript-harness, openhands-handoff) | — |
| `drift.md` append-only | additive; only H1 title rewritten + preamble added; D-1+ history intact | — |

Not re-run (trusted from reconcile evidence, docs-only touches no `.ts`): `deno task check` (2,304
files, reconcile reports 0 failed batches) and the scoped fmt wrapper (reconcile: 9 pre-existing
findings, 0 net-new vs base — methodology sound).

## Internal-wording / public-docs

n/a — all 13 touched files are **internal** harness/agent surfaces (`.agents/skills/`,
`.claude/skills/`, `.llm/harness/`, `.llm/runs/`, `CLAUDE.md`). None are public-facing published docs
(no `docs/` Lume content, no package READMEs), so PR-number and internal-process references are
appropriate; the public-docs no-internal-wording rule does not apply.

## Rationale for verdict

- Approved scope (name the local evaluator transport; preserve OpenHands; restate cost rule; retract
  D-4; reconcile onto the #794 advanced base) is **complete and accurate**.
- **No statement contradicts `lane-policy.md` as merged** — the brief's explicit blocking bar is not
  tripped; the #794 ladder and the evaluator lane are distinct, non-conflicting lanes.
- Reconcile dropped nothing silently (drops disclosed in the comment); no suppressions added; mirrors
  in sync; drift additive; all cheap gates reproduce the claimed results.
- The sole real risk (Finding 1) is a **pre-existing, self-disclosed coordinated-landing dependency**
  on #776, already graded *minor* by the prior eval and unchanged by the reconcile. It is a
  merge-ordering condition, not a doc-content defect — hence `PASS`, conditioned on the merge honoring
  the #776 companion (else `FAIL_FIX`).
