# Worklog — Fresh partial-navigation coordinator

## Run metadata

| Field      | Value                                           |
| ---------- | ----------------------------------------------- |
| Run ID     | `fix-fresh-partial-nav--1590`                   |
| Issue      | `#1590`                                         |
| Branch     | `fix/fresh-partial-nav-ordering`                |
| Baseline   | `b236f0c5ec62b7fe5485e8628cb1697ab33aca0d`      |
| Archetype  | 4 — DSL/builder, frontend/browser-runtime scope |
| Phase      | Slice 1 implementation                          |
| Gate state | `PLAN-EVAL: PASS`; Slice 1 static gates complete |

## Progress log

| UTC date   | Step                             | Evidence / outcome                                                                                                                                                   |
| ---------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-31 | Activated harness                | Read requested skills, Plan-Gate, Archetype 4, frontend scope, doctrine, tooling, and required JSR rubric.                                                           |
| 2026-08-31 | Re-baselined branch              | Fetched `origin/main` and fast-forwarded the clean branch from `62ea359b1` to current baseline `7ae7fe2da`.                                                          |
| 2026-08-31 | Read issue and standing failure  | Re-read issue `#1590`; used #1349 cycle-1 `FAIL_PLAN` as the requirement to settle authority, API, files, ceilings, and gates before dispatch.                       |
| 2026-08-31 | Inspected installed Fresh        | Verified core 2.3.3; read request, apply, history, reviver, marker, and Vite paths rather than designing from issue prose.                                           |
| 2026-08-31 | Established abort evidence       | Traced browser transport termination to server `Request.signal` abort and Vite `next(error)`; compared current EIS drain workaround and its 0–800 ms browser matrix. |
| 2026-08-31 | Reduced marker scope             | Confirmed Fresh already serializes VNode keys. Planned `KeyedPartial key={name}` and excluded HTML-marker rewriting.                                                 |
| 2026-08-31 | Located package seam             | Kept builders unchanged; selected inert `src/runtime/navigation/` plus public `./navigation` lifecycle subpath.                                                      |
| 2026-08-31 | Locked ordering/API              | Selected global page generation with page-dependent region invalidation, coordinator-owned stale history suppression, and public subscription/navigation for 0.0.7.  |
| 2026-08-31 | Corrected request classification | Rejected path-only classification because page anchors may fetch `/partials/**`; locked capture-phase intent tokens plus push correlation before commit.             |
| 2026-08-31 | Designed hosted proof            | Reused the existing hosted `fresh-browser` Chromium gate and durable receipt for deterministic A → B → A barriers and Vite-overlay assertions.                       |
| 2026-08-31 | Wrote plan checkpoint            | Created only the four user-requested run artifacts; no implementation or evaluator action.                                                                           |
| 2026-08-31 | Accepted PLAN-EVAL                | Separate evaluator returned `PASS`; honored its detached-anchor, colon-normalization, dispose/EOF, and connection-slot watch notes.                                  |
| 2026-08-31 | Implemented Slice 1               | Added the inert `./navigation` lifecycle, page/region generations, read-to-EOF stale disposal, history correlation, route subscriptions, and native keyed boundary.   |
| 2026-08-31 | Strengthened disposal ownership   | Tier-A diff review found a headers-arrived/unread-body edge; registration now begins when the managed response is created, and the EOF-disposal test proves it.       |
| 2026-08-31 | Completed final static gates      | Fresh package check/lint/fmt/test, focused tests, consumer check, public doc lint, publish dry-run, quality scan, architecture check, and hygiene scans completed.      |

## Decision checkpoint

| Decision         | Locked outcome                                                             | Rationale source                                                                                         |
| ---------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Ordering         | Monotonic page-intent generation; regions inherit rendered page generation | Preserves parallel same-page regions while invalidating all work owned by superseded pages               |
| Classification   | Capture anchor/form/pop intent, then consume it at Fresh's next fetch      | A page anchor may fetch a `/partials/**` endpoint, so request path is not authoritative                  |
| Disposal         | Read original body to EOF, discard stale value, logical sentinel afterward | Installed Vite server path and EIS reproduction show physical cancellation reaches server abort handling |
| History          | Suppress stale replacement inside the coordinator                          | Fresh performs replacement inside its private post-apply flow                                            |
| Subscription     | Public `RouteChange` surface in 0.0.7                                      | Named consumer-removal condition needs a package-owned replacement, not another app facade               |
| Programmatic nav | Public coordinator method using transient Fresh client-nav anchor          | Fresh has no public navigate function; this preserves its supported event path                           |
| Region identity  | Public keyed wrapper using native marker key                               | Fresh already serializes VNode keys; HTML response rewriting is unnecessary                              |
| Placement        | `src/runtime/navigation/`, exported only as `./navigation`                 | Archetype 4 builders remain cohesive; browser behavior gets a narrow explicit lifecycle                  |
| Browser gate     | Existing hosted `fresh-browser` gate                                       | CI already provisions Chromium and emits an atomic uploaded receipt for all `packages/fresh/**` changes  |

## Slice 1 validation status

| Check                       | Status                    | Notes                                                                                                                                 |
| --------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Research current and cited  | PASS                      | Exact installed/tag source paths and line ranges recorded in `research.md`.                                                           |
| Decisions locked            | PASS                      | Ordering, drain, history, API visibility, region key, placement, and hosted proof are explicit.                                       |
| Open-decision sweep         | PASS                      | Safe deferrals and rescope tripwires are named in `plan.md`.                                                                          |
| Slices and ceilings         | PASS                      | Two ordered slices, both under 30 files; per-slice proof, gates, files, ceiling, and landability stated.                              |
| Risk register               | PASS                      | Eleven implementation/browser/publish risks have mitigations and gates.                                                               |
| JSR plan audit              | PASS                      | New subpath documentation, explicit types, SSR import safety, publish list, doc lint, slow types, and private identity risks covered. |
| Browser strategy executable | PASS (planned)            | Existing CI command and receipt path named; deterministic A → B → A assertion object specified.                                       |
| Focused navigation tests    | PASS                      | 8 passed; controlled bodies reach EOF and report zero transport cancellation.                                                         |
| Consumer SSR/type fixture   | PASS                      | `deno check --unstable-kv packages/fresh/tests/type-fixtures/navigation-consumer_type.ts`.                                             |
| Structured package check    | PASS                      | 207 files, 2 batches, 0 findings; receipt stdout 303 bytes.                                                                            |
| Structured package lint     | PASS                      | 207/207 files, 0 findings; receipt stdout 355 bytes.                                                                                    |
| Structured package format   | PASS                      | 207/207 files, 0 findings; receipt stdout 304 bytes.                                                                                    |
| Structured package test     | PASS                      | 275 passed, 0 failed; receipt stdout 288 bytes.                                                                                         |
| Navigation public doc lint  | PASS                      | 1 entrypoint checked, 0 findings; expected result is on stderr (15 bytes).                                                             |
| Full Fresh export doc lint  | BASELINE FAIL / NO NEW    | 45 inherited findings in untouched builders/query/route/streams entrypoints; `./navigation` reports 0.                                |
| Package publish dry-run     | PASS                      | Exit 0; stdout 0 bytes is normal, stderr 21,094 bytes and ends `Success Dry run complete`; all four new production modules included.   |
| JSR package audit           | PASS with inherited warns | Exit 0; new surface is explicit. It reports existing AI directory cardinality and counts Deno's `Checking for slow types` status line. |
| Quality / architecture      | PASS                      | `quality:scan` findings `[]`; `arch:check` exit 0 and no warning for the 498-line coordinator.                                         |
| File ceiling / exports      | PASS                      | 9 package files: 6 production/config/docs + 3 focused tests; public barrel exports only the locked lifecycle, keyed boundary, and types. |
| Forbidden behavior scan     | PASS                      | Production navigation code contains no `.abort()` or `.cancel()` call and performs no server-marker rewrite.                          |
| Lock / diff hygiene         | PASS                      | `git diff --check`; no dependency specifier diff; lock SHA-256 remains `edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c`. |
| Runtime/browser gates       | NOT RUN (owner boundary)  | No local runtime, Aspire, Docker, or browser gate; hosted A → B → A proof remains Slice 2.                                              |
| PLAN-EVAL                   | PASS                      | Approved evaluator record is `plan-eval.md`.                                                                                           |

## Scope and hygiene record

- Slice 1 package diff is exactly the nine paths locked in `plan.md`; the contingency helper slot
  remains unused.
- `deno.lock` is required to match the baseline byte-for-byte.
- An exact-version inspection briefly added one generated lock resolution during research; it was
  immediately removed before artifact creation and is not part of the checkpoint diff.
- No browser gate was attempted locally; the plan explicitly uses hosted Chromium and does not treat
  this host's browser availability as a blocker.
- No local browser/runtime lease was taken. No label, acceptance box, evaluator dispatch, issue
  closure, ready-for-review transition, or merge action is part of this slice.

## Evidence receipts

Final durable receipts are under ignored
`.llm/tmp/gate-receipts/pr1590-s1/final2-*.json`. The full export-map receipt is intentionally
retained as `FAIL`: its breakdown proves all 45 findings are confined to four untouched entrypoints
and the new `./navigation` entrypoint has zero findings. The scoped public-doc receipt independently
passes. This satisfies the plan's zero-new-findings rule without expanding the locked file ceiling.

## Next authorized transition

Commit Slice 1 once, push by explicit refspec, and open the draft review checkpoint. Merging leaves
#1590 open; the supervisor owns Slice 2's hosted browser proof and all evaluator lifecycle.
