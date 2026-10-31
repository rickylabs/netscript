# Worklog

## Design

1. Public surface: schema-v1 contracts for 104 identities, copy registry items
   with Preact props/parts/attributes/slots, a style fixture test interface.
2. Vocabulary: inventory identity, source style, token preset, contract part,
   semantic scenario, native behavior. Source styles preserve the same API;
   token presets change values without replacing component source.
3. Ports: Preact render/JSX, native HTML input/dialog/popover/details, the
   existing registry manifest/CLI copy pipeline, style fixture provider.
4. Constants: contracts define axis values and keyboard vocabulary. Reuse
   existing CSS token roles; no new token values or volatile model literals
   outside this owner authorization record.
5. Commit slices: the twelve ordered category slices in plan.md, with named
   file scopes and gates; each includes context-pack/worklog updates.
6. Deferred scope: alternate real styles, token changes, Pagefind backend;
   phase 2b is a separate complete review unit after phase 2a.
7. Contributor path: packages/fresh-ui/src/contracts/README.md.

## Owner matrix override

Exact authorization: "Get PLAN-EVAL first: `claude -p --model claude-opus-5-5 --effort high`, read-only."
Exact authorization: "IMPL-EVAL: `claude -p --model claude-opus-5-5 --effort high`, read-only, blockers only."
These override feature evaluator model cells only; separate-session and
separate-vendor-family independence remain required. Implementer uses the
assigned Codex seat. No privileged tier requested.

## Bootstrap

Assignment read in full. Earlier S3 memory read before code. Routing resolved.
Figma handoff fetched read-only; S2 is still open. No duplicate phase2 PR found.
PLAN-EVAL pending; no product implementation yet.

## PLAN-EVAL correction

Round1 FAIL_PLAN identifies four planning blockers: fixture registration/API
must precede components; name the browser gate; register each source slice
before consumer proof; explicitly leave issue closure to full later acceptance.
All four are now locked in plan.md. New Playwright files are inside the already
authorized browser-tool scope; CLI generated embeds remain carrier-only.

PLAN-EVAL round2: PASS in the same independent read-only reviewer. The new browser suite is local evidence unless explicitly added to CI; no remote coverage is claimed. Build its runner/config in slice2.

## Slice1 — contract inventory and style seam

104 unique contracts: all11 category sections,66 shipped/38 unshipped. Added17
identities and explicit ledger deviations. Existing rendering fixtures remain
complete; style registration moved out of the test module. No runtime/code or
token changes. Independent read-only slice review: PASS (s1-review.md).
Structured tests: catalog/serialization4/0 and whole contract suite81/0.
Structured check/lint/fmt:54/54 files, zero findings or dropped files.
Broader quality:gate including dependencies/architecture PASS; release:preflight
PASS, zero import-attribute/file-url/self-import findings. Full package suite is
still running as an additional baseline check, not claimed passed.
Reconcile: phase1 API and 66 shipped identities unchanged; S2 is still open.
Review followups (nonblocking): fill real fixture prop names, test declaration
and render drift separately, document CSS-transient states when components land.

Full Fresh UI package suite completed:300 passed,0 failed,0 ignored (168104ms).
Asset-barrel generation completed with zero generated-source diff. No lock churn.
Slice1 is terminal PASS with independent review; proceed to category slices.

## Slice2 — Actions and browser fixture

ButtonGroup, Toggle and ToggleGroup implemented; typed contracts now69 shipped,
35 explicit gaps. Actions render cases cover orientations/sizes/variants and
conditional parts. Controlled/local pressed state; roving single/multiple toolbar
focus with disabled skipping, wrap, Home/End and RTL; native form behavior stays
on buttons. Registry entries and embedded carriers generated in the same slice.
Dedicated native Deno bundle + Playwright fixture added; no gallery baseline edit.
Initial browser startup found missing shared libraries and Deno precompile bundle
emitting classic React calls. Reused existing project-managed libraries read-only
and added a react-jsx fixture config. Browser matrix20/20 PASS across light/dark
and390/1280, zero serious/critical axe violations. Further typography refinement
uses existing strong roles; final rerun follows. Local screenshots are review
artifacts, not cross-environment pixel baselines. Contract suite100/0; registry
carrier/doc projection tests6/0. Real copied-source consumer check is in flight.
Main1d467c6 merged normally before this slice (upstream watcher changes including
reviewed upstream lock updates); no local dependency/lock edits.

Independent slice2 review FAIL_FIX: manual browser bundle could be stale.
One corrective pass: Playwright's webServer command now builds current sources
before serving; failure stops startup; output is the ordinary ignored test-results
bundle, not run-specific scratch. Poisoned old output before rerunning all20
cases to prove a stale bundle is replaced. Also applied the review's Utility
marker/island documentation corrections. Same reviewer re-review is next.

Slice2 corrected final evidence:107 focused tests pass (100 contracts,6 carrier/
projection,1 actual install/type/lint). New browser20/20 passes after rebuilding
from restored current source, zero serious/critical axe. Actual broken-focus
source control exits1; restoration is byte-identical and final suite auto-rebuilds.
Same reviewer round2 PASS. Source checks16 package files +2 browser spec/config
+2 fixture/server pass;23-file fmt and focused lint pass. quality:gate, release
preflight and docs:accuracy99/99 pass. No local lock changes. Utility light/dark
captures retained; no pixel identity with Figma/CI claimed. Slice2 terminal PASS.

## Slice3 — Forms primitives

Native RadioGroup, InputGroup, InputOTP and Slider implemented and registered;
73 shipped/31 remaining gaps. Radio uses fieldset/legend/named inputs; InputGroup
keeps DOM and visual tab order aligned and uses disabled fieldset propagation.
OTP has one real native code input with grouped aria-hidden slot mirrors,
selection-aware sanitized paste and controlled refusal. Slider has one/two native
ranges, shared min/max geometry and clamped crossing requests, with native key
steps and form names. Design checked/content axes belong to controls/slots;
operational group APIs are documented in contract notes. No backend/network code.

114 contract tests PASS; generic consumer install/source/type/lint proof covers
all7 registered gap items. Browser52/52 PASS, including actual clipboard paste,
controlled rejection for radio/OTP/range, radio form values, disabled controls,
tab order, native keys, two-thumb boundaries and vertical direction. Four
width/scheme projects; zero serious/critical axe. New browser tests/config and
fixture/server check3+3 PASS; source check5/lint6 PASS. Quality and independent
review are running; slice not yet committed. Figma handoff5db9515 merged normally.

Independent slice3 review FAIL_FIX: coincident native range thumbs could trap
pointer users at the maximum. One corrective pass is adding a pointer regression
and derived thumb stacking; capture the actual pre-fix failure, then rebuild and
run all browser projects. Invalid form-control semantics will also be exercised.

Slice3 repair proof: real pointer regression reproduced at coincident max100
before the source change (lower stayed100), then passed at both max and min in
all four browser projects. Final browser60/60 PASS; strict axe includes invalid
radio/control error relationships. Final focused121 tests PASS. Same evaluator
round2 and final source wrappers are pending. No new public stacking axis;
native-input layering derives only from existing thumb values.

Slice3 terminal PASS: same independent reviewer FAIL_FIX -> pointer/accessibility
correction -> PASS. Final121 focused tests and60 rebuilt-source browser cases
pass, including four actual pointer regressions and strict axe. Source check17
and browser checks3+3 pass; source lint6/format17 pass; broader quality passes.
No local token/dependency/lock changes. Source scope remains Forms primitives.
Next is the Calendar/DatePicker slice, with a separate category review.

## User-requested rebase and S2 integration

Rebased four own commits onto main6b7f152 (merged S2 registry v2). All existing
S2 sources/schema/installer remain.7 gap items now authored in registry.json with
native file types/metadata, style-utility mappings and Actions/Forms collections.
Compatibility manifest is main's unmodified projection. Carriers regenerated.
Native registry inventory93 and collection docs updated. Browser60/60 and broad
quality PASS on rebased code. Initial focused124 tests passed after inventory/
collection repair; expanded legacy-authoring audit then required explicit post-v1
allowlisting. Frozen legacy-v1.json is unchanged; negative controls protect
missing/changed baseline and unexpected/missing new items. Generic consumer test
now requires the exact7 reviewed component names, so an empty selection fails.
Same reviewer corrective re-review and expanded tests pending. No READY claim.

Registry integration repair is independently PASS after one correction. Expanded
130 focused tests pass (contracts, installed copies, frozen compatibility negative
controls, published schemas and static registry build). Rebuilt-source browser60
passes; source wrappers5 check/lint pass; quality gate, release preflight and
updated docs accuracy111/111 pass. Source commit precedes carrier generation to
honor the MCP generator's clean-read-set guard. User-authorized force-with-lease
will replace only the known old branch headf6d9ae4 after freshness validation.

All four carrier freshness checks now pass, with public corpus refreshed from
clean source. Full package run:347 passed and1 stale design-sync item-count
assertion failed (85 ->92 after7 intentional additions). The design-sync gate now
derives its count from the frozen v1 snapshot plus the explicit post-v1 list,
and still refuses portable style-utility leakage. No product behavior changed.
Targeted inventory rerun follows; do not call the initial full run all-green.

Reconcile: latest main advanced again to ad252e8 (queue lease repair and CLI
example documentation). Replayed all six feature commits cleanly onto that
head; no additional source conflicts. The prior targeted design-sync rerun
passed all9 tests. Canonical S2 registry inputs and generated artifacts remain
part of this branch. Force-with-lease targets exactly the published8d093a9.
Required CI jobs currently report SKIPPED while draft; this is not a READY
claim. Calendar/DatePicker remains uncommitted work for the next slice.

## Slice4 — Calendar and DatePicker

Two date controls plus one private copied arithmetic support item. Single/range
ISO API, Gregorian leap/century arithmetic, months/caption, disabled/bounds,
roving enabled days and native form values. DatePicker composes the package's
native Dialog with anchored styling, named title/description, Escape/Cancel and
focus return. Registry source style/collections and frozen-v1 addition allowlist
updated;75 shipped/29 remaining. No new token values or dependencies.

A rapid month-crossing key sequence exposed delayed focus; useLayoutEffect
restores focus on the new rendered day before subsequent input. A real browser
trace confirmed native modal BODY boundary focus; tests require :modal, re-entry
and background inertness rather than introducing an artificial JS focus loop.
Standalone consumers/public runtime entry resolve the root catalog derived at
run time; no second catalog is committed. First corrected full browser80/80
passes; final outside-day visual refinement is being rerun with all fixtures.
Scoped source check/lint and consumer install/source/type/lint proof pass.
Broad quality PASS; final focused tests and same-reviewer sign-off pending.

Final focused130/130 tests PASS; scoped source7 check/6 lint/10 format PASS,
browser fixtures3 and specs4 type-check PASS. Whole browser80/80 PASS, zero
serious/critical axe in the standalone fixtures and open date dialog. Existing
CSS variables all resolve to shipped theme definitions. Same independent reviewer
is evaluating this slice; final selected-hover browser rerun is pending.

Independent slice4 review FAIL_FIX: range-middle cells inherited selected visual
state and primary fill, obscuring the lighter range fill. Computed-token browser
negative control reproduced the wrong primary color before correction. Endpoints
now own selected visual state; all range cells retain aria-selected. Browser
asserts middle equals resolved surface-selected and differs from endpoints.
Own controlled-state audit also protects native cancel when parent refuses the
close request, and adds a real Escape/Cancel/value-refusal browser case. Reopening
resets browsing to the selected month; a canceled browse cannot become the next
opening month. UTC today default is now documented. Corrected full browser84
and render gates are running before same-session corrective review.

Slice4 terminal PASS after one range-fill correction. Final full browser84/84
PASS plus24/24 date-only after range aria-multiselectable and screenshot proof.
Corrected123 focused tests PASS; broader quality PASS, source/spec wrappers
PASS, release preflight/docs accuracy111 PASS. Full package356/356 PASS before
the small correction; final phase full suite still repeats. Same independent
reviewer round2 PASS. Native browser-forced repeated Escape is documented as a
platform limitation; normal controlled rejection, native focus and submission
are covered. Local Linux screenshots reviewed against Utility handoff anatomy
and retained under review/. No cross-platform pixel-identity claim.

Slice4 source committed; clean-source MCP corpus and all four carrier freshness
checks PASS. Docs build253 HTML/97 registry artifacts; no docs lock churn.
Push/comment completes this slice; next is Navigation.

## Slice5 — Navigation

Native NavigationMenu links/exclusive details, decorative LocationMarker, ordered
Stepper links/status and Menubar with shared copied action/checkbox/radio/submenu
content. New helper menu-items is a support item, not another public Figma identity.
79 shipped/25 gaps;13 new registry components and2 support items;101 native items.
Every new item maps through style-utility; navigation collection documented.

Related ActionMenu runtime updates: caller-owned checkbox/radio roles, optional
closeOnSelect, first/last entry, scoped traversal/typeahead. Native popovers
promote in layout, avoiding rapid-key loss; menu entry uses native autofocus
and the same edge in the layout/toggle paths. Outside/programmatic dismissal
keeps its destination focus; Escape/explicit close return to the trigger.
No new global listeners or second popover engine.

Initial142 focused tests pass, including native registry/legacy guard and actual
consumer copies. Browser found native blur does not bubble (use focusout), a
function-component ref was not a native button (query the private DOM wrapper),
and rapid submenu arrows exposed deferred native promotion. Those real failures
are being corrected, including directional submenu placement. Current source
check6 then3, lint9 and all new CSS token references pass. Full browser/quality
and independent review follow; do not start Overlays until terminal PASS.

Navigation gates:142 focused tests,108 full browser cases (strict axe), scoped
source/fixture/spec wrappers and broad quality PASS. Global interactive doc-lint
123 errors exactly reproduced in pre-slice c788023 full checkout by code/message/
relative-file, zero introduced/removed. Final source review is in flight with
the same independent evaluator; no Overlays work starts before terminal signoff.

Independent slice5 review FAIL_FIX: a closed NavigationMenu swallowed Escape and
blocked an enclosing native Dialog's cancel request. Actual browser negative
control reproduced the dialog remaining visible. The handler now cancels Escape
only when a native disclosure is open; new modal tests cover both boundary levels
and trigger/summary focus return. Nonblocking notes also addressed: panel links
accept current/aria-current and runtime autofocus marks clear with open lifetime.
Corrected112 browser and142 focused tests are running before corrective review.

Slice5 terminal PASS: same independent reviewer FAIL_FIX -> real native dialog
negative control -> focused Escape correction -> PASS. Corrected112/112 browser
and142/142 focused tests pass. Corrected broader quality receipt PASS/exit0;
publication preflight/docs accuracy111 PASS. Registry doc-order repaired to match
native metadata; targeted design/doc-drift gate9/9 PASS. Source/fixture/spec
check/lint/fmt PASS. No token/dependency/lock changes. Final carriers and push
complete this slice before Overlays starts.

Slice5 source de67b38 signed off; all four carrier freshness checks PASS after
clean-source MCP regeneration. No lock churn. Push/comment closes this slice.

## User-reported current CI build failure

Paused Overlay research (no Overlay implementation yet). Currency gate confirms
current-fail build at6b42a62, Pages run41171444610/job124450236782. Failed step
was docs:exports-drift: published Fresh UI reference omitted new role vocabulary
ACTION_MENU_ITEM_ROLES and ActionMenuItemRole. Added both to the actual public
inventory and explained choice state, closeOnSelect and initialFocus behavior.
Running the Pages export/snippet/build/link/caveat checks before repair push;
no gate weakening or new product implementation in this repair.

CI documentation repair independently PASS. Exact docs:exports-drift and
docs:snippets PASS; full Lume build253 HTML PASS via prose generation;23734
internal links resolve and13 caveat markers resolve. Prose regenerated. No source
behavior, export or lock change. Clean-source corpus/publication and all carrier
freshness checks follow this reviewed source commit before push.

CI build repair complete locally: reviewed source f21bff4; all four carrier
freshness checks PASS, no additional generated change after prose refresh.
Exports/snippets/build/links/caveats all PASS. Push triggers fresh Pages CI;
remote success remains pending. Resume Overlay slice after push/comment.

## Coordinator public-path audit

Audited all added lines against current origin/main, including every added run artifact, at c644a44596623fd93be1dc0cd77897f76d88a399: zero forbidden absolute home, ephemeral or temporary-root paths. Existing run artifacts are already portable; no replacement was needed. Added memory-public-path-hygiene.md to preserve normalization rules for future logs and require an explicit zero-hit statement in final-head READY. Repository-relative scratch paths remain valid. Re-run the whole-PR added-line audit after this note and again before eventual READY; implementation slice status is unchanged.

## Latest-base conflict recovery

Replayed the reviewed Actions, Forms, Calendar and Navigation slices and both coordinator audit commits onto Theme B main. Preserved all six generated theme registrations, their preview files and metadata. Kept main's structural registry comparison and full design-sync name equality; retained explicit post-v1 component/support allowlists and negative controls for the frozen legacy inventory. Normalized historical preview comparison only; the independent complete preview-output guard remains. Regenerated registry embedding, CLI template/source assets and public prose from the combined authoring surface. Source test wrappers report no diagnostics; 135 focused contract/registry/copied-consumer tests and quality/architecture gates PASS. Public export drift PASS and docs build generated 253 HTML pages. Browser and independent integration review are pending at this note. The whole-PR added-line portable-path audit reports zero forbidden roots and will be repeated after final commits. Overlay work is safely saved and remains uncommitted pending corrective independent review.

Latest-base integration independently reviewed PASS (rebase2-review.md). All112 rebuilt-source browser cases PASS; release preflight and docs accuracy PASS. Registry/source/prose assets regenerated from combined source. Remaining clean-source corpus refresh and carrier freshness checks precede the recovery push. This is recovery of reviewed slices, not phase completion.

Recovery source4d9a356 includes latest main3d83caf (auth cookie fix) without additional conflicts. All four generated carrier freshness checks PASS; clean-source MCP corpus is unchanged after regeneration. Focused135/browser112/quality/publication/docs gates and independent integration review PASS. Full Fresh UI package regression suite is still running and is not claimed green by this recovery push. Phase implementation continues; draft remains incomplete.

Coordinator public-path instruction acknowledged: final READY audit must include
all added lines, with run evidence using repository-relative/shorthand paths.
Current audit found zero prohibited absolute path hits across1260 added run
lines and across the complete diff. Repeat at the exact final head. New public
notes/logs use relative paths; opaque local transport remains uncommitted.

## Slice6 — Overlays

AlertDialog composes native Dialog (cancel focus, explicit actions, outside-click
non-dismissal); HoverCard composes Popover with focusOnOpen=false and a pointer
transfer grace; ContextMenu reuses ActionMenu/menu-items with native region keys,
client coordinates and viewport clamping. Added two needed curated L0 paths
(calendar/alert triangle), no icon library or token changes.82 shipped/22 gaps;
native104 items,16 reviewed component additions and2 support items.

Initial source4 check PASS. Render tests exposed nested Button label anatomy;
contract now declares label and optional spinner, with a pending render case.
Strict browser axe exposed existing destructive-white contrast3.91; one scoped
existing-role pair inversion preserves AA and records the visual deviation in
drift. No palette/global Button or axe-baseline changes. Other browser gates
and same-session review remain pending; do not start Data display yet.

Overlay gates:158 focused tests and132 full rebuilt-source browser cases PASS,
including native modal boundaries, controlled rejection, hover pointer transfer,
context keys/submenus/viewport bounds and strict axe. Broad quality PASS; source
4 check/7 lint/8 fmt, browser fixture/spec checks and lint2 PASS. Exports-drift
PASS; current remote Pages build also SUCCESS atc644a44. Full package compilation
exposed Node Timeout vs browser number in the private hover timer; changed its
type to native ReturnType<typeof setTimeout> and reran full package/focused proof.
No runtime behavior changed in that correction.

Full package378/378 PASS after native timer handle type fix. Final focused143,
actual installed-source1 and final hover8 cases PASS; prior full browser132 and
expanded158 focused include the same behavior. Local light/dark captures reviewed
against handoff anatomy; default Avatar square uses existing control radius,
custom slot unaffected. Same independent slice review is running.

Independent Overlay review FAIL_FIX: touch tap opened on pointer-enter/focus and
then click immediately closed the preview. Actual hasTouch browser negative
control reproduced the hidden card after tap. Only mouse pointer-enter/leave
now previews; a pointer press suppresses separate focus opening until click,
so touch/pen activation toggles once. Mouse click after hover deliberately
closes; this choice is documented. Dedicated touch case stays open beyond grace,
uses its link and closes on second tap. Corrected25 Overlay cases PASS across
four desktop projects plus touch, with zero skips via device-specific selection.
Added explicit destructive hover selector and actual hover axe check. Final137
full browser/158 focused/quality proof is running before corrective review.

Post-rebase baseline full Fresh UI suite PASS372/372. Saved Overlay source restored, preserving recovery/coordinator notes and main Theme B registrations; native inventory110 (92 main +16 new components +2 supports), shipped82/104. The corrected Overlay snapshot under independent review matches restored sources; rerun current-base gates before signoff.

Overlay corrective review PASS (overlays-review-round2.md), scoped to the actual saved source; verified eleven restored source/test files byte-for-byte against that snapshot. The touch negative control failed before correction and the full old-base corrected matrix passed137. On current main, focused contracts/runtime/registry/installed-consumer tests PASS192; source and browser fixture/spec type/lint/fmt wrappers PASS; quality/architecture PASS. Docs export inventory and fresh prose build PASS. Current-base complete browser matrix remains in flight. Rebased baseline full package PASS372; final whole-phase package/runtime/IMPL-EVAL still required.

Current-base full Overlay/browser regression matrix PASS137/137 (four light/dark desktop viewport projects plus actual touch). Captures refreshed from this source. Independent corrective review PASS and192 focused tests/source-browser wrappers/quality/docs exports/prose PASS. No token values or lockfiles changed. Final publication/docs accuracy and clean-source generated carrier checks precede the slice push. Evidence scope and pending whole-phase gates are explicit in overlays-validation.json.

Overlay source137447c independently signed off, clean-source corpus refreshed and all four carrier freshness checks PASS. Slice6 is terminal after push/comment. Completed source now82/104; next is Data display5 plus CodeBlock/Feedback/docs-gap audit, split into smaller review slices to bound the source surface. Current recovery head ffc0e5c remote Pages build and Utility docs browser/style-policy jobs both SUCCESS; new push requires fresh exact-head CI.

## Slice7a design — Item, Kbd, Collapsible

Split the locked Data display slice to keep each independent review bounded:7a Item/Kbd/Collapsible;7b Chart/Carousel;7c CodeBlock and Feedback/docs-gap reconciliation. This preserves the approved scope and dependency order. Public surface: copy-registry Item with explicit media/content/actions/header/footer slots and native child links/buttons; Kbd/Kbd.Group native keyboard notation; Collapsible native details/summary with controlled/uncontrolled open, disabled, label/content and open-change callback. Vocabulary: Item is presentation (never a button wrapper), Kbd is notation (never focusable), disclosure is native summary activation. Ports: existing Preact, cn and Icon only. Constants: typed variant/size domains and existing semantic tokens, no dependencies or token edits. Contract declarations precede implementation. Gates: render axes/parts, installed copies, actual Tab/Enter/Space and controlled-refusal/disabled browser checks, strict axe and Utility captures, wrappers plus quality/architecture and carriers. Deferred: remaining locked Data display groups and phase2b. Contributor entry stays src/contracts/README.md.

Slice7a independent review PASS with nonblocking refinements: switched Item to the precise existing radius/input and stack-gap roles, corrected state props outside the part-visibility boolean list, documented native disclosure behavior before hydration, and added browser assertions for native open mutations in uncontrolled, controlled-refused and disabled instances. Retained whole-row hover/focus decoration after comparing handoff PNGs: those states exist in the design, while only native child controls remain actionable. Item title links inherit its semantic ink and header/footer use caption/muted roles; fixture uses the shipped Button in its action slot. Corrective rereview and updated gates precede commit.

Slice7a substantive initial and corrective reviews PASS (display-basics-review-round1/2.md). Latest contract/copied-consumer160 and all16 updated browser cases PASS, including native DOM changes and exactly-one controlled callback. Initial registry/contract168 also PASS. Wrappers/quality/publication/docs accuracy/export drift PASS; six fresh local captures retained. Existing semantic roles only; no dependencies or token/lock edits. Inventory85/104, registry113. Final clean-source corpus and four carrier checks precede push/comment. Remaining7b Chart/Carousel,7c CodeBlock/Feedback/docs reconciliation and final phase2a gates/IMPL-EVAL remain mandatory.

Slice7a source76c85a8 and clean-source corpus refresh complete; all four carrier freshness checks PASS. Both independent review rounds PASS; gates summarized in display-basics-validation.json. Push/comment closes7a. Remote Overlay head bace6f8 Pages build and Utility docs browser/style-policy both SUCCESS. Next7b Chart/Carousel, with latest per-theme chart palette ledger taking precedence over earlier chart colors.

## Slice7b design — Chart and Carousel

Public surface: copy-registry Chart with area/line,1–3 labeled data series, rest/hover/loading/empty, legend orientation, tooltip indicator, native data-table disclosure and semantic SVG labels; Carousel with horizontal/vertical native scroll-snap viewport, outside/inside controls, optional dots/counter, labeled slide slots and index-change notification. Chart's table disclosure is a deliberate accessibility addition to the visual handoff: it exposes exact source values to keyboard and assistive technology without a chart widget key manager. Series count is derived from the actual1–3 series collection; legend orientation never rotates the plot. Carousel has no autoplay, global listeners or synthetic gesture engine; inactive slides become inert only after hydration, and boundary controls use guarded aria-disabled to retain focus after activation. Constants name SVG geometry/tick count and carousel default viewport geometry. Ports: Preact, native SVG/details/scroll-snap/ResizeObserver and existing cn/EmptyState/Skeleton; no dependencies or token changes. Latest chart-palette ledger owns color roles. Gate: axis/state render coverage, source data validity, real native data-disclosure and carousel focus/bounds/RTL/resize/scroll tests, strict axe, Utility captures, installed copies, wrappers/quality and carriers. Remaining7c and phase2b are deferred as locked. Contributor entry unchanged.

Initial7b gates:217 focused tests and source check/lint PASS. Native chart disclosure and carousel controls pass in-browser. The wheel test incorrectly used a fixed400px distance across responsive viewports; on390 this exceeds one-and-a-half slides and correctly reaches3/3. Corrected the test to scroll one measured viewport width (native gestures may traverse multiple slides; button activation is the one-slide contract). Added actual Chromium touch-swipe/tap coverage, with native final alignment and current-slide inertness assertions, rather than relying on desktop mouse emulation. Visible8px square dots have24px pointer targets; vertical dots sit beside the viewport per handoff. Chart data disclosure is an explicit accessibility addition.

Strict7b axe caught prohibited aria-label on unroled SVG g series containers. Removed those redundant labels: the atomic SVG image already has a title/description naming its series, and exact labels/values remain in the visible legend and native table. No axe allowance or baseline change. Responsive native wheel/resize/vertical/RTL checks now pass using one measured viewport distance.

Slice7b initial and follow-up independent reviews PASS (display-motion-review-round1/2.md). Explicit locale defaults en-US consistently on server/client, memoized formatters and SSR/browser locale checks prove it. Carousel moves focus from an outgoing focused slide to its existing viewport before inertness; native boundary/dot/outside focus is preserved. Final210 focused and17 browser cases PASS, plus4 strict axe/component-only capture cases. Source/browser wrappers and fresh quality/architecture PASS. Captures refreshed to exclude harness controls/unused outer space. No token values, dependencies or lockfiles changed. Full phase package/browser/runtime/IMPL-EVAL remain pending.

Slice7b sourcef3b8416 and clean-source corpus refresh complete. All four carrier freshness checks PASS; no stale-diff/failure output and no lock/token changes. Source review and follow-up PASS,210 focused/17 browser/4 capture checks PASS. Push/comment closes7b before7c.

## Slice7c0 design — runtime dependency metadata

CodeBlock preparation exposed a real install gap: command-palette, render-ui, date-picker, menu-items, menubar, alert-dialog, hover-card and context-menu import package-owned Fresh UI runtime subpaths but omit that package from dependencies. The CLI merges only declared item dependencies plus Preact; local test aliases hid the absent root mapping. Repair those eight items with the current package-version dependency; no package version bump. Two historical items (command-palette/render-ui) need explicit additive metadata repairs, preserving their frozen source/CSS/targets and every original dependency. The historical fixture stays frozen; expected comparison adds exactly the reviewed root dependency for only those names, with an independent source-import dependency guard and negative control. Installed-copy test must start without the root mapping and assert the installer adds it before applying local prerelease subpath aliases for type-checking. Gates: compatibility/schema/source-import/installed-consumer tests, wrappers/quality and carriers, separate read-only review. This is a dependency correctness slice before CodeBlock, not a new feature or broad legacy rewrite.

Runtime metadata review FAIL_FIX exposed a scanner false positive: render-ui mentions Fresh UI only in JSDoc, not a real import. Retracted that extra dependency and legacy exception; there are seven actual users, only command-palette is a historical repair. Replaced source regex scanning with native deno info direct-module dependency edges using frozen lock/config, added reverse rejection of unnecessary/wrong declarations and compiler-backed negative fixtures containing JSDoc, raw block/line comments and quoted import examples. Existing AI/PReact render-ui dependencies are restored unchanged; original-dependency negative control now removes AI without adding another dependency. Corrective gates/review pending; no next slice starts before terminal PASS.

Runtime dependency correction terminal independent PASS. Compiler-backed direct edges, required/extraneous declaration checks, comment/string negatives, exact historical expectations and clean-project real installer proof PASS11. Source check/lint/fmt and corrected quality/architecture PASS; locks/frozen fixture unchanged. render-ui has no repair or added dependency. Clean-source carriers and push/comment precede CodeBlock.

Runtime metadata sourcea0ed7e9 clean-source corpus regeneration and all four individual carrier freshness commands PASS (raw exit0 each). No generated delta after source commit, frozen fixture/lockfiles unchanged. Corrective independent review PASS and11 focused tests prove real import closure and actual installer mapping. Push/comment closes7c0; proceed to CodeBlock design/implementation next.

## Third latest-base recovery — 2026-10-31

User requested another latest-base rebase and leased force-push. Saved the unfinished CodeBlock slice before rebasing all25 branch commits onto main1d274c1. Conflicts affected only the generated registry carrier; regenerated from the combined authoring source instead of selecting an obsolete binary payload. Preserved incoming contrast burn-down, locked theme review renders, plugin helper exclusions, workflow guidance and KV corrections. Exact diff against main shows no changes to its token sources, theme outputs, contrast component CSS or axe baseline. Shared floating.css changes remain only the intended native-popover selector additions. Independent same-session integration review PASS; final IMPL-EVAL remains pending.

Focused contract/registry/installed-consumer tests:319 passed,0 failed. Quality/architecture, publication preflight, docs accuracy/export drift, full docs build253pages and four carrier freshness checks PASS. Complete170-case gap browser matrix PASS (all four light/dark and narrow/wide combinations, plus actual-touch cases). Inherited token validation PASS across24 presets,96 inputs,48 effective contexts and9080 contrast uses with0 exact source exclusions. Existing full gallery remote job has not run at this rebased head, so this is not READY. Public added-line audit currently15415 lines,0 forbidden absolute roots; repeat after evidence commit. Restore the saved CodeBlock slice only after this recovery is terminal.

## Slice7c1 design — CodeBlock

Preserve code/filename/lang/class/native HTML attributes and published variant/header aliases while implementing ledger single/tabbed/diff, tone default/destructive, sizes, real file tabs, numbered/diff rows, native horizontal scrolling, copy result feedback and optional footer. Compose public Tabs and Icon; add only adjacent shared Tabs RTL key handling and stop suppressing perpendicular page-scroll arrows. Native onCopy remains a ClipboardEvent handler; new onCopied/onCopyError report actual clipboard outcomes. A generation guard keyed by active file/raw source prevents stale/unmounted promises from marking another file copied. Syntax is trusted caller content via typed Token/Line helpers using existing roles, never a tokenizer or unsafe HTML. Raw code is escaped and copied exactly; absent raw code derives resulting text from rows excluding removed lines. Native scrollbar/thumb and native copy-title tooltip are explicit platform internals, no fake wrappers/position manager. Contract first, same schemaVersion1; keep canonical ledger values and document phase1 compatibility aliases. Header=false hides metadata/copy chrome but essential tab controls remain. Existing code-block runtime dependency becomes a named exact historical addition, and actual installed-source coverage includes this updated baseline item. Gates: real SSR compatibility/escaping, all axes/parts, actual tabs/RTL/controlled refusal/native scroll/clipboard success-failure-race, strict axe/captures, wrappers/quality/carriers and same-session review. No third-party/version/token/lock changes.

CodeBlock first browser pass confirmed tabs/RTL/controlled refusal/native scroll and clipboard success/failure/stale-result behavior. Strict axe found syntax/row-fill contrast combinations omitted from the inherited code/bg certification. Kept all token values and baseline unchanged; normal rows use the seven syntax roles, tinted rows use text/fg, with the exact visual deviation and restoration cost in drift.md. Compared the actual Utility review: diff totals belong beside the filename, so the implementation puts them in the header and keeps the optional footer for line count/custom content. Corrected SSR assertions to the actual safe Preact escaping and a real CRLF expression; added required map keys and typed DOM attribute mutation in fixtures. No new dependency family/version/lock changes. Final slice gates and independent review remain pending.

CodeBlock independent round1 FAIL_FIX found legacy header=tabs without the new files collection would select tabbed mode and throw. Corrected inference to use an actual nonempty collection only; explicit variant=tabbed still rejects an empty collection. Added SSR coverage for all three header aliases and a real clipboard activation on the legacy single fallback. data-header resolves title; typed/JSON contract and README state it. Preserved legacy alias values in machine-readable prop metadata alongside the canonical boolean control. Corrective gates and same-session review follow; no next slice before terminal PASS.

CodeBlock corrective gates PASS:340 focused tests,20 browser cases (including a real clipboard write from legacy header=tabs without files), source/browser check/lint/fmt, quality/architecture. Six local component captures refreshed. Source leaves incoming token values, axe baseline, frozen registry fixture and locks unchanged. Same-session corrective review is running; clean-source corpus refresh and all carrier checks follow a terminal PASS/source commit. Current base recovery24a0c6e is MERGEABLE and its docs build/Utility browser CI are green.

CodeBlock terminal corrective independent PASS (codeblock-review-round2.md). All prior source behavior and recorded syntax contrast deviation remain accepted.340 focused tests and20 current browser cases PASS; source/browser wrappers and fresh quality/architecture PASS. Legacy header aliases are machine-visible and the no-files tabs alias retains real copy functionality. Source sign-off commit includes this run/context; clean-source carriers and push/comment close7c1.

CodeBlock sourced9b7d3f clean-source corpus generation and all four individual carrier freshness commands PASS (exit0 each). Public run text audit zero forbidden roots; no token/lock/frozen fixture changes. All source and carrier evidence is ready for the per-slice push/comment. Reconcile: latest main1d274c1 and recovered remote24a0c6e preserved; no foreign remote changes. This closes7c1 only;7c2 Feedback/docs audit, final phase2a gates/IMPL-EVAL and the complete approved phase2b/harness remain outstanding.

## Slice7c2a design — Label, Card and Pagination docs gaps

G4/G9/G15 reuse existing identities. Public surface: Label variant default/eyebrow, explicit rest/disabled/invalid presentation and optional hint while preserving native label activation, required/srOnly and scope overrides; Card rule/default and md/sm with existing sections/interactive semantics preserved; Pagination numbered/pager plus native previous/next tiles, retaining Meta/Actions composition. Vocabulary: eyebrow is Utility mono uppercase metadata; rule is a top-border-only surface; pager is adjacent document navigation. Ports are native label/anchor semantics, Preact VNodes, current token roles and public Icon. Reuse existing size/state words and semantic token properties; no new policy helper or backend. Contracts/JSON first, copied source second, SSR/render/real keyboard and strict axe/consumer checks third. Add current root dependency only to Pagination because it uses public Icon, with exact historical allowance and installed-source proof. Existing baseline count/new-component list remain unchanged. Split7c2b Alert/Prose/archetype and shell audit afterward to bound review size. No token/third-party/version/lock changes. Contributor entry remains src/contracts/README.md. Review and all carriers close this slice before7c2b.

Docs primitive implementation refinement: contracts now describe actual Card root props and qualified namespace child slots rather than unimplemented header/description/footer booleans. Label retains a pseudo required mark; required wins over optional. Pagination exposes native Link/Previous/Next/Ellipsis with current/disabled semantics, preserving Meta/Actions. The public Icon set lacked the pager’s directional arrows; verified upstream Lucide/Feather arrow-left/right and added only those existing stroke glyphs with their ISC/MIT notices. Page keys retain chevrons; tiles use arrows. No dependency package added; Pagination declares the existing runtime root and its consumer copy joins the audited baseline list.

Initial docs primitive SSR gate found only an over-specific serialized-attribute adjacency assertion; fixed to assert the semantic hint and escaped content independently. The first browser attempt found the shared default port occupied. Read-only reporter found24 unproven survivors and3 unavailable probes; no cleanup attempted. Retained only resource verdict/counts in public evidence. Added a validated per-run browser port override with server reuse still forbidden, then all5 initial light/narrow browser cases PASS, including strict axe.

All20 docs primitive browser cases PASS across light/dark390/1280, strict axe0 serious/critical.422 initial source/contract/registry checks passed; the sole failure was the installed-copy test’s old literal-scope assertion on Card’s intentionally overridable scope expression. Retained exact source-byte comparison and compiler/lint gates, and strengthened audited baseline coverage to render the actual installed components in the consumer workspace and validate against the shared contracts. New-gap literal ownership guard remains unchanged. This also exercises real installed tabbed CodeBlock across its runtime alias, not an implementation string approximation. Source/browser wrappers and quality PASS; corrective consumer gate follows.

The stronger installed SSR gate exposed a Deno global-cache peer-copy resolution failure after fresh consumer compilation. Native node-modules-dir=auto for that consumer runtime stage resolves the same fresh semver graph in its own temporary node_modules; actual installed rendering now PASS1. No lock/cache deletion, reload, version override or root lock change. Source-byte equality, real installer mapping, compile/lint and contract validation all remain required.

Docs primitive independent round1 PASS. Final contract completeness check found the two new public glyphs also need the Icon name enum; expanded the typed/JSON enum, added both real render fixtures and an independent equality guard against the complete published ICON_PATHS vocabulary. Preserved legacy Card.Header flex layout when no Action is composed; only headers containing the new Action seam become grids. Added computed browser assertions for both layouts. Follow-up gates/review cover these final refinements before source sign-off.

Slice7c2a terminal initial/follow-up independent PASS. Final426 focused tests and20 browser cases PASS; current10 component captures retained, strict axe0 serious/critical, wrappers/quality/native primitive doc-lint/preflight/docs gates PASS. Card legacy flex header preserved; public Icon name enum matches all20 published names. No frozen fixture/root lock/token value changes. Source sign-off includes this run/context and review evidence; clean-source corpus and four carrier freshness checks follow before push.

Slice7c2a source0adfad0 clean-source corpus generation and all four individual carrier freshness commands PASS (exit0 each). No generated delta after source commit, root locks/tokens/frozen fixture unchanged. Reconcile: remote3ed65b6 preserved with no foreign updates. Full public added-line audit at source snapshot18705 lines has0 absolute path,0 session identifier and0 thumbprint hits; repeat at the carrier evidence head before push. Next7c2b remains Alert/Prose/remaining docs audit; full original phase2b and harness remain active, no READY claim.

## Owner decision — additive style extensions

Authority: https://github.com/rickylabs/netscript/issues/2416#issuecomment-6541012019. A style may add declared extensions and may never change or remove base contract items. Names begin x-; presentational extensions map to data-x-* attributes read only by that style; structural extensions map to optional named slots or style-scoped blocks, empty by default. Each registry:style declaration records component, name, type, default and maps-to. Base contracts run for every registered source style; extension fixtures run only for their declaring style. Undeclared props, parts, variant values and keyboard changes still fail. The harness slice must include an undeclared-addition negative control and a declared x-extension positive control, plus the existing mutation negatives. Two-style demand promotes an extension into the base contract. Style-switch unsupported-attribute diagnostics and the Figma plugin manifest consume this declaration boundary in their owning workstreams.

## Slice7c2b design checkpoint — Alert

1. Public surface: preserve info default, existing four tones, native attributes/role and Renderable icon/title/children. Add neutral/important, subtle/strong emphasis, description/action slots, close/closeLabel and controlled/uncontrolled open/defaultOpen/onOpenChange. Closed banners remain mounted with native hidden and explicit CSS hiding; no automatic focus on mount. Dismissal uses a native button, reports false and respects controlled refusal. Native onClose retains its DOM meaning.
2. Vocabulary: tone selects semantic fill/border/text; emphasis replaces the box edge with a leading rule on the neutral surface without altering content; description takes precedence over legacy children; false icon suppresses decoration.
3. Ports: Preact state, existing Icon runtime and native HTML button/hidden behavior. No backend, package family, token values or shared InlineNotice redesign.
4. Constants: closed tone/emphasis types and named default-icon map; existing token roles supply all colours, spacing and type. Bell joins the existing licensed public glyph set.
5. Slice files: Alert TSX/CSS, B1/Z1 typed and JSON contracts, native registry dependency metadata, render/browser/installed-consumer tests, contributor/readme notes, run evidence and generated carriers. Gates: focused contract/registry/installed tests, browser dismissal/control/RTL/strict axe and light/dark captures, wrappers, broader quality, doc-lint/preflight/docs and carriers; same independent reviewer before source commit.
6. Deferred scope: remaining Feedback P2 axis expansion and business callback outcomes; Prose/audits follow this terminal slice. Full phase2b/harness remains required.
7. Contributor path: packages/fresh-ui/src/contracts/README.md documents contract and fixture extension; component header documents the new controlled visibility seam.

7c2b review round1 FAIL_FIX: untitled alerts lacked the handoff's tone label. Corrected with six named defaults, localized toneLabel, custom-title replacement and explicit false/null visually hidden labels; contract title anatomy is unconditional. Added default/localized render+unit/browser coverage. Also completed the handoff circle-check/circle-alert glyphs from upstream Lucide under the retained notice and used body size/Medium label weight. Strong emphasis neutral surface/no box edge and scoped CSS load-order protection now have browser assertions. The reviewer confirmed all other behavior and registry boundaries; corrective same-session review follows actual gates.

7c2b corrective gates:454 focused tests and16 real browser cases PASS, strict axe0 serious/critical in light/dark390/1280; source9-file and browser wrappers PASS with no drops; quality/architecture PASS, public primitives doc-lint PASS, publication preflight/docs accuracy/export drift PASS and253-page docs build PASS. Same-session corrective review PASS; public gate evidence is now available for final sign-off. Four retained captures match the ledger's subtle/strong distinction. Untitled/default/localized/hidden labels and native controlled/uncontrolled dismissal are exercised.23 public glyph names exactly match Z1. No root lock, token value, dependency family or frozen fixture changes. Clean-source carrier generation/checks follow the source commit.

7c2b independent evidence sign-off PASS confirms the reviewed corrective source and actual454/16 gates. Source is approved for the slice commit. Reconcile: base remains main1d274c1, the previous terminal source/evidence is8638e06, and the full phase2a/2b goal remains unchanged. No unrelated worktree changes or resource mutations. Next: commit source, generate clean-source corpus/publication assets and pass all four freshness checks, privacy-audit exact pushed head, push and post slice evidence before Prose.

7c2b source086e2ed is terminal: regenerated clean-source corpus/publication assets and all four native carrier freshness checks PASS (agent-docs prose, MCP corpus, assets barrel, publish assets). No additional generated delta remained after source embedding. Public added-line and whole-run path/identity/thumbprint audits PASS with zero hits; retained audit output is verdict/counts only. Evidence commit closes this slice before Prose.

## Slice7c2c design checkpoint — Utility Prose G17

1. Public surface: preserve the copy-only Markdown renderer's children:string, streaming, activeCite, onCite and class props and mandatory sanitizer. Correct X1 metadata that currently invents level/element/state/anchor root props: design axes are native elements and CSS interaction, not renderer API. Public ns-markdown CSS also supports host-authored native lede/kbd/heading-anchor markup, documented separately; it does not assert that Markdown emits those nodes.
2. Vocabulary: prose measure, lede, heading level, square marker, inline-code chip, native link and host heading anchor. Ledger-desktop-docs.json wins over earlier spec: lede measure matches prose measure; existing Studio prose roles are the runtime aliases (new Theme-set twins are Figma-side metadata, no token changes here).
3. Ports: existing semantic typography/colour/spacing roles, native HTML semantics, unchanged sanitizer/unified pipeline and real copy installer. No new dependency family or parsing library.
4. Constants: existing prose/type aliases with current shared-role fallbacks; seven existing code syntax roles on code/bg, no literal palette values.
5. Slice files: markdown.css/README, X1 typed+JSON contract, copied-Prose test helper and render/browser tests/build fixture, contributor/run notes and carriers. Gates: contracts/registry/installed renderer, browser native links/RTL/type/marker/code/strict axe/captures, wrappers+broader quality, docs/preflight/carriers and same independent reviewer. Actual installed renderer HTML feeds the browser; host-authored semantic examples are explicitly separate.
6. Deferred scope: no new Markdown heading-ID generation or anchor/HTML parser option. Lume/host heading-anchor generation stays host-owned; CSS supports focus/hover on those native links. No callout/backend/theme changes. Remaining shell/archetype audit and final phase gates follow this terminal slice.
7. Contributor path: registry/components/ui/markdown.README.md describes actual renderer API, native CSS hooks and source/host responsibilities.

7c2c local gates:454 focused tests PASS;16 real browser cases PASS, strict axe0 serious/critical, source3-file wrappers and all browser build/fixture/spec wrappers PASS without drops; broader quality/architecture, preflight/docs accuracy/export drift and253-page docs build PASS. Browser HTML is actual installed sanitized Markdown, with host-only native examples separate. Existing prose aliases bind544 measure/720 wide cap; final marker measurement is4×4 in the retained light390 capture using existing12px marker font. Native glyph metrics are not a cross-environment pixel promise. Initial independent review PASS; its requested phase-one metadata compatibility note is explicit in X1 typed/JSON notes and drift. Same-session evidence/final-diff sign-off follows before source commit. No template, sanitizer, token value, root lock or dependency-family changes.

7c2c same-session final source/evidence sign-off PASS confirms the metadata compatibility note, final native marker and wide cap,454/16 gates and unchanged sanitizer/token/lock boundaries. Reconcile: previous terminal head0015456; latest pushed CI build and Utility browser/style checks SUCCESS, PR MERGEABLE on main1d274c1. Source is approved for its slice commit. Clean-source carrier generation/checks and added-line/public-run hygiene audit precede the push/comment; final phase IMPL-EVAL remains separate.

7c2c sourcea1d6d4b is terminal: all four clean-source carrier freshness checks PASS (agent-docs prose, MCP corpus, assets barrel, publish assets); generation left no additional source delta. Public added-line and whole-run hygiene audits have zero absolute-path/session-identifier/thumbprint hits. Evidence commit/push/comment closes Prose before the shell/archetype audit and final full-phase gates. Full2b17 gaps, Desktop audit and additive style-contract harness remain required.

## Slice7c3a design checkpoint — CommandPalette

1. Public surface: preserve controlled open/onOpenChange, groups and existing item fields/callbacks, placeholder/emptyLabel/class. Canonical selection uses the existing Combobox onValueChange so pointer and keyboard invoke one command and one close request. Add loading/loadingLabel/searchLabel, optional filters/footer Renderable slots and scrim=false inline mode; item type/disabled/url/excerpt/shortcut are explicit optional fields. Local input filters group items by readable text; optional onQueryChange reports user query changes without owning a network adapter.
2. Vocabulary: palette vs inline surface, command group, enabled/disabled option, highlighted option, results/empty/loading content, plain-text excerpt and query. Existing content/type/state root metadata is corrected to actual inputs and qualified item fields; real output data axes and native machine compatibility remain declared.
3. Ports: existing L1 Dialog/Combobox, native keyboard/composition events and copied Kbd plus existing Icon. No Pagefind/backend requests or routing ownership. Caller callbacks own navigation/business effects. The L1 keyboard guard ignores IME composition before handling editing/navigation keys.
4. Constants: closed CommandItemType and data-content vocabulary, existing token roles for typography/selected marker/scrim/code-independent text; named local defaults. Arbitrary public IDs map to encoded headless values, preserving callbacks.
5. Commit slice: CommandPalette TSX/CSS, O10/Z1 typed+JSON metadata as needed, minimal Combobox IME guard, registry dependency/compatibility allowances and installed baseline coverage, contract/unit/browser fixtures, contributor/run docs and carriers. Before fixes, reproduce legacy Enter no-op/filter failure in real browser. Then focused tests, native browser key/selection/refusal/empty/loading/disabled/inline/RTL/axe/captures, wrappers, broader quality, docs/preflight/carriers and same independent reviewer. Keep the reviewed source surface below30files.
6. Deferred scope: Pagefind network/backend adapter remains approved S8 scope. Application filters/footer are slots, not a new query service. Shell/PageHeader/archetype audit and fidelity revisits follow a terminal reviewed palette slice; full2b/harness remains required. No token values/root locks/new dependency families.
7. Contributor path: registry/components/ui/command-palette.README.md documents actual root/item API, keyboard and data/state responsibilities, local filtering and backend boundary.

7c3a initial independent review FAIL_FIX: copied browser excerpt highlighting required RegExp.escape without a capability fallback. Added portable literal-regex escaping when that API is absent, preserving the native API when available, plus a real-browser negative-capability test that deletes it and searches A.B(C) against literal a.b(c). The reviewer confirmed other source/keyboard/refusal/IME/registry/contract behavior. The query-reset callback behavior is explicitly documented as user-edits-only in the README. Corrective gates and same-session review follow; no second terminal failure is assumed.

7c3a corrective local gates:471 focused tests and32 real browser cases PASS in light/dark390/1280, strict axe0 serious/critical, including actual RegExp.escape absence plus literal punctuation matching. Source12-file and browser wrappers PASS with no drops; public primitive doc-lint/preflight/docs accuracy/export drift/253-page docs build PASS. Native pointer focus, repeated activation after controlled refusal, IME editing, valid ARIA references, disabled/empty/loading and inline order are verified.16 retained captures updated. Existing code/marker/text roles keep the loading arc visible in both schemes. Final broader portability-source quality rerun and same-session corrective review follow.

7c3a final broader portability-source quality/architecture PASS. Same-session corrective review PASS confirms the literal escape fallback, actual API-absence regression and unchanged source protocol. Public command-validation.json now records all finalized471/32/wrapper/quality/doc gates. Evidence sign-off follows before the source commit; carrier freshness is then checked against committed source. Full phase and2b/harness remain open.

7c3a independent source/evidence sign-off PASS. Source is approved for commit after471/32 gates. Reconcile: previous terminal ee656bb on main1d274c1, no unrelated source changes. Stage the implementation and minimal review/context records first to keep the source commit below30 files;16captures/earlier review reports/regression-count evidence follow in the carrier evidence commit. Generated source stays committed before corpus generation. Full274-case gap browser matrix (242prior+32palette) and final phase gates remain pending.

7c3a sourced985633 is terminal: committed source passed all four native carrier freshness checks (agent-docs prose, MCP corpus, assets barrel, publish assets), no extra generated delta.471 focused/32 browser cases and independent corrective/evidence sign-off PASS. Public added-line/whole-run path, identity and thumbprint audits have zero hits; retained output is verdict/counts only. The evidence commit retains16 reviewed captures, both prior reviews, regression counts and memory, then push/comment closes the slice before shell/archetype/fidelity audit.

## Latest-base recovery4 — integration checkpoint

Fetched main15cffa2 after PR metadata lagged behind the real remote. Replayed36 topic commits with5 conflicts confined to the generated offline-docs carrier. Its reader rejects concatenated conflict payloads, so each generation used a parseable HEAD-side seed and then regenerated from the combined259-page site; no stale compressed payload was accepted as final.161 scoped UI source/test files were byte-identical to the reviewed pre-rebase branch before validation. Main's Figma round-trip, native host policies and other fixes are preserved.

Full274-case browser matrix PASS. Full package run:600 PASS/1 FAIL, the existing measured-destructive-text guard identified menu-items.css using the solid fill as text. Integration fix checkpoint: (1) no API change, bind destructive menu labels to measured text; (2) existing intent vocabulary unchanged; (3) existing destructive/text role only; (4) no new constants; (5) menu CSS + destructive fixture/assertion + carrier/evidence commit, validated by the existing guard/full package and menu browser gates; (6) no palette change or assertion exemption; (7) existing menu-items support and contracts README remain contributor seams. Correct the actual binding and add a real destructive action contrast/activation example, then rerun the gates and the same independent integration reviewer.

Recovery4 corrected full package run is terminal:601 PASS/0 FAIL, exit0. All source/menu browser/wrapper/quality/docs gates have completed successfully. Same independent evaluator evidence sign-off follows, then committed-source carrier checks and the leased force-push. Prior live-handle note is superseded; do not rerun the completed full package gate.

Recovery4 same-session independent source/evidence sign-off PASS confirms601 package/57 menu browser cases and completed wrapper/quality/docs gates. Source approved for the integration correction commit. Reconcile: local44dae722 on main15cffa2; remote stillb62324d. Clean-source carriers, zero public hygiene audit and exact leased force-push follow. Full feature scope remains open.
