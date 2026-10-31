# Plan & Design — READY FOR REVIEW

Feature tier; supplied leaf profile. Archetype 1 contracts plus existing Fresh UI
presentation/runtime archetypes, frontend overlay. PLAN-EVAL is mandatory before
implementation, separate read-only Claude Opus 5.5 high as the owner specifies.

## Locked decisions

1. Extend schemaVersion 1: all 104 inventory identities appear in the public
   TypeScript catalog and identical JSON export; ledger deviations get specific
   notes. Preserve existing compatible names. Mark unimplemented components
   shipped=false until their real implementation and tests land.
2. Two review units because the inventory has 38 absent component identities.
   Phase 2a contains complete contracts and Actions/Forms/Navigation/Overlays/
   Data display/Feedback gaps; phase 2b contains Layout/AI/Desktop/Docs kit and
   the all-style harness. Keep both linked to #2416 without claiming completion
   of untouched acceptance. A second stacked draft may target the first branch
   while Cockpit owns merging; rebase is not required and no force push.
3. Native HTML first: input radio/range/date, details/summary, dialog/popover,
   scrolling/scroll-snap and dir. Add only the event/state logic needed for the
   declared APG keyboard semantics. Calendar needs real date navigation and
   disabled/range constraints, not a decorative date grid. Components expose
   contract parts, axis attributes and content slots with existing token roles.
4. Registry additions use main's manifest; no new installer/schema. Regenerate
   assets barrel after registry edits, including the CLI's embedded assets.
   When #2468 lands, merge origin/main and reconcile generated carriers.
5. The style test provider supplies actual renders, prop metadata and keyboard
   scenarios; discover every registered source style. Token-only presets are
   not source styles. Reject missing/extra prop, part, value and keyboard
   changes using independent canonical contracts. Mutants exercise each axis.
   No claim of per-style implementations before S4–S6.
6. Tokens unchanged. New CSS references existing semantic tokens only. Record
   missing-token approximations, using the ledger's interim recipe. Compare
   new component screenshots with Utility light/dark renders; native internals
   may differ only where explicitly documented by the contract.

## Ordered slices

Each source slice includes worklog/context updates and generated carriers.
Each requires independent read-only review before its signoff commit.

| Slice | Files and scope | Proof |
| --- | --- | --- |
| 1 | src/contracts/catalog/{layout-blocks,ai,docs-kit}, catalog.ts, contracts.json, contract tests/README | inventory104, unique IDs, lossless JSON, typed check/lint/fmt |
| 2 | Actions registry TSX/CSS and fixtures/tests | real renders, press/arrow keyboard behavior, installed sources |
| 3 | Forms radio/input-group/OTP/slider sources, CSS, fixtures/tests | native form/keyboard behavior, props and contract renders |
| 4 | Forms calendar/date-picker sources, CSS, fixtures/tests | date arithmetic, leap/month boundaries, disabled/range and browser keys |
| 5 | Navigation components, CSS, fixtures/tests | native links/current marker, menu focus/escape and stepper keys |
| 6 | Overlays sources/runtime composition, CSS, fixtures/tests | focus entry/return, escape, alert dismissal policy and context-menu keys |
| 7 | Data display gaps, CSS, fixtures/tests; audit existing Feedback/docs gap axes | collapse, carousel arrows/bounds, chart accessible labels and renders |
| 8 | Registry manifest, generated carriers, public docs, phase2a evidence | complete package/quality/publication/docs/consumer/runtime gates and IMPL-EVAL |
| 9 | Layout sources/CSS/registry and fixtures/tests | native scroll, ratio, RTL, resizable arrows and renders |
| 10 | AI sources/CSS/registry and fixtures/tests | disclosure keys, questionnaire form interactions and renders |
| 11 | Desktop audit and Docs kit sources/CSS/registry/fixtures | disclosure/link/copy behavior and contract renders |
| 12 | style-provider/checker/registered-style tests, docs/carriers and final evidence | every source style, missing-style refusal, all four negative mutations, full gates/IMPL-EVAL |

Split a slice further only to keep the reviewed file surface below thirty;
category boundaries and complete behavior remain the unit of delivery.

## Gate set and acceptance

F-1/3/5/8/10/11/12/14/15/16/17/18: quality:gate (includes arch:check) plus
manual source/public-surface review where scripts lack coverage. F-19:
structured scoped check/lint/fmt/test wrappers, full Fresh UI tests, registry
installed-template lint guard. F-6/7: release:preflight, static JSR package audit
and doc-lint with baseline attribution; no slow-type/import-attribute regressions.
Frontend: contract render + browser keyboard tests and Utility visual review,
consumer copies exercised through registry. Root docs:accuracy, every applicable
check:* task and all four carriers (prose, corpus, assets barrel, publish assets).
Regenerate carriers, then freshness-check them; revert docs/site/deno.lock churn.
Release-gate class: exactly one full deno task e2e:cli run scaffold.runtime
--cleanup --format pretty per final source review unit. Docker-unavailable is
UNPROVEN, never success. Required remote checks must be green at the reported
head before READY; no merge/tag/release. No labels or session IDs in public work.

## Risks, open-decision sweep and deferred scope

Native semantics and hydration are the main risk: test in a real browser and
retain actual consumer rendering rather than testing duplicated DOM strings.
Large inventory risks contract drift: derive expectations from the locked spec,
review ledger differences, and fail coverage when a shipped fixture is absent.
S2 can land during work: reconcile with a normal merge, regenerate and rerun.
Missing Docker or evaluator capacity cannot be papered over; report unproven
and leave the draft concrete and resumable if a mandatory gate cannot execute.

Resolved now: inventory104, complete phase2a/2b split, data schema unchanged,
no dependencies, registry integration/carrier ownership, style fixture seam.
Safe to defer: real alternate-style source implementations (S4–S6), token value
updates (#2450), Pagefind network/backend adapter (S8 docs application concern).
Any docs-gap component enhancements still required must be implemented in the
category slice or explicitly listed as incomplete in its PR, not marked done.
No new architectural debt is accepted. Contributor entry remains
packages/fresh-ui/src/contracts/README.md.
