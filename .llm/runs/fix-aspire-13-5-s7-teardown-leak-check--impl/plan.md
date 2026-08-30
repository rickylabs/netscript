# Plan: Aspire 13.5 teardown and leak-check

## Run Metadata

| Field          | Value                                           |
| -------------- | ----------------------------------------------- |
| Run ID         | `fix-aspire-13-5-s7-teardown-leak-check--impl`  |
| Branch         | `fix/aspire-13-5-s7-teardown-leak-check`        |
| Phase          | `implement`                                     |
| Target         | `.llm/tools/agentic/teardown`                   |
| Archetype      | `6 - CLI / Tooling` (internal-tooling analogue) |
| Scope overlays | none                                            |

## Archetype

Archetype 6 is the closest fit because this surface is a repository CLI/tool suite with process,
filesystem, Aspire, and Docker adapters. Package publication and JSR-only gates are N/A.

## Current Doctrine Verdict

N/A for package verdicts. The applicable tooling rules are contract-first types, pure classification
behind injected IO ports, and side effects only at the CLI/probe edge.

## Axioms in Play

| Axiom | Why it matters                                                                        |
| ----- | ------------------------------------------------------------------------------------- |
| A6    | Process classification is a stable policy/test seam, not a primitive-renaming helper. |
| A7    | Use `@std/path`, Web Platform timers, and `Deno.Command` at existing edges.           |
| A13   | Failed confirmation escalates visibly; it is never converted into a clean result.     |
| A14   | Synthetic snapshots and versioned fixtures preserve safety behavior.                  |

## Goal

Make leak-check report re-parented Aspire descendants, permit only proven-owned scoped cleanup, gate
persistent cleanup behind an explicit flag, and confirm helper exit after stop.

## Scope

- Add a synthetic S2-shaped orphan process snapshot and RED regression.
- Probe/classify process descendants using DCP labels, exact `--apphost` argv, and socket/cwd paths.
- Add `--force-persistent` under `--apply` and positive ownership only.
- Confirm AppHost and DCP-helper exit with a bounded probe loop.
- Update the cleanup playbook, regenerate the agent-tools barrel, and record Phase-B procedure.

## Non-Scope

- No AppHost start or host CLI change in Phase A.
- No E2E cleanup gate changes, package/plugin source, version pins, skills, or broad stop modes.
- No mutation of foreign or unproven resources.

## Hidden Scope

- Preserve both 13.4.6 and 13.5.3 fixture tests and the `MCP_COMMAND` guard.
- Generated agent-tools corpus changes because it embeds `.llm/tools` documentation.
- Each slice updates the harness evidence and PR commit trail.

## Locked Decisions

| ID | Decision                                                                                            | Rationale                                         |
| -- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| D1 | PPID 1 makes a process observable but never owned.                                                  | Detached helpers are normal during a live run.    |
| D2 | Mutation requires worktree/owned-root path containment; DCP/argv/socket signals classify relevance. | Preserves the shared-host safety boundary.        |
| D3 | Never target `aspire agent mcp` and never emit `--all`.                                             | Protects the session MCP server and sibling runs. |
| D4 | Force cleanup argv is exactly `aspire stop --force --apphost <exact> --non-interactive --nologo`.   | Encodes the S2 V7 proven surface.                 |
| D5 | Confirmation timeout is bounded from S2 V6's 385 ms observation with test-injected sleep/probes.    | Avoids false clean without an unbounded wait.     |

## Open-Decision Sweep

| Decision                | Status        | Notes                                           |
| ----------------------- | ------------- | ----------------------------------------------- |
| Phase-B live receipt    | safe to defer | Requires the explicitly excluded runtime lease. |
| E2E cleanup integration | safe to defer | Owned by S10 and excluded by #1719.             |

## Risk Register

| Risk                                        | Mitigation                                                                              |
| ------------------------------------------- | --------------------------------------------------------------------------------------- |
| False ownership of a live or foreign helper | Separate Aspire relevance signals from positive path ownership; fixture both worktrees. |
| PID reuse                                   | Retain stable process-start identity and re-probe before mutation.                      |
| Force deletes another run's persistence     | Require `--apply`, explicit `--force-persistent`, and owned AppHost path.               |
| Stop returns before helpers exit            | Bounded post-stop snapshot loop; timeout escalates and does not kill.                   |

## Anti-Patterns to Resolve or Avoid

| AP    | Status | Plan                                                                       |
| ----- | ------ | -------------------------------------------------------------------------- |
| AP-10 | risk   | Preserve structured failure/escalation rather than swallow probe failures. |
| AP-12 | risk   | Inject sleep/time in confirmation tests.                                   |
| AP-25 | risk   | Keep IO in probes/CLI edge; classification remains value-in/value-out.     |

## Fitness Gates

| Gate                     | Required | Expected evidence                                              |
| ------------------------ | -------- | -------------------------------------------------------------- |
| F-10 test shape          | yes      | Focused teardown unit suite, versioned and synthetic fixtures. |
| F-19 scoped runners      | yes      | Scoped check/lint/fmt wrappers over teardown TypeScript.       |
| Package-only F/JSR gates | no       | No package/plugin source or public export changes.             |

## Arch-Debt Implications

| Entry | Action | Notes                                     |
| ----- | ------ | ----------------------------------------- |
| none  | none   | No new or deepened doctrine debt planned. |

## Validation Plan

| Order | Gate            | Command or check                                                                | Expected result                                              |
| ----- | --------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 1     | RED             | `run-gate.ts --gate test ... -- .llm/tools/agentic/teardown/leak-check_test.ts` | failing orphan regression receipt before implementation      |
| 2     | unit            | scoped test wrapper over `.llm/tools/agentic/teardown/*_test.ts`                | all tests pass against 13.4.6, 13.5.3, and process snapshots |
| 3     | static          | scoped check/lint/fmt wrappers                                                  | zero findings                                                |
| 4     | configured lint | `deno task lint`                                                                | exit 0                                                       |
| 5     | quality         | `deno task quality:scan`; `deno task arch:check`                                | exit 0                                                       |
| 6     | generated       | `deno task gen:assets-barrel`; `deno task check:assets-barrel`                  | generated corpus current                                     |

## Dependencies

- Stacked S3 head `fe4f496bd` for the 13.5.3 `aspire ps` fixture.
- S2 V6/V7 receipts on `origin/test/aspire-13-5-s2-runtime-verification`.

## Drift Watch

- Any inability to model real process evidence without widening IO permissions.
- Any generated output beyond the expected agent-tools corpus.
- Any need for a runtime start before Phase B.
