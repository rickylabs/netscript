# Context pack — quality-scan-allowance-rail

## Current state

- Wave 0 leaf at baseline `01e0960494c95ce56eb35892c211a095eb13e6ed`.
- Branch `chore/quality-scan-allowance-rail`, no upstream; draft PR #1653 directly targets `main`.
- Bootstrap commit: `12f0929f3db0507b37216dcfefa21301f5255399`.
- PR lifecycle: RESEARCH and PLAN comments posted; milestone 0.0.7; `status:plan-eval`.
- Generator: OpenAI Codex `gpt-5.6-sol`, high.
- No product implementation has started. #1378 and #1545 are inseparable.
- Read `implement.md`, `research.md`, `plan.md`, `worklog.md`, and `drift.md` in full.

## Separate PLAN-EVAL request

Topic orchestrator `topic-internals-0.0.7`: launch one bounded fresh evaluator session using the
native opposite-family route selected by `.llm/harness/workflow/lane-policy.md` for a local
Codex-authored plan (Claude/Fable 5, medium, unless the policy's recorded fallback condition is
active). The implementation session must not evaluate its own plan.

Evaluator instructions:

1. Read `.llm/harness/gates/plan-gate.md` and `.llm/harness/evaluator/plan-protocol.md` before
   judging.
2. Verify the leaf contract against the approved coordinator artifacts in
   `/home/codex/repos/netscript-547-lffix/.llm/runs/release-0.0.7--orchestration/`.
3. Audit the plan's public-reachability algorithm, fail-closed issue-state boundary, non-increasing
   budget, RED-first proof, JSR/publish evidence, gate sufficiency, asset freshness, commit slicing,
   and exclusions.
4. Treat the three `must resolve` items in `plan.md`/`drift.md` as hard Plan-Gate inputs. Do not
   approve by silently widening the leaf or weakening “open, milestoned issue”.
5. Write the bounded verdict and actionable findings to this run directory as `plan-eval.md`, using
   `PASS` or `FAIL_PLAN` exactly as required by the protocol.

The implementation hard stop remains in force until `plan-eval.md` records `PASS` and the topic or
milestone authority has supplied the necessary contract clarifications. Return findings to this same
leaf thread; do not merge, publish, or alter coordinator central state.

## Evaluator focus facts

- Current allowance population is 7; the repo-wide task still has a stale maximum of 8.
- Closing #1545 conflicts with using #1545 as the required open owner after merge.
- Focused scanner tests and embedded generated CLI asset/permission manifest are outside the
  declared surface but are necessary to meet RED-first and shipped-asset requirements.
- Workers full-export doc lint has 20 pre-existing private-type-ref errors; CLI is clean.
- Current docs fence, docs fixture, six soundness assertions, and typed trigger examples already
  pass and must be preserved.
