# fix(sdk): safe() drops the contract error type — isDefinedError narrows to never and the published docs example does not compile — DRAFT (no GitHub mutation; owner ratification pending)

**Draft-ID:** T1-03 · **Proposed milestone:** `0.0.7` (post-rename-shift "Typed seams +
generation", SYNTHESIS §5.3) · **Labels:** `type:fix` `area:sdk` `area:contracts` `area:docs`
`priority:p1` `status:triage` · **Depends on:** T1-01 (RFC-A ratification, §3.7); independent of
T1-02 and can land first

## Summary

NetScript re-implements oRPC's `safe()` and `isDefinedError()` without the `TError` generic, so the
error channel is `unknown`, `Extract<unknown, DefinedError>` evaluates to `never`, and reading
`error.code` after a successful `isDefinedError` narrow is a type error. This is proven by an
executed `deno check`, and it is the exact snippet the published docs tell users to write
(`docs/site/services-sdk/sdk.md:199`). A contributing cause sits one layer down: `baseContract` is
annotated `ReturnType<typeof oc.errors>`, which instantiates the generic at its constraint and erases
the six declared error codes to the open `ErrorMap` index signature — so even a correct `safe()`
could not narrow to NetScript's error vocabulary today. oRPC's headline typed-error DX is fully lost
while three published documents assert it works.

## Evidence

- Corpus: `research/repo-audit/services-sdk.md` §3.4, §3.5, gap register S1/S2/S3;
  `research/external/orpc.md` §4 (G4) with the executed probe transcript.
- Source at baseline `fac9e339042c` (re-verified for this draft):
  - `packages/sdk/src/client/errors.ts:75-77` —
    `export function isDefinedError<T>(error: T): error is Extract<T, DefinedError>`.
  - `packages/sdk/src/client/errors.ts:86-92` —
    `export async function safe<TOutput>(promise: PromiseLike<TOutput>): Promise<SafeResult<TOutput>>`.
  - `packages/sdk/src/client/errors.ts:49` — `SafeResult<TOutput, TError = unknown>`, so `TError`
    defaults to `unknown` at every call site.
  - `packages/sdk/src/ports/service-client.ts:160-171` — `ServiceClientMethod` returns
    `Promise<TOutput>`, discarding upstream's `ClientPromiseResult<TOutput, ErrorFromErrorMap<…>>`.
  - `packages/contracts/src/application/contract-primitives.ts:81` —
    `export const baseContract: ReturnType<typeof oc.errors> = oc.errors(commonErrorMap);` (the six
    codes are declared at `:21-52`); the doc comment at `:54-69` claims the contract is "genuinely
    typed rather than erased to `any`" — true for input/output, false for the error map.
  - `docs/site/services-sdk/sdk.md:199` — tab "Safe error narrowing" ships
    `if (isDefinedError(error)) return { code: error.code, status: error.status };`.
  - `docs/site/services-sdk/how-to/discover-services.md:138-147` and `:212-224` — the same pattern,
    with the comment "`error.code` and `error.data` are typed from the contract".
  - `packages/sdk/tests/readme-doctest_test.ts:36-37` — the guard that should have caught this
    **re-declares** `safe` and `isDefinedError` with different signatures instead of importing them,
    so the doctest passes against a fiction.
- Executed probe (reproduced from `research/repo-audit/services-sdk.md` §8; re-run before filing):

  ```ts
  import { isDefinedError, safe } from 'packages/sdk/src/client/mod.ts';
  declare const p: Promise<{ ok: boolean }>;
  const [error] = await safe(p);
  if (error && isDefinedError(error)) { const c: string = error.code; }
  ```

  `deno check --unstable-kv --config deno.json <probe>.ts` →
  `TS2339 [ERROR]: Property 'code' does not exist on type 'never'.`

- Upstream signature (pinned 1.14.6): `safe<TOutput, TError = ThrowableError>(promise:
  ClientPromiseResult<TOutput, TError>): Promise<SafeResult<TOutput, TError>>`.

## Current surface

Three published documents and one README export table advertise contract-typed error narrowing;
the shipped helpers cannot provide it, and the only test that touches them tests re-declared
fictions. Consumers who follow the docs get a compile error, and the workaround the compiler pushes
them toward is `error as { code: string }` — an unsound cast the type-soundness epic (#1278) then
counts as debt.

## Target contract

Per RFC-A §3.7:

1. `safe<TOutput, TError = ThrowableError>` and `isDefinedError<T>` regain the upstream shape, with
   `SafeResult<TOutput, TError>`'s failure arms discriminating on `isDefined` exactly as upstream
   does.
2. `ServiceClientMethod` carries the error channel so `TError` reaches `safe()` from the contract —
   either by aliasing to oRPC's derived client type or by threading
   `ErrorFromErrorMap<TErrorMap>` through the existing structural derivation.
3. `baseContract`'s annotation preserves the six literal error-map keys. `ReturnType<typeof
   oc.errors>` is replaced with a spelling that is both literal-preserving and
   `--isolatedDeclarations`-safe, following the precedent already set by `BaseContractRoute` /
   `BaseContractOutputRoute` (`packages/contracts/src/application/contract-primitives.ts:125-159`).
4. `packages/sdk/tests/readme-doctest_test.ts` imports the real helpers; the local `declare
   function` shims are deleted.

## Acceptance

- [ ] `safe` and `isDefinedError` carry the upstream error generic and `SafeResult` discriminates on
      `isDefined`.
- [ ] A type fixture proves `error.code` narrows to the contract's declared code union after
      `isDefinedError`.
- [ ] `baseContract`'s type preserves the six literal error-map keys.
- [ ] NEGATIVE: a type fixture asserts a code that is not in the contract's error map is rejected
      (today `'TOTALLY_MADE_UP_CODE'` is assignable to `keyof` the error map).
- [ ] NEGATIVE: a type fixture asserts `isDefinedError` does not narrow a non-oRPC thrown value to a
      defined error.
- [ ] The docs snippet at `docs/site/services-sdk/sdk.md:199` compiles as written, proven by an
      executed check rather than by inspection.
- [ ] The equivalent snippets in `docs/site/services-sdk/how-to/discover-services.md` compile as
      written.
- [ ] `packages/sdk/tests/readme-doctest_test.ts` imports `safe` and `isDefinedError` from the
      package instead of re-declaring them.
- [ ] `gate:` `deno task publish:dry-run` passes for `@netscript/sdk` and `@netscript/contracts`
      with `--isolatedDeclarations` intact.
- [ ] `gate:` `deno task check` and `deno task test` pass at the repo root.

## Boundaries

- Do **not** open the client construction seam here — that is T1-02.
- Do **not** duplicate **#1263** (`service: generated by-id handler returns 500 {defined:false} for a
  missing row instead of a defined 404`, `0.0.6`). #1263 is the **server** raising the wrong error;
  this issue is the **client** being unable to narrow a correctly-raised one. Both should be true
  before the docs example is honest end to end — cross-reference, do not merge.
- Do **not** duplicate **#1278** (type soundness ratification, `0.0.6`). #1278's inventory is
  prose-only; **read its body before filing**. If it already lists `safe`/`isDefinedError` or the
  `baseContract` widening, file this as a child with `Part of #1278` instead of standalone. Either
  way, do not turn this issue into a soundness sweep — it fixes two symbols and one annotation.
- Do **not** duplicate **#1296** (`contracts/ai` source-side rows) or **#1108** (generated package
  references vs live export maps).
- Do **not** rewrite the SDK docs page wholesale — the Tier-1 docs rewrite is the T5 pack. This issue
  changes only what is needed to make the existing snippets true.
- Do **not** extend the error map with new codes.

## Docs/consumer proof

The proof is executable: the two published snippets compile unmodified, and the README doctest
exercises the real exports. Consumer-side, a scaffolded service-to-service call can branch on a
contract error without a cast — demonstrate it in the fixture so the pattern is greppable, and state
in the SDK reference that `error.data` is typed from the contract's Zod schema.

## Provenance

Seed run `plan-fable5-remediation-roadmap--seed`, PR #1347, 2026-08-08. Sourced from
`research/repo-audit/services-sdk.md` (S1, S2, S3) and `research/external/orpc.md` (G4), both of
which carry executed `deno check` transcripts; all cited lines re-verified against worktree baseline
`fac9e339042c`. No GitHub mutation was performed.
