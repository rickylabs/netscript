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
