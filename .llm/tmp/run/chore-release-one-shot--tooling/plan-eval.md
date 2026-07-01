# PLAN-EVAL — chore-release-one-shot--tooling — CYCLE 2

- Plan evaluator session: openhands / minimax-M3 / 2026-06-29
- Run: `chore-release-one-shot--tooling`
- Branch: `chore/release-one-shot` (off `origin/main`)
- Surface / archetype: **SCOPE-tools** — `.llm/tools/`, `.github/workflows/`, new skill. Repo/harness
  tooling (NOT package/plugin framework code).
- Scope overlays: WSL Codex daemon-attached implementation lane; harness evaluator separation.
- Baseline: alpha.11 shipped (verified against current `main`).
- Trigger metadata: action_run `28305083715` (this run), prior cycle-1 action_run `28304587059`,
  PR `#164`, output_mode `pr-comment`, model `openrouter/minimax/minimax-m3`.
- Cycle 1 verdict: `FAIL_PLAN` (sole blocker D3 — pattern set both over-broad and under-broad).
- Cycle 2 verdict: TBD below.

## What was re-baselined vs cycle-1 plan

| Cycle-1 required fix                                                        | Cycle-2 status           | Evidence                                                                                |
| --------------------------------------------------------------------------- | ------------------------ | --------------------------------------------------------------------------------------- |
| 1. Narrow pattern set to `Deno.readTextFile(<arg>)` / `Deno.readFile(<arg>)` only; drop the other 3 | **ADDRESSED** | D3 line 53: "match ONLY `Deno.readTextFile(` and `Deno.readFile(` call sites. Do **NOT** flag `fromFileUrl(`, `import.meta.resolve(`, or bare `new URL(..., import.meta.url)`" |
| 2. Lock cross-line detection approach (two-pass scan) + cross-line positive fixture | **ADDRESSED** | D3 lines 58–63: explicit Pass 1 (collect `const <name> = new URL(<literal>, import.meta.url)` and direct `fromFileUrl(new URL(..., import.meta.url))`) + Pass 2 (flag `<name>` references AND inline `Deno.readTextFile(new URL(..., import.meta.url))`). Lines 64–65: "POSITIVE fixture mirroring `openapi.ts:29→155` (URL declared one line, read another) — the tool MUST flag it". |
| 3. Add D3 cross-line miss class to risk register                              | **ADDRESSED** | "Risks / debt / follow-ups" section lines 130–132: "D3 cross-line miss class (e.g. `openapi.ts:29 → 155`): mitigated by the two-pass scan + the cross-line positive fixture. If a future read indirects through more than one assignment hop, the resolver may miss it — fixture coverage is the guardrail; record any escape as debt." |
| Optional 4. Pin D4 version handoff (no ref-parse fragility)                  | **ADDRESSED** | D4 lines 84–88: `actions/upload-artifact` `version.txt` in publish.yml + `actions/download-artifact` keyed on `github.event.workflow_run.id` in e2e-cli-prod.yml. `workflow_dispatch` path keeps `inputs.published-version`. Non-racy by construction. |
| Optional 5. D5 wording: `agentic:sync-claude` (+`:check`), never hand-edit mirror | **ADDRESSED** | D5 lines 92–93: "regenerate the mirror with `deno task agentic:sync-claude`** and gate it with `deno task agentic:sync-claude:check` (NEVER hand-edit `.claude/skills/` — it is generated)". `deno.json:51-52` confirms both tasks exist. |
| Optional 6. D2 exact edit sites named                                         | **ADDRESSED (with minor line-ref drift)** | D2 line 43 names `prod-install.ts:28` (arg array) + `prod-install.ts:6–7` (rationale comment) + `.llm/tools/README.md:99` (drop `--frozen` mention). The `:6–7` ref points to the rationale block but the explicit `--frozen` mentions in that block are actually on lines 4 and 11; the IMPL session will read the file and fix the right lines. Not a Plan-Gate fail (IMPL-discoverable). |

## Spot-checks against current `main` (re-baseline for cycle 2)

| Claim                                                                            | Verified                                                                                                 |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `prod-install.ts:28` is `const cmdArgs = ['ci', '--prod', '--frozen'];`           | ✓ (line 28 confirmed)                                                                                    |
| `prod-install.ts` rationale block lines 4 & 11 mention `--frozen`                 | ✓ (line 4: "frozen install"; line 11: "`--frozen` (implied by `ci`)") — plan's `:6–7` ref is approximate |
| `.llm/tools/README.md:99` mentions `--frozen` in the `deps:prod-install` row      | ✓ (line 99 confirmed: "Proves the production (non-dev) surface installs against a frozen lock (`deno ci --prod --frozen`)") |
| `.llm/tools/entry.md:59-60` also mentions `--frozen` (NOT in plan edit list)      | ✓ (line 59: "`deno ci --prod --frozen`"; line 60: "frozen lock") — see IMPL nit below                   |
| `openapi.ts:29` is `const scalarJsUrl = new URL('../../assets/scalar.min.js', import.meta.url);` | ✓ (line 29 confirmed)                                                                                    |
| `openapi.ts:155` is `const scalarJs = scalarJsCache ?? await Deno.readTextFile(scalarJsUrl);` | ✓ (line 155 confirmed)                                                                                   |
| `deno task agentic:sync-claude` + `agentic:sync-claude:check` exist              | ✓ (deno.json:51–52)                                                                                      |
| `.github/workflows/e2e-cli-prod.yml` currently triggers on `release: types:[published]` AND `workflow_dispatch` | ✓ (cycle-1 verified; still current)                                                                      |
| `cli-e2e` is the only workspace member with `"publish": false`                   | ✓ (all other packages/plugins publishable)                                                               |

## Per-decision findings (D1–D6) — cycle 2

### D1 — `deno task release:cut` orchestrator (issue #122) — **PASS** (carried from cycle 1)

Cycle-1 evidence still holds. No regression in cycle 2 (D1 not revised; only D2–D5 had clarifications).

### D2 — Drop `--frozen` from `deps:prod-install` (issue #146) — **PASS** (revised for edit-site clarity)

Cycle-2 plan now enumerates the three edit sites by file:line. The arg-array change (`['ci', '--prod']`) is
uncontroversial. The rationale comment + README are doc-consistency items. **IMPL nit:** `entry.md:59-60`
also contains the `--frozen` mention (the per-script detail page referenced from `README.md:21,85,157` and
from `netscript-deno-toolchain/SKILL.md:111`). The plan does not list it. A thorough IMPL session will grep
for `--frozen` after the slice to verify completeness and find the gap; an over-zealous one might not. Logged
as a follow-up note (not a Plan-Gate fail — this is a doc-consistency gap discoverable in a 5-second grep at
IMPL time, not a design decision the plan needs to pre-answer).

### D3 — Text-import preflight gate (issue #133) — **PASS** (REVISED cycle 2)

Three cycle-1 blockers all addressed. Re-assessment:

**(a) Pattern scope — NARROWED correctly.**
The pattern set is now ONLY `Deno.readTextFile(` and `Deno.readFile(` (plus their `<arg>` resolutions via
the two-pass resolver). `fromFileUrl(`, `import.meta.resolve(`, and bare `new URL(..., import.meta.url)`
are explicitly excluded as URL/path constructors. The ~21 constructor hits on `main` are no longer in
the scan set.

Cross-line coverage: every `Deno.readTextFile(<arg>)` / `Deno.readFile(<arg>)` site in publishable source
files on `main` uses an identifier (`scalarJsUrl`, `path`, `entry.path`, `manifestPath`, `xmlPath`, etc.)
or an inline `new URL(..., import.meta.url)`. Of those:
- `openapi.ts:155` `Deno.readTextFile(scalarJsUrl)` — `scalarJsUrl` is in the URL set (line 29).
  **Pass 2 FLAGS this.** ✓
- `readme-examples_test.ts:3` inline form — test file, excluded by the "publishable members" + source filter
  (test files in `tests/` are not in the publishable surface for JSR — even if scanned, this is the inline
  case the plan's Pass 2 explicitly flags; but the source-only filter on publishable members excludes `tests/`
  by intent). Either way, no false negative on the production case.
- All other read sites use plain `path`/`entry.path`/etc. — NOT in the URL set. **No flag.** ✓

The narrowed pattern + two-pass resolver catches exactly the production defect class while ignoring the
21 URL constructors and the dozens of legitimate runtime-FS reads (which use `Deno.readFileSync`/`readTextFileSync`
or non-URL string args).

**(b) Cross-line detection — PINNED correctly.**
Pass 1 collects `const <name> = new URL(<literal>, import.meta.url)` and direct `fromFileUrl(new URL(...,
import.meta.url))` chains. Pass 2 flags both identifier-form reads and inline-form reads. The
`openapi.ts:29 → 155` case is the load-bearing fixture. The plan also requires a NEGATIVE fixture (bare
`new URL(...,import.meta.url)` for HTTP/module-id composition + text-import `with { type: 'text' }` read)
to prove the tool doesn't over-flag. This is correct test design (positive + negative).

**(c) Allowlist — TIGHT, no broad ignore globs.**
Inline `// preflight-allow: <reason>` annotation per line. The narrowed pattern set should make the
allowlist nearly empty (the few legitimate non-asset FS reads in publishable surface, if any, get annotated).
No broad file-class globs that would mask the same defect elsewhere.

**(d) Risk register entries present.**
- "D3 cross-line miss class" (multi-hop indirection): fixture coverage is the guardrail; record escapes as debt.
- "D3 false-positive risk": if CI noise appears, tighten the resolver, do NOT widen broad ignore globs.

**(e) Wiring — BOTH `cut.ts` (step 4) AND `publish.yml` (a step before "Publish dry-run").** ✓ Double-gated:
local bump dry-run + CI publish both run the preflight. No single point of failure.

**Residual miss class check:** the two-pass resolver is one assignment hop. A read that flows through two
hops (e.g., `const x = new URL(...); const y = x; readTextFile(y)`) would NOT be caught — `y` is not in
the URL set. The plan acknowledges this in the risk register and relies on fixture coverage as the
guardrail. This is acceptable: the production case is one hop (`scalarJsUrl`); multi-hop is hypothetical.
If a future bug introduces multi-hop, the IMPL session will see it in code review and add a hop counter
or AST scan. For now, the cost/benefit favors the simpler regex scan.

### D4 — `workflow_run` gate on `e2e-cli-prod` (issue #123) — **PASS** (with version handoff pinned)

Cycle-1 verdict holds. Cycle-2 revision pins the version handoff:
- `publish.yml` writes `version.txt` and `actions/upload-artifact`s it.
- `e2e-cli-prod.yml` `actions/download-artifact`s from the triggering run via `github.event.workflow_run.id`,
  reads the version, uses it for the install/check. Non-racy by construction (artifact is keyed on the run ID,
  not on tag/release lookup).
- `workflow_dispatch` path keeps `inputs.published-version` for the manual lane.

This is the canonical GitHub Actions pattern for cross-workflow data passing; it sidesteps the ref-parse
fragility flagged in cycle 1. ✓

### D5 — New `netscript-release` skill — **PASS** (wording fixed)

Cycle-1 wording nit resolved: the plan now explicitly says "add to `.agents/skills/`, run `deno task
agentic:sync-claude`, gate via `deno task agentic:sync-claude:check`". `deno.json:51–52` confirms both
tasks exist. The `.claude/skills/` mirror is generated, never hand-edited.

### D6 — Non-goals — **PASS**

Carried from cycle 1 (no local publish, no auto-tag, no new casts). ✓

## Scope / lane / slice verdict (cycle 2)

- **Scope**: harness tooling only. No `packages/`/`plugins/` framework code. WSL Codex implementation
  lane is correct.
- **Slices** (5 total, well under the 30 limit). Independently committable:
  - S1 (D2): smallest. ✓
  - S2 (D3): preflight + fixtures + wiring. ✓ (now self-contained with positive+negative fixtures)
  - S3 (D1): orchestrator + dry-run proof. ✓
  - S4 (D4): workflow change + actionlint. ✓
  - S5 (D5): skill + AGENTS.md + sync-claude. ✓
- **Gates**: lint + fmt + run-deno-check + unit tests + `release:cut --dry-run` proof + actionlint +
  IMPL-EVAL. ✓
- **No regressions** on cycle-1 PASS items (D1/D2/D4/D5/D6 + scope/lane/slices/gates).

## Open-decision sweep (evaluator-run, cycle 2)

| Decision the plan left open                                                                              | Forces rework if deferred? | Required fix                                                                                                                                                                                                                                                                              |
| -------------------------------------------------------------------------------------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D3 file-selection filter: how to scope the scan to the JSR-publishable surface (exports-based vs all source vs source-minus-tests) | NO (IMPL-discoverable) | The plan says "publishable members (name set, `publish !== false`; source `.ts`/`.tsx` only)". If the IMPL session implements "source = anything in `src/`/`mod.ts`/etc., exclude `tests/`" then the test fixture `readme-examples_test.ts:3` is naturally excluded. If "all source `.ts`/`.tsx`" then it would be flagged; the IMPL session would either tighten the filter or rely on the inline form being a legitimate use (and the plan's narrow pattern set + allowlist handles it). Either way, the IMPL session can resolve this without going back to PLAN. Not a Plan-Gate fail. |
| D2 doc-consistency: `entry.md:59-60` also mentions `--frozen` and is not in the plan's edit list          | NO (IMPL-discoverable)     | The IMPL session should grep `git grep -nF -- '--frozen'` after the slice to confirm zero remaining mentions in `.llm/tools/`. A 5-second sanity check. If they miss it, the next doc audit will catch it; the design itself is unaffected. Logged as an IMPL nit, not a Plan-Gate fail. |
| D3 multi-hop indirection (read via intermediate identifier, not direct `const <name> = new URL(...)`)     | NO (risk-registered)       | Plan's risk register explicitly calls this out: "If a future read indirects through more than one assignment hop, the resolver may miss it — fixture coverage is the guardrail; record any escape as debt." Acceptable for the production case (which is one hop). |
| D4 artifact versioning on re-runs / re-publishes (does the `version.txt` artifact on a re-run overwrite the original?) | NO | GitHub artifacts are immutable per run; a re-run produces a new artifact with a new run ID, and the `workflow_run.id` lookup points to the new run. ✓ The `conclusion == 'success'` guard ensures only successful publishes trigger e2e-cli-prod. |

No open decisions force rework at IMPL time. ✓

## Checklist results (cycle 2)

| Plan-Gate item                          | Result     | Evidence / location                                                                                                                  |
| --------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Research present and current            | **PASS**   | `.llm/tmp/run/chore-release-one-shot--tooling/research.md` re-baselined vs main. Spot-checks above.                                  |
| Decisions locked                        | **PASS**   | D1–D6 all present; D3 REVISED cycle 2 narrows pattern + pins two-pass resolver; D2 names exact edit sites; D4 pins artifact handoff; D5 names `agentic:sync-claude` tasks. |
| Open-decision sweep                     | **PASS**   | Only residual gaps are IMPL-discoverable (`entry.md:59-60` doc nit; source-root filter). Risk register covers multi-hop indirection. |
| Commit slices (< 30, gate + files each) | **PASS**   | 5 slices; S2 expanded to enumerate fixtures and pattern narrowing.                                                                   |
| Risk register                           | **PASS**   | D3 cross-line miss class + D3 false-positive risk + alpha.12 live-verification follow-up.                                            |
| Gate set selected                       | **PASS**   | run-deno-check + run-deno-lint + run-deno-fmt + unit tests + `release:cut --dry-run` + actionlint + IMPL-EVAL.                       |
| Deferred scope explicit                 | **PASS**   | D6 non-goals enumerated.                                                                                                              |
| jsr-audit surface scan (pkg/plugin)     | **N/A**    | SCOPE-tools; the preflight tool's *output* gates JSR publishability of downstream cuts but the plan itself doesn't change package surfaces. |

## Verdict

`PASS`

## IMPL notes (not blocking, but worth flagging)

1. **D2 doc nit** — After dropping `--frozen`, grep `git grep -nF -- '--frozen' .llm/tools/` to confirm zero
   remaining mentions. Likely catches `entry.md:59-60` (also a documentation file in the same set as
   `README.md:99`).
2. **D3 source-root filter** — Decide whether "source `.ts`/`.tsx` only" means (a) files reachable from
   `exports:` in deno.json, (b) all `.ts`/`.tsx` outside `tests/`, or (c) all `.ts`/`.tsx`. The IMPL
   session should pick the option that excludes test fixtures with inline-form `Deno.readTextFile(new
   URL(...))` (e.g., `readme-examples_test.ts:3`).
3. **D3 multi-hop test** — The positive fixture mirrors `openapi.ts:29→155` (one hop). Consider also a
   negative fixture for the multi-hop case (`const x = new URL(...); const y = x; readTextFile(y)`) that
   the tool should NOT flag, documenting the known limitation in code rather than only in the plan.
4. **D4 artifact name** — Use a versioned artifact name like `netscript-published-version-<run-id>` to
   avoid collision with other artifacts if the workflow grows.

## Notes

- Cycle-1 verdict (`FAIL_PLAN`) was correct in identifying D3 as the sole blocker. The cycle-2 revision
  correctly addresses all three required fixes (narrowed pattern, two-pass resolver, risk register) and
  folds all three optional clarifications (D4 artifact handoff, D5 `agentic:sync-claude`, D2 edit sites).
- The two-pass resolver is correct for the production defect class (`openapi.ts:29 → 155`). The risk
  register is honest about its limits (multi-hop indirection, false-positive drift).
- The plan is now ready for IMPL. Two `FAIL_PLAN` cycles allowed; only one was needed.