# PLAN-EVAL RECHECK 1 — fix-native-service-policy--u2-u4

- Plan evaluator session: ses_e8090d570ffeh6MLTyd5d16ZHM / 2026-10-28 (OpenRouter meta/muse-spark-1.3, max; SAME independent SID recheck; generator remains separate native Anthropic Fable5.1 session c2672910-4296-4cbf-b7be-4652f52837eb, not resumed)
- Run: fix-native-service-policy--u2-u4
- Surface / archetype: `@netscript/service` builder + auth/CORS middleware / Archetype 4 (Public DSL/Builder)
- Scope overlays: SCOPE-service; leaves U2 + U4 only
- Recheck target: plan.md revision 5 + decisions.md revision 5 (D-U4-7 = root-authorized coordinator projection of native plan paragraphs, projection-receipt.json) against original `FAIL_PLAN` `234a77914ec162e0a8b31a5bed7eda3a76c009cb9307b65b5d9d8e2bcb666159` six required fixes. Canonical packet = root addendum + plan rev5 + decisions rev5; rev4 Design labels stale and explicitly superseded. HEAD still 1582e1c9e1adcaa0a8a92900ec3b5b4b0db3e92d, product source unchanged, all behavior UNRUN. Original plan-eval.md left byte-identical.
- Coverage: four current views read once in parallel (plan.md 491 lines, decisions.md 277, plan-eval.md 59, projection-receipt.json 85 — all complete, no truncation); original five-part + 189-line diagnostic coverage retained in-session; NetScript guidance used this turn; no implementation, execution, or source/config/lock edits.

## Checklist results

| Plan-Gate item                          | Result | Evidence / location |
| --------------------------------------- | ------ | ------------------- |
| Research present and current            | PASS   | Unchanged from original PASS: research.md HEAD-bound to 1582, hashed, root corrections incorporated; mechanical fix cycle required no new research. Load-bearing spot-checks stand. |
| Decisions locked                        | PASS   | D-U2-1..5 unchanged LOCKED; D-U4-1..5 unchanged LOCKED; D-U4-6 natively updated (baselines + locked focused owner); D-U4-7 LOCKED via verbatim-projected native plan paragraphs (predicate, atomicity, compatibility, proof matrix) with byte-equality receipt, preserved timeout honesty, and no new architecture. M-U4-2 resolved markers throughout. |
| Open-decision sweep                     | PASS   | Original S1 resolved by fix 1+2 (predicate locked, late semantics defined, distinguishing proofs added). Re-sweep below: no remaining rework-forcing open decision; one advisory (late-fixture composition) scoped out of rework by explicit no-reorder disclaimer. |
| Commit slices (< 30, gate + files each) | PASS   | Two ordered slices; U4 now 10 native owners + 1 existing metadata owner + locked focused test 8a with its proof matrix and gate (`tests/auth/` suite comment includes it); footprint note explicit; still < 30; no release/version/lock work. |
| Risk register                           | PASS   | 15 rows → extended: silent health opt-in / late-drop / double-register row, installAuth mark-before-validation row, and 661-cap growth row, each with concrete mitigation; all original mitigations retained. |
| Gate set selected                       | PASS   | Unchanged Archetype 4 + SCOPE-service set; owning-tests command annotated for the focused file; durable receipts + deferred e2e:cli retained. |
| Deferred scope explicit                 | PASS   | Unchanged Q-U2-3..6, Q-U4-2..3, U1/U3/E1, topology/adoption/release boundaries. |
| jsr-audit surface scan (pkg/plugin)     | PASS   | Fix cycle adds no public API (private predicate/flags, one test file); original surface scan stands; doc:lint + publish:dry-run still gated. |

## Required-fix audit (original FAIL_PLAN → revision 5)

1. **installHealth predicate — SATISFIED.** Plan owner 5 (lines 209–226) + projected D-U4-7 lock: register iff `healthConfigured && !healthInstalled`; `healthInstalled = true` only after all three registrations succeed; prepare-then-mark explicitly NOT mark-first; absent `withHealth()` ⇒ no route; late `withHealth()` honored on next `build()` before first request within Hono route-mutability constraints, with explicit no-promise on reordering earlier deferred routes.
2. **Distinguishing proofs — SATISFIED.** Owner 8a matrix: absent-`withHealth()` row (health handler 0, no silent opt-in), late rows (second-`build()` registration exactly once, further `build()` adds nothing, no reorder assertion), exactly-once lifecycle rows; all prior RED→GREEN/count/preservation rows retained with unweakened oracles.
3. **Atomicity fold-in — SATISFIED.** Plan owner 5 + projected D-U4-7 cite root-locked acceptance on the same owner: construct BOTH middlewares before any `app.use`, register, mark `authInstalled` only after success; invalid-rule first-build + repeated-build + subsequent-serve rejection rows with zero auth/health/raw/listener calls; `authInstalled` stays false; valid idempotence retained; TypeError never swallowed, no unguarded fallback.
4. **F-1 accounting — SATISFIED.** One locked sentence in plan owner 5 (mirrored in D-U4-7): installAuth reorder absorbed inside 629+≤32/≤661 same-count cap, offset by removed eager registration, no separate allowance, no other file growth, no registry edit, no PASS claim; risk row restates the hard cap.
5. **Test budgets + selection — SATISFIED.** Baselines recorded (326/295/219), focused `health-auth-order_test.ts` SELECTED and locked now (condition resolved pre-implementation), every affected file hard ≤480, no golf/skips/weaker oracles, not new F-10 debt; existing files keep their rows under cap.
6. **Stale M-U4-2 markers — SATISFIED.** Plan compatibility paragraph + self-check and projected D-U4-7 all read root-resolved (Unreleased Added + Changed, BEFORE-200/AFTER-401 impact, add-`'/health'`/six-entry migration, breaking-impact summary, pinned 0.0.8 strings); no "open" marker remains.

## Open-decision sweep (evaluator-run)

**R1 — Late-`withHealth()` fixture composition (advisory, NOT rework-forcing).** The late rows assert `GET /health` ⇒ health handler 1 while disclaiming any reorder of first-`build()` deferred routes. Sound as specified: the implementer proves registration with a fixture free of competing catch-all shadowing, and the no-reorder disclaimer explicitly scopes Hono precedence out of this proof. IMPL-EVAL verifies fixture choice; no plan change required.

**R2 — Candidates checked, none open:** `includeDetails` capture named as stored one-time health state (field naming is implementation detail inside the cap); `bindContractPolicy` throws covered by end-positioned `authInstalled` mark; serve-retry hook semantics out of the proof's zero-call scope (handlers/listeners only); focused-file 480-line fit feasible for the matrix (IMPL-EVAL verifies); U2 byte-identical per receipt + visual check (six-value checkpoint, Vary union, wildcard supplied-Origin override, all controls preserved).

## Verdict

`PASS`

## Notes

- Projection provenance accepted: receipt attests the 300s native timeout honestly (no successful native final claimed), three verbatim blocks byte-exact with SHA/offsets, prefix/suffix and U2 byte-unchanged, prior partial + native raw preserved; visual read confirms textual identity. Same authorized mechanical-projection pattern as the rev4 Design supplement; content is native-authored + root-locked, not new architecture.
- Non-blocking cleanups for the implementation turn (not rework-forcing, noted only): Next-action "three tests" count and Leaf-U4 "(10 paths)" header predate locked owner 8a (authoritative owner list + footprint note are explicit and correct); D-U4-1 "no builder edit" scoping refers to type-forwarding transparency, with the behavioral builder change owned by D-U4-7.
- Carried: README-compile gate unnamed (JSDoc covered by doc:lint; IMPL-EVAL covers README). This recheck judges the prospective upstream PLAN only; root read still required; implementation, independent IMPL-EVAL, runtime/browser/listener, release, and EIS S16 acceptance all remain pending and are not granted here.
