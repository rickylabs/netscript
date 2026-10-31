# Plan & Design — READY FOR REVIEW

Feature tier; supplied leaf profile. Primary package Archetype4 (Public DSL/Builder),
as assigned to Fresh UI by doctrine06; the small-contract concern is folded into it.
Frontend and docs overlays apply; existing interactive materialization adds real
browser/lifecycle/consumer gates. No new builder API or CLI command is introduced. PLAN-EVAL is mandatory before
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
5. Lock the fixture seam before category work in slice 1. Extend
   ContractStyleProvider with `contracts: readonly ComponentContract[]` and
   `keyboard: readonly ContractKeyboardFixture[]`; each keyboard fixture has
   `component`, `scenario`, `keys: readonly string[]`, and `expectation: string`.
   ContractRenderFixture gains `props: readonly string[]` describing the real
   caller API exercised. Preserve existing rendering backends. Providers live
   in tests/contracts/styles.ts (the only source-style registration table),
   with Utility initially. `registeredContractStyles` is the declared source
   style ID list, separate from the provider table; each ID must have exactly
   one complete provider. Registry `kind: style` CSS support items and token
   presets are explicitly excluded. Browser fixtures consume the same keyboard
   scenario identifiers, and tests require each shipped interactive contract's
   operations to have a matching browser assertion. Discover every registered
   source style from this explicit registration table. Token-only presets are
   not source styles. Reject missing/extra prop, part, value and keyboard
   changes using independent canonical contracts. Mutants exercise each axis.
   No claim of per-style implementations before S4–S6.
6. Tokens unchanged. New CSS references existing semantic tokens only. Record
   missing-token approximations, using the ledger's interim recipe. Compare
   new component screenshots with Utility light/dark renders; native internals
   may differ only where explicitly documented by the contract.

## Ordered slices

Each source slice includes worklog/context updates and generated carriers.
Each category slice (2–7 and9–11) also edits registry.manifest.ts, regenerates
registry.generated.ts, CLI embedded.generated.ts and publish assets; consumer
installation is then verified against that slice. Slice8 is reconciliation,
docs and evidence only, following the same pattern as phase2b.
Each requires independent read-only review before its signoff commit.

| Slice | Files and scope | Proof |
| --- | --- | --- |
| 1 | src/contracts/catalog/{layout-blocks,ai,docs-kit}, catalog.ts, contracts.json, contract tests/README, style-provider.ts and styles.ts registration | inventory104, unique IDs, lossless JSON, typed check/lint/fmt |
| 2 | Actions registry TSX/CSS and fixtures/tests | real renders, press/arrow keyboard behavior, installed sources |
| 3 | Forms radio/input-group/OTP/slider sources, CSS, fixtures/tests | native form/keyboard behavior, props and contract renders |
| 4 | Forms calendar/date-picker sources, CSS, fixtures/tests | date arithmetic, leap/month boundaries, disabled/range and browser keys |
| 5 | Navigation components, CSS, fixtures/tests | native links/current marker, menu focus/escape and stepper keys |
| 6 | Overlays sources/runtime composition, CSS, fixtures/tests | focus entry/return, escape, alert dismissal policy and context-menu keys |
| 7 | Data display gaps, CSS, fixtures/tests; audit existing Feedback/docs gap axes | collapse, carousel arrows/bounds, chart accessible labels and renders |
| 8 | Registry reconciliation, public docs, phase2a evidence | complete package/quality/publication/docs/consumer/runtime gates and IMPL-EVAL |
| 9 | Layout sources/CSS/registry and fixtures/tests | native scroll, ratio, RTL, resizable arrows and renders |
| 10 | AI sources/CSS/registry and fixtures/tests | disclosure keys, questionnaire form interactions and renders |
| 11 | Desktop audit and Docs kit sources/CSS/registry/fixtures | disclosure/link/copy behavior and contract renders |
| 12 | style checker/registered-style tests, docs/carriers and final evidence | every source style, missing-style refusal, all four negative mutations, full gates/IMPL-EVAL |

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

## Browser and issue decisions locked after PLAN-EVAL

The new component keyboard gate is a dedicated Playwright suite:
`tools/fresh-ui-browser/gap-tests/*.spec.ts`, `gap-fixture.tsx`,
`gap.playwright.config.ts` and a local fixture server/bundle under the same
browser tool. Use native `deno bundle` with the Fresh UI import map to bundle
real Preact sources; serve only the dedicated test fixture, shut it down after
the suite. The installed-source check separately runs ui:add for every new
registry item, validates emitted source/type/lint and demonstrates the fixture
imports match the installed source bytes after documented import relocation.
The browser spec contains actual keypress and focus/ARIA/value assertions;
metadata alone never proves keyboard behavior. No scaffold gallery route
changes are planned, so its fixed axe targets and baseline remain unchanged.
Every new standalone fixture must have zero serious/critical axe findings;
never loosen axe-baseline.json. Screenshot captures are review artifacts,
compared with handoff renders for anatomy/token treatment. They are labeled
local Linux captures; a future pixel gate needs baseline and test from the
same CI-pinned image. No cross-environment pixel identity is claimed.

Neither 2a nor2b closes #2416. The owner explicitly requires Refs only, and
2b delivers the style-contract harness while real alternate-style sources
remain S4–S6; the issue's full every-style acceptance cannot be claimed by
this phase alone. Existing phase1 acceptance proof is retained, not rewritten.
Cockpit retargets the stacked2b PR to main after merging2a; normal merges only,
no force push. The canonical final handoff follows the phase-specific operator
directive (Refs only), not the contradictory generic issue-closing template.

## Owner decision — additive style extensions

Authority: https://github.com/rickylabs/netscript/issues/2416#issuecomment-6541012019. A style may add declared extensions and may never change or remove base contract items. Names begin x-; presentational extensions map to data-x-* attributes read only by that style; structural extensions map to optional named slots or style-scoped blocks, empty by default. Each registry:style declaration records component, name, type, default and maps-to. Base contracts run for every registered source style; extension fixtures run only for their declaring style. Undeclared props, parts, variant values and keyboard changes still fail. The harness slice must include an undeclared-addition negative control and a declared x-extension positive control, plus the existing mutation negatives. Two-style demand promotes an extension into the base contract. Style-switch unsupported-attribute diagnostics and the Figma plugin manifest consume this declaration boundary in their owning workstreams.
