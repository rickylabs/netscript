# Research — test-openapi-mcp-wave0-proofs--wave0

## Re-baseline

- Carried-in source: RFC #1123 and `.llm/runs/plan-openapi-mcp-plugin--seed/` (rev 2).
- Re-derived against `origin/main` @ `fb75cf6fc5ad02130ada0ac42e6f44035ac03a9b` on 2026-08-03.
- GitHub issue bodies read in full: #1127, #1128, #1129; epic #1126 and RFC #1123 also read.
- RFC authority reread: `rfc.md` §4 Wave 0 and §9 F1 in the seed run directory.
- What changed vs the carried-in version:
  - Aspire on this host is 13.4.6. Its official eventing documentation and generated TypeScript SDK
    now expose `onResourceEndpointsAllocated` plus `EndpointReference.getValueAsync()`.
  - This is positive research evidence only. F1 remains proof-arbitrated until P1 measures a real
    generated scaffold and emits the required verdict.

## Findings

| #  | Finding                                                                                                                                                                                                     | How to verify                                                                                                                                               |
| -- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Branch and `origin/main` are the same clean baseline; the proof branch did not exist remotely at bootstrap.                                                                                                 | `git rev-list --left-right --count HEAD...origin/main` → `0 0`; `git ls-remote origin refs/heads/test/openapi-mcp-wave0-proofs` → empty                     |
| 2  | RFC §4 requires committed `proofs/P<n>-verdict.md` files in the implementing run and defines skipped as non-pass.                                                                                           | `.llm/runs/plan-openapi-mcp-plugin--seed/rfc.md:256`                                                                                                        |
| 3  | RFC §9 leaves F1 to P1: PASS selects (a); an explicit FAIL legitimately selects (b).                                                                                                                        | `.llm/runs/plan-openapi-mcp-plugin--seed/rfc.md:367`                                                                                                        |
| 4  | Current generated AppHost code registers resources before `builder.build().run()`, so helper-body endpoint reads remain pre-allocation.                                                                     | `packages/cli/src/kernel/assets/aspire/helpers/apphost.ts.template`; `packages/cli/src/kernel/assets/generated/aspire/helpers/generate-index-1.ts.template` |
| 5  | Aspire 13.4 documents and generates a TypeScript resource callback at the exact allocation event, with an endpoint API that can await a concrete URL.                                                       | `aspire docs get apphost-eventing-apis`; generated SDK `onResourceEndpointsAllocated`, `EndpointReference.getValueAsync()`                                  |
| 6  | Existing service behavior already supplies a precise P3 fixture shape: unauthenticated spec fetch → 401, wrong scope → 403, correct scope → 200. The proof must rerun and ratify wording rather than infer. | `packages/service/tests/auth/define-service-auth_test.ts`                                                                                                   |
| 7  | MCP central truncation currently caps arrays at 50 and strings at 2,000 characters; P2 must report measurements against those exact current bounds.                                                         | `packages/mcp/src/application/runner/truncation.ts`                                                                                                         |
| 8  | The no-database scaffold contract is built from bare `oc`, so common error-family presence cannot be assumed.                                                                                               | `packages/cli/src/kernel/assets/service/contract.memory.ts.template`; canonical design `03-projection-and-naming.md` §3                                     |
| 9  | The host is shared: two foreign AppHosts and six foreign containers were already running before this slice. They are out of scope and must not be stopped or mutated.                                       | `aspire ps --format json`; `docker ps` captured 2026-08-03                                                                                                  |
| 10 | The task changes only run artifacts / experiment evidence and the ratified RFC record; no `packages/**` or `plugins/**` public surface is owned.                                                            | User slice contract; clean baseline                                                                                                                         |

## Doctrine / scope classification

- Archetype: N/A — proof/measurement slice; no published package or plugin surface changes.
- Overlay: `SCOPE-service.md` because measurements exercise generated services and Aspire runtime.
- Current relevant doctrine verdicts are read-only context: `@netscript/aspire` is Archetype 2 /
  Keep; `@netscript/service` is Archetype 4 / Refactor; `@netscript/cli` is Archetype 6 /
  Restructure.
- Doctrine debt delta: none expected; any required product change is a rescope and belongs to S7
  (#1133), not this proof PR.

## jsr-audit surface scan (package/plugin waves)

- N/A. This run does not change a package/plugin export, dependency, README, or publish surface.

## Open questions

- P1: does the TypeScript allocation callback produce a concrete host URL in a real scaffold, and
  can an experiment atomically emit every service with `projectRoot` + per-run `runId`?
- P2: what exact operation-row and schema-view byte counts result from the generated live specs,
  including the no-DB template, and which JSON Schema/OpenAPI keywords actually occur?
- P3: what exact 401/403 response envelope is observed on the current branch, and what concise
  `spec_unavailable` text names both likely cause and corrective exemption?

These are empirical proof outputs, not unresolved design decisions. `plan.md` D4–D9 lock the
measurement and verdict rules that will resolve them after PLAN-EVAL.
