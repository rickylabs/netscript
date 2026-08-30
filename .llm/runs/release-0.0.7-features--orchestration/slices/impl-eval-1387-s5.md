use harness

# IMPL-EVAL — #1387 Slice 5 (contract-policy adapter and middleware binding)

You are a **separate evaluator session**, opposite family to the author (Codex authored; you are
Claude). You certify or reject; you do not fix, do not commit, do not push, do not comment on GitHub,
and do not move any head.

| Field | Value |
| --- | --- |
| Repo | detached worktree, already checked out at the evidence head |
| **Content head** | `c2cbfbf0b3c355682732be5805f0f180498576db` |
| **Evidence head** | `00cfde5d7101a4b5424639530c09da875dbe726b` |
| Base | `de4089573` (the D-9 ceiling amendment) |
| PR | rickylabs/netscript **#1762**, draft, `Refs #1387 — partial` |
| Plan | `.llm/runs/feat-service-principal-procedure-policy--1387/plan.md` § Slice 5, and LD-6/LD-7/LD-8 with the LD-8 "binding time" clarification |
| Tier-A | `.llm/runs/feat-service-principal-procedure-policy--1387/tier-a-slice-5.md` |
| Receipts | `.llm/runs/feat-service-principal-procedure-policy--1387/receipts/` |

## SKILL

`netscript-harness`, `netscript-doctrine`, `netscript-tools`, `rtk`. Read the plan's Slice 5 section,
LD-6/LD-7/LD-8, and `drift.md` D-9 (the ceiling amendment that made this slice's export possible)
before judging.

## What to judge

1. **Ceiling.** Twelve files authorized (ten original plus `packages/service/src/auth/mod.ts` and
   `packages/service/mod.ts`, added by owner ruling D-9). `contract-policy.ts` was not touched —
   confirm that's correct for a behavior-only slice, not a missed requirement. `deno.lock` byte-
   identical to base.
2. **LD-8's exact timing.** Verify `createContractAuthorizer` throws during **construction**, not on
   first request — trace the call path from the exported function through to the throw. The negative
   test's name must be exactly `createContractAuthorizer rejects optional authentication during
   construction`; verify it actually is, and that removing the throw would make the test fail (not
   merely that the test currently passes).
3. **LD-6, as an ordering property.** Confirm the fallback is genuinely never *consulted* when
   contract metadata exists on a matched procedure, not merely that its answer gets overridden. The
   test suite counts `fallbackCalls`; verify that count claim yourself by tracing the code path, not
   by trusting the assertion's presence.
4. **LD-6's "deny regardless of fallback's `denyByDefault`."** Research requires: no metadata + no
   matched fallback rule → deny, even if the fallback's own standalone `denyByDefault` is `false`.
   Verify the implementation does not accidentally match this by coincidence in the test's specific
   configuration — check the logic path handles the general case.
5. **LD-7, one resolver, both stages.** Confirm `bindContractPolicy()` is called once per
   `installAuth()` and the *same* resolver object is passed to both `createAuthnMiddleware` and
   `createAuthzMiddleware`. Verify the middleware test's `resolverCalls === 2` /
   `authenticatorCalls === 0` / `authorizerCalls === 0` assertions actually prove what they claim —
   trace whether a bug that broke the sharing (e.g., two separate `.bind()` calls) would make this
   test fail.
6. **Rename continuity and actual-path binding together.** The dispatch test binds to non-default
   paths and resolves a renamed procedure through REST, canonical RPC, an alias, and a deprecated-
   route remap. Confirm this genuinely exercises the builder's *actual* bound paths rather than
   falling back to hardcoded defaults that happen to coincide.
7. **`createScopeAuthorizer`'s return-type change.** It now returns `MatchAwareAuthorizerPort`
   instead of `AuthorizerPort`. Confirm this is backward-compatible (a subtype assignable to its
   supertype), not a breaking signature change — Slice 4's own test already proved a plain
   `AuthorizerPort`-typed assignment from `createScopeAuthorizer(...)` compiles; confirm it still
   does at this head.
8. **Evidence integrity.** Seven receipts, each `gitHead == actualGitHead` at the content head.
   Verify by `argv` and `durationMs`, never by `exitCode` alone. Confirm Slices 1–4's archived receipt
   sets are intact and untouched, and the top level holds only Slice 5's set.
9. **Tier-A's F-1.** The resolver is consulted twice per authorized request path (once in middleware
   to decide short-circuit, once inside `authorize()` itself). Rule on whether this is genuinely
   harmless or worth a follow-up.

## Provenance

Slice 5 was dispatched twice. The first attempt stopped correctly on a genuine plan gap (**D-9**):
`createContractAuthorizer` had no ceiling-authorized export path. The owner approved a two-file
ceiling amendment; this content is from the second, successful dispatch on the amended ceiling.

## Verdict

Return exactly one of `PASS`, `ACCEPTED_WITH_FINDINGS`, `FAIL_FIX`, `FAIL_PLAN`, naming the exact head
you certify. Findings must be concrete: file, line, what breaks. State plainly anything you could not
verify.

**Do not run `e2e:cli`, Aspire, Docker, or any browser gate.** No runtime lease is held by this lane
and none may be acquired.
