# Worklog: docs/user-site

| Field | Value |
|-------|-------|
| Run ID | `docs-user-site--diataxis` |
| Branch | `docs/user-site` (off `release/jsr-readiness`) |
| Status | **plan READY for PLAN-EVAL** (Groups 1+2 merged → IMPL gate satisfied; awaiting OpenHands/minimax-M3 PLAN-EVAL) |

## Progress Log

| Time | Phase | Step | Notes |
|------|-------|------|-------|
| 2026-06-18 | bootstrap | skeleton scaffolded | Draft `plan.md`/`research.md` grounded in `.llm/tmp/docs/docs-architecture-research.md` (Diátaxis, Lume→Pages, comparators). No branch/worktree/generator yet. |
| 2026-06-18 | plan & design | **Design checkpoint — PLAN-EVAL ready** | Plan finalized against `main`@`cc3b8731` post-1+2-merge. Locked: **US-5** reference denominator = **26** publish targets (`cli-e2e` excluded, `publish:false`); **US-6** the sole `deno doc --lint` debt is `@netscript/fresh-ui` (7 `error[private-type-ref]`) → fixed by a **WSL Codex source slice** (export the 7 `*Namespace` types), not supervisor doc edits; **US-7** Pages target = project subpath `https://rickylabs.github.io/netscript/` (Lume `location`). Evidence: `deno doc --lint` baseline across all 26 units = **25/26 clean** (`research.md` finding #6 + lint table). Branch `docs/user-site` rebased onto umbrella `dd712b1e`. Next: PLAN-EVAL (separate OpenHands/minimax-M3 session); no slice before PASS. |

## Gate Results

(none yet — see `plan.md` Validation Plan)

## Handoff Notes

- Research+Plan can proceed in parallel with Groups 1/2. **IMPL waits for Groups 1+2 merged.**
- Supervisor must **ping the user for a `workflow`-scoped token** when the Pages workflow YAML slice
  is reached (current PAT lacks `workflow` scope).
- PLAN-EVAL (separate OpenHands session) before any slice.


## Design checkpoint — Group 3 IMPL launch prep (2026-06-18)

PR #57 (Group 4) merged into the umbrella (`2a2aec70`); the G4/LD-DOCS-LANE lane is verified green, satisfying the "hold G3 until lane validated" gate. User dispatched "proceed".

Resolved the two remaining open Design decisions:
- **US-8 (reference depth):** 22 primary reference pages; the 4 `*-core` substrate packages fold as Internals subsections under their public plugin. All 26 stay in the A1 lint denominator.
- **US-9 (READMEs):** standardized template, generated per unit + README-conformance checker (A2).

Enumerated `## Commit Slices` G3-0..G3-6 (doc-authoring lane) + G3-FUI (fresh-ui WSL Codex source slice) + G3-DEPLOY (Pages CI, user-gated workflow token). 26-unit census captured. Worktree `.claude/worktrees/g3-user-site` created on `docs/user-site` @ `6c6f2672`.

Pending user input before generator launch (per "present plans before launching any generator"): Pages `workflow`-scoped token approach (US-7/G3-DEPLOY) + fresh-ui WSL Codex go-ahead (US-6/G3-FUI). The G3-0..G3-6 doc bulk is independent of both.
