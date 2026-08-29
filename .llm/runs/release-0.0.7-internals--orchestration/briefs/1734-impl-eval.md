use harness

## SKILL

Load `netscript-harness`, `netscript-tools`, `netscript-deno-toolchain`, `netscript-doctrine`, and
`rtk`. Read `.llm/harness/gates/static-gates.md` and `.llm/harness/workflow/lane-policy.md`.

# Brief — #1734 IMPL-EVAL (independent, opposite-family)

You are the **independent implementation evaluator** for issue #1734 / draft PR #1736. You did not
author this work and must not fix it. Your only output is a verdict.

- **Exact head:** `e537b2c1f06e9bc3345efe84597740a72844440b` on `fix/fresh-query-hydration-readonly-state`
- **Worktree:** `/home/codex/repos/netscript-007-eval-1734` (already at that head)
- **Base:** `21d516224fe35e92957f0998ee848bbf2024eda0` (main)

**Assert head equality first:** `git rev-parse HEAD` == remote branch head == PR #1736 `headRefOid`
== the SHA above. A verdict against a different head is void; if they diverge, report only that.

## The defect and the contract

`packages/fresh/src/application/query/hydration.ts:43` passed the package's **readonly**
`DehydratedState` into TanStack `hydrate()`. Upstream changed that parameter between minors:

| `@tanstack/query-core` | second parameter |
| --- | --- |
| 5.101.0 / 5.101.4 (root lockfile pin) | `unknown` |
| 5.102.8 (what a fresh consumer resolves) | `Partial<DehydratedState>` |

`packages/fresh/deno.json` declares the open range `^5.101.0`, so repo CI resolved the pin and
stayed green while consumers resolved 5.102.8 and failed `deno check`.

Required of the fix, from the issue's acceptance:

1. `deno check` passes against **both** the pinned 5.101.x and the resolvable 5.102.x.
2. **No** `any`, `as unknown as`, `@ts-ignore`, `@ts-expect-error`, or silent widening of the public
   `DehydratedState` to a mutable shape.
3. A regression that pins the hydrate boundary so a future upstream parameter change fails a test
   rather than only breaking consumers.
4. The dependency-range decision is stated: either narrow the range, or be compatible across the
   whole declared range. **A green check that only holds for the locked version is insufficient** —
   that is the hole that hid the defect.
5. No public export-surface change beyond what the fix strictly requires.

## What to check — execute, do not read and believe

1. **Scope.** `git diff --name-only 21d516224...HEAD` confined to `packages/fresh` plus leaf run
   artifacts. Anything outside is a finding. No lock/cache/workflow churn.
2. **RED is real.** Check out the test-only commit `d48861c82` separately and run the version-compat
   suite. It must fail there with the `TS2345` readonly/mutable error. If it passes, the RED claim
   is false.
3. **Both range ends.** Run the compat suite at HEAD against the `5.101.0` and `5.102.8` fixtures.
   Both must pass. Confirm the fixtures actually resolve the versions they name — read the resolved
   version, do not trust the filename.
4. **The conversion is honest.** The fix validates and copies at the boundary rather than casting.
   Attack it: feed `hydrateFromDehydrated` a malformed `mutations`/`queries` entry and confirm it
   throws a clear `TypeError` rather than corrupting the QueryClient or passing junk through. Check
   the guards actually reject the shapes they claim to.
5. **Public contract intact.** `query-types.ts` and `query/mod.ts` unchanged; `DehydratedState`
   still readonly; the declared query-core range unchanged.
6. **No forbidden constructs** anywhere in the added source, including the tests.
7. **Behaviour preserved on the happy path.** A well-formed dehydrated state still hydrates, and the
   copy does not drop or reorder entries.
8. **Gates at this head:** focused suites; `deno task check`; `deno task test`; `deno task lint`;
   `deno task fmt:check`; `deno task quality:scan` (**`allowCount` must be 7**); `deno task
   arch:check`; and `check:assets-barrel` if any generated asset moved.

## Out of scope — do not run or request

**No runtime lease exists** — the host lease is held by another lane. Do not start Aspire, Docker, a
browser, `scaffold.runtime`, or `e2e:cli`. The issue's `scaffold.runtime` restoration is
**CI-verified**, and a bounded local runtime proof is queued behind that lease; its absence here is
**not** a finding. Do not merge, mark the PR ready (that is this repo's IMPL-EVAL dispatch trigger),
flip labels, close the issue, or push to the author's branch.

`packages/sdk` discovery, the island/defer surfaces, and #1728/#1732 are outside this envelope.
Report anything found there as an observation; do not fail the leaf for it.

## Output

Write `impl-eval.md` in the leaf slice run dir, commit it, push with an explicit refspec, **and post
one PR comment on #1736 opening with the exact marker line**:

**[PHASE: IMPL-EVAL] [VERDICT: PASS]**  (or `[VERDICT: CHANGES_REQUESTED]`)

The artifact carries the verdict token `PASS_IMPL` or `FAIL_IMPL` on its own line, the exact
evaluated head, your head-equality assertion, and numbered findings with severity, reproducing
evidence, and the contract clause violated. A finding without a reproduction is not a finding.
Report the executed command and actual exit for every claim. No praise or quality adjectives.
