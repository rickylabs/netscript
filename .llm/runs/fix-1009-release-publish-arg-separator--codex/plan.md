# Plan: release task argument-separator tolerance

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1009-release-publish-arg-separator--codex` |
| Branch | `fix/1009-release-publish-arg-separator` |
| Phase | `plan` |
| Target | `.llm/tools/release/` task entry points |
| Archetype | `6 — CLI / Tooling` (contract/gate subset only) |
| Scope overlays | `none` |

## Archetype

Archetype 6 is the smallest fit because the changed files are user-run CLI automation. This is not
a package restructure: only argument parsing and semantic entry-point tests are in scope.

## Current Doctrine Verdict

N/A for `.llm` infrastructure tooling. No `packages/` or `plugins/` surface is changed or evaluated.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| `A2` | The documented CLI boundary must remain simple and exact. |
| `A14` | A semantic drift guard must bind usage documentation to parser behavior. |

## Goal

Make direct task invocations tolerate Deno's forwarded bare separator without weakening rejection
of any other unknown argument, and prevent the documented `release:publish` usage from drifting.

## Scope

- Skip bare `--` anywhere in `github-release.ts`'s parser.
- Add a test that reads each documented `release:publish` usage line from the source header, removes
  the task prefix, tokenizes its representative arguments, and proves `parseArgs` accepts it.
- Skip bare `--` anywhere in `preflight-text-imports.ts`'s parser and cover the task-style argv.
- Record the user-required exact before/after probe and scoped validation evidence.

## Non-Scope

- No changes to already-tolerant sibling entry points.
- No changes to non-task-wired release scripts.
- No edits under `packages/` or `plugins/`, no release cut, publish, or E2E scaffold run.
- No edits to the correct docstring or missing-version message.

## Hidden Scope

- The docstring drift test must parse the source comment rather than merely repeat a literal argv.
- `--` must be accepted in any position while all other unknown arguments remain hard errors.

## Locked Decisions

| ID | Decision | Rationale |
| --- | -------- | --------- |
| `D1` | Add an early `if (arg === '--') continue;` in both loops. | Matches established siblings and is position-independent. |
| `D2` | Derive publish test cases from source `Usage:` lines. | Couples docs and parser so either side changing incompatibly fails. |
| `D3` | Exercise preflight through its real subprocess entry point. | `parseArgs` is intentionally private; the task contract is the behavior to guard. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Parser placement | resolved now | Separator check precedes all flag/positional branches. |
| Test tokenization | resolved now | Parse the two known source comment usage lines with quoted-string support sufficient for their documented grammar. |
| Broader parser normalization | safe to defer | Explicitly outside issue scope. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Separator acceptance accidentally weakens unknown-flag rejection. | Keep the final `Unknown argument` branch and existing rejection test unchanged. |
| Doc-derived test becomes a tautology or ignores commands. | Assert at least one usage line is found and run every matching line through `parseArgs`. |
| End-to-end probe reaches network/token checks after parsing. | Accept later failure, but capture output and assert it does not contain `Unknown argument: --`. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| `AP-18` | risk | Use semantic assertions, not a large output snapshot. |
| `AP-25` | risk | Keep side effects at existing script entry points; tests isolate subprocess behavior. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| CLI contract | yes | Document-derived parser test and real task probe. |
| Unknown-argument strictness | yes | Existing rejection test remains green. |
| Static quality | yes | Scoped check/lint/fmt wrappers over `.llm/tools/release`. |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `.llm/harness/debt/arch-debt.md` | none | No new or deepened architectural debt. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | Type check | `deno run -A .llm/tools/run-deno-check.ts --root . --ext ts,tsx --file ...` (root-scoped fallback if unsupported) | PASS |
| 2 | Format | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root .llm/tools/release --ext ts,tsx` | PASS |
| 3 | Lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root .llm/tools/release --ext ts,tsx` | PASS |
| 4 | Focused tests | User-specified five release test files | PASS |
| 5 | Task probe | `deno task release:publish -- v0.0.9 --message "probe" --dry-run` | Gets past parsing; no `Unknown argument: --` |

## Risks

- A later network/token/tag failure in the real probe is expected and is not treated as a parser
  failure; the exact output and exit code will be recorded.

## Dependencies

- Existing Deno task wiring and `@std/assert`; no new dependency.

## Drift Watch

- Any additional task-wired parser discovered without separator tolerance.
- Any need to export private preflight parsing or modify scripts outside the four owned files.
