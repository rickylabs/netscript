# PLAN-EVAL — PR #120 CLI `dx`-runnable slice (`feat/cli-dx-runnable`)

> Evaluator session (separate from the generator). Plan-only evaluation; no implementation has
> occurred yet (the branch has a single commit — `336df06b docs(cli-dx-runnable): research +
> plan for the CLI dx-runnable slice` — and no source/config edits). Follows
> `.llm/harness/evaluator/plan-protocol.md` + `gates/plan-gate.md` + the
> `netscript-deno-toolchain` skill (ground-truth for `deno dx` / JSR exports) +
> `netscript-doctrine` (Archetype 6 — CLI / Tooling + SCOPE-docs overlay) + `jsr-audit` skill
> (publishability of the new export). Hard stop before any implementation slice.

- **Evaluator session:** MiniMax M3 (OpenHands cloud) — `run-28135291668-1`
- **Run:** `cli-dx-runnable`
- **Branch / PR:** `feat/cli-dx-runnable` (PR #120)
- **Phase:** plan (Plan-Gate)
- **Surface / archetype:** `packages/cli` / **Archetype 6 — CLI / Tooling** + **SCOPE-docs** overlay
- **Base rebased onto:** `336df06b` (single commit on branch; verified via `git log -1`)

## Verdict

**`PASS`** — Plan-Gate cleared. Implementation (S1 → S2) may begin.

### Plan-Gate sub-total

| # | Item                                       | Result   |
|---|--------------------------------------------|----------|
| 1 | Research present and current               | **PASS** |
| 2 | Decisions locked                           | **PASS** |
| 3 | Open-decision sweep                        | **PASS** |
| 4 | Commit slices (<30, gate + files each)     | **PASS** |
| 5 | Risk register                              | **PASS** |
| 6 | Gate set selected                          | **PASS** |
| 7 | Deferred scope explicit                    | **PASS** |
| 8 | jsr-audit surface scan (pkg/plugin)        | **PASS** |

### Per-point sub-total (the six evaluator asks)

| # | Concern                                                          | Verdict |
|---|-------------------------------------------------------------------|---------|
| 1 | Mechanism correctness (D1/D2) — export-based `dx`, empirical verification, A/B viability | **PASS** |
| 2 | Library purity (D3) — guard + test protects library import       | **PASS** |
| 3 | Sweep completeness (D4) — grep-driven, residual gate, maintainer exclusion, verified-form-only | **PASS** |
| 4 | Gate sufficiency (D5) — pre-merge structural gate + post-publish dx smoke on #111 | **PASS** |
| 5 | Scope discipline — slice excludes behavior/subcommands/#111, two-commit plan right-sized | **PASS** |
| 6 | Debt — Option B → arch-debt note disposition                      | **PASS** |

**14/14 PASS.** No FAIL_PLAN boxes. No concrete plan fixes required.

## Evaluation Summary

The plan is sound. Research decisively corrects the original task framing's "declare a
`dx`-resolvable bin" assumption against authoritative Deno 2.6 docs and JSR's exports-only manifest
— `dx` resolves a module export (no `bin` field for JSR). The current `@netscript/cli` exports
`.`/`./scaffolding`/`./testing` (library) and ships `bin/netscript.ts` via `publish.include` but
without an `exports` entry — so `dx` cannot resolve it today; the gap is precisely identified.

**D1 (mechanism)** is correct: executable export, not `bin` field, with the `import.meta.main`
guard already in place on `bin/netscript.ts` (verified — lines 11–24; imports above the guard are
side-effect-free). **D2 (empirical-then-pick A/B)** is sound: the Deno docs are inconclusive on the
bare-vs-subpath resolution rule and on arg-forwarding, so the requirement to verify empirically
against `deno x jsr:@std/http/file-server` (plus a bare-specifier probe) BEFORE locking the
surfaced command form is the right move. Options A (runnable `.` default export) and B (named
`./cli` export) are both viable; the selection criterion (bare resolution works → A, else B) is
correct because A is the cleaner marketing form and B is the safe fallback.

**D3 (library purity)** is adequately protected: the existing `if (import.meta.main)` guard means
`import { createPublicCli } from "jsr:@netscript/cli"` (and the `./scaffolding`/`./testing`
consumers) cannot trigger CLI execution. A focused test asserts the library import is
side-effect-free.

**D4 (sweep)** is correctly scoped: grep-driven (not whitelist), 18 source-file occurrences in the
current residual set (README, docs/site, tutorials, plugin READMEs), maintainer local-source forms
(`bin/netscript-dev.ts` calls `createLocalContributorCli` and is `publish.exclude`d;
`deno task dev` runs local source not JSR form) correctly excluded. The "verified-form-only" rule
prevents false landing-page claims.

**D5 (gate split)** is correct given the road-to-JSR ordering (CLI publishes LAST). The pre-merge
structural gate (`deno publish --dry-run` clean, local `deno run` of the export, empirical `dx`
resolution-rule check against a reference package, guard test green) is sufficient. The true
end-to-end `deno dx jsr:@netscript/cli …` smoke is correctly deferred to a post-publish close-out
on #111.

**Scope discipline:** the slice excludes CLI behavior changes, new subcommands, the publish
workflow/order (#111), maintainer local-source entries, and the npm/dnt `bin` concept. The two
commit slices (S1 export+test, S2 sweep) are right-sized and each names its gate + files.

**Debt:** the Option B contingency (named subpath forces longer `…/cli init` form) is correctly
dispositioned — gated on the empirical outcome, captured as an arch-debt note with a future
Deno `dx` improvement as the closing trigger.

## Code-Evidence Cross-Checks (verified during evaluation)

- `packages/cli/mod.ts` re-exports `createPublicCli` via `src/public/public-api.ts` (library; no `import.meta.main`).
- `packages/cli/bin/netscript.ts` has `if (import.meta.main) { runPublicCli(...) }` guard; imports above the guard are side-effect-free.
- `packages/cli/bin/netscript-dev.ts` calls `createLocalContributorCli` (maintainer local-source; `publish.exclude`d).
- `packages/cli/deno.json` exports map: `.`/`./scaffolding`/`./testing`; `publish.include` ships `bin/netscript.ts`; `publish.exclude` excludes `bin/netscript-dev.ts` + `maintainer.ts`.
- `packages/cli/deno.json` `compilerOptions.isolatedDeclarations: false` (slow-types accepted per publish decisions).
- Sweep residual: `grep -rln "jsr:@netscript/cli/bin/netscript.ts"` → 18 source files in current tree.

## Required Follow-Ups (non-blocking, addressed during impl)

These are gap cleanups, not plan fixes — they do not block `PASS`:

1. **`packages/cli/deno.json` `publish.include` review during S1.** If Option B adds a new entry file, it must be added to `publish.include`. (Caught by dry-run gate; IMPL-EVAL confirms.)
2. **`@module` JSDoc tag on the new export.** JSR `deno doc --lint` requires it. (Caught by dry-run gate; IMPL-EVAL confirms.)
3. **Empirical dx check log retention in `worklog.md`.** Per plan §Pipeline step 2. (IMPL-EVAL confirms the worklog entry exists.)
4. **Option B arch-debt entry registration** if Option B is forced. Per plan §Debt/follow-ups. (IMPL-EVAL confirms.)
5. **Post-publish `deno dx` smoke on #111 close-out.** Correctly deferred; tracked on #111.

## Plan-EVAL Cycle

- **Cycle: 1 of 1** (verdict: **PASS**).
- Implementation may begin on the strength of this verdict per `gates/plan-gate.md`.
- Sequence: S1 (runnable export + guard test) → S2 (repo-wide command sweep) → IMPL-EVAL → merge → #111 ordered publish → post-publish `dx` smoke close-out.

## Changes

- New artifact: `.llm/tmp/run/cli-dx-runnable/plan-eval.md` — the plan-eval deliverable (full checklist, open-decision sweep, code-evidence cross-checks, follow-ups).
- This summary: `/home/runner/work/_temp/openhands/28135291668-1/summary.md`.
- **No edits to `packages/`, configs, or lockfiles** (the trigger-mandated hard stop).

## Validation

- `git log -1` on `feat/cli-dx-runnable` → `336df06b docs(cli-dx-runnable): research + plan for the CLI dx-runnable slice` (single commit; no implementation).
- `cat .llm/tmp/run/cli-dx-runnable/research.md` (108 LOC) — full read.
- `cat .llm/tmp/run/cli-dx-runnable/plan.md` (89 LOC) — full read.
- `cat packages/cli/deno.json` — exports + publish + tasks reviewed; `isolatedDeclarations: false` confirmed.
- `cat packages/cli/mod.ts` — library surface confirmed; `@module` JSDoc present; no `import.meta.main`.
- `cat packages/cli/bin/netscript.ts` — `import.meta.main` guard confirmed at lines 11–24; imports side-effect-free above the guard.
- `cat packages/cli/bin/netscript-dev.ts` — maintainer local-source confirmed; `createLocalContributorCli` flow; correctly excluded from sweep.
- `grep -rln "jsr:@netscript/cli/bin/netscript.ts" --include="*.md" --include="*.ts" --include="*.tsx" --include="*.json" --include="*.template"` → 18 source files (S2 target set; consistent with plan's "grep-driven, not whitelist" framing).

## Responses to Review Comments

N/A — This is the PLAN-EVAL evaluator session for the planning phase. No implementation review
comments exist yet (the slice is at the Plan-Gate, not yet implemented).

## Remaining Risks

None at the Plan-Gate level. The plan's own residual risks (Q1/Q2 empirical dx resolution,
library-purity on Option A, post-publish-only end-to-end verification) are bounded by the named
gates and mitigations in `plan.md` (empirical check + verified-form-only rule + guard test +
structural pre-merge gate + post-publish dx smoke on #111 close-out). None force a plan-level fix.