# S5 Tier-A slice review — #1717 / PR #1740

- Reviewer: Fable 5 medium supervisor; generator: GPT-5.6 Sol high, thread
  `01a04ff1-28a6-7e70-9a25-b2307bc78800`.
- Review worktree: `/home/codex/repos/netscript-aspire-13-5-s5-eval` (detached).

## Cycle 1 — head `13375bfc0` (base `origin/main` `13878a80a`) — **FIX REQUIRED**

Commit stack: `e83659d78` gate RED → `24817a404` sagas publisher/D-14 → `aae91586b` contributions
→ `8aee17462` opt-in plugin + infrastructure host ports (D-16) → `732337435` E2E probes via
`aspire describe` → `13375bfc0` cleanup + regen. 112 files, +1759/−552.

Gates executed by the reviewer at `13375bfc0`:

| Gate | Result |
| --- | --- |
| S5 literal grep (`809[1-4]\|4437\|127.0.0.1:80` over plugins, cli/src, cli/e2e) | only `sagas/src/constants.ts` + deprecation test |
| new `deno-lint-ignore` / `as unknown as` / `: any` in diff | 0 |
| `deno task check:aspire-host-ports` | OK — 957 files, no pinned host ports |
| `check:assets-barrel` | PASS |
| `quality:scan` / `arch:check` | 0 findings / FAIL=0 |
| `run-deno-check` (plugins, cli/src, cli/e2e, .llm/tools e2e+validation) | 1282 files, 0 diagnostics |
| unit suites (5 plugins, cli templates/adapters, tool tests) | 481 passed / 0 failed / 12 ignored |
| raw `deno lint --no-config` on 79 changed TS files | clean |
| raw `deno fmt --check --no-config --single-quote --line-width 100` on the same files | 8 flagged; 7 already non-conforming on `origin/main` (pre-existing `packages/cli` double-quote style), 1 new: `packages/cli/e2e/.../configure-flow-b-job.ts` (minor, in the steer) |
| sagas `deno publish --dry-run --allow-dirty` / `deno doc --lint mod.ts` | 3 pre-existing warnings / pre-existing #1708 only |
| `deno task e2e:cli run scaffold.plugins --cleanup --format pretty` | 17/17 |
| `SAGAS_API_DEFAULT_PORT` runtime reads | none (exports + README only) |

Substantive review — D-14 (sagas), #1370 contributions, D-16 opt-in `entry.Port` emission, and
the `aspire describe`-derived E2E probes are correct and tested. Two findings are
**review-blocking** because they satisfy the locked grep by respelling rather than by fact:

1. `.llm/tools/generate-cli-assets-barrel.ts` `sourceSafeAssetLiteral` escapes the first char of
   any forbidden port literal inside embedded skill/doc/base64 strings — couples the asset
   generator to S5's port list; generated barrels embed S9/S11 prose and are not fallbacks. Fix:
   revert; exclude `*.generated.ts` from the grep test + receipt (checker already skips
   `.generated.` via `isGeneratedSource`).
2. `AUTH_API_DEFAULT_PORT = 8_094`, `TRIGGERS_API_DEFAULT_PORT = 8_093` — numeric separators hide
   the literal. Fix: restore values, apply D-14 (`@deprecated` JSDoc, exports kept, no runtime read,
   deprecation-contract tests, allow-list the constants files), extend the 0.0.8 removal draft.

Steer posted as PR #1740 comment (2026-08-30 ~03:05 CEST); runner stopped (SIGTERM, runner only);
the child's in-flight continuation turn reads the comment. Slice 7 expected. Fix brief also sent by `codex-resume` on the same thread (supervisor is the sender after the runner stop).
