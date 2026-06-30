# PLAN-EVAL summary — chore-plugin-rearch-v2--184

## Summary
Plan-evaluator session for harness run `chore-plugin-rearch-v2--184` (PR #193, issue #184 tracking #191). Read-only evaluation of `plan.md` + `research.md` against the Plan-Gate hard-stop rubric. **Verdict: FAIL_PLAN** with 3 hard findings + 3 minor findings. No source churn; no lock-file edits.

## Changes
- Created `.llm/tmp/run/chore-plugin-rearch-v2--184/plan-eval.md` (verdict document with checklist results, hard-check results, required fixes, evaluator open-decision sweep).
- Wrote this summary under the run-scoped path from `OPENHANDS_SUMMARY_PATH`.
- Did not commit source or `deno.lock`.
- Did not post a PR comment (per the operational contract: "The workflow owns GitHub comments."). The verdict body that would be posted is captured in `plan-eval.md` § "Verdict" and the per-check subsections.

## Validation
- Read `gates/plan-gate.md`, `evaluator/plan-protocol.md`, `templates/plan-eval.md` (harness skill).
- Read `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/netscript-doctrine/SKILL.md`, `.agents/skills/netscript-deno-toolchain/SKILL.md`, `.agents/skills/jsr-audit/SKILL.md`.
- Read `AGENTS.md`.
- Read `research.md` (160 L), `plan.md` (231 L) end-to-end.
- Independently confirmed base-truth (Check a): `packages/plugin/deno.json` v0.0.1-alpha.16 exports 12 subpaths; `./adapter`, `./protocol`, `./contract-base`, `./service` already present; only `./scaffold` is net-new.
- Confirmed aspire base (Check c): `AspireNSPluginContribution` at `packages/aspire/src/runtime/aspire-ns-plugin-contribution.base.ts:10`.
- Confirmed `serveRpc:false` proxy path (Check b): `packages/plugin/src/service/presentation/create-plugin-service.ts:92, 158`.
- Structural narrowing analysis (Check e): `WorkersPluginDependencyManifest` ⊂ `PluginManifest` (subset, not superset). The plan's "delete every local `*PluginManifest` + remove the third cast" is self-contradictory without picking a resolution path.
- Confirmed PR #192 (Triggers feature-backing) is **OPEN, PLANNING** via `gh pr list --state open` (Check d.1). Plan's "AFTER #181 lands" is not safe to defer as currently worded.
- Confirmed streams deletion hazard (Check d.2): `plugins/streams/src/public/mod.ts:71-75, 139-141` not enumerated in S-conform-streams.
- Confirmed `runtime/` subpath ambiguity (Open-decision 3): plan line 82 keeps `./runtime` while line 155-156 renames `-core/src/runtime/` orchestration → `application/`.
- Did NOT run `deno task` checks (PLAN-EVAL is read-only, gate runs on IMPL-EVAL).

## Responses to review comments or issue comments when relevant
N/A — this is a planning-only evaluation. No source churn means no review-comment thread to address.

## Remaining risks
- **Loop-limit**: a second `FAIL_PLAN` cycle on the same items will escalate per plan-gate loop-limit. The 6 required fixes are all planning-quality (not architecture-quality), so a single revision should pass.
- **#192 merge hazard**: if PR #192 (`feat/triggers-feature-backing`) merges in a way that diverges from the assumption baked into plan line 197 (the 6 deferred routes are backed), the plan needs to re-validate that the 4 hot shared files (`plugin-manifest.ts`, `contract-base/`, `ports/`, `service/`) are still in the assumed state.
- **Cast-mechanism choice (A vs B)**: whichever path the planner picks, `inspectWorkers` / `inspectSagas` / `inspectTriggers` / `inspectStreams` / `inspectAuth` typed signatures will change. Downstream consumers of these functions (if any) need a separate review pass.
- **JSR-publishability**: the jsr-audit rubric needs to be applied to the new `@netscript/plugin/scaffold` net-new surface and to each trimmed `-core` subpath before S-core-1 lands.
