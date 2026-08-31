use harness

# SLICE — #1664: why the optimistic row never appears after Rename

Bounded investigation-then-fix. `behavior.service-client-refetch` is the **last** failing gate on
PR #1664 — the runtime suite is otherwise **71 passed / 1 failed**.

| Field | Value |
| --- | --- |
| Worktree | `/home/agent/projects/netscript/worktrees/007-leaf-1664` |
| Branch | `feat/app-service-client-wiring` |
| Base | current HEAD — do **not** rebase or merge `main` |
| Run dir | `.llm/runs/feat-app-service-client-wiring--1664/` |
| Failing gate | `behavior.service-client-refetch`, hosted `scaffold-runtime` |

## SKILL

`netscript-harness`, `netscript-cli`, `deno-fresh`, `netscript-tools`.

## What the probe actually asserts

`packages/cli/e2e/src/application/gates/scaffold/service-client-browser-probe.ts:275-295`:

1. clicks Rename;
2. **pauses the update RPC response** via `Fetch.requestPaused`;
3. **while the response is still held**, waits for the row to read `<originalName>*`;
4. only then continues the response.

So it is asserting the **optimistic** update specifically — the server round trip is deliberately
blocked. It times out at step 3.

## Two hypotheses already eliminated — do not re-derive them

1. **Cache-key mismatch: ruled out.** The island passes the *same* `listOptions.queryKey` to both
   `useQuery` (`ServiceShowcaseLab.tsx.template:55`) and
   `createOptimisticListMutationCallbacks` (`:88`). They match by construction.
2. **Probe reading the wrong element: ruled out.** The probe takes
   `button.closest('li').querySelector('p')`, and the name `<p>` is the **first** `<p>` inside the
   `<li>` (`:210`); the "Created …" `<p>` follows it.

## Primary hypothesis — test this first

`optimistic-list-mutation.ts.template`, `onMutate`:

```ts
const previous = options.queryClient.getQueryData<TData>(options.queryKey);
if (previous !== undefined) {
  options.queryClient.setQueryData(options.queryKey, options.update(previous, variables));
}
options.onOptimisticUpdate?.(variables);   // fires regardless
return { previous };
```

**When `getQueryData(queryKey)` returns `undefined` the optimistic write is silently skipped, yet
`onOptimisticUpdate` still runs** — so the island sets `statusMessage` to
*"Optimistically renamed record #N."* while the DOM never changes. That is precisely the observed
symptom: the gate's status assertions pass and only the row assertion times out.

The likely reason `previous` is `undefined`: the island seeds the list through `useQuery`'s
`initialData` (plus `initialDataUpdatedAt`, added by this same PR for #1360). Establish whether, at
mutate time, the list is actually resident in the query cache under `listOptions.queryKey`, or only
present as `initialData` on the observer.

**Prove it before fixing it.** Add temporary instrumentation, or a focused test that drives the same
sequence with a real `QueryClient`, and report which branch is taken.

## The fix, once the cause is confirmed

If the hypothesis holds, the defect is that a **silent no-op is indistinguishable from success**. Fix
so that either the optimistic write applies when the list is only `initialData`-seeded, or the
skipped-write case is surfaced rather than swallowed. **Do not** simply make `onOptimisticUpdate` fire
only on success — that hides the bug instead of fixing it, and the showcase is meant to *demonstrate*
optimistic updates working.

If the hypothesis is disproved, **stop and report the measured cause**; do not widen scope
speculatively.

## Ceiling

Start with `packages/cli/src/kernel/assets/app/routes/examples/service/(_lib)/optimistic-list-mutation.ts.template`
and the two `ServiceShowcaseLab*.tsx.template` islands, plus focused tests and the regenerated
`embedded.generated.ts` carrier. Anything beyond that — especially `packages/sdk` query internals —
is a **rescope: stop and report**.

## Definition of done

- The cause is **measured and stated**, not inferred.
- A focused test reproduces the failure before the fix and passes after — the regression must be
  provable without a browser.
- Scoped `packages/cli` check/lint/fmt with **non-empty `stdout.bytes`** on each receipt.
- `packages/cli` tests pass; nothing deleted, skipped, or weakened.
- `deno.lock` byte-identical.
- One commit, pushed by explicit refspec, plus a PR comment with the measured cause and the evidence.
  Update `worklog.md` and `context-pack.md` in the same commit.

Do not change labels, tick acceptance boxes, dispatch an evaluator, or merge. **Never place
`close`/`closes`/`fixes`/`resolves` immediately before an issue number**, including in a negation —
this milestone has already had two PRs accidentally register live closing references that way.
