# PLAN-EVAL — fix-fresh-partial-nav--1590

- Plan evaluator session: separate Claude (Fable 5) PLAN-EVAL session, 2026-08-31; evaluated plan
  head `77d8aba4c35c1c98c76adbf3b9ca48a6a97d4fc8` on `fix/fresh-partial-nav-ordering`
- Run: `fix-fresh-partial-nav--1590` (issue rickylabs/netscript#1590, milestone 0.0.7)
- Surface / archetype: `packages/fresh` — Archetype 4 (DSL/builder), Keep verdict; builders and
  root barrel untouched; new inert `src/runtime/navigation/` concern behind `./navigation`
- Scope overlays: frontend + browser-runtime

## Checklist results

| Plan-Gate item                          | Result | Evidence / location |
| --------------------------------------- | ------ | ------------------- |
| Research present and current            | PASS   | `research.md` re-baselined to `7ae7fe2da` (current `main` at evaluation; confirmed by `git log`). Line citations spot-checked against the installed JSR cache, not prose: `fetchPartials` at cached `partials.ts` 353–387 with post-apply `maybeReplaceHistory` at 384–385; `maybePushHistory` 86–107 (pre-fetch replace+push); button path `fetchPartials(partialUrl, partialUrl, false)` 179–195; GET form `fetchPartials(actionUrl, partialUrl, true, init)` ~314 with no preceding push; zero `AbortController`/`signal` occurrences in the file. `reviver.ts` 58–70 (`PartialComp` registers in `ACTIVE_PARTIALS` in `componentDidMount` only, no update hook), 293–306 and 437–449 (name+key read from marker into the VNode). Cached `preact_hooks.ts` serializes `${name}:${mode}:${normalizedKey}` into the boundary (149–160). All citations accurate. |
| Decisions locked                        | PASS   | LD-1…LD-6 with rationale; state/event model table; public contract given as exact code (`plan.md` Public contract). Adjudication of each decision below. |
| Open-decision sweep                     | PASS   | Plan's resolved/defer/tripwire lists present; evaluator-run sweep found no decision that would force rework when deferred (see below). |
| Commit slices (< 30, gate + files each) | PASS   | Two ordered slices, ceilings 10 and 6 files, per-file content, proving gates, and explicit landability statements. |
| Risk register                           | PASS   | Eleven risks, each with mitigation and proving gate; includes the abort-overlay, misclassification, sibling-cancellation, and timing-flake rows. |
| Gate set selected                       | PASS   | Covers Archetype 4 rows of `gates/archetype-gate-matrix.md`: static (check/test/lint/fmt/doc-lint/publish), fitness (`quality:scan`, `arch:check`, JSR audit, lock hygiene), browser (subtype — hosted `fresh-browser`), consumer import (type fixture). Runtime gates included although `optional` for Arch 4, correct for browser-runtime behavior. |
| Deferred scope explicit                 | PASS   | "Explicitly excluded broader navigation work" + safe-to-defer list names the same-page single-region-lane ordering as deliberately uninvented pending upstream identity. |
| jsr-audit surface scan (pkg/plugin)     | PASS   | Section applied to planned surface: JSDoc bar, explicit non-leaking types, SSR-import safety, publish exclusions, doc-lint/dry-run zero-new-findings requirement, slow-type risk named with mitigating gates. |

## Locked-decision adjudication (evaluator questions)

1. **LD-1 capture-correlated global page generations — sufficient and well-defined.** The page rule
   (`captured == requested`) and region rule (`captured == rendered AND no newer page pending`)
   order overlapping traffic, and the linearization point — after the complete body read, before the
   body returns to Fresh — is the actual corruption seam (`applyPartials` has no freshness check;
   verified in cached source at 396–531). The converse case is handled and derivable: a region intent
   never consumes a page token and never advances `requestedPageGeneration`, so an in-flight **page**
   response stays current when a region intent arrives after it; the later region snapshots the
   single well-defined `renderedPageGeneration` at token consumption (rendered only advances at
   accepted EOF), and if the page settles first the region's captured generation no longer matches
   and it drains — exactly the mixed-DOM case the risk register names. Sibling regions under one
   rendered generation keep passing independently. `dispose()`-awaiting-drains is bounded by server
   EOF on finite HTML partial bodies; see Notes.
2. **LD-3 full-page supersedes older page and region responses — converse verified** as part of (1);
   no rule discards a current-generation page for a region intent, so last-intent ordering does not
   silently lose pages.
3. **LD-2 drain-not-abort — established from evidence, not assertion.** Three independent layers,
   all confirmed by this evaluation: (a) mechanism in installed sources —
   `@remix-run/node-fetch-server` 0.12.0 wires `res.once('close', () => controller.abort())` for the
   server `Request` signal (cached dist ~85–90), and the `fresh:dev_server` middleware's catch
   forwards `next(err)` into Vite (cached source, cited region 113–167, `next(err)` at ~166);
   (b) the cited EIS Chat `client-nav.ts` at `39b863d5` implements the identical drain design
   (stale-at-headers → `arrayBuffer()` then logical drop; stale-during-`text()` → let the read
   finish; caller signal insulated from transport) and was fetched and verified; (c) the EIS 0–800 ms
   browser matrix with zero abort errors is cited by commit path. The gate set locks the negative:
   cancel/abort spies never fired, hosted Vite stderr scanned, request-failure count asserted.
   Stalling cannot hide a regression because completion of superseded responses is itself an
   assertion.
4. **LD-3 (history in coordinator) — correct seam.** The late `replaceState(actualUrl)` happens
   *inside* Fresh's private post-apply flow (verified: cached 384–385), so caller-side suppression is
   unattributable; one correlated adapter owning both suppression and subscription emission avoids
   competing history wrappers, and the identity-guarded restore is tested.
5. **LD-5 native keyed boundaries — verified against real 2.3.3 source.** The marker includes the
   normalized vnode key; the reviver passes it into `h(PartialComp, { name, key, mode })`;
   `PartialComp` registers by `props.name` only in `componentDidMount`, so an unkeyed rename
   reconciles to the old instance and orphans the registry — and a rename changes VNode identity,
   forcing the remount that re-registers. The tag `partials_test.tsx` test at the cited range is
   "reconcile keyed partials" (reordering, not renaming), and `research.md` states that limitation
   explicitly rather than overclaiming; the gap is owned by the Slice-1 key test and Slice-2 hosted
   A/B/A name assertion. No server-HTML rewriting anywhere — the issue constraint holds.
6. **LD-4 public surface — right split for 0.0.7.** Two functions and three interfaces is the
   minimum that satisfies the named removal condition; the issue's removal clause is a consumer
   deleting its whole facade, so internalizing subscription/navigation would re-create the facade and
   fail the acceptance. Placement matches the existing `./interactive`/`./streams` runtime-subpath
   precedent in `packages/fresh/deno.json` (verified), builders untouched.

## Gate question — Slice 1 implementability and sequencing honesty

Slice 1 is implementable without re-deriving design: the public contract is given as exact
signatures, the transition table is per-event, LD-1…LD-6 settle the mechanisms (token staging with
microtask expiry, WeakSet sentinel, identity-guarded restore), and the test file entries name the
adversarial cases (token expiry, anchor-with-`/partials/**`-endpoint classification, controlled-stream
EOF spies, late-replace suppression). The sequencing statement is honest, not concealment: Slice 1
*is* independently verifiable against its own gates (unit, type-fixture, static/fitness) — it is
declared not independently *landable* only because the issue's acceptance condition is hosted
browser behavior, which Slice 2 owns. Nothing in either slice is unprovable at its own HEAD.

## Browser proof — would it fail if last-intent-wins regressed?

Yes. The barrier schedule removes timing luck: the final A page and current region settle **first**,
and the superseded A-region and B-page barriers are released **after** into a late window that the
test then waits beyond. A regression must then break at least one asserted channel: late repaint
(final URL/title/H1/visible region content), history (`replaceState` suppression), transport
(`AbortSignal`/request-failure/Vite-overlay stderr, plus the positive requirement that superseded
responses reach HTTP 200 completion — so an abort-based "fix" fails too), registry (serialized marker
keys, missing-partial warning), or subscription sequence. The exact hosted command matches
`.github/workflows/ci.yml` 252–265, the classifier line (`freshBrowser` for any
`packages/fresh/**`) was verified at `.github/scripts/ci-classify-changes.ts:224`, the gate catalog
maps `fresh-browser` → `deno task test:browser` → the extended browser test, and receipts upload with
`if: always()` (ci.yml 274–279).

## Open-decision sweep (evaluator-run)

No open decision found that would force rework if deferred. Rescope tripwires (lock, CI, builder,
marker-editing, dependency changes) are correctly wired back to PLAN-EVAL. Notes below are
implementation-watch items, not design gaps.

## Verdict

`PASS`

## Notes (non-blocking; for implementation and IMPL-EVAL)

1. `navigate()`'s transient anchor must be **attached to the document** before activation — Fresh's
   listener is document-level, so a detached `el.click()` never reaches it. The hosted route-event
   assertion covers this only if it includes the programmatic activation; keep that leg.
2. The marker key is the **normalized** vnode key (`normalizeKey` replaces `:` with `_`). LD-5's
   "marker key equals region name" holds for names without colons; choose fixture names accordingly
   or assert the normalized form.
3. `dispose()` awaits in-flight drains, so its promise is bounded only by server EOF. Fine for
   finite HTML partial bodies, but the JSDoc lifecycle rule should state it.
4. Draining briefly holds HTTP/1.1 dev-server connection slots; inherent to the locked drain choice
   and bounded by the same finite-body property — one README compatibility-boundary sentence suffices.
