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
