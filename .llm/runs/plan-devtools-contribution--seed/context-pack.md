# Context Pack: NetScript DevTools Contribution Architecture RFC

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `plan-devtools-contribution--seed` |
| Branch | `plan/devtools-contribution` |
| Worktree | `/home/codex/repos/ns-rfc-devtools-contribution` |
| Current phase | `plan-eval` — **ESCALATED**: two `FAIL_PLAN` cycles, harness limit reached |
| Draft PR | [#1450](https://github.com/rickylabs/netscript/pull/1450) — **draft**, `status:plan-eval`, `Backlog / Triage` |
| Baseline | `2256a67bf` (`origin/main`, verified 2026-08-11) — unchanged all run |
| Authority | `RFC-AUTHORITY.md` — the RFC is normative; `drift.md` beats the corpus; GitHub beats all after filing |

## Current State

**Stages A–G are complete. The run is STOPPED at the escalation boundary and is waiting on the
owner.** RFC-0002 is committed, the plan is locked, 25 filing drafts exist, and PLAN-EVAL ran twice.
Both cycles returned `FAIL_PLAN`; `run-loop.md` allows two before escalation, so **no third cycle was
opened**.

**Every supervisor-fixable finding from both cycles is closed and verified.** What remains is
**owner-gated only**. No board mutation has occurred.

## Completed

- **A — Bootstrap.** `supervisor.md` first; baseline verified against live `origin/main`; draft PR
  #1450 with docs-only CI lane and RFC taxonomy; charter committed and read back.
- **B — Discovery corpus.** 14 agents, 0 errors; `workflow.js` committed *before* execution; 6,327
  corpus lines + 78 saved upstream artifacts; every claim cited.
- **C — Synthesis.** Full corpus read by the supervisor; 26 cited findings; 22 numbered syntheses.
- **D — Design packs.** 8 packs; supervisor verified V1–V4 in source before sign-off; two
  verifications corrected the run's own corpus.
- **D2 — GLM design pass. FAILED, lane unlaunchable** (drift D-10). Not substituted, not fabricated.
- **E — RFC + plan lock.** `rfc-0002-devtools-contribution.md`, 15 sections; 14 locked decisions; all
  12 charter questions closed or escalated.
- **F — Adversarial review.** Sonnet 5, unoriented; 1 critical + 2 major found and fixed; 12/13
  citation spot-checks passed.
- **G — PLAN-EVAL ×2.** Both `FAIL_PLAN`. Fix cycles 1 and 2 applied and committed.
- **H-prep — drafts only.** Epic body, 16 issue drafts, 7 agent briefs, filing manifest, decision
  brief, supersession map. **Zero board mutation.**

## Blocked on the owner — the only remaining work

1. **D-10 / GLM 5.2 design pass.** Policy declares a design lane the execution surface cannot launch.
   Needs a launcher repair **or an explicit owner waiver** of the charter and `lane-policy`
   invariant 5. Decisions **D-0a / D-0b** in `decision-brief.md`.
2. **F-1 — package/spine ownership.** Fixes public specifiers and emitter ownership; blocks W1-a.
3. **F-3 — manifest schema evolution.** The two options have different old-CLI behavior *and
   different tests*; blocks the pointer and emitter slices.

## Next steps, once the owner rules

1. Apply the ratified answers to F-1 / F-3 and either run or waive the GLM pass.
2. Re-run PLAN-EVAL — and **bound its reading**: point it at a *diff* plus the specific claims to
   re-verify, not the whole corpus (drift D-14). Use a **new** worktree (drift D-13) and
   `--max-turns 26+`.
3. On `PASS` **and** in-turn ratification: one-shot filing from `filing/filing-manifest.md`, then
   `FILING-LOG.md`.

## Key decisions

| Decision | Source |
| --- | --- |
| 14 locked architecture decisions (L1–L14) | `plan.md` |
| A1 contracts + A6 CLI emission + A5 plugin; host app is userland | RFC §13.1 (corrected from A2) |
| Identity `(mountId, id, apiMajor)`; ordering anchors-then-`(order, mountId, id)` | RFC §6 |
| v1 kinds: `panel` + `link` + `diagnostic` (reuse) | RFC §7 |
| PLAN-EVAL selected; IMPL-EVAL `N/A` by run shape | `drift.md` D-2 |
| Planning-only mutation boundary held all run | `supervisor.md` |

## Gates

| Gate | Status | Evidence |
| --- | --- | --- |
| `docs:links --root docs/architecture/rfc` | **PASS** | 0 broken links/anchors, re-run after every fix cycle |
| `docs:accuracy` | **PASS** | re-run after every fix cycle |
| Lock hygiene | **PASS** | `deno.lock` clean; one incidental churn caught and reverted |
| Citation gate | **PASS** | 12/13 adversarial spot-checks; evaluator verified independently |
| Cross-file variant sweep | **PASS** | 0 surviving identity/ordering/package-name variants |
| **PLAN-EVAL** | **`FAIL_PLAN` ×2 — owner-gated remainder** | `plan-eval.md` |
| `check`/`test`/`lint`/`arch:check`/`quality:scan`/`e2e:cli` | `N/A` | no TypeScript, no `packages/**` source in the changeset |

## Drift and debt

**D-1 … D-14.** Six correct the run's *own* earlier claims: D-4 (a gate that does not exist), D-6
(#890's false compatibility claim), D-7 (my corpus understated a security finding), D-8 (comment
threads reversed a board recommendation), D-9 (off-by-one citation), D-14 (evaluator budget).
D-10 is the blocking one. Debt: none created.

## Commits

The draft PR's commit list plus its per-stage comments are the commit trail.
