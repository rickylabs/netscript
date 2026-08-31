use harness

# SLICE — #1664: instrument the hosted browser lane to name the optimistic-render cause

Coordinator-ruled: **use the hosted GitHub E2E/browser lane.** Local NAS Chromium absence is not a
blocker and is not an excuse to defer this.

| Field | Value |
| --- | --- |
| Worktree | `/home/agent/projects/netscript/worktrees/007-leaf-1664` |
| Branch | `feat/app-service-client-wiring` |
| Base | current HEAD — do **not** rebase or merge `main` |

## SKILL

`netscript-harness`, `netscript-cli`, `deno-fresh`, `netscript-tools`.

## Where the investigation stands — three mechanisms already eliminated

`behavior.service-client-refetch` is the **last** failing gate; the runtime suite is otherwise
**71 passed / 1 failed**. The probe holds the update RPC response paused and requires the *optimistic*
row to read `<name>*` before continuing. It times out there.

Closed off by evidence — **do not re-derive these**:

1. **Cache-key mismatch — ruled out.** The island passes the same `listOptions.queryKey` to both
   `useQuery` and `createOptimisticListMutationCallbacks`.
2. **Probe reads the wrong element — ruled out.** The name `<p>` is genuinely the first `<p>` in the
   `<li>`.
3. **Skipped optimistic write — ruled out by measurement.** The rendered helper was driven against a
   real TanStack `QueryClient`/`QueryObserver` with the island's actual `initialData`,
   `initialDataUpdatedAt`, key and stale time: `previousDefined: true`, cache and observer both read
   `Seed User*`, and the observer **received** the notification.

So the cache write and the observer notification both happen. **The failure is downstream, in render
propagation** — Fresh/Preact island hydration or the query provider — or in something browser-specific.

## Your job: make the hosted run report the cause, not just a timeout

Add bounded CDP instrumentation to
`packages/cli/e2e/src/application/gates/scaffold/service-client-browser-probe.ts` so that **when the
optimistic assertion fails, the failure carries evidence**. At minimum, captured at timeout:

- the island's rendered row text and the `data-mutation-state` / `renderState` value;
- whether the island actually hydrated (is the Preact island interactive, or still SSR markup?);
- the query cache entry for the list key as the browser sees it, and its `dataUpdatedAt`;
- whether the rename mutation's `onMutate` ran in-browser at all.

Emit these as structured fields in the gate's evidence output so the CI report names the cause.

**Then read the hosted run and state the measured cause.** Push, let `e2e-cli` execute
`scaffold-runtime`, and report what the instrumentation shows.

## Then, and only then, fix it

If the instrumentation identifies the cause and the fix is inside the scaffold templates or the
optimistic helper, make it. **If the cause is in `packages/fresh` island hydration or the query
provider, stop and report** — that is a different package and a rescope.

## Constraints

- **Instrumentation must not weaken the assertion.** The gate must still fail when the optimistic row
  is absent. Do not extend the timeout to make it pass, do not retry, do not quarantine.
- Prefer evidence that survives into the CI artifact; a `console.log` that only exists in a live
  session is not evidence.

## Ceiling

`service-client-browser-probe.ts` plus, if the cause proves to be there, the two `ServiceShowcaseLab*`
island templates and `optimistic-list-mutation.ts.template`, and the regenerated carrier. Anything in
`packages/fresh` or `packages/sdk` is a **rescope: stop and report**.

## Definition of done

- The hosted `scaffold-runtime` run reports **named, structured evidence** at the failure point.
- The measured cause is stated in a PR comment — inferred causes are not acceptable; this
  investigation has already disproved one supervisor hypothesis and eliminated two more.
- Scoped `packages/cli` check/lint/fmt with **non-empty `stdout.bytes`**; `deno.lock` byte-identical.
- One commit, pushed by explicit refspec; update `worklog.md`/`context-pack.md`.

**Never place `close`/`closes`/`fixes`/`resolves` immediately before an issue number**, including in a
negation. No labels, no acceptance boxes, no evaluator, no merge.
