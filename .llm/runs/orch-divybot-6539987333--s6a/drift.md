# Drift

- RTK missing: equivalent underlying commands used.
- Dispatcher generic close/ready instructions conflict with explicit operator instructions. Follow operator Refs #2419 only, no labels and exact-head green READY.

- S1 browser found health inner wrapper intrinsically wider than mobile shell, and fixed-height topbar allows wrapped nav to overlap. Added w-full to health content and moved the narrow topbar flow fix in registry/styles/layouts.css from S4 into S1. Initial development probe ran concurrently with build and observed production mode; rerun dev/prod separately.

- Fresh Context.config.mode remains production under the scaffold's Vite dev integration. Browser evidence caught the missing development Design link; use Vite import.meta.env.MODE, the same mode that controls route inclusion, with vite/client types.

- S1 default documentation also updates docs/site/reference/fresh-ui/index.md, whose default statement otherwise contradicts the changed scaffold. The tokens-init command reference deliberately remains NS One.

S2 browser comparison exposed a baseline native-choice cascade bug: checked selectors masked invalid borders and pointer hover only applied to the visually hidden input. Utility scopes now bind hover to the label and keep invalid red after checked/hover. Capture restores checkbox state after pointer activation so the gallery labels remain accurate. Figma-only xs/link buttons and sm switches are outside the existing public contract; their absence is a documented deferred gap.

S2 label font follows the Figma font/label role (sans for Utility); mono remains on meta/keycaps. Bare studio root is also accepted because token emission aliases it to Utility. Off switch thumb follows spec surface/card; no base forms ledger is present to supersede it. Filter-form card fill will be reconciled with the S3 surface family.

S3 owns the carried filter-form CSS adjustment: the Figma Card/Filter form render confirms transparent fill and top hairline, so it now uses the same per-side card border roles. Badge info moves from planned to shipped; its type, real render fixture and JSON contract advance together. Section-divider uses existing label size/line and wide tracking with font-eyebrow because separate eyebrow size/line/tracking tokens do not exist. No token value is invented.

S3 capture now loads the actual scaffold Tailwind preflight through UTILITY_PREFLIGHT. Without it, browser-default paragraph margins exaggerated the card header. Toast gallery wrappers are placed in flow and timers frozen only in the specimen harness so every toast is visible; native runtime positioning/timers remain the shipped implementation. No production behavior is certified by an SSR timer snapshot.

S4 adds the existing top-bar scope/parts to the scaffold layout template so its generated header consumes Utility CSS. Automatic ChartBlock/Donut categories need to be distinguishable from explicit semantic tones: additive data-series (1–5, derived only when tone is omitted) is declared in the contract, emitted by both charts, and covered by intent-preservation tests. Legacy data-tone emission remains unchanged. This avoids automatic red error colour on the fifth category while preserving a caller's destructive series.

S4 missing role: the Figma donut's larger diameter has no named token in tokens v2. Preserve the shipped SVG footprint and text-lg center size, apply the KPI font/weight, and record the size difference instead of constructing a literal or arithmetic substitute. Sidebar's new marker anatomy remains deferred with the unshipped contract part.

Owner authority update supersedes the earlier S4 sidebar-marker deferral: locked renders require square tab/nav/filter markers. Existing spacing scale supplies the 6px marker and gap; pseudo-elements are decorative and keep public parts unchanged. Locked DataGrid selection uses ink native checkboxes, compact vertically centered rows, a leading ink selection rule and combined selected-hover paint. S4R will reconcile earlier families against this newly supplied authority.

S4R locked authority supersedes S2/S3 library badge appearance: Utility uses transparent outlined status badges, text-coloured dot/stroke and sans label, while mono uppercase stays on eyebrows/meta. The decorative dot part now renders (hidden in legacy). Utility Avatar always displays derived/explicit initials; images remain in markup and visible in legacy presets. Off switch track uses border-control for the locked grey silhouette; invalid field labels remain neutral, with error text/border carrying state. All values are existing tokens. Selected nav keeps nav-active transparent, following the locked composed screen and token role; the state-sheet tint is documented. Caller-supplied sidebar icons remain supported; the locked top-nav specimen has none.

S4R independent review corrected two mistaken role bindings: border-control is ink in Utility light, so the locked off-switch grey must use input-border; locked field labels use 14px strong roles rather than the library's 11px label roles. Native off/checked distinction and label size/weight now have browser assertions.

S5 uses highlight.js common languages at 11.11.1, matching the repository docs site's existing pin (not an assertion of latest). Recognized code-block languages get escaped syntax spans, unknown languages remain Preact text; clipboard source unchanged. Registry dependency and reviewed lock additions accompany this renderer change. Strong-small is a Figma composite with no literal CSS role: small size/line/tracking plus strong weight. Link ink uses marker, pressed primary uses the existing pressed-opacity composition. Compact PromptInput retains caller capability slots rather than silently hiding controls; its existing stacked compact anatomy differs from the library's minimal inline input. Desktop native request controls retain their existing API rather than adding simulated native-dialog variants.

S5 typed state fixtures exposed that ModelSelector accepted native details attributes at runtime but its props used generic HTMLAttributes, rejecting open in TypeScript. Use upstream DetailsHTMLAttributes so the existing public open state is expressible without casts. The manual update fixture uses the documented manualUpdateUrl field.

S5 lock:update adds only highlight.js11.11.1 to package versions/integrities. Deno also normalizes three existing better-auth/Prisma peer-qualified keys; no version or integrity changes. Root lock adds the same one package. The syntax fixture now includes fenced TypeScript; legacy CSS comparison deliberately keeps its original prose payload, while updated badge/avatar/chart/code markup is compared. PromptInput has no named default textarea-height role; its existing one-row auto-grow footprint is retained and the larger Figma specimen height is an explicit gap.

S5 extends the write inventory to the root lock for the same reviewed syntax-highlighter package; no unrelated dependency versions changed.

S5 review round 1 FAIL_FIX found two unguarded primary-border→primary-stroke substitutions in citation-chip and markdown. NS One aliases these roles and hid the regression. Restored both base rules; legacy comparison now checks NS One, tonal and macos-27 in both schemes, and a pre-fix negative control failed on the non-NS One borders. Reviewer accepted documented anatomy/height gaps. Non-blocking visible differences remain: composer toggles use the shipped small control height and body type rather than a new smaller toggle API; native dialog launchers retain three equal primary actions; user-message typing dots and tool-result error edge retain their existing hierarchy. These are disclosed in the comparison, not claimed as exact Figma matches. S6 must prove the copied npm syntax import builds through Fresh Vite.

S6 carrier generation: tokens:build only canonicalized the new registry dependency array; all token outputs/values unchanged. MCP corpus regeneration deliberately uses --allow-dirty for the already-generated prose carrier; subsequent freshness checks validate all generated output. Carrier checks compare the staged candidate, not a claim of a clean worktree. JSR audit incorrectly requires JSDoc in the existing JSON export; a narrow data-export skip retains source module-tag checks and missing-export failures, covered by an integration fixture. This is necessary validation tooling within the declared surface.

S6 full304-fixture capture found missing Utility focus rings on native overlay trigger/close parts. Added existing focus-ring tokens in Utility-only floating/sheet rules. The secondary-action assertion now runs independently of PromptInput selection. Accordion fixture is the unstyled headless primitive, not a baseline registry item; its native focus remains outside the strict Utility-ring assertion and its registry styling stays with parallel gap-component work. This exclusion is explicit scope, not a claim that accordion matches Utility. Full final capture reruns after the overlay fix.

S6 complete package tests initially328PASS/2FAIL: Avatar presence assertion used a brittle pre-S4R child index, and registry-authoring compared the new highlighter dependency with a frozen historical fixture. Presence now checks actual rendered parts with/without a photo. The registry test preserves the historical fixture and declares exactly the approved CodeBlock dependency addition; all other files/dependencies/CSS/tags remain compared. No product behavior changes in these repairs.

Integrated main1d274c1 via merge8e5e8b1. Contrast burn-down7ee9c3e supplies approved Figma values and destructive-text bindings, plus zero source exclusions. Shared CSS merged cleanly; generated registry conflict resolved by regeneration. S6 authored source survived stash/reapply byte-for-byte. Prior330-test and304-fixture/1820-measurementPASS evidence is pre-merge; affected full/token/carrier/browser gates refresh against the merged source before review.

S6 manual final image inspection caught a DataTable header order dependency: later shared Card CSS reset its flex axis to column while end alignment remained, pushing the heading right. An explicit Utility contract selector restores row/center alignment, independent of import order. A new browser assertion covers the axis; only DataTable needs the supplemental recapture because this selector targets that part exclusively. Full304-case merged pass remains the evidence for other scopes.

## CI repair — default-aware design browser matrix

CI at e501f41 exposed design-browser assertions that still assume the scaffold defaults to NS One. Extend the write surface to `tools/fresh-ui-browser/` to cover the actual Studio Utility default and retain explicit NS One preview coverage. The baseline migration must preserve existing legacy findings, permit no new contrast exclusions, and be independently reviewed with complete axe reports. Core test shard failures are also under investigation; no READY claim.

## CodeBlock review repair

The coordinator requires the bare highlight.js import and a shared ^11 registry dependency,
plus per-instance code/language memoization. The real browser fixture proves the call-count
contract and its deliberate no-memo failure. The package import declaration also requires the
Expo and desktop reference lock metadata to be refreshed by native Deno tooling; this extends
the original write surface solely for lock consistency. Resolved versions remain unchanged.
Correction: CSS hiding alone does not stop an eager image request, but native loading=lazy
defers the hidden Utility image while visible NS One images still fetch. The earlier blanket
deferral was incorrect; no theme contract is needed. Owner-measured behavior is now covered by
a real SSR/Chromium fetch-count test, red without lazy and green with it.

## Runtime CI repair at7b847c3

Both full runtime suites ran and cleaned up, but their final hydration probe failed only because
it selects main output, removed by S6a semantic QueryResult rendering. PostgreSQL108pass/1fail,
SQLite101pass/1fail. All otherCIchecks pass. READY remains withheld.

Public surface: successful generated query content gains a data-query-result container; loading
and error states do not. Domain: query-result surface means successfully rendered payload, even
empty/null/scalar. Ports: existing QueryResult template, public query singleton and browser probe.
Constants: keep the query module path in the probe; extract its browser expression as a pure
function accepting that path so Playwright executes the same observation. Slice: template marker,
probe expression and tests/browser fixture, then carriers and gates, independent same-reviewer
sign-off, push and full CI. Deferred: no runtime readiness/network assertions removed or weakened.
Contributor path: query-result-template.ts owns the generated markup; browser regression uses its
actual template and the real public singleton, with positive/negative DOM states.

Authorized surface extends existing CLI/E2E and browser harness files only. Prove the stale output
selector fails the new actual-DOM test; retain query-client/list-query requirements. Full runtime
proof remains CI-only because local Docker/Aspire are unavailable.

Hydration IMPL-EVAL round1:FAIL_FIX. Reviewer traced /people to generate resource, whose
ResourceIsland template duplicated QueryResult and did not use QUERY_RESULT_RETURN. The page
fixture therefore proved the wrong generator. Failure streak1; stop after a second consecutive
failure. Repair before re-review: share successful return and QueryResult body across BOTH
generators, update resource goldens, and compile/render the actual canonical PeopleIsland
with its real QueryIsland/useIslandQuery hooks in the browser. Repeat old-selector negative
control against that resource surface. No commit/push before independentPASS.


## Owner badge correction

Owner explicitly requires per-variant backgrounds/borders to win over the later Utility outline
override and secondary-text as the info fallback. This supersedes the earlier transparent/currentColor
paint choice; anatomy/dot and semantic token values are unchanged. CSS-size growth and QueryResult
duplication belong to separate issue scope, not this PR round.


Current-main19a677e reconciliation imports upstream changes only; canonical docs ownership is
now MCP. Generator removes the oldCLIprosecarrier and preserves209MCPpages, with exactly two
Utility-default page differences frommain. No badge source changes; no CSS-size/QueryResult work.


## Avatar owner correction and main reconciliation

The earlier assertion that download suppression requires SSR theme context was too broad.
Native loading=lazy provides the requested behavior without a new API. RealSSRChromium tests
prove hiddenUtility0fetches, visibleNSOne1, and deferredloading afterthemechange.
Main7312ba4 onlyoverlapsMCPgeneratedcarriers;regenerationpreservesall209docs andbothparents.
No CSS-size/QueryResult work, badge or CodeBlock changes in this follow-up.


## Main refresh after Avatar READY

Coordinator requested reconciliation with main7feb24c7d09518a045c3955555967dbbde51e92a after
PR2503 became conflicting. Merge from53f3794; no rebase or force push. Conflicts only in
CLI embedded assets and MCP publish assets. Regenerated all four canonical carriers.
All82main-only paths match main; overlaps are three generated carriers and two lockfiles.
Lock diffs preserve main's std/http workspace metadata; resolved dependency graphs unchanged.
All Fresh UI authored source, browser tests and registry payload remain identical to the
approved Avatar head. Docs retain209pages with only the two reviewed Utility-default pages
differing from main. Current source manifest refreshes122hashes.

New local carrier/root/quality gates and same independent evaluator are required before commit;
new exact-head required CI and both full runtime suites are required before renewed READY.
Previous53f3794CI is historical. No product redesign or new scope. Cockpit owns merge.
