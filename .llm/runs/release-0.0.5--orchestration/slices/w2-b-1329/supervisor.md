# W2-B implementation supervisor — #1329

| Field                          | Value                                                                                           |
| ------------------------------ | ----------------------------------------------------------------------------------------------- |
| Status                         | active — Plan & Design                                                                          |
| Supervisor                     | Codex · OpenAI · GPT-5.6 Sol · medium                                                           |
| Session                        | current Codex implementation-supervisor thread                                                  |
| Host                           | WSL/Linux, Europe/Zurich                                                                        |
| Worktree                       | `/home/codex/repos/ns005-w2b`                                                                   |
| Branch                         | `fix/streams-versioned-sse-envelope`                                                            |
| Baseline                       | `origin/main@c383b2e84c254d90bab8c4f9ffcbf43a7beb8652`                                          |
| Implementation lane            | `normal_implementation`                                                                         |
| Review pairing                 | `review_codex` → Claude · Fable 5 · low                                                         |
| PLAN-EVAL                      | Claude · Fable 5 · medium, fresh opposite-family session; required before implementation        |
| IMPL-EVAL                      | Claude · Fable 5 · medium, fresh opposite-family session launched by the milestone orchestrator |
| Merge/canary/publish authority | milestone orchestrator only                                                                     |

The lane is justified by the versioned public contract, replay semantics, Fresh/browser consumer,
published export-map repair, and correlated runtime telemetry proof. No route override is active.

## Current issue state

#1329 is open in milestone 0.0.5 at `status:triage`, `priority:p0`, with eight unchecked acceptance
rows and no product PR at activation.

## Required skills at launch

Activated in the user-specified order: `netscript-harness`, `netscript-doctrine`, `deno-fresh`,
`aspire`, `netscript-tools`, `netscript-deno-toolchain`, `netscript-pr`, and `jsr-audit`.
Contract-first ordering, Archetype 3, and Fresh 2.x consumer conventions are mandatory.
