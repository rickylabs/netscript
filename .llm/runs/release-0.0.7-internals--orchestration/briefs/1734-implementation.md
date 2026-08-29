use harness

## SKILL

Load `netscript-harness`, `netscript-doctrine`, `netscript-tools`, `netscript-deno-toolchain`,
`netscript-pr`, and `rtk`. Read `.llm/harness/gates/static-gates.md`.

# Brief — #1734 fresh query hydration readonly/mutable type correction

## Standing

Worktree `/home/codex/repos/netscript-007-leaf-hydration`, branch
`fix/fresh-query-hydration-readonly-state`, base
**`21d516224fe35e92957f0998ee848bbf2024eda0`** (main). Issue **#1734**, milestone `0.0.7`,
priority p1.

PLAN-EVAL is **N/A** unless your research shows this genuinely changes a complex public contract —
if it does, stop and report before implementing rather than deciding that yourself. Tier-A and an
independent exact-head IMPL-EVAL follow your push.

## The defect, already reproduced — do not re-derive it

`packages/fresh/src/application/query/hydration.ts:43` passes the package's readonly
`DehydratedState` into TanStack `hydrate()`. Upstream changed that parameter between minors:

| `@tanstack/query-core` | `hydrate` second parameter |
| --- | --- |
| 5.101.0 / 5.101.4 (lockfile pin) | `dehydratedState: unknown` |
| **5.102.8** (what a fresh consumer resolves) | **`dehydratedState: Partial<DehydratedState>`** |

`packages/fresh/deno.json` declares the open range `npm:@tanstack/query-core@^5.101.0`, so repo CI
resolves the pinned 5.101.0 and stays green while consumers resolve 5.102.8 and fail.

Reproduce it yourself before changing anything — pin `packages/fresh/deno.json` to
`npm:@tanstack/query-core@5.102.8`, then:

```
deno check --unstable-kv --no-lock packages/fresh/src/application/query/hydration.ts
```

```
TS2345: Argument of type 'DehydratedState' is not assignable to parameter of type 'Partial<DehydratedState>'.
  Types of property 'mutations' are incompatible.
    The type 'readonly unknown[]' is 'readonly' and cannot be assigned to the mutable type 'DehydratedMutation[]'.
    at packages/fresh/src/application/query/hydration.ts:43:24
```

Restore the range afterwards; the range decision is part of the work, not a side effect.

The local contract is `query-types.ts:34-39`, `readonly mutations` / `readonly queries` as
`readonly unknown[]`. `dehydrateQueryClient` at `:27` is unaffected — it already casts its result,
so only the hydrate direction is checked.

## What to deliver

A **narrow architectural type correction plus regression**, RED-first.

1. **RED first.** Add a test that fails at base against the 5.102.x signature and passes after your
   fix. Commit it separately with its failing output recorded in the worklog. A regression that
   cannot fail is not a regression test.
2. **The correction.** Restore assignability without weakening type safety. **Forbidden:** `any`,
   `as unknown as`, `@ts-ignore`, `@ts-expect-error`, and silently widening the public
   `DehydratedState` to a mutable shape just to make the error go away. If you conclude the public
   readonly contract genuinely must change, say so explicitly with the reasoning — do not slip it
   in.
3. **State the dependency-range decision.** Either narrow the declared range to what is actually
   supported, or make the code compatible across the whole declared range. **A green check that
   only holds for the locked version does not satisfy this issue** — that is precisely the hole
   that hid the defect.
4. **Prove the consumer path.** Show `deno check` green against *both* the pinned 5.101.x and a
   resolvable 5.102.x. If you can do it without a runtime lease, also show a generated project's
   `deno task check` passing.

## Gates — static only

**No runtime lease is granted.** Do not start Aspire, Docker, a browser, `scaffold.runtime`, or
`e2e:cli`; keep Docker and Aspire empty. Note in the PR that the `scaffold.runtime` restoration
claimed by the issue is verified by CI, not locally.

Run through the structured wrappers: focused test and focused check over changed files;
`deno task check`; `deno task test`; `deno task lint`; `deno task fmt:check`;
`deno task quality:scan` (**`allowCount` must stay 7**); `deno task arch:check`; and, if any
generated asset moves, `deno task check:assets-barrel` with canonical regeneration only.

## Delivery

1. Slice commits, RED visible in history.
2. **Atomic clean explicit push** to `fix/fresh-query-hydration-readonly-state`; local == remote.
3. **Draft PR** against `main` with `Closes #1734`, labels `type:fix`, `area:fresh`, `priority:p1`,
   exactly one `status:` label (`status:impl`), milestone `0.0.7`, and a Definition-of-Done
   checklist. **Leave it draft** — marking it ready is this repo's IMPL-EVAL dispatch trigger.
4. **Every receipt at the final pushed head.** State the exact 40-character SHA in your handoff.
5. Record drift honestly. If the fix cannot avoid changing the public `DehydratedState` contract, or
   if narrowing the range breaks another consumer, **stop and report** rather than absorbing it.

## Bounds

Scope is the query hydration type boundary in `packages/fresh`. Not a rewrite of the query module,
not the island/defer surfaces, not `packages/sdk` discovery, and nothing to do with #1728 / #1371 /
#1732. Do not merge, flip readiness, close the issue, publish, or take a runtime lease. Do not issue
your own evaluator verdict.
