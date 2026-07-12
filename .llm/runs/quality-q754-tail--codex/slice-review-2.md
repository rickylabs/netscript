# Slice Review 2 (Correction Pass) — quality-q754-tail--codex

- Reviewer: Claude Opus 4.8 (`claude-opus-4-8`), independent opposite-family Tier-A slice review (A1 gate)
- Generator: Codex
- Date: 2026-07-12 (correction pass — re-reviews the working-tree diff after the prior `FAIL_FIX`)
- Baseline (HEAD): `779171bd20b94027964b0b5b5b9dd2b705bca93f`
- Scope: **Slice 2** — SDK oRPC contract-router narrowing + Fresh UI VNode / style / summary / event typing (`packages/sdk`, `packages/fresh-ui`).
- Files in diff (9):
  - `packages/sdk/src/client/http-client-link.ts`
  - `packages/sdk/tests/integration/service-client-runtime_test.ts` *(new guard test)*
  - `packages/fresh-ui/deno.json`
  - `packages/fresh-ui/src/presentation/primitives.tsx`
  - `packages/fresh-ui/src/runtime/_internal/platform-popover.ts`
  - `packages/fresh-ui/src/runtime/accordion/{Accordion.tsx,accordion.types.ts,use-accordion.ts}`
  - `packages/fresh-ui/tests/runtime/accordion/accordion-render.test.tsx` *(new render test)*
  - plus run artifact `drift.md`

## Verdict

`PASS`

Both `FAIL_FIX` findings from the prior pass are resolved, and the fix that closed Finding 2
additionally surfaced and repaired a real soundness bug in the SDK guard (empty-branch / reserved
`~orpc` impostor acceptance). Every acceptance claim in the correction brief reproduced green in this
independent session. No unresolved correctness or acceptance defect remains. Cleared for the
supervisor sign-off commit.

## Resolution of prior findings

### Finding 1 (doc:lint `private-type-ref` regression) — RESOLVED

`primitives.tsx` no longer aliases a Preact dependency type. `PrimitiveNode` is now a **self-contained
public interface**:

```ts
export interface PrimitiveNode {
  readonly type: unknown;
  readonly props: unknown;
  readonly key: unknown;
}
```

`props` was widened from `Record<string, unknown>` to `unknown` precisely so a Preact `VNode` (whose
`props` is not a string-record) is structurally assignable to it — which is why `Icon` can now return
`h(...)` **without any cast** and still satisfy the return type. Verified:

| Entrypoint | HEAD | Prior pass | This pass |
| --- | --- | --- | --- |
| `deno doc --lint packages/fresh-ui/mod.ts` | 0 | **1** | **0** (`Checked 1 file`) ✓ |
| `deno doc --lint packages/fresh-ui/primitives.tsx` | 0 | 1 | **0** (`Checked 1 file`) ✓ |

The change is public-surface sound: `PrimitiveNode` is a *return* type (produced by `Icon`/
`VisuallyHidden`/`SrOnly`, consumed as JSX), not a type consumers construct or index, so widening
`props` to `unknown` and adding `readonly` is non-breaking in practice and more truthful. Publish
dry-run confirms **no slow types**.

### Finding 2 (plan-committed regression tests absent) — RESOLVED, and it caught a real bug

Both tests the plan committed to now exist and pass:

- **SDK guard test** (`service-client-runtime_test.ts`): `createHttpClientLink accepts real oRPC
  routers and rejects structural impostors` — asserts a real router builds a link, and that
  `{ '~orpc': {} }` throws `TypeError` with the exact message. This test **exposed** that the earlier
  recursive guard accepted a reserved-`~orpc` empty object as an empty router (the empty-`{}`
  branch returned `true` vacuously). See guard analysis below.
- **Accordion render test** (`accordion-render.test.tsx`, `preact-render-to-string`): asserts the
  rendered element is `<summary`, that an item-level `disabled` yields `aria-disabled="true"` (the
  supported disable path), `role="button"`, and that SSR registers but does not invoke the click
  handler (`clickCount === 0`). This pins both the corrected element contract and the sanctioned
  `aria-disabled` behavior.

## Corrected SDK guard — independently verified against upstream

```ts
function isOrpcContractRouter(value: unknown): value is ORPCAnyContractRouter {
  if (isContractProcedure(value)) return true;
  if (!isRecord(value) || Array.isArray(value) || '~orpc' in value) return false;
  const children = Object.values(value);
  return children.length > 0 && children.every(isOrpcContractRouter);
}
```

Verified against the cached `@orpc/contract@1.14.6` runtime (not just declarations):

- **Leaf predicate is oRPC's own.** `isContractProcedure` (`contract.D_dZrO__.mjs:46`) returns true
  for a `ContractProcedure` instance *or* a duck-typed object whose `~orpc` has `errorMap` + `route`
  + `meta`. `inferRPCMethodFromContractRouter` (`index.mjs:327`) walks the router with `get(contract,
  path)` and throws unless `isContractProcedure(procedure)`. The guard's leaf check is therefore
  **exactly** the predicate the consumer applies — the acceptance set matches what
  `inferRPCMethodFromContractRouter` can actually resolve.
- **Impostor rejection is correct.** `{ '~orpc': {} }` fails `isContractProcedure` (its `~orpc` lacks
  `errorMap`/`route`/`meta`), and the new `'~orpc' in value` clause then rejects it instead of
  recursing into its children. This can never reject a *valid* node: a real procedure is caught by the
  first `if` before the `~orpc` clause, and a real router namespace object never carries a `~orpc`
  key. Array rejection and the `children.length > 0` empty-branch rejection remove the two remaining
  ways a non-router structurally slipped through.
- **Behavior preservation for real contracts.** For any real contract router (records of procedures)
  the guard returns true and the runtime path is identical to before; the cast
  (`contract as unknown as ORPCAnyContractRouter`) is gone and `inferRPCMethodFromContractRouter(contract)`
  is called on the narrowed type.
- **Non-blocking note:** the guard is now marginally *stricter* than upstream for the degenerate
  empty-router case — an empty `{}` (or a router with an all-empty sub-branch) throws eagerly at link
  creation, whereas oRPC's lazy `inferRPCMethod` would only error when such a path were invoked. An
  empty contract yields no usable client, so eager rejection is a defensible fail-fast improvement,
  not a regression. No action required.

## Evidence (independently reproduced this session, read-only)

| Check | Command | Result |
| --- | --- | --- |
| Scanner (slice-2 roots) | `scan-code-quality.ts --root packages/sdk --root packages/fresh-ui --max-allow 4` | `{"ok":true,"findings":[],"allowCount":0}` ✓ |
| Scanner (seven-root) | all seven roots | `ok:false`, allowCount 0, exactly 2 findings — both the **planned slice-3** plugin cores (`plugin-ai-core`, `plugin-auth-core`); sdk/fresh-ui clean ✓ |
| Scoped check — sdk / fresh-ui | `run-deno-check.ts` | `totalOccurrences:0`, 0 failed batches both ✓ |
| Scoped lint — sdk / fresh-ui | `run-deno-lint.ts` | exit 0, 0 occurrences both ✓ |
| Scoped fmt — sdk / fresh-ui | `run-deno-fmt.ts` | 0 findings both ✓ |
| sdk tests | `deno task test` | **16 passed / 0 failed** ✓ |
| fresh-ui tests | `deno test --allow-read … tests/**` | **134 passed / 0 failed** ✓ |
| doc:lint `mod.ts` / `primitives.tsx` | `deno doc --lint` | **0 / 0** ✓ |
| sdk publish dry-run | `deno publish --dry-run --allow-dirty` | `Success`, no slow types ✓ |
| fresh-ui publish dry-run | `deno publish --dry-run --allow-dirty` | `Success`, no slow types ✓ |
| Lock hygiene | `git diff --exit-code -- deno.lock` (root + fresh-ui) | both **CLEAN**; `preact-render-to-string` is already in the committed HEAD lock, so the new render test adds no churn ✓ |
| Drift entry | `drift.md` | New `Fresh UI test permission correction` entry records the `--allow-read` change, its cause, minimal scope, and evidence ✓ |

## Other correctness checks (unchanged from prior pass, re-confirmed sound)

- **Cast accounting:** 5 casts removed, 0 added; the only new code is small typed guards
  (`isCssProperties`, `isRecord`/`isOrpcContractRouter`). No new `any`, no `as unknown as`, no
  `deno-lint-ignore` — confirmed by the clean scanner.
- **`mergePlatformStyle`** return-type widening and `isCssProperties` guard are branch-equivalent to
  the old code; internal-only, consumers compile clean.
- **Accordion summary/event correction** compiles clean, breaks no in-repo consumer, and the
  sanctioned `aria-disabled` narrowing (trigger-level `disabled` no longer contributes) is now pinned
  by the render test on the supported item-disabled path.
- **`--allow-read` test task** repairs a pre-existing baseline failure (`render-ui.test.tsx` reads its
  source fixture), is the tightest grant among sibling packages, and is now recorded in `drift.md`.

## Slice-gate conclusion

The correction pass closes both prior `FAIL_FIX` findings without introducing new debt: the public
`PrimitiveNode` surface is self-contained and doc-lint clean, the SDK contract-router boundary is
narrowed by a guard whose leaf predicate is provably oRPC's own and whose reject paths were validated
by a new test that caught a genuine empty-branch bug, the accordion element/event/`aria-disabled`
correction is pinned by an SSR render test, and the `--allow-read` correction is drift-logged.
Scanner (0/0), scoped check/lint/fmt, sdk 16/16, fresh-ui 134/134, `mod.ts`/`primitives.tsx` doc:lint
(0/0), both publish dry-runs (no slow types), and lock hygiene (root + fresh-ui clean) all reproduce
green within scope. **`PASS` — cleared for the supervisor sign-off commit.**
