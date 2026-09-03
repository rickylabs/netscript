# IMPL-EVAL — PR #1692 (#1350 `sdk-typed-error-channel`)

| Field          | Value                                                                                 |
| -------------- | ------------------------------------------------------------------------------------- |
| Head evaluated | `bcc9f393d993cd5468015c883c8b0dc6a5b6dc62`                                            |
| Base           | `main@61bfd858d20f3bf61e7ee45b5646537af567f247` (merge-base confirmed equal)          |
| Evaluator      | Claude Fable 5 · medium, fresh native session, worktree `netscript-007-eval-1692`     |
| Generator      | Codex `gpt-5.6-sol` (opposite family)                                                 |
| Base control   | detached worktree `/tmp/ns-eval-base` at the base SHA (read-only; removed afterwards) |
| Archetype      | Archetype 1 — small contract, `docs` overlay                                          |

## Verdict

**PASS-WITH-FINDINGS** (harness vocabulary: `PASS`; no `FAIL_*` condition is met).

Blocking for a later `status:ready-merge` flip, not for this draft head: **F1** (breaking-change
disclosure is absent from every consumer-visible record — PR body, commit messages, docs pages).
Everything else is non-blocking.

## Head identity

```
git rev-parse HEAD                                  → bcc9f393d993cd5468015c883c8b0dc6a5b6dc62
git ls-remote origin fix/sdk-typed-error-channel    → bcc9f393d993cd5468015c883c8b0dc6a5b6dc62
gh pr view 1692 --json headRefOid                   → bcc9f393d993cd5468015c883c8b0dc6a5b6dc62
git merge-base HEAD 61bfd858d                       → 61bfd858d20f3bf61e7ee45b5646537af567f247
```

Diff stat vs base: 15 paths — 8 run artifacts, 4 source/test, 1 generated corpus, 2 docs pages.
`packages/contracts/src/public/mod.ts` is **not** in the diff (claim 3 holds).

## Claims tested

### 1. Six-code union preserved; assertion non-vacuous — CONFIRMED

Codes re-derived from source (`awk` over the `commonErrorMap` literal in
`contract-primitives.ts`, not from the test's constant):
`NOT_FOUND|VALIDATION_ERROR|UNAUTHORIZED|FORBIDDEN|RATE_LIMITED|SERVICE_UNAVAILABLE`.

Independent probe (my own file, imports `@netscript/contracts` + `packages/sdk/mod.ts`, asserts
`Equal<keyof baseContract['~orpc']['errorMap'], Src>`, `IsAny=false`, `[never]=false`, and the same
union on `safe().error.code` and `isDefinedError()`-narrowed `error.code`):

| Run                                  | Result                                                   |
| ------------------------------------ | -------------------------------------------------------- |
| head, probe                          | `deno check` exit 0                                      |
| head, probe with one code removed    | `TS2344 Type 'false' does not satisfy 'true'`, exit 1    |
| base worktree, same probe            | `TS2344` + `TS2571 unknown` + `TS2339 'code' on never`, exit 1 |

The base failure texts are exactly the two RED texts PLAN-EVAL advisory A1 predicted.

### 2. Doc-lint at exact baseline parity — CONFIRMED

`deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-doc-lint.ts --root packages/<p>`:

| Package   | head `totalPrivateTypeRef` | base `totalPrivateTypeRef` |
| --------- | -------------------------- | -------------------------- |
| contracts | 9                          | 9                          |
| sdk       | 3                          | 3                          |

Raw `deno doc --lint packages/contracts/mod.ts` at head: the only `baseContract` diagnostic is
`references private type 'oc'` (`contract-primitives.ts:120:14`). sdk's 3 are `QueryClient` refs,
pre-existing.

### 3. No public-barrel growth — CONFIRMED

`git diff --stat 61bfd858d..HEAD` does not list `packages/contracts/src/public/mod.ts`.
`deno task docs:exports-drift` → `Exports & Symbols drift check: PASS`, exit 0.

### 4. Corpus delta leaf-owned only — CONFIRMED (decoded, not file-diffed)

Decoded both gzip/base64 corpora (7611 entries each) and compared on
`(packageName, subpath, symbol, kind)`:

```
ADDED []   REMOVED []   CHANGED 5
  @netscript/sdk . SafeFailure         typeAlias  signature
  @netscript/sdk . SafeResult          typeAlias  signature
  @netscript/sdk . ServiceClientMethod typeAlias  signature
  @netscript/sdk . isDefinedError      function   signature
  @netscript/sdk . safe                function   signature
surfaces equal: True   frameworkVersion 0.0.6 == 0.0.6
```

`deno task gen:mcp-export-corpus` re-run at head: decoded output identical to the committed
artifact (`regen decoded == committed decoded: True`); file restored afterwards.

### 5. Breaking-change disclosure at full strength — PARTIAL → **F1**

The `surface:diff` 532 → 531 signal **is** recorded as a tooling false negative, not banked:
`worklog.md:1366-1368` ("drops the instantiation argument, so the signal is a known tooling false
negative"). Independently confirmed: the decoded corpus renders `baseContract` as
`const baseContract: ReturnType<oc.errors>` at head — identical to the base rendering — so the tool
cannot see the change.

The strength problem is **location**. The breaking verdict exists only in harness artifacts
(`plan.md` §"Breaking-change verdict", `worklog.md` S4/S5 sections). Executed searches:

| Record                                                         | Grep for `break|undefined|null|migrat|major|semver` | Hit |
| -------------------------------------------------------------- | ---------------------------------------------------- | --- |
| PR #1692 body (`gh pr view 1692 --json body`)                  | none                                                 | 0   |
| 12 leaf commit messages + bodies (`git log 61bfd858d..HEAD`)   | none; no `!` or `BREAKING CHANGE` footer             | 0   |
| `docs/site/services-sdk/sdk.md`, `how-to/discover-services.md` | none                                                 | 0   |
| sole PR comment (2026-08-23T08:34:38Z)                         | only `"waiver": null` in JSON                        | 0   |

The PR carries `type:fix`, the commits are `fix(sdk)/fix(contracts)`, and the docs pages replace the
old `const [error, result] = await safe(...)` idiom with the new `result.isSuccess/isDefined` idiom
without saying the old shape (`data: null`, single `isDefined: boolean` arm, `TError = unknown`)
is gone. `plan.md:251` requires "Declare breaking change explicitly … document migration".

### 6. `ThrowableError → Error` — ACCEPTABLE, recorded

`grep -rn "declare module '@orpc/shared'|throwableError" packages plugins` → 0 hits; `Registry`
is un-augmented, so `ThrowableError` ≡ `Error` today. "Leaf-new" holds in the sense that matters:
at base the published default was `TError = unknown`; `ThrowableError` was only ever a plan-level
choice (PLAN-EVAL A3), never published, so no JSR consumer can depend on it. Moving `Error →
ThrowableError` later is additive for every consumer that has not augmented `Registry`. Recorded as
a declared design decision in `worklog.md:1166-1170`. No finding beyond **F3** (no follow-up pointer).

### 7. Bounded couplings (`__error?: { type: E }` inlined) — ACCEPTABLE

Inlined shape is `Promise<T> & { __error?: { type: E } }`, duplicated in `errors.ts` and
`service-client.ts`. Judgement: this is a two-property phantom marker, not a reconstructed class —
the asymmetry with rejecting a local `ContractBuilder` reconstruction (many generics + method
surface) is defensible and does not meet AP-1/AP-9. Drift behaviour if oRPC renames the marker:
`TError` inference silently degrades to the `Error` default — **but** the in-tree
`readme-doctest_test.ts` `Equal<typeof discriminated.error.code, ExpectedBaseErrorCode>` assertion
turns `TS2344`, and claim-1 probe above shows that assertion is live. The drift risk is therefore
detected by a gate, not only "named".

## Gates executed at head (structured wrappers; raw exit codes)

| Gate                                                             | Result                                     | Exit |
| ---------------------------------------------------------------- | ------------------------------------------ | ---- |
| `run-deno-check.ts --root packages/sdk --root packages/contracts` | 105 files, 0 findings                      | 0    |
| `run-deno-check.ts --root packages/fresh` (only out-of-leaf consumer of `isDefinedError`) | 197 files, 0 findings | 0 |
| `run-deno-test.ts -- --allow-all packages/sdk/tests packages/contracts` | 77 passed / 0 failed               | 0    |
| `run-deno-lint.ts` (sdk+contracts)                               | 0 findings                                 | 0    |
| `run-deno-fmt.ts --ext ts,tsx` (sdk+contracts)                   | 0 findings                                 | 0    |
| `deno publish --dry-run --allow-dirty` in `packages/contracts`   | Dry run complete                           | 0    |
| `deno publish --dry-run --allow-dirty` in `packages/sdk`         | Dry run complete                           | 0    |
| `deno task docs:exports-drift`                                   | PASS                                       | 0    |
| `run-deno-doc-lint.ts` contracts / sdk, head vs base             | 9/9, 3/3                                   | —    |
| `gen:mcp-export-corpus` regen vs committed (decoded)             | identical                                  | 0    |

Known pre-existing reds (`packages/mcp` fmt/lint batch, `surface:diff` ~531 majors, `F-DOCT-5`) were
not re-run and are not attributed to the leaf.

## Process checks

- PLAN-EVAL: `plan-eval.md` verdict **`PASS`** (commit `e78f87b12`) precedes the first
  implementation commit `5d348fbc8` in ancestry. OK.
- Design checkpoint: `worklog.md` §"Design" (public surface, vocabulary, ports, constants, slices,
  deferred scope, contributor path). Slices S1–S6 match plan "Commit slices". OK.
- Out-of-leaf consumers: only `packages/fresh/src/diagnostics/error/extract.ts` imports
  `isDefinedError`; type-checks clean. No repo source asserts `SafeFailure.data === null`.
- arch-debt delta: none (no doctrine violation introduced; see F5 for the A4 advisory).
- Close-gate: PR is draft; #1350 boxes not assessed for ticking (out of this pass's remit).
- `## SKILL` chapters: the run dir stores no agent briefs, so this cannot be verified from artifacts
  (`grep -c "## SKILL" .llm/runs/…/*.md` → 0 in every file). Recorded as unverifiable, not as a
  finding against the generator.

## Findings

| ID | Severity | Finding | Evidence |
| -- | -------- | ------- | -------- |
| F1 | **Medium** (blocks ready-merge, not this draft) | Breaking-change disclosure exists only in `plan.md`/`worklog.md`. PR body, all 12 commit messages, and both docs pages contain no breaking/migration statement; PR is labelled `type:fix`, commits are `fix(...)` with no `!`/`BREAKING CHANGE`. `plan.md:251` requires explicit declaration + migration notes. | greps in §5 above; `gh pr view 1692 --json body` |
| F2 | Low | `safe()` parameter narrowed from `PromiseLike<TOutput>` to `Promise<TOutput> & { __error?: … }`; non-`Promise` thenables are now rejected. Not enumerated anywhere as a consumer-visible break (only the base signature is quoted at `plan-eval.md:97`). | probe `declare const p: PromiseLike<number>; safe(p)` → `TS2345 … not assignable to 'Promise<number> & { __error?: …}'`, exit 1 |
| F3 | Low | `ThrowableError → Error` foreclosure is recorded in `worklog.md:1166-1170` but has no follow-up pointer (issue/debt) for the day `Registry.throwableError` augmentation becomes wanted. | `grep -rn throwableError packages plugins` → 0; worklog lines cited |
| F4 | Low | For an untyped `Promise<T>` (`TError` defaults to `Error`), the `isDefined: true` arm types `error` as `never` (`Extract<Error, DefinedErrorLike>`), while `createSafeFailure` can still return `isDefined: true` at runtime if an `ORPCError` with `defined: true` rejects that promise. Typed-unreachable, runtime-reachable branch. The leaf's own `_PlainErrorRejectedFromDefinedArm` asserts this typing deliberately and `sdk.md` documents the intent; noting it because it is a behavioural difference from the base's `isDefined: boolean` arm. | `errors.ts:141-148` (runtime); `readme-doctest_test.ts` `_PlainErrorRejectedFromDefinedArm` |
| F5 | Low | PLAN-EVAL advisory A4 asked for an `arch-debt.md`/issue entry so the bench-prose follow-up is literally "tracked". `drift.md:35-36` states "No new file or debt entry was created; the coordinator owns any later issue" while `drift.md:25` still says "remains tracked follow-up debt". Not a doctrine violation by this leaf, so not `FAIL_DEBT`; the word "tracked" is currently unbacked. | `drift.md:25,35-36`; `git diff --stat` shows no debt file change |
| F6 | Info | `surface:diff` 532→531 on `baseContract` is a `deno doc` rendering loss (`ReturnType<oc.errors>` at both base and head in the decoded corpus). Correctly recorded as a false negative in `worklog.md:1366-1368`; must not be cited as a clean surface result at cut time. | corpus decode above |

## What I did not do

No product, test, docs, or label mutation. No merge, readiness flip, checkbox, #1348/#1466 change,
or runtime lease. Scratch probes were created under `packages/sdk/tests/__eval1692/` and removed;
`git status` is clean apart from this artifact. `/tmp/ns-eval-base` worktree removed after use.
