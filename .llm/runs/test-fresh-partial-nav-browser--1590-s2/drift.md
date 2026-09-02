# Drift log — test-fresh-partial-nav-browser--1590-s2

## 2026-09-01 — tooling availability (minor)

The workspace-required `rtk` executable is absent on this worker. Focused native Git/filesystem
commands were used instead. No behavior, scope, or evidence semantics changed.

## 2026-09-01 — full export doc-lint baseline differs from locked plan (significant)

The structured full-export doc-lint reports 45 diagnostics in existing builder/query/route/streams
source. The navigation entrypoint is clean (0 private-type-ref, 0 missing-JSDoc), and this slice
does not change `packages/fresh/src/**`. The locked plan expected the package doc-lint to be clean,
but fixing these diagnostics would violate the proof-only source prohibition. No source change was
made; the supervisor must classify the baseline evidence for merge readiness.

## 2026-09-01 — browser proof files enter the JSR publish set (significant)

The locked plan states that tests/fixtures match the existing publish exclusions. The actual
`packages/fresh/deno.json` filter includes `**/*.ts`/`**/*.tsx` and does not exclude
`tests/fixtures/**` or `tests/form-navigation_browser.ts`. The raw publish dry-run lists all four new
fixture files plus the modified browser evidence file.

Changing `packages/fresh/deno.json` solely to add publish exclusions is outside the explicitly
conditional sixth slot (“only if the existing explicit browser task needs adjustment”). The browser
task already works and needs no adjustment. The implementation lane therefore did not widen scope.
Supervisor decision is required: authorize a reviewed publish-filter change/rescope, or explicitly
accept the proof files in the package publish set. This drift blocks a clean claim that the planned
JSR/published-file gate passed as written.

## 2026-09-02 — stale setup synchronization used the wrong observable (minor)

The original proof awaited Playwright's `response` event before advancing from each held request.
Hosted job `100127639255` timed out there, then Vite reported the held request's signal aborting as
the page closed. Static Fresh 2.3.3 inspection also confirms that both fixture activation paths issue
the request with `fresh-partial=true`, and the coordinator does not remove it from the fetch input.

The repair now treats server-side barrier `arrived` state as the authoritative request-start
observable, records every stale-phase request/response URL, and waits for response status/EOF only
after explicit release. No timeout was lengthened, no product source changed, and the planned
last-intent, drain, cancellation, and overlay assertions remain in force.

## 2026-09-02 — hosted proof fails on MutationObserver at merge head (blocking)

Hosted `check-test`/`fresh-browser` at merge head `c72710bae` (job `100149154445`, run
`33599242516`) fails with `ReferenceError: MutationObserver is not defined` thrown from the
run-code evaluation context (observer setup before the release phase). The barrier-arrival
repair itself worked: the first held request now arrives and is released past the former 30 s
wait. The remaining failure is a test-harness capability assumption, not a product or fixture
defect, and it fails before any assertion runs — deterministic, not flaky. Hosted Vite stderr
again shows `Internal server error: The signal has been aborted` for a held stale response
aborted at page close, so the drain-without-overlay claim is still unproven in the hosted lane.
Product source remains untouched by this slice.

## 2026-09-02 — driver/page-context harness drift repaired locally

The blocking `MutationObserver` assumption is repaired in the browser proof: observation now lives
in the page context, while the driver reads the ordered capture only after disconnecting it at the
original settle point. Teardown now releases and drains both barriers, with zero cancellations,
before closing the Playwright session, so the unchanged Vite stderr abort check cannot be polluted
by a live held body at page close. This required no fixture or product-source change and introduced
no timeout or sleep. The hosted verdict remains pending at the commit produced by this repair.

## 2026-09-02 — live nested-partial markers are consumed by Fresh 2.3.3 (minor)

Determination: **(a)**, not a Slice-1 product defect. `deno info` resolves the fixture to
`@fresh/core@2.3.3`. Its installed client `reviver.ts` calls `_walkInner` during boot, hides each
`frsh:*` comment, converts nested `frsh:partial` records into `PartialComp` VNodes carrying the
serialized key, and renders `PartialComp` as children only. `partials.ts` performs the same
comment-to-keyed-VNode conversion for fetched partial HTML. The nested region comments are inputs
to hydration/partial parsing, not a supported durable live-DOM surface. This explains why the raw
`colonMarker` response probe succeeds while the post-hydration TreeWalker sees no region markers.

The proof now retains the exact marker assertion against the three HTML response bodies actually
fetched for initial A, B mount, and A mount. It additionally tags the live region node with an
expando immediately before A→B and B→A; the tag is absent after both transitions, proving node
replacement/remount rather than same-node reconciliation. No `packages/fresh/src` or fixture
change is warranted.

## 2026-09-03 — MCP generator clean-tree guard during merge (minor)

The prescribed bare `deno task gen:mcp-export-corpus` exited 1 because the #1867 guard correctly
reported the merge's staged `origin/main` package/plugin changes as dirty. The generator explicitly
supports deliberate convergence through `--allow-dirty`; that rerun exited 0, its check gate exited
0, and every generated output remained byte-identical to `origin/main`. No product or proof scope
changed.
