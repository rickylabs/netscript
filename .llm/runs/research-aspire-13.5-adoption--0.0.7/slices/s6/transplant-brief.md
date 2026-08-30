use harness

## SKILL

Read `AGENTS.md`, `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/aspire/SKILL.md`,
`.agents/skills/netscript-tools/SKILL.md`, `.agents/skills/netscript-pr/SKILL.md`. You are the
Codex · GPT-5.6 Sol · high implementation thread for a **narrow semantic transplant** of S6
(#1718 / PR #1743) onto exactly-shipped main. Worktree
`/home/agent/projects/netscript/worktrees/007-aspire-s6-new`, branch
`chore/aspire-13-5-s6-listener-transplant` @ `2a1248d33d55` (= shipped main, contains S1/S3/S4/S5).
No runtime, no AppHost, no containers, no evaluators, no CI dispatch. Explicit-refspec push.

## Why this is a transplant, not a rebase

S6's own commits (`5d2bd8756`, `31a2fac87`, `714df7de5`, `b4ca8a1d3`, `9f97954b6`, `01f27d4d4` —
all in the original repo history, fetch them with `git fetch origin
feat/aspire-13-5-s6-health-checks` if not present locally) were built stacked on S5 **before** S5
shipped. Three of the six are pure additive/typing work and were already proven to cherry-pick
clean onto current main (`5d2bd8756`, `31a2fac87`, then a generated-asset regen for `714df7de5`,
then `01f27d4d4`'s typing fix applies last). The fourth, **`b4ca8a1d3` "test(e2e): add listener
health recovery gate", is NOT additive** — it refactors the whole `runtime-gates.ts` module
(removes `pluginProbeCommand`/`APP_HOME_FAILURE_HINT`/`APP_REFERENCE_FAILURE_HINT`/
`AI_CHAT_ROUTE_FAILURE_HINT`, moves things into a new `runtime/` subdirectory including
`generated-app-name.ts`, `runtime-scripts.ts`) and collides with S1's live-db-endpoint fix and
S5's port fixes, which independently evolved the pre-refactor layout that is now on main. **You do
not replay `b4ca8a1d3` as a whole and do not adopt its module split or its `runtime-scripts.ts`
refactor.** Instead you extract only the S6 *listener-readiness* semantics from it and insert them
into current main's `runtime-gates.ts` with minimal, targeted edits.

## Required reconstruction, in order

1. **Carry the clean commits first**, on top of `2a1248d33d55`:
   - `5d2bd8756` feat(aspire): prove listener readiness helper contract
   - `31a2fac87` feat(aspire): emit backing service readiness checks
   - regenerate assets for `714df7de5`'s effect (`deno task gen:assets-barrel`; do not adopt any
     non-generated hunk from that commit if it turns out to carry one — verify with `git show
     714df7de5 --stat`)
   - `01f27d4d4` fix(aspire): type generated health checks against 13.5.3 (apply last; it's the
     final correction on top of the other two)
   Apply these as ordinary commits (cherry-pick `-x` is fine) since they were already proven clean
   against this exact main in supervisor testing; if any of them now conflicts differently for
   you, stop and report the exact conflict rather than force it.

2. **Extract, do not replay, `b4ca8a1d3`'s listener semantics.** From that commit's diff
   (`git show b4ca8a1d3`), port only:
   - the new files `packages/cli/e2e/src/application/gates/scaffold/runtime/listener-readiness-gates.ts`
     and its fixture `runtime/listener-unreachable-fixture.ts` (name may differ slightly — use
     the commit's actual paths) and `runtime/verify-listener-readiness.ts`
   - their focused test file(s)
   - the minimal `GATE` id / suite / capability-gate registrations needed to wire the new
     listener-readiness gate into the existing gate registry (in `domain/cli-surface.ts`,
     `scaffold-capability-gates.ts`, or wherever the commit registers it — the smallest diff that
     makes the new gate reachable)
   - targeted imports/insertions into **current main's** `runtime-gates.ts` (the version already
     on `2a1248d33d55`, carrying S1's live-db-endpoint logic and S5's port fixes unchanged) —
     add the new listener-readiness gate definition(s) without touching, reordering, or renaming
     any existing gate, constant, or function that S1/S5 already ship.
   - **Do not** move `generated-app-name.ts`, do not add a "prepare-readiness" step, do not touch
     `probe-app-reference.ts`/`probe-plugin-resource.ts`, do not add `behavior-gates.ts`,
     `behavior-scripts.ts`, or adopt `runtime-scripts.ts` as a new shared module — if the listener
     code needs a helper that commit put in `runtime-scripts.ts`, inline it locally or place it in
     the new `listener-readiness-gates.ts` file instead.
   - Adapt every import path in the ported files to current main's actual layout (they will not
     match `b4ca8a1d3`'s moved-file paths).

3. **Identity assertion (required, write it into the run-dir worklog verbatim):**
   `git diff origin/main HEAD -- packages/cli/e2e/src/application/gates/scaffold/runtime-gates.ts`
   must show **only additions** related to the listener-readiness gate (no removed lines, no
   reordering of unrelated gates, no change to `verify-live-db-endpoint`/port-related logic).
   State the exact diff stat and confirm by eye that nothing S1/S5 shipped was altered.

4. **Gates:** scoped `run-deno-check.ts`/`lint`/`fmt --ext ts,tsx` over the touched
   `packages/cli/e2e` paths and the ported generator/helper paths; the new listener-readiness
   focused tests; the generator/helper tests from step 1's commits; `arch:check`; `quality:scan`.
   No runtime, no `aspire start`.

5. **Preserve S6 harness history + annotate.** Copy forward (don't discard) the original S6 run
   dir content (`.llm/runs/feat-aspire-13-5-s6-health-checks--impl/`) from the commits you carry,
   and add a new worklog section titled "Reconstruction (transplant, D-91/D-92)" explaining
   exactly what was carried whole, what was extracted, and what was deliberately excluded (the
   `runtime-scripts.ts` refactor, `generated-app-name.ts` move, `behavior-gates.ts`) with the
   coordinator ruling cited.

6. Commit by slice, push explicitly to
   `refs/heads/feat/aspire-13-5-s6-health-checks` (the existing PR #1743 branch — the supervisor
   will pin the push to its current head `01f27d4d4` as a safety check; if your final head is not
   a fast-forward-safe replacement in content terms, say so and let the supervisor force with
   lease). PR #1743 comment `## [PHASE: IMPL] S6 — listener-readiness transplant onto shipped
   main` with the identity assertion and gate results. Final line: new head SHA.
