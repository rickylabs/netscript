# Plan: Aspire and CLI lifecycle (#1011, #1012)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1011-aspire-lifecycle--codex` |
| Branch | `fix/1011-aspire-lifecycle` |
| Phase | `plan` |
| Target | `packages/cli` generated Aspire lifecycle and runtime inspection |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `service` intent applies, but the referenced `SCOPE-service.md` file is absent from this checkout; recorded as drift |

## Archetype

Archetype 6 is the smallest fitting profile because the changed product is a user-run `netscript db`
flow plus generated AppHost tooling. The embedded runtime-lifecycle concern is folded into A6; it
does not split `@netscript/cli` into Archetype 3.

## Current Doctrine Verdict

`@netscript/cli`: **Restructure** — existing debt remains under the active Archetype-6 migration.
This focused change may not deepen that debt or introduce a new surface/layout deviation.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A1 | Lifecycle ownership and readiness evidence are contracts before implementation. |
| A7 | Wrap Aspire's `--isolated`, backchannel, describe, and HTTP-health APIs. |
| A10 | Generated AppHost entries remain declarative composition roots. |
| A13 | Missing binaries, absent backchannels, and failed probes have explicit outcomes. |
| A14 | Live runtime gates, red proofs, and package fitness gates preserve the contracts. |

## Goal

Close #1011 and #1012 with one draft PR by proving that read-only DB status cannot disturb the
resident AppHost and that endpoint-bearing executables do not become trusted as healthy without
readiness evidence.

## Scope

- Generate a distinct root-level DB-operation AppHost entry.
- Route detached DB operations exclusively through that path with `--isolated` lifecycle ownership.
- Add deterministic runner/generator tests plus a live resident PID/backchannel runtime gate.
- Add readiness probes for endpoint-bearing `tauri`/`task` app entries by default.
- Preserve `healthReports` evidence through `AppHostInspector` and report zero-report `Healthy` as
  warning/unverified.
- Add a live runtime fixture whose process stays alive but never binds its endpoint; assert a
  non-healthy status with report evidence.
- Test the missing-Aspire-binary path on the injected inspector/process seam.

## Non-Scope

- Changing Aspire upstream's raw status semantics.
- Killing any process outside positively proven run ownership, or ever killing `aspire mcp`.
- Redesigning interactive `db studio`.
- General CLI restructuring, new public exports, or release publication.

## Hidden Scope

- Generated template assets/barrels must stay fresh when the AppHost entry changes.
- `scaffold.runtime` gate IDs, suite expectations, cleanup, and leak ownership must remain coherent.
- Issue acceptance boxes and evidence comments are product deliverables, not postscript.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| L1 | Use `aspire/db-operation-apphost.mts` plus `--isolated` for detached DB commands. | A distinct path gives a distinct backchannel/stop target; isolation alone does not. |
| L2 | Never call `aspire start` on the resident path from a detached DB operation. | Read-only inspection cannot acquire mutation/teardown ownership. |
| L3 | Extend the existing `AppHostInspector` with health-report evidence. | Reuses the #1076 seam and its missing-binary behavior. |
| L4 | Probe every generated app entry that advertises HTTP unless it explicitly opts out. | Closes #1033's named `tauri`/`task` gap without inventing a parallel resource model. |
| L5 | Put both live acceptance cases in `scaffold.runtime`. | They require a real generated AppHost, not emitted-string assertions. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Exact filename constant and template rendering helper | safe to defer | Mechanical naming within L1; no contract impact. |
| Runtime gate order | safe to defer | Must run after AppHost start and before cleanup. |
| Whether zero reports are warning or error | resolved now | Warning/unverified: absence of evidence is neither healthy proof nor proof of failure. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Starting DB AppHost still targets resident identity | Assert exact generated path, `--isolated`, resident PID before/after, and independent DB path cleanup. |
| E2E contention on shared host | Run leak-check first; wait on any foreign AppHost/Postgres; run `scaffold.runtime` once. |
| `aspire stop` leaves child processes | Re-probe `aspire ps` and OS process paths; clean only positively owned paths/PIDs. |
| Missing Aspire binary turns warning into crash | Keep injected process seam and explicit `Deno.errors.NotFound` test. |
| Dead-port fixture stalls the suite | Do not include it in wait gates; validate its describe snapshot after start, then normal cleanup owns it. |
| Probe default breaks custom task/tauri servers | Reuse `HealthCheckPath` custom/false contract and add semantic generator coverage. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-11/AP-25 | risk | Keep process/filesystem effects in existing kernel adapters and E2E edges. |
| AP-18 | risk | Assert generated semantics and live resource state, not giant snapshots. |
| AP-1/AP-21 | existing debt | Add focused files/gates; do not expand monoliths or flat command folders. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-1/F-3/F-5/F-10/F-11/F-12/F-15…F-19 | yes | `quality:scan`, `arch:check`, scoped wrappers, manual A6 review |
| F-6/F-7 | yes | CLI/Aspire doc-lint and publish dry-run/JSR audit with no new public surface |
| F-CLI-1…F-CLI-31 | yes | `PENDING_SCRIPT` with manual structural evidence plus `arch:check` |
| Runtime/Aspire | yes | Focused tests and one clean `scaffold.runtime` run |
| Consumer | yes | Generated project type-check and live AppHost behavior inside runtime suite |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `packages/cli — AP-1 / doctrine verdict Restructure` | none | Must not deepen. |
| `packages/cli — cli/archetype-6-v2-pending-scripts` | none | Manual F-CLI evidence remains required. |
| New debt | none expected | Any discovered violation blocks or is explicitly registered before eval. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | Focused unit | `deno test -A` on touched DB runner, Aspire inspector, generator, and E2E gate tests | All pass; mutations produce named red proofs. |
| 2 | Scoped static | `.llm/tools/run-deno-{check,lint,fmt}.ts --root <touched root> --ext ts,tsx` | Zero findings. |
| 3 | Package tests | `deno task test` for touched packages/surfaces | All pass. |
| 4 | Quality | `deno task quality:scan` and `deno task arch:check` | No new findings / no FAIL. |
| 5 | JSR | `deno task doc:lint --root packages/cli --pretty`, Aspire equivalent, and relevant dry-run audit | No new publish-surface failure. |
| 6 | Resource hygiene | `deno task agentic:leak-check -- --slice-dir <run> --worktree <worktree>` plus `ps`/`docker ps` | No foreign runtime contention before E2E. |
| 7 | Merge readiness | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` once | Exit 0; resident PID preserved; dead-port resource non-healthy; cleanup verified. |
| 8 | Close gate | acceptance mirror dry-run, review-thread gate, CI | All evidenced boxes checked; no unanswered threads. |

## Dependencies

- Installed Aspire CLI 13.4.x behavior and generated TypeScript AppHost SDK.
- Existing `AppHostInspector`, process port, helper generator, and `scaffold.runtime` harness.

## Drift Watch

- Any evidence that the distinct wrapper path resolves back to the resident backchannel.
- Any runtime resource whose JSON omits `healthReports` entirely rather than returning an array.
- Foreign AppHosts/Postgres containers that make the single runtime gate unsafe to start.

