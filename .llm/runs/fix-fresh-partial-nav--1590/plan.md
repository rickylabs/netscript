# Plan — Fresh partial-navigation coordinator

**PLAN-EVAL: REQUIRED.** No implementation may begin until a separate evaluator session returns
`PASS`. This checkpoint is plan-only and belongs to issue `#1590`.

## Scope, archetype, and acceptance

- **Owned product surface:** `packages/fresh` only, plus its existing hosted browser fixture/task.
- **Archetype:** 4 — DSL/builder, with frontend and browser-runtime scope. The existing DSL remains
  intact; behavior is isolated under a new runtime concern.
- **Doctrine verdict:** Keep. Add a focused `src/runtime/navigation/` concern and public
  `@netscript/fresh/navigation` subpath; do not add navigation state to builders or the root barrel.
- **Compatibility target:** Fresh 2.3.3. The implementation must be import-safe on the server and
  explicit about its client lifecycle.
- **Acceptance:** last full-page intent wins; page-dependent late region bodies are consumed and
  discarded; stale history replacement is suppressed; dynamic region names remount through native
  keyed Fresh markers; consumers can subscribe and navigate programmatically; EIS Chat can remove
  its custom `apps/dashboard/lib/client-nav.ts` implementation and import this package surface.
- **Debt:** no navigation-specific doctrine debt exists. This plan creates none. Any need to edit
  outside the owned surface is a rescope signal, not silent debt.

## Public contract

The 0.0.7 public entrypoint and names are locked as `@netscript/fresh/navigation`:

```ts
export interface RouteChange {
  readonly kind: 'push' | 'replace' | 'pop';
  readonly url: URL;
  readonly state: unknown;
}

export interface PartialNavigationCoordinator {
  navigate(href: string | URL): void;
  subscribe(listener: (change: RouteChange) => void): () => void;
  dispose(): Promise<void>;
}

export interface KeyedPartialProps {
  readonly name: string;
  readonly mode?: 'replace' | 'append' | 'prepend';
  readonly children?: ComponentChildren;
}

export function installPartialNavigationCoordinator(): PartialNavigationCoordinator;
export function KeyedPartial(props: KeyedPartialProps): ComponentChild;
```

Installation is a document-scoped, reference-counted lifecycle. Repeated installation shares the
same internal coordinator; each handle disposes once, and final disposal restores only wrappers it
still owns and awaits the package's in-flight drains. Imports do nothing. `navigate()` uses Fresh's
supported link activation contract rather than calling private Fresh functions. `subscribe()` emits
only accepted `push`, `replace`, and `pop` mutations; the internal event name, generation, and
logical-drop sentinel are not public.

`KeyedPartial` delegates to Fresh's public `Partial` with `key={name}`. It does not parse or mutate
HTML. The props are a documented, explicit structural surface so private Fresh runtime types do not
leak through JSR declarations.

## Locked decisions

### LD-1 — global page-intent generation; regions are subordinate to a rendered page

Use one monotonic `requestedPageGeneration` and one `renderedPageGeneration`, not a counter per
region. Classify **intent**, not the fetched pathname:

- a capture-phase eligible anchor activation, programmatic `navigate()`, or Fresh-enabled `popstate`
  stages a page token;
- a capture-phase GET form stages a page token unless it is a NetScript named-region form whose
  `f-partial` target is under `/partials/**` and whose action retains the current page;
- Fresh's partial button path and that named-region form stage a region token; and
- the next synchronous same-origin `fresh-partial=true` GET consumes the staged token. An unconsumed
  token expires at the event/microtask boundary so a prevented activation cannot poison a later
  fetch.

Fresh's pre-fetch `pushState` provides a second page-intent correlation for anchors. Path-based
`/partials/**` classification is only a conservative fallback for request flows with no staged
token; it must never downgrade an anchor token, because an anchor may navigate to a page while
fetching a `/partials/**` endpoint.

Consuming a page token increments the requested generation. Consuming a region token captures the
currently rendered page generation.

- A page body is current only when its captured generation still equals the requested generation.
- A region body is current only while its captured generation still equals the rendered generation
  and no newer page intent is pending.
- A current page body advances `renderedPageGeneration` only after its complete body has been read
  and accepted for Fresh to apply.
- Starting a full-page navigation immediately makes every older page response and every in-flight
  region response stale. Those transports continue to EOF and their bodies are discarded.
- Multiple independent regions belonging to the same rendered page may settle in either order; one
  does not cancel another. Repeated ordering within a single page generation is deliberately not
  invented without an upstream stable region-target identity.

This model matches the actual cross-page failure and preserves parallel deferred regions. A generic
global request counter would incorrectly discard sibling regions; per-region counters cannot be
assigned reliably from Fresh's private fetch call because the target name is present only in the
response marker.

The freshness linearization point is the check immediately after the complete original body read and
before that body is returned to Fresh. A page accepted before a later intent may finish its
already-linearized application, but the later page is then the only generation permitted to settle
last. The hosted barriers place supersession before the older EOF so the reported failure is proved
at the actual stale-body seam.

### LD-2 — stale bodies are drained, never physically cancelled

The compatibility wrapper recognizes only same-origin Fresh partial GETs. It never calls
`AbortController.abort()`, `ReadableStream.cancel()`, or abandons a resolved stale response.

- Stale at headers: consume the original `arrayBuffer()` to EOF, discard it, then issue the
  package-owned logical-drop sentinel.
- Stale during Fresh's `text()` read: let the original read finish, discard the string, then issue
  the same sentinel.
- Caller cancellation: do not propagate the caller signal to the in-scope transport; remember the
  logical cancellation, drain the response, then surface the caller's reason.
- The package suppresses only its own WeakSet-tracked sentinel from the unhandled-rejection event
  generated by Fresh's async document listener. Real failures remain visible.

Final disposal marks outstanding work stale, restores owned globals, waits for tracked reads, and
does not tear down their network transports.

### LD-3 — history replacement suppression belongs to the coordinator

Fresh performs `replaceState(actualUrl)` after body application inside its private request flow. A
caller cannot safely determine whether that replacement belongs to stale A. The coordinator owns a
single correlated history adapter: it records accepted pushes with their generation, suppresses a
replacement tied to an older generation when a newer location is current, and permits current
redirect replacements, unrelated application history calls, and `popstate`.

The same adapter emits route subscriptions only after a mutation is accepted. This avoids competing
history wrappers for ordering and subscription. Wrapper restoration is identity-guarded so the
coordinator never overwrites a later third-party owner during disposal.

### LD-4 — subscription and programmatic navigation are public in 0.0.7

Both capabilities are required by the named consumer-removal condition, so making them internal
would leave EIS Chat with another custom facade. `RouteChange` exposes only URL, state, and mutation
kind; generations, progress, request bodies, and Fresh internals stay private. `navigate()` creates
a transient same-origin anchor with `f-client-nav="true"`, activates it, and removes it. It rejects
cross-origin use and remains a no-op-safe import on the server; it does not directly mutate history.

### LD-5 — native keyed markers, not response-marker rewriting

Fresh 2.3.3 already serializes a VNode key into its comment boundary. `KeyedPartial` supplies the
dynamic name as that key so A → B → A creates a distinct reconciliation identity at every name
change and reruns Fresh's mount-time registry update. Applications and the coordinator do not alter
returned marker text.

Measurable success is: marker key equals region name; a changing name receives its matching region
updates after each navigation; no old-name boundary is reused for the new name; and no
`Partial "…" not found` warning occurs.

### LD-6 — internal compatibility adapter, explicit lifetime

Fresh 2.3.3 exports neither its request function nor a pre-apply hook, so a narrowly filtered
`fetch`/`history` adapter is necessary. It lives below `src/runtime/navigation/`, is installed only
by `installPartialNavigationCoordinator()`, and is not exported as patch functions or mutable
globals. The entrypoint has no module-load DOM access. A future Fresh hook can replace the adapter
behind the same public contract.

## State and event model

| Event                         | State transition                                        | Response rule                                                                  | History/subscription rule                               |
| ----------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------- |
| Page A fetch consumes intent  | increment requested generation; capture A               | A may read, but may apply only if still requested                              | Fresh push A is correlated and emitted                  |
| Region R consumes intent      | capture rendered generation                             | R may apply only while that page remains rendered and no newer page is pending | no route event                                          |
| Page B fetch consumes intent  | increment requested generation                          | older page and region work becomes logical-drop work; all bodies drain         | Fresh push B is correlated and emitted                  |
| Current page body reaches EOF | mark its generation rendered; return body to Fresh      | body/head mutation may proceed                                                 | current redirect replacement may proceed and emit       |
| Stale body reaches EOF        | discard; raise owned sentinel                           | no body/head/partial mutation                                                  | any correlated late replacement is suppressed           |
| Popstate                      | start a new page intent associated with the destination | older page/region work becomes stale                                           | one `pop` notification after location changes           |
| Final dispose                 | mark coordinator disposed; await tracked reads          | pending bodies still drain                                                     | restore only wrappers still owned; no new notifications |

## Hosted browser proof

Extend the existing `packages/fresh/tests/form-navigation_browser.ts` task with a real Fresh/Vite
fixture under `tests/fixtures/partial-navigation-browser/`. The fixture supplies deterministic
server barriers/delays and dynamic `KeyedPartial` names.

The hosted scenario is the issue's overlapping **A → B → A** sequence:

1. Load A and start A's delayed named-region response.
2. Activate B, whose page partial is delayed after headers.
3. Activate A again and allow the final A page plus its current region to settle first.
4. Release the older A-region and B-page barriers; wait beyond their completion window.
5. Exercise `coordinator.navigate()` for one activation and collect `subscribe()` events for the
   accepted route mutations.

The Playwright assertion object must include final URL, title, H1, visible region name/content,
serialized marker keys, route-event sequence, same-document sentinel, document-request count,
partial response statuses, request-failure count, page errors, console errors/warnings, and captured
Vite stdout/stderr. Assertions require:

- the final route and page/region DOM are A after the late window;
- B never repaints after final A and never rewrites the final history location;
- the superseded page and region responses reach HTTP completion, while no document reload occurs;
- A/B/A dynamic names have matching keys and region updates, with no missing-partial warning;
- no `AbortSignal`, `signal has been aborted`, request-failure, `vite-error-overlay`, page-error, or
  unexpected console evidence exists; and
- route subscription ends at A and includes the programmatic activation.

The existing hosted `check-test` job installs Chromium and runs:

```text
deno run --allow-read --allow-write --allow-run --allow-env \
  .llm/tools/gates/run-gate.ts --gate fresh-browser --id check-test-fresh-browser \
  --cwd packages/fresh --output .llm/tmp/gate-receipts/check-test/fresh-browser.json
```

The test prints the compact assertion object. The atomic receipt attests the command, Git SHA, exit
code, duration, and bounded stdout/stderr hash/tail; CI uploads it in the `check-test` receipt
artifact. Local Chromium absence is irrelevant to this required hosted verdict.

## Commit slices and file ceilings

The future implementation has two ordered slices. Each is committed separately during an
implementation run; this plan checkpoint is not either slice.

### Slice 1 — public lifecycle, ordering core, drain adapter, keyed boundary

**Proves:** the public contract is SSR-import-safe and documented; page generations invalidate old
page/region application; stale responses reach EOF; stale history replacement is suppressed;
subscriptions and programmatic activation share one lifecycle; a name change produces a keyed Fresh
boundary.

**File ceiling: 10 files total; at most 6 production/config/docs and 4 focused test files.**

- `packages/fresh/src/runtime/navigation/mod.ts` — documented public entrypoint only.
- `packages/fresh/src/runtime/navigation/types.ts` — explicit public shapes.
- `packages/fresh/src/runtime/navigation/coordinator.ts` — explicit lifecycle and private adapter.
- `packages/fresh/src/runtime/navigation/keyed-partial.tsx` — public Fresh wrapper.
- `packages/fresh/src/runtime/navigation/coordinator_test.ts` — generation/drain/history/lifecycle
  cases, capture-token expiry, anchor-with-partial-endpoint classification, and fake platform ports.
- `packages/fresh/src/runtime/navigation/keyed-partial_test.tsx` — native marker key and
  changing-name rendering contract.
- `packages/fresh/tests/type-fixtures/navigation-consumer_type.ts` — public consumer and SSR-safe
  type/import proof.
- `packages/fresh/deno.json` — add `./navigation`; include it in check/doc-lint; no dependency
  change.
- `packages/fresh/README.md` — install/use/dispose example, compatibility boundary, subpath table.

The tenth slot is contingency for one narrow internal helper only if the implementation would
otherwise mix pure generation logic with browser ownership. It may not become an internal barrel.

**Slice gates:** focused coordinator/keyed tests; consumer type fixture with `--unstable-kv`;
structured package check/test/lint/fmt; full export-map `deno doc --lint`; package publish dry-run;
JSR audit; `quality:scan`; `arch:check`; diff/file-ceiling/forbidden-export scan; lock-byte
equality.

**Landability:** not independently landable for this issue. It is a coherent review checkpoint, but
the browser acceptance condition remains unproven until Slice 2.

### Slice 2 — deterministic Fresh/Vite A → B → A browser proof

**Proves:** the Slice-1 behavior works through the installed Fresh 2.3.3 client and Vite development
server under real Chromium, including drain-without-overlay and dynamic-name remounting.

**File ceiling: 6 files total; no product source file.**

- `packages/fresh/tests/form-navigation_browser.ts` — add the compact evidence/assertion scenario.
- `packages/fresh/tests/fixtures/partial-navigation-browser/app.tsx` — delayed page/region routes
  and dynamic keyed boundaries.
- `packages/fresh/tests/fixtures/partial-navigation-browser/client.ts` — explicit coordinator
  installation for the fixture.
- `packages/fresh/tests/fixtures/partial-navigation-browser/main.ts` — Fresh fixture entrypoint.
- `packages/fresh/tests/fixtures/partial-navigation-browser/vite.config.ts` — real Fresh Vite boot.
- `packages/fresh/deno.json` only if the existing explicit browser task needs adjustment; otherwise
  this slot remains unused.

No workflow or classifier edit is planned: the hosted lane already triggers for `packages/fresh/**`.

**Slice gates:** focused hosted `fresh-browser` durable gate; repeat all final Slice-1 package,
fitness, JSR, lock, and file-ceiling gates at Slice-2 HEAD; full `deno task e2e:cli` during the
evaluator/merge-readiness pass.

**Landability:** depends on Slice 1 and is not landable alone. The combined Slice-2 HEAD is the
first independently landable state.

## Complete gate set

### Static and contract gates

1. `deno check --unstable-kv packages/fresh/tests/type-fixtures/navigation-consumer_type.ts`.
2. `.llm/tools/run-deno-check.ts --root packages/fresh --ext ts,tsx`.
3. `.llm/tools/run-deno-test.ts -- --allow-all packages/fresh`, with focused navigation tests also
   reported separately.
4. `.llm/tools/run-deno-lint.ts --root packages/fresh --ext ts,tsx`.
5. `.llm/tools/run-deno-fmt.ts --root packages/fresh --ext ts,tsx`.
6. `deno task --cwd packages/fresh doc-lint` across every export, including `./navigation`.
7. `deno task --cwd packages/fresh publish:dry-run` and published-file review.

### Runtime and hosted consumer gates

1. Controlled-stream tests prove every stale body reaches EOF and no cancel/abort method is called.
2. History tests prove late A replacement is suppressed while B redirects and unrelated calls work.
3. SSR/Deno import test proves no module-load browser access or global mutation.
4. Hosted `fresh-browser` A → B → A proof described above, with an atomic uploaded receipt.
5. Final `deno task e2e:cli` at merge readiness, not during intermediate loops.

### Fitness, publishability, and hygiene gates

1. `deno task quality:scan` and `deno task arch:check`.
2. `deno run --allow-read --allow-run --allow-env
   .llm/tools/fitness/audit-jsr-package.ts --root packages/fresh --text`.
3. No slow types, private-type references, undocumented public symbols, internal self-imports, or
   accidental test/fixture publication in the dry-run and JSR audit.
4. `git diff --check`, planned-file/ceiling sweep, and `git diff --exit-code -- deno.lock`.
5. Full current-source diff review after the browser proof; no generated allowance or ignored
   diagnostic may substitute for a gate.

## JSR audit applied to the planned surface

- `packages/fresh/deno.json` already has valid metadata, explicit exports, and publish filtering.
  Add only `./navigation`; no new import or version means no lock movement.
- `mod.ts` for the new entrypoint requires module JSDoc and a runnable explicit-install example.
  Every exported interface, method, function, parameter, return, lifecycle rule, and throw condition
  requires JSDoc.
- Exported return types are explicit. Public props are structural and must not reference private
  Fresh reviver/history types. No inferred anonymous object may cross the public boundary.
- Browser globals are covered by the package's existing DOM libs, but import must remain SSR-safe.
- Tests and fixtures match the existing publish exclusions; the dry-run must verify they stay out.
- README gains the subpath and an install/dispose example. `deno doc --lint` and publish dry-run
  must report zero new findings and no slow-type warning before the slice can advance.

## Risk register

| Risk                                                              | Impact                                              | Mitigation / proving gate                                                                                                                    |
| ----------------------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Fresh changes private sequencing                                  | wrapper stops correlating request/history correctly | Version-bound docs and exact 2.3.3 browser fixture; fail visibly on incompatible behavior; future upstream hook stays behind public contract |
| A stale response is abandoned after headers                       | Vite server abort overlay                           | controlled streaming EOF/cancel-spy tests plus hosted Vite stderr and request-failure assertions                                             |
| Intent classification mistakes an anchor partial URL for a region | a page generation is never advanced                 | capture-token tests where `href` is a page and `f-partial` is `/partials/**`; push correlation and hosted proof                              |
| Global request sequence cancels sibling regions                   | valid deferred regions disappear                    | page-generation model; same-generation parallel-region unit and hosted assertions                                                            |
| Region response from old page applies during new page intent      | mixed A/B DOM                                       | region captures rendered generation and also requires no newer page pending                                                                  |
| Late A rewrites B history                                         | final URL and subscription regress                  | correlated replace suppression tests and A → B → A final URL/event assertions                                                                |
| Wrapper disposal clobbers another owner                           | unrelated runtime breaks                            | reference count plus identity-guarded restoration tests                                                                                      |
| Logical sentinel hides real errors                                | diagnostics disappear                               | suppress only WeakSet-owned sentinel; inject real fetch/read/app errors and assert visibility                                                |
| Key helper leaks upstream/private types                           | JSR docs or consumers fail                          | explicit structural props, consumer fixture, full export doc lint, dry-run, JSR audit                                                        |
| Dynamic name still reuses registry entry                          | region update skipped                               | serialized key/name assertion, A/B/A browser response, no missing-partial warning                                                            |
| Hosted test is timing-flaky                                       | false confidence or intermittent CI                 | server-side barriers and explicit request events, never sleep-only ordering; late completion window asserted                                 |

## Open-decision sweep

No implementation-shaping question remains open:

- **Resolved now:** global page generation versus per-region counters; capture-token versus
  path-only intent classification; full-page invalidation of in-flight regions; read-to-EOF drain
  semantics; coordinator-owned stale `replaceState` suppression; public 0.0.7
  subscription/navigation contract; explicit install/dispose; native keyed boundary; runtime subpath
  placement; hosted gate and evidence.
- **Safe to defer:** non-GET mutation ordering; repeated same-page requests targeting one unnamed
  region lane; navigation progress/loading/error lifecycle; scroll/focus restoration policy;
  prefetch/cache/dedupe; view-transition policy; cross-origin/document navigation; automatic Vite
  injection; an upstream Fresh contribution; EIS Chat's consumer migration commit; Fresh versions
  beyond the tested 2.3.3 behavior.
- **Rescope tripwires:** any implementation need to edit a builder, CLI/scaffold, plugin, Fresh
  dependency/version, `deno.lock`, server HTML text, CI workflow, or change classifier. Stop and
  return to PLAN-EVAL rather than expanding the slice.

## Explicitly excluded broader navigation work

This issue does not define a router, replace Fresh's listeners/application engine, provide a general
history store, expose request cancellation, manage navigation UI, or standardize every application
partial route. It owns the smallest 2.3.3 compatibility seam necessary for page-intent ordering,
page-dependent region disposal, dynamic-name remounting, route observation, and programmatic Fresh
activation.
