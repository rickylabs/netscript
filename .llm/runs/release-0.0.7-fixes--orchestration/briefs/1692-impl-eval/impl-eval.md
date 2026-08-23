use harness

# IMPL-EVAL — PR #1692 (#1350 `sdk-typed-error-channel`) at `bcc9f393d993cd5468015c883c8b0dc6a5b6dc62`

You are a **formal IMPL-EVAL evaluator**. You did not write this work and you must not repair it.
Produce a verdict, not a fix. You are a fresh opposite-family session: the generator is Codex
`gpt-5.6-sol` (thread `01a006f3-…`); you are native Claude Fable 5 · medium.

## SKILL

`netscript-harness` (evaluator protocol), `netscript-doctrine` (**Archetype 1 — small contract**,
`docs` overlay), `netscript-tools` (structured wrappers are the ONLY verdict source), `jsr-audit`,
`netscript-deno-toolchain`, `rtk`.

## Identity

- Worktree: `/home/codex/repos/netscript-007-eval-1692` — **detached, yours alone**, already at the
  exact head. Do not enter the author's worktree `/home/codex/repos/netscript-007-leaf-typed-error`.
- Immutable head under evaluation: `bcc9f393d993cd5468015c883c8b0dc6a5b6dc62`
- Base: `main@61bfd858d20f3bf61e7ee45b5646537af567f247`
- PR **#1692** (draft, sole `status:impl`), `Closes #1350`. #1671 is its closed predecessor.

**Verify the head yourself** before evaluating: local `HEAD` == `git ls-remote origin
fix/sdk-typed-error-channel` == PR `headRefOid`. If they differ, stop and report — do not evaluate a
moving head.

## What the change claims to do

Preserve NetScript's exact six-code contract error union through `safe()` and `isDefinedError()`, and
remove the leaf's own `private-type-ref` regressions from the published surface.

Seven paths: four source/test (`packages/contracts/src/application/contract-primitives.ts`,
`packages/sdk/src/client/errors.ts`, `packages/sdk/src/ports/service-client.ts`,
`packages/sdk/tests/readme-doctest_test.ts`), one derived artifact
(`packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts`), and two
`docs/site/services-sdk/` pages.

The `baseContract` annotation uses a TypeScript **instantiation expression**,
`ReturnType<typeof oc.errors<{…exact map…}>>`. The pre-existing `ReturnType<typeof oc.errors>` collapses
the type parameter to its `ErrorMap` upper bound and erases the six literal codes.

## Claims to test — do not accept any of these on the record's word

1. **The six-code union is preserved and the assertion is not vacuous.** Test it. The claimed proof is a
   type-level assertion through the package entrypoint with `IsAny` and `[never]` guards, plus a control
   that fails `TS2344` against the base annotation. Re-derive the six codes **from source**, not from the
   test's own expectation constant.
2. **Doc-lint is at exact baseline parity.** Claimed: `contracts` 9 = base 9, `sdk` 3 = base 3, and
   `baseContract`'s only private reference is the pre-existing pinned `oc`. Measure both at this head and
   at the base yourself.
3. **No public-barrel growth.** `packages/contracts/src/public/mod.ts` must be untouched. An earlier
   attempt to expose `ContractBuilder`/`Schema`/`BaseContractErrors` there was measured at 10 → 21
   `private-type-ref` and a red `docs:exports-drift`, and was withdrawn.
4. **The derived corpus delta is leaf-owned only.** Claimed: 0 added exports, 0 removed, exactly 5
   changed signatures, all `@netscript/sdk` (`SafeFailure`, `SafeResult`, `ServiceClientMethod`,
   `isDefinedError`, `safe`). The corpus is gzip/base64 — a file diff proves nothing; decode and compare
   on symbol identity if you test this.
5. **Breaking-change disclosure is at full strength.** The failure payload changes `null` → `undefined`
   and the default `TError` changes. This is **breaking, not patch-level**. Check the disclosure has not
   been softened. Note specifically: `surface:diff` **stopped** reporting `baseContract`'s signature
   change (undeclared majors 532 → 531) because `deno doc` drops the instantiation argument. That is a
   **tooling false negative**, not reduced breakingness — verify it is recorded as such and not banked as
   a clean result.
6. **`ThrowableError → Error`.** Factually equivalent today (`Registry` un-augmented repo-wide) but it
   forecloses a consumer extension point. Judge whether "acceptable because these signatures are
   leaf-new" holds.
7. **Bounded couplings.** `ClientPromiseResult` and `ProcedureErrorFromNode` were inlined, duplicating
   oRPC's internal shapes (`__error?: { type: E }`). Judge whether the named drift risk is adequate or
   whether this is structural duplication that doctrine AP-1/AP-9 should reject — note the same reasoning
   was used to *reject* reconstructing `ContractBuilder`.

## Known pre-existing reds — do not attribute these to the leaf

- `packages/mcp` fmt/lint batch exits 1 with **0 findings**, on the pristine tree as well. Tooling
  failure over a ~300 KB single-line generated file.
- `surface:diff` carries ~531 undeclared majors repo-wide, a pinned baseline.
- `F-DOCT-5`.

If you find a red, establish whether it exists at the **base** before calling it leaf-owned.

## Verdict

Write `impl-eval.md` into `.llm/runs/fix-sdk-typed-error-channel--0.0.7-wave1/` in your own worktree,
with a clear **PASS** / **FAIL** / **PASS-WITH-FINDINGS**, each finding tied to executed evidence
(command + result), and severity. Then post it as a PR comment on **#1692** bound to
`bcc9f393d993cd5468015c883c8b0dc6a5b6dc62`, and commit your artifact **without** touching any product,
test, or docs path.

Findings must be checkable. **No praise adjectives, no "excellent"/"comprehensive"/"robust"** — a
verdict is a list of things that are or are not true, with the command that shows it.

Do not merge, flip readiness, change labels, tick checkboxes, mutate `#1348`/`#1466`, take a runtime
lease, or repair anything. Report your exact head and verdict, then stop.
