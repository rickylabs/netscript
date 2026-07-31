# Worklog: aspire lifecycle (#958, #970)

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `fix-aspire-lifecycle--958` |
| Branch | `fix/aspire-lifecycle` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `none` |

## Design

Implementation is authorised by the supervisor's binding `# PLAN-EVAL resolution` in `plan.md`,
committed before product changes. This checkpoint reflects that resolution and supersedes the
pre-resolution stop recorded below.

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

1. **Isolation-aware lifetime** — emit a generated AppHost conditional that maps configured
   persistence to session lifetime only when `DcpPublisher__RandomizePorts=true`; prove generated
   isolated and non-isolated source contracts with focused generator tests.
2. **Cold-start budget and guidance** — emit a generated-workspace default for
   `ASPIRE_CLI_START_TIMEOUT` and document the upstream knob in generated start guidance; prove the
   emitted default and README contract.
3. **Tool failure observability** — reproduce `db:studio` exit 1 first; if it does not reproduce,
   surface the first stderr line for failed tool commands without changing auto-start behavior;
   prove the generated resource contract with focused tests.
4. **Merge-readiness evidence** — scoped check/lint/fmt, focused tests, `quality:gate`, doctrine
   fitness, and the canonical one-pass `scaffold.runtime` gate; update both issues and PR #986.

### Deferred Scope

- Upstream Aspire CLI phase/elapsed changes — NetScript does not own the detached launcher.
- Namespacing resource names by isolation id — connection-string and reference names are
  contract-bearing and the stabilisation slice deliberately avoids that blast radius.
- Generation-time validation of `db:studio` — the task exists, so the hypothesised defect is false.

### Contributor Path

Start at `generate-register-infrastructure.ts` for generated lifetime policy,
`generate-register-tools.ts` plus its generated asset for tool resources, and
`runtime-gates.ts` for the repo-owned E2E launch path.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-07-31 | pre-implementation | research | Verified the binding plan against NetScript and Aspire 13.4.6; no product code touched. |
| 2026-07-31 | implementation bootstrap | plan resolution | Supervisor resolution accepted all three research corrections and authorised the four slices above. |
| 2026-07-31 | isolation + timeout | implementation | Added generated `aspire:start` wrapper with a 300-second default and TypeScript isolation-key bridge; persistent databases now resolve to session lifetime only for isolated starts. |
| 2026-07-31 | isolation + timeout | fails-before/pass-after | New generator guards failed against the old output, then passed after implementation. Live `aspire describe` showed raw TypeScript isolation remained persistent and the generated task produced `container.lifetime: Session`. |
| 2026-07-31 | tool observability | reproduction | Direct `db:studio` reproduced exit 1 from missing `DATABASE_URL`; Aspire supplied the reference and Studio ran, disproving the filed absent-task/root-cause framing. |
| 2026-07-31 | tool observability | fails-before/pass-after | Generator guard failed before the wrapper existed. Live forced failure then produced resource state `forced studio failure: regression proof`; an initial `.mjs` execution-path mistake was caught live and corrected to generated `.mts`. |
| 2026-07-31 | implementation review | opposite-family review | Fable 5 returned `model_not_found`; canonical Claude Opus 4.8 low fallback passed the slice with three non-blocking teardown/style notes recorded in `impl-review.md`. |
| 2026-07-31 | timeout follow-up | runtime correction | A `Deno.Command` start wrapper altered detached-child ownership. Replaced it with direct cross-platform task-shell commands: `aspire:start` and `aspire:start:isolated`; the latter alone bridges `DcpPublisher__RandomizePorts=true`. |
| 2026-07-31 | timeout follow-up | opposite-family review | Same Claude Opus 4.8 review session returned PASS for the direct task-shell correction; no actionable findings. |
| 2026-07-31 | merge readiness | full E2E | `scaffold.runtime` ran twice: 44 gates passed and cleanup passed both times; `behavior.service-health` failed twice because the users service returned database-unhealthy from Prisma `$queryRaw`. Reported as FAIL, not a pass; the suite invokes Aspire directly and the failure is outside the changed lifecycle paths. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Stop before implementation | Binding plan leaves load-bearing decisions open and contains two disproven premises. | Harness Plan-Gate; `research.md`; `drift.md`. |
| Resume implementation | The binding resolution in `plan.md` closes all open decisions and explicitly authorises implementation. | Commit `7ecd773f2`; owner assignment. |
| Bridge isolated mode in the generated task | Aspire 13.4.6 does not propagate its .NET isolation environment seam through `GuestAppHostProject`; live TypeScript output otherwise stays persistent. | `research.md` finding 8; `drift.md`. |
| Keep Prisma Studio auto-start and add diagnostics | The task exists and runs under Aspire; changing lifecycle would exceed the authorised observability scope. | `research.md` finding 9; binding plan resolution. |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| Timeout configurability already exists upstream. | significant | yes |
| `db:studio` absent-task hypothesis is false. | significant | yes |
| Phase/elapsed reporting is upstream-owned. | architectural | yes |
| TypeScript AppHost isolation signal requires a generated task bridge. | significant | yes |
| Prisma Studio direct exit is missing environment, not a missing task. | significant | yes |
| Deno subprocess wrapper changes detached-start ownership. | significant | yes |

## Gate Results

- Focused generator/orchestrator tests: PASS — 27 tests / 50 steps.
- Scoped `packages/cli` check: PASS — 737 files, 0 findings.
- Scoped `packages/cli` lint: PASS — 737 files, 0 findings.
- Scoped `packages/cli` format: PASS — 737 files, 0 findings.
- `check:assets-barrel`: PASS.
- `quality:gate`: PASS (repository warnings unchanged; zero failures).
- `scaffold.runtime`: **FAIL** twice — 44 passed / 1 failed; deterministic
  `behavior.service-health` database-unhealthy Prisma query; cleanup passed.

## Handoff Notes

- The resolution section at the end of `plan.md` is binding where earlier sections conflict.
- Preserve non-isolated generated output and Prisma Studio auto-start behavior.
