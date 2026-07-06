# Charter — verbatim owner prompt (2026-07-06)

> use harness
>
> # Beta.6 program supervisor — non-dashboard lanes
>
> You are the supervisor for the **non-dashboard** portion of milestone `0.0.1-beta.6`
> (rickylabs/netscript). Coordinate; do not implement framework code yourself.
>
> ## HARD EXCLUSION
> The **dev-dashboard epic (#400) and every DDX issue (#410–#431)** are OUT of your scope.
> An owner-mandated rescope is running in a parallel session (run
> `.llm/runs/dashboard-rescope--seed/`, PR #506): the dashboard was drifting into an
> Aspire/Scalar duplicate and is being replanned as DX-complementary. Do not touch, close,
> re-label, or build against those issues. Exception awareness: telemetry **T7 #408**
> (`@netscript/telemetry/query` dashboard surface) is a dashboard *consumer* — implement the
> query surface against its own contract, but leave dashboard-panel integration decisions to
> the rescope outcome; note any coupling in drift.md.
>
> ## SCOPE (open beta.6 issues, by lane)
> - **telemetry-revamp epic #399** (T2 already merged, f91dc503): #404 T3 thin-vs-SDK provider
>   adapters + decouple enabled from OTEL_DENO · #405 T4 W3C hardening + triggers parenting
>   bugfix · #406 T5 real span-links fan-in (streams+sagas) · #407 T6 oRPC span-creation fix +
>   AI port invocation · #408 T7 query surface (see exception above) · #409 T8 real
>   grouped-trace e2e = **epic merge gate**, do it last.
> - **AI-stack (epic #238 family)**: #494 per-turn generation options + reasoning across chat
>   adapters · #463 FAI-7 MCP pooling primitive + ui:// resource extraction · #379 FA4
>   createMcpAppCallHandler route · #257 FB4 mcp-ui-widget · #258 FB5 generative-ui-renderer ·
>   #464 FAI-9 capability e2e = **merge gate**, do it last. Respect the flagship-quality
>   mandate: plugin-ai must meet-or-exceed reference plugins.
> - **process-manager**: #511 PM-0 wire linux/windows-service deploy targets +
>   resolveTargetConfig key mismatch + de-gate flat verbs (epic #510; M1=beta.8 — only PM-0 is
>   beta.6).
> - **program/track**: #389 harness-v3 epic (check remaining acceptance vs merged PR #493-era
>   work) · #303 S2 enterprise maturation · #306 S5 harness+skills revamp · #307 S6 stale-code
>   elimination (p2 — deprioritize if capacity is tight).
>
> Re-verify the live board first (`gh issue list --milestone "0.0.1-beta.6" --state open`);
> GitHub is the source of truth, this list is a snapshot.
>
> ## SKILL
> Activate before work, and list in every sub-agent brief (be generous):
> `netscript-harness` (V3 run loop, lane policy), `netscript-doctrine`, `netscript-pr`
> (labels/milestones/closing keywords), `netscript-tools` (scoped check/lint/fmt wrappers =
> only gate-evidence source), `netscript-deno-toolchain`, `netscript-cli`, `codex-wsl-remote` +
> `.llm/tools/agentic/` (ONLY WSL Codex surface), `openhands-handoff`, `rtk`, `aspire` (e2e
> resource mgmt via aspire CLI only), `deno-fresh` (fresh-ui/AI-UI slices).
>
> ## OPERATING RULES
> - Harness V3 topology: you (Tier-A) supervise; implementation slices via WSL Codex
>   daemon-attached sub-agents (launch only via `.llm/tools/agentic/`, record thread id +
>   worktree + steering command); Opus sub-agents allowed per lane-policy. Never Fable in
>   workflows. Generator ≠ evaluator; PLAN-EVAL (OpenHands minimax-M3) before implementation,
>   IMPL-EVAL (OpenHands qwen-3.7-max) after — one eval round per PR: fix and ship, no
>   re-dispatch.
> - Per slice: commit → push → draft-PR comment → worklog/context-pack update. Closing keyword
>   (`Closes #N`) in PR body for fully-resolved issues; never on epics.
> - Merge on green is granted for slice PRs; the USER cuts the release. No force-push.
> - Landmines: run generators (`gen:assets-barrel`) in Linux only (Windows runs embed \r\n →
>   CI-only parity failures; bit PR #547); push from WSL with explicit
>   `HEAD:refs/heads/<branch>`; gh from WSL via `cd /tmp` + `--body-file`; verify OpenHands
>   commit-back file sets before merge (lock churn); `db generate` is Aspire-coupled.
> - Validation: smallest proof per slice via `.llm/tools/run-deno-check|lint|fmt.ts --root
>   <pkg> --ext ts,tsx`; `deno task e2e:cli` only at merge-readiness. E2E type soundness:
>   only the 2 accepted casts.
> - Sequencing: within telemetry, T3→T6 parallelizable where files don't overlap, T8 last;
>   within AI-stack, #463 before #379/#257 (pooling primitive is upstream), #464 last.
>   Cross-check dependencies in each issue body before locking the plan.
>
> Start with: read the epic bodies (#399, #400-exclusion note, #238 refs in #494), re-baseline
> against origin/main, write `supervisor.md` for a new run
> `.llm/runs/beta6-nondash--supervisor/`, then propose the lane plan for PLAN-EVAL.
