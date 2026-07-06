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
