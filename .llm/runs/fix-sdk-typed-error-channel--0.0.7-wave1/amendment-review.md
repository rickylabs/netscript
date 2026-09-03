# Amendment review — PR #1692, F1/F3/F4/F5 closure

| Field            | Value                                                                          |
| ---------------- | ------------------------------------------------------------------------------ |
| Head reviewed    | `7b00249673bf1eaac5af14f000869e378b999c71`                                     |
| Prior verdict    | IMPL-EVAL **PASS-WITH-FINDINGS** at `bcc9f393d` (`impl-eval.md`, `1772dfdf9`) — unchanged |
| Scope            | Amendment commits `29c9e40aa`, `7b0024967` only. Not a second IMPL-EVAL.      |
| Reviewer         | Claude Fable 5 · medium, fresh native session, own detached worktree           |
| Generator        | Codex `gpt-5.6-sol`, thread `01a006f3`                                         |

## Verdict

**ACCEPT-WITH-FINDINGS.** F1 is closed to the standard `plan.md:251` set (consumer-visible
declaration + migration, in both pages, PR body, and a `!`/`BREAKING CHANGE` commit). F3/F5 are
closed by #1693. F4 is documented as a characteristic. Two under-claims remain in the docs tables
(A1, A2) and two precision defects (A3, A4); none re-opens F1, all are page-text fixes.

## Head and scope verification

```
git rev-parse HEAD                               → 7b00249673bf1eaac5af14f000869e378b999c71
git ls-remote origin fix/sdk-typed-error-channel → 7b00249673bf1eaac5af14f000869e378b999c71
gh pr view 1692 headRefOid / isDraft             → 7b0024967… / draft=true
git diff --name-only 1772dfdf9 HEAD -- packages/ plugins/ | wc -l   → 0
git diff --quiet bcc9f393d HEAD -- packages/ plugins/               → exit 0 (byte-identical)
git diff --name-status 1772dfdf9 HEAD → 3 run artifacts + sdk.md + discover-services.md
```

The product tree is byte-identical to the evaluated S6 head, so the original product gate results
(`impl-eval.md` gate table) describe this head exactly.

## Receipts re-run at this head

| Command                          | Result                                                                   | Exit |
| -------------------------------- | ------------------------------------------------------------------------ | ---- |
| `deno task check:mcp-export-corpus` | sha256 `a8f0779228987ed7e304dc032d45d1488b0cfb651b088d563c1e17fbafa2fb0b` (== S6) | 0 |
| `deno task docs:exports-drift`   | PASS                                                                     | 0    |
| `deno task docs:links`           | docs=103 broken-links=0 broken-anchors=0                                 | 0    |
| `deno task docs:accuracy`        | PASS                                                                     | 0    |
| `deno task docs:snippets`        | 0 failures (2 informational partial-snippet notes, unrelated pages)      | 0    |

Markdown fmt of `docs/site` — not gated; not claimed by the supervisor; not claimed here.

## Item-by-item

### 1. F1 closure — CLOSED, with two under-claims

Both pages carry a "Migrating … to 0.0.7" section (`sdk.md:265-282`, `discover-services.md:178-195`)
with identical five-row tables. Coverage of the six required points:

| Required point                                             | sdk.md | discover-services.md |
| ---------------------------------------------------------- | ------ | -------------------- |
| payload `null → undefined`, tuple slot **and** `data`      | row 1  | row 1                |
| default `TError` `unknown → Error`                         | row 2  | row 2                |
| `ServiceClientMethod` gains `TError` + `__error` marker    | row 3  | row 3                |
| `safe()` `PromiseLike → Promise`, `TS2345`, `Promise.resolve` remedy | row 4 | row 4          |
| tuple → discriminated migration                            | row 5  | row 5 (→ Step 4, heading exists at line 137) |
| pre-1.0 intentional break / not patch-compatible           | lead sentence | lead sentence  |

Over-claim check: both pages state "The tuple form has **not** been removed … destructuring still
works." Correct — every arm in `errors.ts` is `[…] & {…}`. No over-claim.

PR body: "⚠️ Breaking change — not patch-level" section with a six-row table, migration paragraph,
and the `surface:diff` false-negative caveat. Present.

A consumer reading only these pages is warned about the five listed surfaces. They are **not** warned
about two changes that `plan.md` §"Breaking-change verdict" and the PR body itself enumerate — see
A1 and A2.

### 2. F4 closure — CLOSED, one precision defect

`sdk.md:251-262` "Bare promises and the defined-error arm": states `TError` falls back to `Error`,
the `isDefined: true` arm types `error` as `never`, the arm is runtime-reachable when a
`defined: true` `ORPCError` rejects a bare promise, calls it "a deliberate characteristic", and gives
the practical remedy (pass a promise carrying contract error typing). Matches `errors.ts:141-148`
and `_PlainErrorRejectedFromDefinedArm`. Not framed as a bug. See A3 on naming.

### 3. F3 + F5 closure — CLOSED

`gh issue view 1693` → OPEN, "sdk/contracts: record the ThrowableError substitution decision and
back the deferred bench-prose debt", `type:chore, status:triage, priority:p3, area:sdk`, milestone
`Backlog / Triage`. `drift.md` now points at #1693 in both the "tracked" sentence and the
former "no debt entry was created" sentence; the :25 vs :35-36 contradiction is resolved (the
"tracked" claim is now backed by an issue). Commit `29c9e40aa` carries `Refs #1693`.

### 4. Commit hygiene — SUFFICIENT

`git log -1 --format=%B 29c9e40aa`: subject `docs(sdk)!: …`, body contains a
`BREAKING CHANGE:` footer naming payload `null → undefined`, default `unknown → Error`, and the
thenable rejection, plus "Pre-1.0 intentional break; not patch-compatible." With the PR body table,
a squash or a changelog generator keyed on `!`/`BREAKING CHANGE` will surface the break. Leaving the
twelve earlier `fix(...)` commits unrewritten is acceptable under that ruling; the branch-level
signal exists once, which is what conventional-commit tooling needs.

## Findings (amendment text only)

| ID | Severity | Finding | Evidence |
| -- | -------- | ------- | -------- |
| A1 | Low (under-claim) | Neither docs table lists the `SafeFailure` arm change (single arm with `isDefined: boolean` → two literal-discriminated arms). The PR body has this row; the pages do not. A consumer who typed `failure.isDefined` as `boolean` or narrowed on a single arm gets no page-level warning. | `git diff 1772dfdf9 HEAD -- docs/site` — no row mentions `isDefined: boolean`; PR body row 3 does |
| A2 | Low (under-claim) | Neither page nor the PR body lists the `baseContract` key-space tightening — `plan.md:110-112`: "intentionally rejects consumers that treated undeclared codes as valid." Consumers comparing `error.code` against an undeclared string now get a TS error; this is a deliberate break the plan named and the disclosure omits. | `plan.md:105-114`; `grep -n "undeclared" docs/site/services-sdk/*.md docs/site/services-sdk/how-to/*.md` → 0 |
| A3 | Low (precision) | `sdk.md:254-257` names `DefinedErrorLike` and `createSafeFailure`, neither of which is exported (`grep DefinedErrorLike\|createSafeFailure packages/sdk/mod.ts packages/sdk/src/client/mod.ts` → 0), and cites a test file path. A consumer cannot resolve these names; the explanation should be in terms of the published `SafeFailure` arms. | grep above |
| A4 | Info (precision) | Docs row 2 says `safe` "defaulted `TError` to `unknown`" — at base `safe<TOutput>` had no `TError` parameter at all (`git show 61bfd858d:packages/sdk/src/client/errors.ts`); the `unknown` came from `SafeResult`'s default. PR body row 6 says the old `isDefinedError` return was `error is DefinedError`; it was `error is Extract<T, DefinedError>` (same file, line 75). Both are "before" descriptions that are slightly wrong in the direction of overstating the change. | `git show 61bfd858d:packages/sdk/src/client/errors.ts` lines 75, 86 |

## Not done

No product, test, or docs edits; no merge, label, checkbox, readiness, #1348/#1466 mutation, or
runtime lease. This file is the only change in my worktree.
