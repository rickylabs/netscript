# Research — fix-aspire-13-5-s7-teardown-leak-check--impl

## Re-baseline

- Carried-in source: issues #1719, #1429, epic #1712, S2 lifecycle receipts, and S3 fixture head.
- Re-derived against `origin/main` @ `13878a80a50c55b9662099fed64555f2310ae4a3` and the required
  stacked baseline `fe4f496bdcc605eceb9b3e5748ad55a7811bbed9` on 2026-08-30.
- S3 adds the version-suffixed 13.5.3 `aspire ps` fixture without changing teardown behavior.

## Findings

| # | Finding                                                                                                                                            | How to verify                                  |
| - | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| 1 | Current discovery observes AppHosts and Aspire-labelled containers only; detached PPID-1 helpers are invisible.                                    | `.llm/tools/agentic/teardown/probes.ts`; #1429 |
| 2 | PPID 1 is not ownership proof because Aspire intentionally detaches helpers.                                                                       | #1429 body and comments                        |
| 3 | Positive path containment is the mutation boundary; foreign and unknown-owner resources remain report-only.                                        | `AGENTS.md` Resource hygiene; `ownership.ts`   |
| 4 | Aspire 13.5.3 removed the killed launcher's AppHost registration in 385 ms; exact scoped stop returned in 374 ms and retained persistent Postgres. | S2 `receipts/02-v6-*` and `drift.md`           |
| 5 | `aspire stop --force --apphost <exact>` completed in 4.42 s and removed persistent resources.                                                      | S2 `receipts/02-v7-aspire-stop-force.raw.txt`  |
| 6 | The existing `MCP_COMMAND` guard refuses Aspire MCP despite otherwise-owned path evidence.                                                         | `ownership.ts`; `ownership_test.ts`            |
| 7 | The tooling already has injected command/file ports and bounded confirmation polling.                                                              | `ports.ts`; `teardown.ts`                      |

## jsr-audit surface scan

- N/A: this is internal `.llm/tools/agentic/teardown` tooling; no package/plugin export, JSR
  manifest, or published `mod.ts` changes.

## Open questions

- None that require pre-implementation resolution. Phase B live receipt timing is deliberately
  deferred until the supervisor supplies a runtime lease.
