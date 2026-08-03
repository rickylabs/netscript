# Implementation Prompt: OMB S4 OpenAPI projection domain — Slice 1

use harness

You are the delegated implementation lane. Implement **Slice 1 only**, run its focused gates,
update this run's `worklog.md` and `context-pack.md`, then stop without committing or pushing. The
Tier-A supervisor owns substantive review, the sign-off commit, the explicit-refspec push, and the
PR comment. Do not begin Slice 2.

## SKILL

- `.agents/skills/netscript-harness`
- `.agents/skills/netscript-doctrine` (`packages/mcp`, Archetype 2; pure domain slice)
- `.agents/skills/jsr-audit` (new subpath export)
- `.agents/skills/netscript-tools`
- `.agents/skills/rtk`

Read each selected `SKILL.md` completely, then read:

1. `.llm/runs/feat-openapi-mcp-projection-domain--w2/research.md`
2. `.llm/runs/feat-openapi-mcp-projection-domain--w2/plan.md`
3. `.llm/runs/feat-openapi-mcp-projection-domain--w2/worklog.md`
4. `.llm/runs/feat-openapi-mcp-projection-domain--w2/context-pack.md`
5. `.llm/runs/feat-openapi-mcp-projection-domain--w2/plan-eval.md`
6. `.llm/runs/test-openapi-mcp-wave0-proofs--wave0/proofs/P2-verdict.md`
7. `.llm/runs/test-openapi-mcp-wave0-proofs--wave0/proofs/evidence/P2-no-db.json`
8. `.llm/runs/plan-openapi-mcp-plugin--seed/design/canonical/03-projection-and-naming.md`

## Slice 1 contract

- Relocate the existing command-domain triplet into `packages/mcp/src/domain/command/` and update
  internal imports while preserving every package-root export name and behavior.
- Add the documented package-root `openapi-projection.ts` entrypoint and
  `./openapi-projection` export in `packages/mcp/deno.json`.
- Add `packages/mcp/src/domain/openapi/operation-index.ts` with the explicit readonly public types,
  standard HTTP-method constant, and `indexOpenApiOperations(document)`.
- Add `packages/mcp/tests/operation-index_test.ts` importing only `../openapi-projection.ts` for the
  new API. Cover deterministic source order, dotted ids, missing operation-id method-path fallback,
  and ignoring non-operation path keys.
- Add a concise README section for the new pure projection subpath. Do not change the server's
  14-tool claims.
- No I/O, dependency, lockfile, registry, flow, adapter, tool-count, or generated-asset changes.
- Public exports require explicit return types and full JSDoc suitable for `deno doc --lint`.
- No internal `mod.ts`/barrel, lint ignore, `any`, `as unknown as`, or quality allowance.

## Slice 1 gates

Run at minimum:

1. Existing command-focused tests affected by the moves.
2. `deno test packages/mcp/tests/operation-index_test.ts`
3. `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/mcp --ext ts,tsx`
4. A raw `git status --short` and `git diff -- deno.lock` hygiene check.

Record exact commands, exit codes/results, changed files, and any drift. Stop after the working tree
contains reviewed-ready Slice 1 changes; do not stage or commit.
