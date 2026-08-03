# Kickoff — RFC: single deployment (issue #820)

use harness. You are the **RFC single-deployment orchestrator**.

## Identity & lanes
- You: Claude · Fable 5 · high (generator/orchestrator). Record your session id in supervisor.md at start.
- Adversarial evaluator: Codex · GPT-5.6 Sol · max — SEPARATE session, launched by YOU via `deno task agentic:launch-codex-slice` (never self-eval; evaluator protocol in .llm/harness/evaluator/). This is a seed/RFC run: PLAN-EVAL applies to the RFC design before it is posted as the canonical proposal.
- Sub-research agents: route per .llm/harness/workflow/lane-policy.md (Sol low/medium for targeted forensics; do not swarm Fable).

## Mission (owner-ratified 2026-07-17)
Issue #820 is your charter — read it first. Study the eis-chat POC **to learn, not to copy**:
- Local clone: /home/codex/repos/eis-chat @ main (aeaf2df = PR #150 "Prototype full-stack Windows singleton desktop deployment"). Read PR #150's body/thread, plus the fix lineage (#135 split-brain KV, #136 CEF render, #137 CEF/MCP stdio crash, #147/#149 local inference + desktop runtime hardening) — the SEAMS and FIXES are the lessons.
- GitHub API token workaround: TOKEN=$(grep -m1 oauth_token ~/.config/gh/hosts.yml | awk '{print $2}') (gh CLI returns 401).

Produce, in this order:
1. `research.md` — POC forensics: what the singleton deployment actually does (supervision, discovery, telemetry, packaging), where it breaks (crash of a sidecar = dead app, no frontend awareness), what is script-glue vs framework-worthy.
2. Gap analysis vs epic #510 (PM, beta.12, sub-issues PM-1..PM-34 #512-#545) and the desktop packaging scope (#543 PM-32, #400 dev-dashboard beta.13, #327 enterprise deployment): which POC lessons are covered, which are NOT (installation layer! update lifecycle!).
3. `plan.md` = the RFC design itself: (a) PM-first sequencing with concrete adjustments to beta.12 sub-issues; (b) enterprise installation layer INSIDE the Aspire stack (not a standalone .NET AOT host) — install/uninstall/repair, per-machine/per-user, service registration, elevation, signing, first-run provisioning; (c) update lifecycle for the COMBINED singleton output (deno desktop's single-output update story does not map 1:1 — design atomic/rollback semantics across window + service graph + sidecars); (d) composition contract with the prior single-runtime feature issues (both approaches are KEPT — find those issues, define shared contracts vs divergence).
4. Adversarial Sol·max PLAN-EVAL of the RFC. Two-failure escalation applies.
5. On PASS: post the RFC design as a comment on #820 and draft (as files in the run dir, NOT filed) the proposed board adjustments (new issues, re-scopes, re-milestones for beta.12/beta.13).

## Stop-lines (hard)
- NO implementation. NO framework code.
- NO filing/closing/re-milestoning of issues other than commenting on #820 — board changes are DRAFTS until the owner ratifies (seed-run doctrine, workflow/seed-run.md).
- NO merge/publish of anything.
- Public-repo hygiene: no eis-chat internal process details beyond what its public repo already shows; the RFC comment on #820 may reference eis-chat PR/issue numbers (same owner).

## Artifacts
Run dir: .llm/runs/rfc-single-deployment--orchestrator/ — supervisor.md, research.md, plan.md, worklog.md, drift.md, context-pack.md per harness templates. Keep worklog current every slice; the beta-10 orchestrator (this file's author) and the owner will supervise via the run dir and by resuming your session.
