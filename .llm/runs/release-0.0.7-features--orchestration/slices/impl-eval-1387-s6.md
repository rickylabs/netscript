use harness

# IMPL-EVAL — #1387 Slice 6 (OpenAPI access projection)

You are a **separate evaluator session**, opposite family to the author (Codex authored; you are
Claude). You certify or reject; you do not fix, do not commit, do not push, do not comment on GitHub,
and do not move any head.

| Field | Value |
| --- | --- |
| Repo | detached worktree, already checked out at the evidence head |
| **Content head** | `11e83f06426469b48a67c2211d954ac916cd6fda` |
| **Evidence head** | `3d6e4d239f1c056d894e8e2f7c69b97a54483c6b` |
| Base | `0dc715633` |
| PR | rickylabs/netscript **#1762**, draft, `Refs #1387 — partial` |
| Plan | `.llm/runs/feat-service-principal-procedure-policy--1387/plan.md` § Slice 6; `research.md` § "Generated surfaces" (the exact LD-9 mapping) and finding 10 |
| Tier-A | `.llm/runs/feat-service-principal-procedure-policy--1387/tier-a-slice-6.md` |
| Receipts | `.llm/runs/feat-service-principal-procedure-policy--1387/receipts/` |

## SKILL

`netscript-harness`, `netscript-doctrine`, `netscript-tools`, `rtk`.

## What to judge

1. **Ceiling.** Two of three authorized files: `packages/service/src/primitives/openapi.ts`,
   `packages/service/tests/handlers_test.ts`. `contract-authorizer_test.ts` untouched — confirm that
   is correct (it already proves runtime `optional` rejection; this slice only concerns docs
   generation) rather than a missed requirement. `deno.lock` byte-identical.
2. **LD-9's exact mapping.** `none` → `security: []`; `required` → a bearer requirement carrying
   declared scopes, with roles in a `x-netscript-roles` extension (not inside `security`, since
   OpenAPI security schemes cannot express roles portably); `optional` → `security: [{},
   { bearerAuth: [] }]`, present in the generated docs even though the runtime authorizer rejects
   `optional` at construction (LD-8) — verify this slice does not also enforce LD-8's rejection; it
   should only make the declaration visible. No metadata → the operation must be genuinely untouched,
   not merely equal by accident — check the test uses `Object.hasOwn` for the absence claim rather
   than an equality comparison, since `security: undefined` and "no security key" are different facts
   and only one of them is the correct no-metadata result.
3. **Matching correctness.** `indexProcedureAccess` builds a lookup by both `operationId` and
   `method+path`. Verify this actually uses oRPC's public `traverseContractProcedures` (research
   finding 10) rather than a private reimplementation, and that the matching logic in
   `projectProcedureAccess` can't silently miss an operation whose `operationId` doesn't match its
   contract path (check the fallback order: does `byOperationId` take priority, and is that the
   right priority given a custom `operationId` override exists in the test?).
4. **Preservation, proven not assumed.** The test exercises a custom `operationId`, a
   `.route({ spec: ... })` override adding `summary` and `x-user-field`, and asserts both survive
   verbatim alongside the injected `security`/`x-netscript-roles`. Confirm this genuinely proves
   additive post-processing — trace whether `projectProcedureAccess` could plausibly overwrite an
   existing `security` field a user had already set via `.route({ spec: ... })`, since the plan
   requires preserving existing user-supplied OpenAPI fields and this is the one case the current
   test doesn't cover (a user-supplied `security` on a metadata-bearing procedure).
5. **The bearer security-scheme component.** Verify it's added only when at least one operation
   needs it (`needsBearerScheme`), and that an existing user-supplied `bearerAuth` scheme definition
   is kept rather than overwritten — check the exact spread order in the code.
6. **Corpus/lock.** Both are unchanged from Slice 5's end state (corpus stays at 7 654 symbols,
   `deno.lock` at `edfa0c24…`). Confirm that's the correct result — this slice changes an existing
   function's runtime output, not its exported type signature, so no new public symbol should appear.
7. **Evidence integrity.** Eight receipts, each `gitHead == actualGitHead` at the content head.
   Verify by `argv` and `durationMs`, never by `exitCode` alone. Confirm Slices 1–5's archived receipt
   sets are intact and untouched, and the top level holds only Slice 6's set.

## Verdict

Return exactly one of `PASS`, `ACCEPTED_WITH_FINDINGS`, `FAIL_FIX`, `FAIL_PLAN`, naming the exact head
you certify. Findings must be concrete: file, line, what breaks. State plainly anything you could not
verify.

**Do not run `e2e:cli`, Aspire, Docker, or any browser gate.** No runtime lease is held by this lane
and none may be acquired.
