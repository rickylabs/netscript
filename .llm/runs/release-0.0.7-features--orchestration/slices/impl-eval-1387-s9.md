use harness

# IMPL-EVAL — #1387 Slice 9 (adoption documentation, final implementation slice)

You are a **separate evaluator session**, opposite family to the author (Codex authored; you are
Claude). You certify or reject; you do not fix, do not commit, do not push, do not comment on GitHub,
and do not move any head.

| Field | Value |
| --- | --- |
| Repo | detached worktree, already checked out at the evidence head |
| **Content head** | `3cb08103ff9c25ff3ec580301b5936586b13d37e` |
| **Evidence head** | `c4bd642324079f41eebb079fb862ebc5abbdd8ae` |
| Base | `9ce84de2f` |
| PR | rickylabs/netscript **#1762**, draft, `Refs #1387 — partial` |
| Plan | `.llm/runs/feat-service-principal-procedure-policy--1387/plan.md` § Slice 9; the full Key Decisions (LD-1–LD-12) table; research finding 14 |
| Tier-A | `.llm/runs/feat-service-principal-procedure-policy--1387/tier-a-slice-9.md` |
| Receipts | `.llm/runs/feat-service-principal-procedure-policy--1387/receipts/` |

## SKILL

`netscript-harness`, `netscript-doctrine`, `netscript-tools`, `rtk`.

## What to judge

This is a **documentation** slice — judge accuracy against the actual shipped code across Slices
1–8, not merely internal consistency of the prose.

1. **Ceiling.** All eight authorized files: `packages/{contracts,service,plugin,mcp}/README.md`,
   `docs/site/reference/{contracts,service,mcp}/index.md`,
   `docs/site/tutorials/workspace/05-route-authz.md`. No product file outside these eight — confirm
   no plugin-core contract, CLI scaffold/template, `packages/ai`, auth provider, or lockfile edit.
   `deno.lock` byte-identical.
2. **The path-matcher defect is genuinely fixed (research finding 14).** Read the tutorial in full.
   Confirm `.meta({ access: {...} })` plus `createContractAuthorizer()` is now the primary teaching,
   and `createScopeAuthorizer` is retained (not removed, not marked deprecated) and correctly
   explained as the match-aware legacy fallback consulted only when a matched procedure has no
   metadata. Verify the code samples actually compile against the real `packages/contracts` and
   `packages/service` exports — check imports, not just prose.
3. **LD-8's error string, exact.** Compare the tutorial/README's quoted error text against
   `packages/service/src/auth/contract-authorizer.ts`'s actual `OPTIONAL_AUTHENTICATION_ERROR`
   constant and throw site. It must match character for character (the `<procedure>` placeholder
   aside), and the "at construction, before first request" framing must be correct.
4. **LD-6's precedence, both directions.** The docs claim a fallback can neither make a declared
   public procedure private nor weaken declared scopes/roles. Trace this against
   `contract-authorizer.ts`'s actual control flow (Slice 5) — confirm the fallback branch really is
   unreachable whenever metadata exists on a matched procedure, in both the "would allow" and "would
   deny" directions.
5. **LD-11's accepted substitution, not the issue's original wording.** Confirm the docs state rename
   continuity plus the stale-SDK-key compile failure — not a blanket "renames are always
   compile-time-safe" claim, which PLAN-EVAL explicitly rejected.
6. **The evidence-gap fix, verified not trusted.** Tier-A reports that `check`/`lint`/`fmt` were
   originally asserted by prose only, then re-cut as real receipts at the exact content head after
   the supervisor found the gap. Verify the three receipts genuinely satisfy
   `gitHead == actualGitHead == 3cb08103f` and that their `argv` actually scopes to
   `^packages/(contracts|service|plugin|mcp)/` rather than the bare unscoped task. Independently
   confirm the bare unscoped `deno task check` failure (`TS2551` on `health.ts:184`) is real,
   pre-existing, and unrelated to this slice — reproduce it yourself if you can, or at minimum verify
   `packages/service` alone checks clean.
7. **Evidence integrity, the rest.** All twelve receipts, each `gitHead == actualGitHead` at the
   content head. Verify by `argv` and `durationMs`, never `exitCode` alone. Confirm Slices 1–8's
   archived receipt sets are intact and untouched, and the pre-refresh diagnostic set
   (`pre-refresh-s9-582e82322/`) is preserved as history, not silently discarded.

## This is the final implementation slice

If this slice is accepted, #1387's implementation is complete; only the close-gate remains. State
plainly whether you consider the documentation adequate for that close, or whether you found a gap
that should block it.

## Verdict

Return exactly one of `PASS`, `ACCEPTED_WITH_FINDINGS`, `FAIL_FIX`, `FAIL_PLAN`, naming the exact head
you certify. Findings must be concrete: file, line, what breaks. State plainly anything you could not
verify.

**Do not run `e2e:cli`, Aspire, Docker, or any browser gate.** No runtime lease is held by this lane
and none may be acquired.
