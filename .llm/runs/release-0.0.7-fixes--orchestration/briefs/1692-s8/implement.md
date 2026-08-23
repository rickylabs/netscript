use harness

# PR #1692 (#1350) — **slice S8**: amendment-review prose corrections A1–A4 (docs + run artifacts only)

Same lane, same worktree, same thread. You are the generator; you do not self-review or self-certify.
A focused opposite-family delta re-review of A1–A4 follows your push.

## Why this slice exists

The focused amendment review returned **ACCEPT-WITH-FINDINGS** at `7b0024967` with four prose findings.
Three are **under-claims** — the disclosure is missing real breaks — and one is a **precision** error in
the "before" column. None touch product. This is the final bounded prose repair.

## Identity

- Worktree: `/home/codex/repos/netscript-007-leaf-typed-error`
- Branch: `fix/sdk-typed-error-channel`, no upstream. Push by explicit refspec only:
  `git push origin HEAD:refs/heads/fix/sdk-typed-error-channel`
- Expected HEAD before you start: `34eb1f5245d578dce01c88046aa22f8f6deabf02`
- PR **#1692** (draft). Issue #1350. Follow-up #1693.

## Frozen contract

Authorized: `docs/site/services-sdk/sdk.md`, `docs/site/services-sdk/how-to/discover-services.md`, and
existing run artifacts under `.llm/runs/fix-sdk-typed-error-channel--0.0.7-wave1/`.

**Forbidden, absolutely:** any `packages/` or `plugins/` path, the generated export corpus, `deno.lock`,
any test, metadata vocabulary, `#1348`, `#1466`. The PR body and the #1671 comment are **the
supervisor's** to rewrite — do not touch them. If a change would move the export corpus you are out of
scope: stop and report.

## A1 — the `SafeFailure` arm change is missing from both pages

The PR body has this row; neither docs page does. Add it to **both** migration tables.

Verified at base `61bfd858d`, `packages/sdk/src/client/errors.ts:39`:
`SafeFailure<TError = unknown> = [TError, null, boolean, false] & { error, data: null, … }` — **one**
arm whose `isDefined` slot is `boolean`. At head it is two literal-discriminated arms,
`isDefined: false` and `isDefined: true`.

Consumer consequence to state: code that typed `failure.isDefined` as `boolean`, or that narrowed on a
single undifferentiated failure arm, must now branch on the literal.

## A2 — the `baseContract` key-space tightening is missing everywhere

Add to **both pages**. `plan.md:108-111` names it as a deliberate break: tightening `baseContract` from
an open error-map key space to the six declared literals "also intentionally rejects consumers that
treated undeclared codes as valid".

Consumer consequence to state: comparing `error.code` against a code outside the six
(`NOT_FOUND`, `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `RATE_LIMITED`, `SERVICE_UNAVAILABLE`)
is now a **type error** rather than a silently-false comparison. Frame it as the intended benefit *and*
a break, because it is both.

## A3 — rewrite the F4 explanation in exported vocabulary only

`sdk.md:254-257` currently names `DefinedErrorLike` and `createSafeFailure` — **neither is exported**
— and cites a test-file path. A consumer cannot resolve any of those.

Rewrite that passage using only published vocabulary: `SafeFailure`, its two arms, `safe`,
`isDefinedError`, `DefinedError`. Keep the substance exactly: for a promise carrying no contract error
type the defined arm is unreachable to the type checker but still reachable at runtime, and the remedy
is to pass a promise that carries contract error typing. Drop the internal names and the test path —
do **not** replace them with different internal names.

## A4 — correct two "before" descriptions that overstate the change

Both are wrong in the direction of making the break look larger. Verified at base `61bfd858d`:

- `errors.ts:86` — `export async function safe<TOutput>(promise: PromiseLike<TOutput>): Promise<SafeResult<TOutput>>`.
  `safe` had **no `TError` parameter at all**. The `unknown` came from `SafeResult<TOutput, TError = unknown>`
  (`:49`). Fix the docs row that says `safe` "defaulted `TError` to `unknown`".
- `errors.ts:75` — `export function isDefinedError<T>(error: T): error is Extract<T, DefinedError>`,
  **not** `error is DefinedError`. That row is in the PR body, which is the supervisor's to fix; if the
  same wording appears on a page, fix it there.

## Preserve

Keep the "tuple form has **not** been removed" wording exactly — it is correct and it is the guard
against the opposite over-claim. Keep everything else already verified: `null → undefined` on both the
tuple slot and `data`, `unknown → Error` defaults, `ServiceClientMethod` with the `__error` marker,
`PromiseLike → Promise` with `TS2345` and `Promise.resolve`, tuple → discriminated migration, and
"intentional pre-1.0 breaking change … not patch-compatible".

## Gates

| Gate | Required |
| --- | --- |
| `deno task check:mcp-export-corpus` | **PASS exit 0**, sha256 unchanged at `a8f0779228987ed7…` |
| `git diff --name-only 34eb1f524..HEAD -- packages/ plugins/` | **empty** |
| `deno task docs:snippets` | exit 0 |
| `deno task docs:accuracy` | PASS |
| `deno task docs:links` | 0 broken links / anchors |
| `deno task docs:exports-drift` | PASS exit 0 |

## Commit

`docs(sdk)!:` with a `BREAKING CHANGE:` footer as before — the earlier commits stay unrewritten.
Include `Refs #1693`. Update `worklog.md` / `context-pack.md` / `drift.md` with the S8 receipts.

## Finish

Commit, push by explicit refspec, post the S8 phase comment on **#1692**, and **stop**. Report your
exact head sha. Keep the PR draft. No label, checkbox, readiness, or merge action. No runtime lease.
