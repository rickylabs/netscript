# Plan: bind the Fresh navigation platform fetch

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `fix-fresh-navigation-fetch-binding--1900` |
| Branch | `fix/fresh-navigation-fetch-binding` |
| Phase | `plan` |
| Target | `packages/fresh` navigation runtime |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `frontend` |

## Archetype

`packages/fresh` is assigned Archetype 4 by doctrine. This slice changes an internal runtime used by
that public DSL without widening or reorganizing the package.

## Current Doctrine Verdict

`Keep` — preserve per-concern builders and route contracts. This fix preserves the existing
navigation entrypoint and its seven exported symbols.

## Axioms in Play

| Axiom | Why it matters |
| ----- | -------------- |
| A2 | Preserve the simple published navigation contract while correcting internal browser behavior. |
| A7 | Invoke the Web Platform `fetch` with its required browser receiver. |
| A13 | Keep logical supersession and disposal failure boundaries unchanged. |
| A14 | Add a receiver-sensitive regression and retain the existing drain/EOF gates. |

## Goal

Capture a receiver-bound callable for the platform fetch while retaining the raw function for
identity-preserving restoration, and prove both transport call sites cannot detach the receiver.

## Scope

- Update `coordinator.ts` to capture a separately bound fetch callable and use it for pass-through
  and partial navigation requests.
- Add one receiver-sensitive unit regression in `coordinator_test.ts` covering both paths.
- Maintain harness evidence under this run directory.

## Non-Scope

- No changes to `keyed-partial.tsx`, `types.ts`, `mod.ts`, package exports, docs/reference corpus, or
  #1895 fixtures.
- No coordinator restructure and no semantic changes to ordering, logical abort handling, draining,
  EOF disposal, wrapper restoration, or history behavior.
- No local Chromium, Docker, Aspire, or `e2e:cli`; hosted `fresh-browser` proof is supervisor-owned.

## Hidden Scope

- Retain the unbound raw function solely for the existing restoration identity comparison.
- Explicitly scan production navigation code for `.abort(`, `AbortController`, and `.cancel(`.
- Verify `deno.lock` and the seven-symbol export surface are unchanged.

## Locked Decisions

| ID | Decision | Rationale |
| -- | -------- | --------- |
| D1 | Store a second, receiver-bound fetch callable at construction. | Binding `originalFetch` itself would alter the function restored during final disposal. |
| D2 | Bind the callable to `globalThis`, the browser `Window` receiver. | The production platform fetch is `globalThis.fetch`; real browsers require the Window receiver. |
| D3 | Exercise intercepted partial and ordinary pass-through fetches in one regression. | The coordinator has two independent invocation sites and both must preserve the receiver. |

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| Receiver and restoration strategy | resolved now | D1 and D2 lock the implementation without changing disposal identity. |
| Browser rerun timing | safe to defer | The features supervisor owns hosted `fresh-browser` after this PR. |

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| Binding the wrong object | Regression throws unless `this === globalThis`, matching Window semantics. |
| Restoration identity drifts | Keep `originalFetch` raw and retain the existing equality assertion on disposal. |
| Drain-never-abort regresses | No body/lease logic changes; run the focused tests and forbidden-token production scan. |
| Public surface drifts | Do not touch entrypoint/type files; compare `deno doc` symbol count before and after. |
| Lock churn | Record the initial `deno.lock` hash and reject any diff. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| -- | ------ | ---- |
| AP-2 | risk | Use native function binding; add no helper wrapper. |
| AP-9 | risk | Make the minimum local change; introduce no abstraction beyond the required callable. |
| AP-11 | clear | Capture the browser receiver explicitly at construction instead of relying on invocation syntax. |
| AP-25 | existing edge | Navigation is the designated browser edge; do not add new side-effect classes. |

## Fitness Gates

| Gate | Required | Expected evidence |
| ---- | -------- | ----------------- |
| F-1–F-5, F-8–F-19 (Archetype 4 applicable set) | yes | `deno task quality:gate` plus manual diff/surface review |
| F-6 / F-7 | yes | Fresh JSR audit, structured doc lint, and package publish dry-run |
| F-19 | yes | scoped structured check/test/lint/fmt wrappers |
| Browser subtype | hosted | Existing failure is supervisor-owned; no local browser per lane constraint |

## Arch-Debt Implications

| Entry | Action | Notes |
| ----- | ------ | ----- |
| Fresh navigation fetch binding | none | The defect is fixed in this slice; no violation is deferred. |
| Existing Fresh debt rows | none | Unrelated and neither deepened nor closed. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| ----- | ---- | ---------------- | --------------- |
| 1 | Regression | structured test wrapper over `packages/fresh/src/runtime/navigation` | receiver-sensitive and drain tests pass |
| 2 | Check | structured check wrapper rooted at `packages/fresh` | PASS |
| 3 | Lint | structured lint wrapper rooted at `packages/fresh` | PASS |
| 4 | Format | structured fmt wrapper rooted at `packages/fresh` | PASS |
| 5 | Doctrine quality | `deno task quality:gate` | PASS |
| 6 | JSR/docs | Fresh audit, structured doc lint, package publish dry-run | PASS / no surface delta |
| 7 | Invariants | forbidden-token scan, export comparison, `deno.lock` diff | zero production hits; seven exports; no lock delta |

## Dependencies

- Fresh 2.3.3 browser semantics already diagnosed by issue #1900 and hosted run `33542380097`.

## Drift Watch

- Any need to edit outside the two product files, any public symbol delta, any transport cancellation,
  or any local browser/resource gate is significant drift and requires stopping or rescoping.
