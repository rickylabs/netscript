# Drift Log: scriptc task-runtime benchmark + RFC

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-08-19 — D-1: Lane overrides for cloud-container run

- **What:** Orchestrator runs as Claude Fable 5 (cloud session) instead of the canonical Opus 5 ·
  high local orchestrator; Tier-D WSL Codex implementation lane and native opposite-family local
  evaluator sessions are unreachable from this container.
- **Source:** Session environment (Claude Code Remote managed container); `supervisor.md` § Recorded
  lane/eval overrides.
- **Expected:** `lane-policy.md` canonical routes (local Opus orchestrator, WSL Codex Tier-D
  implementation, native Codex Sol evaluator sessions).
- **Actual:** Cloud-driven run launched by the owner on this surface. Benchmark scaffolding is
  run-dir throwaway code and the deliverable is an RFC (SCOPE-docs); no `packages/`/`plugins/`
  source changes. Evaluator phases use the cloud PR automation route (`openhands` +
  `status:plan-eval`; draft→ready for IMPL-EVAL) per lane-policy's cloud-PR provision.
- **Severity:** significant
- **Action:** accept (recorded; owner-launched surface is the directive)
- **Evidence:** `supervisor.md`; lane-policy § "Native-first formal evaluation" cloud-PR paragraph.

## 2026-08-19 — D-2: Handover Phase 1 (scaffold + Aspire + Docker) not executable in container

- **What:** The handover's Phase 1 requires Aspire CLI, .NET, and a running Docker daemon to
  scaffold `bench-app` and start the AppHost graph. This container has none of them
  (no `dotnet`, no `aspire`, no Docker socket), and installing them cannot conjure a container
  runtime (no docker daemon available to start).
- **Source:** `docker info` → cannot connect `/var/run/docker.sock`; `which aspire dotnet` → empty.
- **Expected:** `netscript init bench-app` + `netscript plugin install worker` + Aspire graph, then
  benchmark through the hosted worker service.
- **Actual:** The dispatch machinery the benchmark must measure (queue → `MultiRuntimeTaskExecutor`
  → adapter → subprocess → TaskResult) lives in `@netscript/plugin-workers-core` and is exercised
  in-process from the repo workspace with the repo's own queue provider (see research.md
  § Feasibility for the provider chosen and why). The Aspire-hosted environment differs only in
  process hosting/wiring, not in the executor/adapter code path. This substitution is stated
  plainly in the RFC methodology + limits; end-to-end numbers are labeled "in-process worker
  runtime, not Aspire-hosted".
- **Severity:** significant
- **Action:** accept + propose-update (handover's own stop-rule consulted; the real dispatch-path
  requirement is satisfied at the executor/queue layer, which is what the RFC's claims depend on)
- **Evidence:** `supervisor.md` § Environment constraints; toolchain probe output in worklog.

## 2026-08-19 — D-3: DB-less init flag unrecorded (Phase 1 step 3 not reachable)

- **What:** The handover asks to record the real DB-less `netscript init` flag from
  `netscript init --help`. Because the scaffold path is not executable here (D-2), the flag is
  determined from CLI source instead of a live `--help` run, and recorded in research.md.
- **Source:** `packages/cli` init command source (see research.md finding).
- **Severity:** minor
- **Action:** accept
- **Evidence:** research.md § Findings.
