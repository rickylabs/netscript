# Amendment review delta — PR #1692, A1–A4 prose repair (S8)

| Field         | Value                                                                                   |
| ------------- | --------------------------------------------------------------------------------------- |
| Head reviewed | `7a880c01804d566c28424f3b70254a296fdd3f15`                                              |
| Scope         | A1–A4 from `amendment-review.md` only. F1/F3/F4/F5 and the IMPL-EVAL verdict are not re-opened. |
| Reviewer      | Claude Fable 5 · medium, own detached worktree. Generator: Codex `gpt-5.6-sol` thread `01a006f3`. |

## Verdict

**PASS on A1, A2, A3, A4.** No over-claim or under-claim found in the corrected text. No new finding.

## Head and scope

```
git rev-parse HEAD / git ls-remote origin fix/sdk-typed-error-channel / PR headRefOid
                                                        → 7a880c018… (all three), draft=true
git diff --name-only 34eb1f524 HEAD -- packages/ plugins/ deno.lock | wc -l   → 0
git diff --quiet bcc9f393d HEAD -- packages/ plugins/ deno.lock                → exit 0
git diff --name-status 34eb1f524 HEAD → 3 run artifacts + sdk.md + discover-services.md
```

Receipts re-run at this head, all exit 0: `check:mcp-export-corpus` sha256
`a8f0779228987ed7e304dc032d45d1488b0cfb651b088d563c1e17fbafa2fb0b` (unchanged since S6);
`docs:exports-drift` PASS; `docs:links` broken-links=0 broken-anchors=0; `docs:accuracy` PASS;
`docs:snippets` exit 0. Markdown fmt of `docs/site` not gated, not claimed.

## A1 — `SafeFailure` arm change — PASS

Both tables (`sdk.md` "Migrating to 0.0.7", `discover-services.md` "Migrating typed-error handling
to 0.0.7") gained the row `SafeFailure arms`: before = "one failure arm with `isDefined: boolean`";
after = "two literal-discriminated arms, `isDefined: false` and `isDefined: true`", with the
consumer consequence "code that typed the property as a general `boolean` or treated failure as one
undifferentiated arm must branch on the literal". Base anchor checked:
`git show 61bfd858d:packages/sdk/src/client/errors.ts` line 39 — `[TError, null, boolean, false]`.
Accurate.

## A2 — `baseContract` key-space tightening — PASS

Both tables gained the row `baseContract error codes`. Six literals in the page match the
`commonErrorMap` keys derived from `contract-primitives.ts` by `awk`:
`NOT_FOUND,VALIDATION_ERROR,UNAUTHORIZED,FORBIDDEN,RATE_LIMITED,SERVICE_UNAVAILABLE` (identical
lists). Framed as both benefit ("intentional typo/undeclared-code protection") and break ("a
breaking tightening").

The "before" claim — "undeclared codes remained type-valid" — verified at base in a throwaway
worktree: `const k: keyof typeof baseContract['~orpc']['errorMap'] = 'NOT_DECLARED'` →
`deno check` exit 0 at `61bfd858d`. At head the same assignment is rejected (claim-1 probe in
`impl-eval.md`, `Extract<'NOT_DECLARED', …> = never`). Accurate.

## A3 — exported vocabulary only — PASS

`grep -c "DefinedErrorLike\|createSafeFailure\|readme-doctest\|_PlainErrorRejected\|NarrowDefined\|NonDefinedSafeFailure\|DefinedSafeFailure\|orpcIsDefinedError"` → 0 in both pages (the
last four are the remaining private names in `errors.ts`; none was swapped in). The rewritten
passage names only `SafeFailure`, `DefinedError`, `safe`, `isDefinedError` — all exported from
`packages/sdk/src/client/mod.ts:16-17`. Substance retained: `isDefined: true` arm of
`SafeFailure<Error>` types `error` as `never`; runtime-reachable when a `DefinedError` rejects a
bare promise; remedy = pass a promise carrying contract error typing. Matches `errors.ts:141-148`.

## A4 — historical signature precision — PASS

Both tables now read: "`SafeFailure` and `SafeResult` defaulted `TError` to `unknown`;
`safe<TOutput>` had no `TError` parameter and returned `SafeResult<TOutput>`, inheriting that
default." Base check: `errors.ts` at `61bfd858d` line 39 (`SafeFailure<TError = unknown>`), line 49
(`SafeResult<TOutput, TError = unknown>`), line 86 (`safe<TOutput>(…): Promise<SafeResult<TOutput>>`).
Accurate. Neither page repeats the `isDefinedError` "before" wording (`grep -c "error is DefinedError"`
→ 0 in both); that half remains in the PR body, which the supervisor owns — not flagged here.

## Preserved

`grep -n "has \*\*not\*\* been removed"` → `sdk.md:279`, `discover-services.md:193`. Present.

## Commit

`8e568e49f` — `docs(sdk)!:` subject; `BREAKING CHANGE:` footer names the literal-arm change and the
undeclared-code rejection; `Refs #1693`. Consistent with the page text.

## Not done

No product/test/docs edits; no merge, label, checkbox, readiness, #1348/#1466 mutation, or runtime
lease. Throwaway base worktree `/tmp/ns-base2` removed. This file is the only change.
