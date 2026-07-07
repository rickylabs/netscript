# Drift — beta6-nondash--supervisor (append-only)

## D1 · 2026-07-06 · significant · phantom FAI dependency handles

#464 cites deps "FAI-5, FAI-6, FAI-8" and #463 cites "Blocks: FAI-8, FAI-14", but no GitHub issues
exist for FAI-5/6/8/14 (verified via full `epic:ai-stack` state-all listing). They are F-ai
design-doc slice handles that were consolidated into the filed set. Effective #464 dependency set
re-derived as {#494, #463, #257, #258, #379} (plan D-4). Follow-up: when #464's PR lands, its body
should restate deps by issue number; consider an owner-batch note to fix #463/#464 bodies.

## D2 · 2026-07-06 · minor · topology deviation from workflow/supervisor.md

Run uses per-slice branches + draft PRs against main (beta.4/beta.5 rolling-cadence shape) instead
of the integration-branch layout in `workflow/supervisor.md`. Recorded as configuration in
`supervisor.md` + plan D-1; merge-on-green grant is per slice PR.

## D3 · 2026-07-06 · watch · T7 ↔ dashboard-rescope coupling (charter exception)

T7 #408 is consumed by the dashboard being rescoped in a parallel session (PR #506). T7 ships the
`@netscript/telemetry/query` contract + aspire-query adapter against its own acceptance only; the
"DDX-3 can switch onto it (co-land handshake)" acceptance line is **suspended** pending rescope
outcome — panel-integration decisions belong to the rescope session. Any interface request arriving
from the rescope gets logged here, not silently absorbed.

## D4 · 2026-07-06 · watch · #495 published-stub adjacency

`@netscript/fresh/ai/sandbox` ships a throwing FA0 stub on the published surface (#495, stable
milestone). #257/#379 e2e must validate against local-source scaffold, not the published stub.

## D5 — Codex usage quota exhausted; wave-1 Tier-D rerouted to Tier B (significant)

2026-07-06 ~18:52. All three wave-1 Codex launches (TEL-T3, TEL-T4, AI-494) failed at turn start:
`You've hit your usage limit ... try again at Jul 7th, 2026 3:52 AM`. Daemon healthy; threads
created but turns refused. Empty threads `019f3858-36b8…`, `019f3858-3efd…`, `019f3858-47ab…`
(plus 3 earlier zero-turn orphans from the slice-dir crash) are abandoned — no rival-send risk.

Blocked-lane handling applied (lane-policy invariant): Tier-D launch mechanism recorded as blocked
until 2026-07-07 03:52; wave-1 implementation rerouted to **Tier B (Opus 4.8 high, worktree
sub-agents)** — precedent: V3 impl run #390 topology (Opus impl sub-agents, Codex
adversarial-only) — supervisor pushes branches + opens PRs (Windows-side agents have no git
credentials; push via WSL). Adversarial WSL Codex review per PR still required and is expected to
run after quota reset; if the reset slips, record a follow-up drift. PM-0 (#511) and wave-2 Tier-D
slices stay queued for Codex post-reset.

Also hit and fixed en route: `launch-codex-slice.ts` crashed on a missing `--slice-dir` directory
AFTER `thread/start`, killing the stream and aborting the daemon turn (pipe-kill landmine). Fixed
on this run branch (mkdir-recursive before the record write). MSYS pathconv mangling of
`/home/codex/...` argv re-confirmed — all agentic CLI calls from Git Bash need
`MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL="*"`.

## D6 — #257 implemented in wave 1 ahead of #463; MERGE order must stay #463-first (watch)

Charter line 67: "within AI-stack, #463 before #379/#257 (pooling primitive is upstream)." Wave-1
parallelization implemented **#257 (FB4 mcp-ui-widget, PR #550) before #463 (FAI-7 pooling +
ui:// extraction)** because #463 is the Codex-blocked lane and #257 is Tier-B eligible. This is a
safe reordering of *implementation*, NOT of *merge*: A1 verified #257's `McpUiWidget` island is
contract-independent of the pooling primitive — it renders a plain `src` string prop with no import
coupling to `@netscript/plugin-ai-core` MCP surfaces; #463 later *produces* the ui:// resources the
widget renders (upstream/downstream is data-flow, not compile-dep). **Merge sequencing obligation:
#463 still merges before #257** (and before #379) to honor the charter's upstream-first intent;
#257's PR #550 stays draft until #463 lands or the owner explicitly clears it. Recorded so the
merge-order isn't lost when finalizing.

## D7 — Wave 1 complete (5/5 draft PRs); finalization gated on Codex reset (significant)

2026-07-06 19:43. All five wave-1 slices are impl-done, A1 PASS, on draft PRs against main from base
`a1669f60`: PROG-306 #306→#549 · AI-257 #257→#550 · AI-494 #494→#558 · TEL-T4 #405→#559 ·
TEL-T3 #404→#560. No lock churn on any; scoped gates green; parallel-slice boundaries (T3∥T4,
257∥494) verified clean at A1. **Two gates remain before any merge and both are effectively
Codex-reset-gated**: (1) per-PR adversarial WSL Codex review (charter pipeline: adversarial →
IMPL-EVAL) needs Codex, blocked until 07-07 03:52; (2) IMPL-EVAL is OpenHands qwen-3.7-max
(available now) but is deliberately held until after the adversarial pass so the single per-PR eval
round isn't spent on un-adversarially-reviewed code. Post-compaction posture (per
merge-grant-lost-on-compaction): PREP to green + SURFACE to owner-batch; do not autonomously merge
even on green until the owner re-confirms the charter's merge grant. Non-Codex forward work
dispatched meanwhile: PROG-303 172a-2-SOUND scope audit (Tier-B Opus, read-only).

## D8 — #550 (#257) close-gate: `gate:e2e` is an UNBUILT acceptance criterion (significant)

2026-07-07. #550's IMPL-EVAL is PASS on the island code, but the `close-gate` CI check
(`check-close-gate.ts --pr 550`) FAILS on 6 unchecked acceptance boxes on issue #257. Triage:
- **5 of 6 boxes are backed by real evidence** (A1 + IMPL-EVAL PASS) and are honestly checkable:
  F-5 (JSDoc/@module convention), F-6 (`publish:dry-run` exit 0 WITHOUT `--allow-slow-types`),
  keyed-remount, sandbox-restrictive-every-path, `check`/lint pass on fresh-ui.
- **1 box — `gate:e2e` — is genuinely UNBUILT.** It asserts `deno task e2e:cli run scaffold.runtime`
  covers `netscript ui:add ai` resolving+copying `McpUiWidget.tsx` + its `theme-seed` dep into a
  scaffolded Fresh app. Verified `packages/cli/e2e` has **zero** references to `ui:add`/`McpUiWidget`/
  `mcp-ui` — the scaffold.runtime suite does not exercise `ui:add` at all. #257's slice was
  island+manifest only; the e2e coverage was never implemented. **I will NOT check `gate:e2e` — doing
  so without real coverage is exactly the gate-falsification the close-gate exists to prevent (#260
  antipattern).**
- **Evaluator process note:** the IMPL-EVAL evaluator's §9 conflated the close-gate with "does the PR
  body carry a closing keyword." Hardened the re-dispatched #494 prompt with an explicit close-gate
  clarification; fold the same clarification into the standing IMPL-EVAL prompt template.
- **Compounding block:** charter line 67 (#463 upstream of #257) still holds and #463 (MCP pooling
  primitive) is not implemented yet, so #550 cannot merge today regardless of the checkboxes. The
  `gate:e2e` decision is therefore NOT on today's critical path — #550 waits on #463 either way.
- **Owner decision required (owner-batch #5):** build the `ui:add ai` scaffold.runtime e2e coverage
  (a small CLI/e2e-suite WSL Codex slice) as part of #257's acceptance, OR amend #257 to move
  `gate:e2e` into a follow-up issue so #257's bar shrinks to the 5 verified boxes. Recommend the
  follow-up split: the island is proven; ui:add scaffold coverage is CLI-suite work orthogonal to the
  fresh-ui island.

## D9 — #303 (S2) materially smaller than planned; seam already sound via #332 (significant)

2026-07-06 (Tier-B Opus read-only audit, `303-audit.md`). The beta-gate this lane was scoped
against — "172a-2-SOUND: phantom-typed base contract seam" — is ALREADY FIXED on main (#332, all 4
slices merged, closed 2026-07-03); AC1a plugin-service soundness is MET (zero Hole-A/Hole-B grep
matches). All 4 `--allow-slow-types` carve-outs (contracts/plugin/plugin-triggers-core/service) are
STALE — each publishes clean WITHOUT the flag. Genuine remaining #303 work = **AC2 full-export
doc-lint** (fresh-ui `./interactive` 123 errors is the tentpole) + mechanical carve-out/stale-debt
cleanup. Rescoped to 3 slices (A carve-out+debt cleanup, B plugin-layer doc-lint, C fresh-ui
doc-lint); exclude `plugin-ai-core` (#238-coordinated). Full evidence in `303-audit.md`.
### DRIFT — #258 lane override B→D (2026-07-07)
plan.md row 44 assigns #258 to Lane B (Opus 4.8 high) as a design-sensitive fresh-ui UI slice.
Overridden to **Lane D (WSL Codex)**. Rationale: (1) Lane B (Opus) is weekly-limited until Jul 11 and
the Anthropic budget is on life-support until Saturday; (2) the owner explicitly directed resuming WSL
Codex dispatch and extreme token caution. Quality mitigation: the security-critical depth/whitelist
guards are specified as HARD non-deferrable unit regressions in the brief, and this slice gets a
mandatory adversarial Codex review before IMPL-EVAL (per the adversarial-impl-review rule). Severity:
moderate (lane reassignment, scope unchanged).
