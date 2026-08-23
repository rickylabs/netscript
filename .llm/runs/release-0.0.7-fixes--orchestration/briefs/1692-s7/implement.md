use harness

# PR #1692 (#1350) — **slice S7**: consumer-visible breaking/migration disclosure (docs + run artifacts only)

Same lane, same worktree, same thread. You are the generator; you do not self-review or self-certify.
A separate opposite-family focused amendment review follows your push.

## Why this slice exists

The IMPL-EVAL returned **PASS-WITH-FINDINGS** at `bcc9f393d`. Finding **F1 (Medium)**: the
breaking-change verdict existed **only** in `plan.md`/`worklog.md`. The PR body, all twelve commit
messages, and both docs pages carried no breaking or migration statement, while `plan.md:251` requires
an explicit declaration plus migration notes.

The PR body half is already repaired by the topic supervisor. The coordinator has ruled that the
**twelve commits are not to be rewritten**, so this slice closes the remaining half: the two
consumer-visible docs pages, plus one behavioural note and one debt reference.

## Identity

- Worktree: `/home/codex/repos/netscript-007-leaf-typed-error`
- Branch: `fix/sdk-typed-error-channel`, no upstream. Push by explicit refspec only:
  `git push origin HEAD:refs/heads/fix/sdk-typed-error-channel`
- Expected HEAD before you start: `1772dfdf9f26a9c7ed76f196e93505732696fb30`
- PR **#1692** (draft). Issue #1350. Follow-up issue **#1693** (already filed).

## Frozen contract — docs and run artifacts only

Authorized paths, exactly:

1. `docs/site/services-sdk/sdk.md`
2. `docs/site/services-sdk/how-to/discover-services.md`
3. existing run artifacts under `.llm/runs/fix-sdk-typed-error-channel--0.0.7-wave1/`

**Explicitly forbidden this slice:** any `packages/` path — no product, no test, and **no
`export-surface-corpus.generated.ts`**. If your change would alter the export corpus, you have gone out
of scope: stop and report. Also forbidden: `packages/contracts/src/public/mod.ts`, any
`docs/site/reference/` page, `#1348`, `#1466`.

## Task 1 — breaking/migration disclosure on both docs pages

Add explicit **0.0.7** breaking-change and migration wording to both pages. It must be consumer-facing
prose, not a harness note. Cover all six items:

| Item | Before | After |
| --- | --- | --- |
| `SafeFailure` / `SafeResult` failure payload — both tuple slot and `data` property | `null` | `undefined` |
| Default `TError` on `SafeFailure` / `SafeResult` / `safe` | `unknown` | `Error` |
| `ServiceClientMethod` | `<TInput, TOutput>` | `<TInput, TOutput, TError = Error>`, returning a promise carrying the `__error` phantom marker used to recover `TError` |
| `safe(promise)` parameter | `PromiseLike<TOutput>` | `Promise<TOutput> & { __error?: { type: TError } }` — **non-`Promise` thenables are now rejected** (`TS2345`); wrap with `Promise.resolve(...)` |
| Result handling idiom | tuple destructuring `const [error, result] = await safe(...)` | discriminated form: `result.isSuccess`, then `result.isDefined` |
| Compatibility | — | **pre-1.0 intentional break; not patch-compatible** |

Say plainly that the tuple form still works (both arms remain tuple-and-object intersections) but that
the discriminated form is the documented path, and give a concrete `null` → `undefined` migration line.
Do **not** claim the tuple form is removed — it is not.

## Task 2 — document the F4 behaviour, pre-cut

On `sdk.md`, document this honestly:

For a promise with no error type — where `TError` falls back to `Error` — the `isDefined: true` arm
types `error` as `never`, because `Extract<Error, DefinedErrorLike>` is empty. That arm is therefore
**unreachable in the type system but still reachable at runtime**: if an `ORPCError` with
`defined: true` rejects such a promise, `createSafeFailure` returns `isDefined: true`.

State the consequence for a reader: to get the defined-error arm typed, the promise must carry contract
error typing (a service-client call), not a bare `Promise`. This is a deliberate design choice, asserted
in `readme-doctest_test.ts` by `_PlainErrorRejectedFromDefinedArm`. Write it as a documented
characteristic, not as a bug and not as a warning to be explained away.

## Task 3 — reference #1693 from the drift record

In `drift.md`, resolve the contradiction the evaluator found: `:25` says the deferred bench-prose
"remains tracked follow-up debt" while `:35-36` says no debt entry was created. Point both at
**#1693**, which now backs it, and note that the `ThrowableError → Error` decision (F3) is tracked
there too.

## Gates — run and record with structured output

| Gate | Required |
| --- | --- |
| `deno task docs:snippets` | PASS — your fenced examples must compile |
| `docs-source-format` / `docs-accuracy` | PASS |
| `deno task docs:exports-drift` | PASS exit 0 |
| `deno task check:mcp-export-corpus` | **PASS exit 0 and unchanged** — proof you touched no published signature |
| `git diff --name-only <base>..HEAD -- packages/` | **empty** |

If any fenced snippet you add fails to compile, fix the snippet — do not weaken the claim it
illustrates.

## Commit — breaking-change marker required

The coordinator forbids rewriting the twelve existing commits, so **this amendment commit carries the
marker**. Use a `!` in the type and a `BREAKING CHANGE:` footer, e.g.:

```text
docs(sdk)!: disclose 0.0.7 typed-error breaking changes and migration

<body>

BREAKING CHANGE: SafeFailure/SafeResult failure payload changes null -> undefined,
default TError changes unknown -> Error, and safe() no longer accepts non-Promise
thenables. Pre-1.0 intentional break; not patch-compatible. See PR #1692.

Refs #1693
```

## Finish

Commit, push by explicit refspec, post the S7 phase comment on **#1692** with structured receipts,
update `worklog.md` / `context-pack.md` / `drift.md`, and **stop**. Report your exact head sha.

Keep the PR **draft**. No label, checkbox, readiness, or merge action. No runtime lease. The amendment
review is someone else's.
