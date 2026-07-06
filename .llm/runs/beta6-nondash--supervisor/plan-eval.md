# PLAN-EVAL — beta6-nondash--supervisor

- Plan evaluator session: OpenHands minimax-M3 (run 28807188190), 2026-07-06
- Run: `beta6-nondash--supervisor`
- Branch: `chore/beta6-nondash-supervisor-run` (PR #548)
- Surface / archetype: multi-lane supervisor; per-slice archetypes — telemetry = ARCHETYPE-2 +
  plugin overlays; AI-stack = ARCHETYPE-2 (`@netscript/ai`) + ARCHETYPE-4 (`fresh`/`fresh-ui`,
  `SCOPE-frontend`); PM-0 = ARCHETYPE-6; PROG lanes = harness/docs (`SCOPE-docs` where applicable)
- Scope overlays: `SCOPE-frontend` (UI slices #257, #258, #379)
- Baseline: `origin/main @ a1669f60`

## Checklist results

| Plan-Gate item                          | Result            | Evidence / location |
| --------------------------------------- | ----------------- | ------------------- |
| Research present and current            | PASS              | `research.md` §1 re-baselines to `a1669f60`; §2 verifies live board against charter snapshot (telemetry #404–#409, AI #494/#463/#464/#379/#257/#258, PM #511, PROG #389/#303/#306/#307). |
| Decisions locked                        | PASS              | `plan.md` § Design D-1…D-7 (lines 98–114) state each architecture decision with rationale; no unstated design choices. |
| Open-decision sweep                     | PASS              | All deferred / open items are in `drift.md` D-1…D-4 (phantom FAI handles D-1, topology deviation D-2, T7 ↔ dashboard-rescope coupling D-3, #495 published-stub adjacency D-4). Each marks `significant` / `minor` / `watch` and is paired with a plan-side mitigation. No decision left open that would force code rework if deferred. |
| Commit slices (< 30, gate + files each) | PASS              | 18 enumerated slices (TEL T3–T8 = 6; AI 494/463/257/258/379/464 = 6; PM PM-0 = 1; PROG 389 + 303-audit + 303-impl + 306 + 307 = 5). Each row names Issue, Lane, Deps, Surface; per-slice protocol §4 names the gates (`scoped check/lint/fmt`, `deno doc --lint`, `publish:dry-run` where the issue carries `gate:jsr`, `e2e:cli` only at merge-readiness). |
| Risk register                           | PASS              | `drift.md` D-1 (significant — phantom FAI handles; effective deps re-derived), D-2 (minor — topology deviation, recorded as configuration), D-3 (watch — T7 ↔ dashboard rescope), D-4 (watch — #495 stub adjacency). `supervisor.md` §"Landmines in force" captures 6 charter-level landmines (Linux-only generators, explicit `HEAD:refs/heads/...` push, `--body-file` for `gh`, OpenHands commit-back file-set check, Aspire-coupled `db generate`, 2 accepted casts). |
| Gate set selected                       | PASS              | `plan.md` § Per-slice protocol §4 names the gate evidence path: scoped wrappers (`run-deno-check\|lint\|fmt.ts --root <pkg> --ext ts,tsx`), `deno doc --lint` + `publish:dry-run` where `gate:jsr` is on the issue, `e2e:cli` only at merge-readiness / gate slices. § Per-slice protocol §5 adds adversarial WSL Codex review + ONE OpenHands qwen-3.7-max IMPL-EVAL round per PR. Archetypes map cleanly to `gates/archetype-gate-matrix.md` columns (A2 → universal F-*, A4 + SCOPE-frontend, A6 → F-1…F-19 + F-CLI-*, docs lane → SCOPE-docs). |
| Deferred scope explicit                 | PASS              | Drift D-3 + plan D-6 mark T7 #408 as contract-only under the dashboard-rescope exception. Plan D-5 defers #303 implementation behind TEL W1–W2. PROG-307 is `owner-batch` per `phase-registry.md`. Plan lines 19, 53–59, 66, 102–114 carry the deferred-scope markers. |
| jsr-audit surface scan (pkg/plugin)     | PASS              | Per-slice protocol §4 names `deno publish --dry-run` as the gate evidence where the issue carries `gate:jsr`. Affected package surfaces enumerated: `packages/ai` (#494, #463, T6), `packages/fresh-ui` (#257, #258 via `registry.manifest.ts`), `packages/fresh/ai` (#379), `packages/telemetry` + new `query` subpath (T3, T7), `packages/cli` + `packages/config` (PM-0). #306 (PROG) carries the `jsr-audit` skill hardening work and the 5 JSR gotchas are listed in its body. `publish:dry-run` without `--allow-slow-types` is the gate (see #257 F-6, #258 F-6, #511 acceptance). |

## Open-decision sweep (evaluator-run)

None found. Every potentially-deferred decision is captured in `drift.md` D-1…D-4 with a
watch/disposition marker, and the design decisions (D-1…D-7) are stated with rationale. The only
forward-looking decision with rework risk is the T7 ↔ dashboard-rescope handshake (drift D-3, plan
D-3/D-6) — the plan correctly suspends the "DDX-3 can switch onto it" acceptance line in #408
rather than silently absorbing an interface request, which is the only correct behavior per the
charter.

## Verdict

`PASS`

### If FAIL_PLAN — required fixes

N/A

## Independent spot-checks

1. **Drift D1 (phantom FAI handles) — verified.** `gh issue list --state all --search
   "FAI-5 OR FAI-6 OR FAI-8 OR FAI-14"` returns only #464 (FAI-9) and #463 (FAI-7); no FAI-5,
   FAI-6, FAI-8, or FAI-14 exist. #464 body explicitly lists deps "FAI-5, FAI-6, FAI-7, FAI-8";
   #463 body lists "Blocks: FAI-8, FAI-14". Plan D-4 re-derives #464's effective dep set as
   {#494, #463, #257, #258, #379} — all filed, all in `phase-registry.md`. The "F-ai slice handles
   that were consolidated into the filed set" framing in `research.md` §3 matches the on-the-board
   reality.

2. **T3→T5 hard dep + T6 ↔ #494 `packages/ai` collision — verified.** #406 body: "Deps: T1, T2,
   T3 (needs SDK adapter for link attributes)" — plan D-2 records this as a hard dep. T6 #407
   body: "AI: invoke the injected `TelemetryPort` in `packages/ai/src/runtime/mod.ts`" — T6 also
   edits `packages/sdk` (oRPC CLIENT span) and `packages/telemetry` (TracingPlugin). #494 body
   edits `packages/ai/src/ports/chat-client.ts` + `packages/ai/src/adapters/*` + new reasoning
   `AgentChunk` (`packages/ai/src/contracts/chunk.ts`). Both slices touch `packages/ai/`;
   `research.md` §8 cross-lane collision map captures the mitigation ("T6 AI-half after #494"),
   and `plan.md` D-2 / `phase-registry.md` wave ordering (T6 in W2 with `ai-half after #494`)
   implement the sequence. No rework risk if T6's AI half lands after #494 (different subfiles
   within `packages/ai/`; T6's seam is `runtime/mod.ts` + the `TelemetryPort` injection
   already exposed by T3).

3. **#257/#258 `registry.manifest.ts` collision + ordering — verified.** `registry.manifest.ts`
   exists at `packages/fresh-ui/registry.manifest.ts` (single canonical file). #257 body:
   "registry.manifest.ts: new registry item `mcp-ui-widget` ... appended to the `ai` collection's
   `items` list (the collection itself is created by FB0)". #258 body: "New `ai` (or extended)
   manifest collection entries in `registry.manifest.ts` for: the renderer itself, and the
   layout/viz/data block primitives it dispatches to." Both append into the same file. Plan D-3
   sets #257 as the first manifest edit (Tier B, smaller size M); #258 rebases (Tier B, size L);
   `phase-registry.md` puts #257 in W1 and #258 in W2, with #379 (which also needs the FB4
   widget surface) gated on #257 merge. No silent ordering assumption.

## Hard-exclusion compliance

- Dashboard epic #400 and all DDX #410–#431: not enumerated in `plan.md` lane tables, not in
  `phase-registry.md` rows, not mentioned in any "to do" list. Charter "HARD EXCLUSION" and
  rescope PR #506 are cited in `charter.md`, `supervisor.md` §"HARD EXCLUSION", and `drift.md`
  preamble. ✓
- T7 #408: ship `application/query` + `adapters/aspire-query` + `./query` subpath (plan § Lane
  TEL TEL-T7) only; drift D-3 + plan D-6 suspend the "DDX-3 can switch onto it" acceptance line
  until the dashboard rescope lands. The acceptance line is preserved on the issue (not silently
  dropped) so the rescope session owns the integration decision. ✓

## Notes

- Plan deliberately deviates from `workflow/supervisor.md` integration-branch layout (D-1, drift
  D-2) — recorded as configuration with rationale (per-slice shippability, rolling beta
  cadence, no serialization of unrelated lanes). This is consistent with `lane-policy.md` §
  "Tiered Agent Model" — deviations are configuration when recorded.
- Plan leaves PROG-307 (`owner-batch` status in `phase-registry.md`) and PROG-303-impl
  (`blocked` until audit + TEL W1–W2) as the two lower-priority entries; both are correctly
  flagged in `phase-registry.md` rather than smuggled into the wave schedule.
- IMPL-EVAL per-PR model is `qwen-3.7-max` (one round, fix-and-ship) per `supervisor.md` §
  "Recorded lane/eval overrides" and `lane-policy.md` Tier E. PLAN-EVAL minimax-M3 in a separate
  session is the contract being honored by this run.

## Verdict line

OPENHANDS_VERDICT: PASS
