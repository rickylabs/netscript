# Plan: host-agnostic agentic WSL execution

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-602-agentic-host-agnostic--host-agnostic` |
| Branch | `fix/602-agentic-host-agnostic` |
| Phase | `plan` |
| Target | internal agentic tooling |
| Archetype | N/A — internal repository CLI helpers, not framework-layer code |
| Scope overlays | none |

## Goal

Make all agentic-suite WSL command dispatch work both from Windows and from inside Linux/WSL,
without weakening argv, git, route-identity, or one-sender safety.

## Scope

- Add a pure host-aware command-plan builder in `lib/agentic-lib.ts`.
- Make `wsl()` and `wslCd()` execute that plan and reject local user mismatches clearly.
- Route the `gh auth token` WSL probe through the shared host-aware helper.
- Add pure selection, cwd, and mismatch tests and a concise README paragraph.

## Non-Scope

- No changes outside `.llm/tools/**` and this harness run directory.
- No daemon lifecycle, routing policy, brief contract, git-safety, or sender-ownership changes.
- No privilege switching on Linux and no `sudo`/`su` fallback.

## Hidden Scope

- Preserve Windows command argv byte-for-byte.
- Ensure local mode maps WSL `--cd` semantics to `Deno.Command`'s `cwd` option.
- Keep token values out of disk, argv, and output.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Model host dispatch as a pure `{ bin, args, cwd? }` plan. | Enables spawn-free unit tests and one construction source. |
| D2 | Linux uses `bash -lc <script>` and Windows retains exact `wsl.exe -u ... [--cd ...] -- bash -lc ...` argv. | Matches the requested behavior and preserves Windows compatibility. |
| D3 | Linux rejects a requested user different from the current user before command execution. | Prevents silently dropping `-u` semantics. |
| D4 | The token probe calls the shared host-aware capture path rather than constructing `wsl.exe` itself. | Completes the suite-wide audit while retaining secret handling. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Require positive WSL detection beyond Linux | safe to defer | The brief explicitly selects Linux; generic Linux local execution is valid. |
| Add cross-user execution support | safe to defer | Explicitly out of scope; mismatch must fail. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Windows argv drift | Exact pure-plan unit assertion. |
| Username unavailable without env permission | Resolve through a small current-user helper with clear failure; tests inject identity. |
| A raw WSL call remains | Repository-wide search before and after implementation. |
| Safety regression outside dispatch | Full suite tests plus dry-run git-safety proof in this worktree. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | Unit/runtime | `deno test --no-lock -A .llm/tools/agentic/` | PASS |
| 2 | Type | scoped `run-deno-check.ts` for agentic | PASS |
| 3 | Format | scoped `run-deno-fmt.ts` for agentic | PASS |
| 4 | Audit | search raw `wsl.exe` call sites | Only the shared Windows plan literal remains |
| 5 | Native WSL E2E | `launch-codex-slice.ts --dry-run` against this worktree with no shim | PASS including git safety |
| 6 | Hygiene | compare `deno.lock` to baseline | unchanged |

## Deferred Scope

- WSL distro selection and Linux cross-user privilege switching.
- Host abstractions outside WSL command execution.

## Drift Watch

- Record any call site needing semantics not expressible through the shared helper.
- Record any validation command or delivery metadata that differs from the brief.
