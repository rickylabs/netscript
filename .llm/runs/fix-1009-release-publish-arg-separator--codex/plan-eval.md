# PLAN-EVAL — fix-1009-release-publish-arg-separator--codex

Evaluator: Opus 5 supervisor (owner-waived open-model lane, 2026-08-01)

Route note: implementation is delegated to Codex (GPT-5.6 Sol). Generator and evaluator are
different sessions and different model families, so the harness independence invariant is
satisfied via the ordinary review ladder rather than the `formal_evaluation` open-model route.

Reviewed at plan commit `0c54ef63e`, branch `fix/1009-release-publish-arg-separator`, base
`origin/main` @ `3ab64720f`.

## Plan-Gate checklist

| Box | Verdict | Evidence |
| --- | --- | --- |
| Research present and current | PASS | `research.md` exists; "Re-baseline" section pins `main` @ `3ab64720ffe06dedc80f12e8f7bb9fa281de37b9` on 2026-08-01 and states the delta vs the carried-in issue framing ("nothing"). Findings 1–5 each carry a verification method, not an assertion. |
| Decisions locked | PASS | `plan.md` → "Locked Decisions" `D1`–`D3`, each with rationale. `D1` position-independent `--` skip; `D2` usage-derived drift test; `D3` preflight guarded through its real subprocess entry point because `parseArgs` there is private. |
| Open-decision sweep | PASS | `plan.md` → "Open-Decision Sweep": parser placement and test tokenization both `resolved now`; only "broader parser normalization" is deferred, and deferring it forces no rework because it touches no file this fix edits. |
| Commit slices | PASS | `worklog.md` → "Commit Slices": 3 slices (0 plan, 1 publish parser + doc-derived test, 2 preflight parser + sweep + e2e evidence), ordered, well under 30, each naming what it proves, its gate, and its files. |
| Risk register | PASS | `plan.md` → "Risk Register": 3 risks with mitigations, including the two that actually matter here — separator tolerance weakening unknown-flag rejection, and the drift test degenerating into a tautology. |
| Gate set selected | PASS | Archetype 6 (CLI/Tooling) selected with rationale; "Fitness Gates" and the 5-step "Validation Plan" name check/fmt/lint/focused-tests/task-probe. No scope overlays, correctly. |
| Deferred scope explicit | PASS | `plan.md` → "Non-Scope" and `worklog.md` → "Deferred Scope": no shared parser helper, no non-task-wired scripts, no `packages/`/`plugins/` edits, no release cut/publish, no e2e scaffold run. |
| jsr-audit | N/A (accepted) | `research.md` → "jsr-audit surface scan": owned surface is `.llm/tools/release/` only; no package/plugin export, manifest, or JSDoc surface changes. Reason given, as the gate requires. |

## Adversarial review of the supervisor's own framing

I wrote the brief that shaped this plan, so these are the parts I am least likely to question and
therefore pressed hardest on.

1. **I handed the slice the AC4 sweep result and asked it to "confirm" it.** That is leading, and a
   rubber-stamp would have looked identical to agreement. Mitigated, not merely asserted: the slice
   re-derived the sweep independently (`research.md` findings 2–4, each with its own verification
   method) and logged the re-baseline in `drift.md`. I also verified the survey myself before
   briefing — a grep of `'--'` handling across every `.llm/tools/release/*.ts` and a `deno.json`
   task-wiring survey — so the claim is independently checkable and was independently checked twice.
   Not a `FAIL`, but the framing risk is real and is why the IMPL-EVAL must re-verify the sweep
   against the actual diff rather than against this plan.

2. **The preflight extension is supervisor-authored scope beyond AC4's literal text.** AC4 says "the
   other entry points that *document* a `--` form". `cut.ts` and `canary.ts` are the only ones that
   document it and both are already tolerant, so AC4 is arguably satisfied by the publish fix alone.
   I extended it to `preflight-text-imports.ts` on a *reachability* argument (`deno task
   release:preflight -- --root <path>` is the idiom a user reaches for), not a documentation one.
   This is defensible and low-risk — a single `continue` — but it is scope I invented, and it is
   flagged here so it is visible at merge rather than discovered in the diff. If it grows beyond one
   line, that is a `draft_needs_human` signal.

3. **The drift guard has a bounded blast radius I should have named in the brief.** The
   usage-derived test couples `github-release.ts`'s own header to its parser. It does not cover the
   same `--` form duplicated in `.agents/skills/netscript-release/SKILL.md:133` or
   `docs/ROADMAP.md:40`. Those stay correct only because the fix makes the documented form work
   everywhere; if a future change reverses that, only the in-file docstring is guarded. Within AC3's
   wording ("the docstring and the parser") this is correct scope, so it does not fail the gate —
   but it is a known edge of the guarantee, not an oversight to discover later.

4. **My brief prescribed a `run-deno-check.ts --file` invocation I had not confirmed exists.** The
   plan absorbed this correctly with a root-scoped fallback (Validation Plan step 1). Had it copied
   my command blindly, step 1 would have failed on an unknown flag. The plan is better than my
   framing here.

5. **Vacuity check on the key test.** The one way this fix passes while proving nothing is a
   doc-derived test that finds zero usage lines and trivially succeeds. The plan pre-commits to
   asserting at least one usage line is found and running every match through `parseArgs`
   (`plan.md` → Risk Register, row 2). IMPL-EVAL must confirm that assertion is actually present in
   the committed test, not just planned.

## Binding conditions for IMPL-EVAL

- The final `Unknown argument` branch and the existing
  `parseArgs: unknown flag and missing value are rejected` test must survive unchanged.
- The doc-derived test must assert a non-zero usage-line count.
- The real probe `deno task release:publish -- v0.0.9 --message "probe" --dry-run` must be shown to
  get past `parseArgs`; a later network/token/tag failure is acceptable, `Unknown argument: --` is
  not.
- Diff must touch only the four owned files plus run artifacts.

## Verdict

**PASS**

Every Plan-Gate box is checked with its own evidence pointer. The plan is narrower than the issue's
framing and says so with proof, the drift guard is the semantic kind AC3 demands rather than a
literal restatement, and the one place the plan diverged from my brief it diverged by being more
careful. Implementation may begin.
