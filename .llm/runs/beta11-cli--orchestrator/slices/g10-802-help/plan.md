# Plan: truthful sibling plugin CLI usage metadata

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `beta11-cli--orchestrator/slices/g10-802-help` |
| Branch | `fix/802-plugin-cli-help` |
| Phase | `plan-eval` |
| Target | `plugins/workers`, `plugins/sagas`, `plugins/triggers`; audit `plugins/streams` |
| Archetype | `6 — CLI / Tooling` (larger concern folded into first-party plugin packages) |
| Scope overlays | `none` |

## Archetype and Current Doctrine Verdict

These are first-party Archetype-5 plugins, but the changed surface is their shipped CLI command
contract, so the decision tree selects the larger Archetype 6. Doctrine file 10 currently marks
sagas and streams `Keep`, and workers/triggers `Refactor` for unrelated structural concerns. This
slice changes no layering or folder shape and must not absorb that pre-existing refactor debt.

## Goal

Make every source-side plugin CLI `usage` string directly runnable without an unperformed install
step, and protect the convention with regression tests across every touched sibling CLI.

## Scope

- Replace `ns-workers`, `ns-sagas`, and `ns-triggers` usage prefixes with the version-pinned
  `deno x -A jsr:@netscript/plugin-<name>@<version>/cli` invocation.
- Add exhaustive metadata regression assertions for every command in workers, sagas, and triggers.
- Record streams as audited/no-change because it has no usage metadata.

## Non-Scope

- Docs prose, scaffold/install behavior, global aliases, CLI parsing/dispatch, streams command metadata,
  release publication, merging, milestone closure, and issue closure.

## Locked Decision — option (b)

Choose **(b): replace the shorthand with the full `deno x` form**. Although the supervisor was
predisposed to (c), the actual sibling convention argues for (b): streams' executable composition
entrypoint already identifies its CLI as `deno x -A jsr:@netscript/plugin-streams/cli`, other
published executable guidance uses direct `deno x`, and the shared plugin help formatter has no
one-time-install-hint concept. Adding a hint to every command usage would repeat it rather than print
it once, while adding a new cross-package help contract would expand this truthfulness fix. The
version-pinned direct form is immediately executable, consistent with existing CLI entrypoint prose,
and does not require persistent global state.

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| a/b/c remediation | resolved now | Locked to (b) above. |
| Extract a shared formatter/constant | safe to defer | Repetition is limited to three package-local prefixes; a shared API would widen scope. |
| Add usage metadata to streams | safe to defer | Streams has no affected pattern; inventing usage metadata is unrelated feature work. |

## Commit Slice

| # | What it proves | Gate | Files |
| - | -------------- | ---- | ----- |
| 1 | All existing sibling usage metadata is truthful and exhaustively regression-tested. | touched CLI test dirs; full touched plugin test dirs; scoped check/lint/fmt; `quality:scan`; `arch:check` | three command source surfaces, three CLI test files, run artifacts |

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| One command retains the phantom prefix. | Exhaustive test iterates every command definition plus a focused source scan. |
| Long prefixes drift between plugins. | Assert the exact package-specific prefix in each plugin suite. |
| `<version>` is mistaken for a shell-resolved value. | Preserve the issue's documented placeholder convention; docs-side version guidance remains separate. |
| Unrelated plugin debt makes broad gates noisy. | Record raw results and distinguish pre-existing failures; do not suppress or refactor unrelated findings. |

## Anti-Patterns and Debt

- Avoid AP-6/AP-11 speculative shared abstractions and AP-15 misleading public CLI surface.
- No new or deepened architecture debt expected. Existing workers/triggers doctrine refactor entries
  remain out of scope.

## Validation Plan

1. Focused help/metadata regression tests in each touched CLI test directory.
2. Full `plugins/workers/tests`, `plugins/sagas/tests`, and `plugins/triggers/tests` directories.
3. Scoped check/lint/fmt wrappers for each touched plugin root (`--ext ts,tsx`).
4. `deno task quality:scan` and `deno task arch:check`.
5. Focused `rg` proves no `ns-workers|ns-sagas|ns-triggers` remains in touched source usage strings.

## Deferred Scope

- Docs-side prose is owned elsewhere.
- No alias installation, scaffold mutation, release operation, merge, issue closure, or milestone closure.

