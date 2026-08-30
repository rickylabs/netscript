use harness

# IMPL-EVAL — #1387 Slice 4 (contract-policy service ports)

You are a **separate evaluator session**, opposite family to the author (Codex authored; you are
Claude). You certify or reject; you do not fix, do not commit, do not push, do not comment on GitHub,
and do not move any head.

| Field | Value |
| --- | --- |
| Repo | detached worktree, already checked out at the evidence head |
| **Content head** | `9cc8c4c5f84acef262bca2cec9169ebbaa410eb5` |
| **Evidence head** | `0f8e99ec95a7fc62304e22d7e95d8264977d4f53` |
| Base | `2d7d1b79a` |
| PR | rickylabs/netscript **#1762**, draft, `Refs #1387 — partial` |
| Plan | `.llm/runs/feat-service-principal-procedure-policy--1387/plan.md` § Slice 4 |
| Research | `research.md` §§ "Fail-closed migration census" and finding 15 (contract-local, not a router/URL-keyed map) |
| Tier-A | `.llm/runs/feat-service-principal-procedure-policy--1387/tier-a-slice-4.md` |
| Receipts | `.llm/runs/feat-service-principal-procedure-policy--1387/receipts/` |

## SKILL

`netscript-harness`, `netscript-doctrine`, `netscript-tools`, `rtk`. Read the plan's Slice 4 section
and research finding 15 before judging design shape.

## What to judge

1. **Ceiling.** Six files: `packages/service/src/auth/types.ts`, `options.ts`,
   `contract-policy.ts` (new), `mod.ts`, `packages/service/mod.ts`,
   `packages/service/tests/type-assignability_test.ts`. Plus the permitted corpus carrier. Anything
   else is a breach. `deno.lock` must be byte-identical to the base.
2. **Type contract only.** This slice defines signatures, not logic. Confirm `contract-policy.ts`
   contains no resolver implementation, no runtime lookup, no middleware wiring — only types and a
   factory *signature*.
3. **`AuthorizerPort` compatibility, exactly preserved.** Confirm the interface itself is unchanged
   in this diff, and that `createScopeAuthorizer` still satisfies it with no signature change.
4. **Contract-local, not a path map.** Verify `ContractPolicyContract` and the resolver types key off
   the contract's own `~orpc.meta.access`, not a parallel router/URL-keyed structure — research
   finding 15 explicitly rejected the latter because it breaks silently on a router key rename. If you
   find a structure that could drift from the contract it describes, that is the defect this finding
   exists to prevent.
5. **The fallback-typing invariant, and whether it is actually proved.** `MatchAwareAuthorizerPort`
   exists so a fallback can distinguish "no rule matched" from "rule matched and denied" — required so
   contract metadata can win on disagreement (research findings 5/6) rather than a legacy path rule
   silently overriding it. The test file includes a `@ts-expect-error` proof that a plain
   `AuthorizerPort` is rejected as `ContractAuthorizerOptions.fallback`. Verify that proof is real: does
   removing the `@ts-expect-error` comment actually produce a compile error? Do not take the comment's
   presence as proof by itself — this lane has been burned before by tests that only prove the right
   type is accepted; check that this one also genuinely proves the wrong type is refused.
6. **The contract round-trip is real.** The test constructs an actual `@netscript/contracts` procedure
   with `.meta({ access: {...} })` and reads it back through `~orpc.meta.access`. Confirm that this
   exercises the real contract builder from #1466 rather than a hand-typed stand-in that merely looks
   like it.
7. **Evidence integrity.** Nine receipts, each `gitHead == actualGitHead` at the content head. Verify
   by `argv` and `durationMs`, never by `exitCode` alone. Confirm Slices 1–3's archived receipt sets
   are intact and untouched, and that the top level holds only Slice 4's set.
8. **Corpus delta.** The corpus grew 7 628 → 7 652 symbols (24 new). Confirm that count is explained
   by this slice's new public exports and is not evidence of an unrelated signature change slipping
   through.

## Provenance you should know

This slice completed and pushed while a coordinator routing update required obtaining a second,
sanctioned evaluator verdict on the **preceding** slice (Slice 3) before release. The supervisor held
this slice's review — no Tier-A certification, no downstream action — until that gate cleared;
Slice 3 is now doubly certified by two independent opposite-provenance evaluators. This slice's
content is unaffected by that hold; it is presented to you exactly as its author left it.

## Verdict

Return exactly one of `PASS`, `ACCEPTED_WITH_FINDINGS`, `FAIL_FIX`, `FAIL_PLAN`, naming the exact head
you certify. Findings must be concrete: file, line, what breaks. State plainly anything you could not
verify rather than passing it silently.

**Do not run `e2e:cli`, Aspire, Docker, or any browser gate.** No runtime lease is held by this lane
and none may be acquired.
