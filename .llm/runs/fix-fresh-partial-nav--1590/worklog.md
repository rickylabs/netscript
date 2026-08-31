# Worklog — Fresh partial-navigation coordinator

## Run metadata

| Field      | Value                                           |
| ---------- | ----------------------------------------------- |
| Run ID     | `fix-fresh-partial-nav--1590`                   |
| Issue      | `#1590`                                         |
| Branch     | `fix/fresh-partial-nav-ordering`                |
| Baseline   | `7ae7fe2dad941ed70e5806965fd964b9746d8fe1`      |
| Archetype  | 4 — DSL/builder, frontend/browser-runtime scope |
| Phase      | Plan & Design only                              |
| Gate state | `PLAN-EVAL: REQUIRED`                           |

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

## Plan validation status

| Check                       | Status                    | Notes                                                                                                                                 |
| --------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Research current and cited  | PASS                      | Exact installed/tag source paths and line ranges recorded in `research.md`.                                                           |
| Decisions locked            | PASS                      | Ordering, drain, history, API visibility, region key, placement, and hosted proof are explicit.                                       |
| Open-decision sweep         | PASS                      | Safe deferrals and rescope tripwires are named in `plan.md`.                                                                          |
| Slices and ceilings         | PASS                      | Two ordered slices, both under 30 files; per-slice proof, gates, files, ceiling, and landability stated.                              |
| Risk register               | PASS                      | Eleven implementation/browser/publish risks have mitigations and gates.                                                               |
| JSR plan audit              | PASS                      | New subpath documentation, explicit types, SSR import safety, publish list, doc lint, slow types, and private identity risks covered. |
| Browser strategy executable | PASS (planned)            | Existing CI command and receipt path named; deterministic A → B → A assertion object specified.                                       |
| Product/runtime gates       | NOT RUN                   | Plan-only checkpoint; implementation does not exist.                                                                                  |
| PLAN-EVAL                   | REQUIRED / NOT DISPATCHED | Separate supervisor-owned evaluator action.                                                                                           |

## Scope and hygiene record

- Intended diff: only this run's `research.md`, `plan.md`, `supervisor.md`, and `worklog.md`.
- No path under `packages/` or `plugins/` is intentionally changed.
- `deno.lock` is required to match the baseline byte-for-byte.
- An exact-version inspection briefly added one generated lock resolution during research; it was
  immediately removed before artifact creation and is not part of the checkpoint diff.
- No browser gate was attempted locally; the plan explicitly uses hosted Chromium and does not treat
  this host's browser availability as a blocker.
- No PR, label, evaluator session, issue mutation, or merge action was performed.

## Next authorized transition

After the single commit is pushed by explicit refspec, the supervisor runs PLAN-EVAL in a separate
session. Implementation remains stopped until that verdict is `PASS`.
