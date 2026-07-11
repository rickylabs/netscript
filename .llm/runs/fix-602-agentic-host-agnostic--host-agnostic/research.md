# Research — fix-602-agentic-host-agnostic--host-agnostic

## Re-baseline

- Carried-in source: issue #602 slice brief.
- Re-derived against `origin/main` at `720fcb7e3b762c1e9ee5bf51a1371bfeeb6be22f` on 2026-07-11.
- The branch is clean, equals the baseline, and intentionally has no upstream.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | `wsl()` and `wslCd()` unconditionally construct `wsl.exe` commands. | `.llm/tools/agentic/lib/agentic-lib.ts` |
| 2 | Status and resume route execution through shared helpers and `wslGitInfo()` composes `wsl()`, but the launcher's real streaming spawn directly constructs `Deno.Command('wsl.exe', ...)`. | `.llm/tools/agentic/codex/launch-codex-slice.ts:416` and shared-helper call-site search |
| 3 | Raw execution constructors include `wsl()`/`wslCd()` and the token capture probe in `agentic-lib.ts`, the launcher's streaming spawn, and `gh-token.ts`'s stdin-bearing login. Display-only command strings also occur in launcher/resume diagnostics. | Search all `wsl.exe` literals under `.llm/tools/agentic/**/*.ts` |
| 4 | Current tests live beside `agentic-lib.ts` and use local assertions/imported `@std/assert`; argv construction can be tested without spawning. | `.llm/tools/agentic/lib/agentic-lib_test.ts` |
| 5 | Safety invariants to preserve are argv-only dispatch, LF normalization, push-safety exit 4, requested-vs-observed route identity, and one-sender ownership. | `.llm/tools/agentic/README.md` |

## jsr-audit surface scan

- N/A: this run changes internal `.llm/tools/` tooling, not a published package/plugin surface.

## Open questions

- Resolved now: Linux selection keys on `Deno.build.os === "linux"`; no additional WSL-only probe is required by the brief.
- Resolved now: local requested-user validation compares against a supplied/current username and fails before spawning.
- Resolved now: one pure `{ bin, args, cwd? }` plan must serve buffered, captured, streaming
  `.spawn()`, and stdin-bearing callers; execution/output policy remains at each caller.
