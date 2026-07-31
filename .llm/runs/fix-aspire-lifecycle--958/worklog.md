# Worklog: aspire lifecycle (#958, #970)

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `fix-aspire-lifecycle--958` |
| Branch | `fix/aspire-lifecycle` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `none` |

## Design

The carried-in plan has not passed PLAN-EVAL. The following checkpoint records the verified
surface without authorizing implementation.

### Public Surface

- Generated TypeScript AppHost infrastructure registration.
- Generated Prisma Studio Aspire resource behavior.
- Generated workspace instructions for `aspire start`.
- Internal `scaffold.runtime` Aspire-start gate.

### Domain Vocabulary

- `isolated start` — Aspire start with randomized ports and isolated user secrets, observable in
  the AppHost through `DcpPublisher__RandomizePorts=true`.
- `persistent lifetime` — reuse across ordinary AppHost sessions.
- `session lifetime` — resource belongs to one AppHost run.
- `startup timeout` — Aspire CLI detached-launch budget controlled by
  `ASPIRE_CLI_START_TIMEOUT`.
- `tool resource` — generated development executable such as Prisma Studio.

### Ports

- Aspire CLI environment — existing upstream seam for isolated mode and startup timeout.
- Aspire TypeScript hosting SDK — lifetime and process-command APIs.
- Deno task registry — source of truth for generated database tool tasks.

### Constants

- `DcpPublisher__RandomizePorts` — upstream isolation signal.
- `ASPIRE_CLI_START_TIMEOUT` — upstream detached-start timeout override.
- `NETSCRIPT_ASPIRE_PROCESS_COMMANDS` — current opt-in process-command seam.
- `db:studio` — generated Prisma Studio task.

### Commit Slices

No implementation slices are locked. PLAN-EVAL must resolve the significant drift in
`drift.md` first.

### Deferred Scope

- Upstream Aspire CLI phase/elapsed changes — NetScript does not own the detached launcher.
- Aspire persistent-resource correctness under randomized ports — upstream documents this as
  supported and has functional coverage.

### Contributor Path

Start at `generate-register-infrastructure.ts` for generated lifetime policy,
`generate-register-tools.ts` plus its generated asset for tool resources, and
`runtime-gates.ts` for the repo-owned E2E launch path.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-07-31 | pre-implementation | research | Verified the binding plan against NetScript and Aspire 13.4.6; no product code touched. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Stop before implementation | Binding plan leaves load-bearing decisions open and contains two disproven premises. | Harness Plan-Gate; `research.md`; `drift.md`. |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| Timeout configurability already exists upstream. | significant | yes |
| `db:studio` absent-task hypothesis is false. | significant | yes |
| Phase/elapsed reporting is upstream-owned. | architectural | yes |

## Gate Results

All implementation gates are `NOT_RUN`: implementation is blocked at PLAN-EVAL.

## Handoff Notes

- PLAN-EVAL should inspect `research.md` and `drift.md` first.
- No product source has been modified.

