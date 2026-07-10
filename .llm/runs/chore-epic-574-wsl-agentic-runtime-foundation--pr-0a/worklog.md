# Worklog: PR 0A canonical WSL agentic foundation

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `chore-epic-574-wsl-agentic-runtime-foundation--pr-0a` |
| Branch | `chore/epic-574-wsl-agentic-runtime-foundation` |
| Archetype | 6 — CLI / Tooling, scoped internal-tool variant |
| Scope overlays | none |

## Design

### Public Surface

- `deno task agentic:wsl-foundation doctor [--json]` — read-only structured runtime report.
- `deno task agentic:wsl-foundation bootstrap [--dry-run] [--json]` — idempotent user-local install.
- `deno task agentic:wsl-foundation rollback-plan [--json]` — non-destructive reversal instructions.
- Pure exported parsing/planning functions used by tests and #576 migration.

### Domain Vocabulary

- `RuntimeComponentId` — finite IDs for Node, npm, Deno, Git, Codex, Claude, Gemini, .NET, Aspire,
  Docker, and required local state directories.
- `ProbeStatus` — `ready | missing | outdated | version_skew | auth_required | auth_conflict |
  unavailable`.
- `RuntimeProbe` — component ID, detected version, expected constraint, status, and redacted detail.
- `RuntimeDoctorReport` — schema version, native path proof, component probes, mobile-control probe,
  auth-boundary probes, and overall status.
- `InstallAction` — download, checksum verification, atomic install/symlink, npm stable install,
  directory creation, or PATH update.
- `BootstrapPlan` — ordered actions plus rollback actions; contains no secret values.
- `CommandOutcome` — exit code and bounded/redacted output.

### Ports

- `CommandRunner` — executes bounded child processes at the adapter edge.
- `FileSystemPort` — reads/writes local state and performs atomic links without embedding paths in
  domain logic.
- `DownloadPort` — fetches official Node metadata/artifacts and checksum data.
- `ClockPort` — timestamps evidence deterministically.
- `EnvironmentReader` — reports only allowed key presence/conflicts, never values.

### Constants

- `FOUNDATION_SCHEMA_VERSION` — report schema version.
- `NODE_VERSION` — `26.5.0`.
- `RUNTIME_COMPONENT_IDS` — finite component vocabulary.
- `PROBE_STATUSES` — finite diagnostic states.
- `FORBIDDEN_GEMINI_AUTH_KEYS` — API-key and Vertex route indicators checked by presence only.
- `LOCAL_STATE_DIRS` — `.claude`, `.codex`, `.gemini`, `.config/netscript-agentic`.
- `EXIT_CODES` — ready, degraded/auth-required, invalid configuration, and execution failure.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| S1 | Foundation contract and read-only doctor | unit tests + scoped check/lint/fmt | `deno.json`, `.llm/tools/agentic/wsl-foundation*.ts`, README, run artifacts |
| S2 | Idempotent bootstrap and rollback plan | unit tests + native WSL dry-run/live doctor | same owned surfaces |
| S3 | Mobile/auth/reconnect/rollback evidence | native WSL canaries with raw exit codes | run artifacts plus directly required fixes |

### Deferred Scope

- Generic routing/controller/fallback/provider policy belongs to #576-#581.
- Full rollout matrix belongs to #582.

### Contributor Path

Add a component by extending `RUNTIME_COMPONENT_IDS`, one pure probe, its adapter command, and
table-driven tests. Add installation behavior by introducing an `InstallAction` planner case and
its rollback action; do not put provider credentials or values into reports.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-07-10 | plan | baseline | Native WSL toolchain, managed Codex daemon, and Windows rollback versions captured. |
| 2026-07-10 | plan | worktree | Native ext4 worktree created at `/home/codex/repos/netscript-epic-574-pr0a-foundation` with no upstream. |
| 2026-07-10 | plan-eval | owner waiver | Owner personally reviewed the plan, declared it passed, and directed immediate WSL Codex delegation. |
| 2026-07-10 | launch | thread created | Checked-in launcher created thread `019f4b48-abaf-77d2-9cca-5cdec9f2446d`; UNC artifact write failed before the initial turn persisted. |
| 2026-07-10 | launch | managed repair | Active-work/rollout checks found no active implementation. Anchored PID repair restored managed remote control on environment `env_e_6a2d7485c5a0832a82505a12442cd3ec`, with CLI/app-server `0.144.1`. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Attach-only first Codex turn | Records exact thread identity before implementation while preserving one-sender rule. | Owner directive + codex-wsl-remote |
| Keep PR 0A bootstrap seam narrow | Generic controller belongs to #576. | #575/#576 |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| Checked lane policy names GPT-5.5-high, not owner-selected GPT-5.6 Sol high. | significant | yes |
| Codex CLI/app-server versions differ. | minor | yes |
| Launcher lacked UNC write permission; unmanaged daemon surfaced before first turn. | significant | yes |

## Gate Results

### Plan Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| Research current | PASS | `research.md` | Re-baselined at `b58b4c2a`. |
| Design checkpoint | PASS | This section | Contract, ports, constants, slices, deferred scope, and contributor path recorded. |
| PLAN-EVAL | PASS | `plan-eval.md` | Owner-reviewed explicit waiver. |

## Handoff Notes

- Evaluator should challenge the #575/#576 boundary and whether every mobile/auth acceptance item has
  a concrete gate without requiring credentials in artifacts.
