# Worklog

## Design

1. Public surface: plugin import/export/download/GitHub PR; shared typed
   figmaTokenSources; ui:apply --preset URL; init --preset URL.
2. Vocabulary: FigmaCollection/Variable, snapshot bundle, DTCG round-trip bundle,
   portable registry theme, version-1 preset; names remain owned by code.
3. Ports: narrow Figma variables API; fetch GitHub adapter; existing CLI fs,
   transport, paths and token engine. No new CLI effect abstraction.
4. Constants: DTCG schema/version, collection file mapping, source filenames,
   extension identifier and GitHub API origin. Reuse public preset catalog.
5. Commit slices (each below 30 files):
   - S0 plan/run bootstrap, proved by independent PLAN-EVAL.
   - S1 shared source composition, token entrypoint, importer script refactor and
     focused test (4 source files plus run); tokens:sources:check and source-byte
     equality, check/lint/fmt and independent slice review.
   - S2 LICENSE/NOTICE, upstream color conversion, narrow Figma port/snapshot,
     shared DTCG converter and fixture/mock tests (about 8 files plus run);
     explicit figma wrappers and exact fixture/color/float/alias/Theme B tests.
   - S3 two-pass import, GitHub values-only PR adapter, iframe UI/main/build,
     manifest/README and mock tests (about 9 files plus run); import/export
     API tests, no-write negative controls, browser bundle task, slice review.
   - S4 independent name checker/root tasks/required CI step (3 files plus run);
     unknown-name negative control and explicit figma wrappers, slice review.
   - S5 URL load/install helper, token-engine bridge, init helper/command/wiring,
     maintainer init parity and focused CLI tests (under 20 files plus run);
     structured URL/preset negative tests, existing lifecycle tests and native
     single-command loopback scaffold + deno task check, slice review.
   - S6 docs reference/census assertions and generated carriers (existing
     generated files plus run); docs:accuracy, every check:* task, quality,
     release preflight, publish audits/size, runtime suite and final IMPL-EVAL.
6. Deferred: Code Connect/library components phase 2; Community publication and
   manual Figma host acceptance cannot run in CI.
7. Contributor path: tools/figma-plugin/README.md describes the full flow,
   shared importer, named inventory, install contract, test and build commands.

## Bootstrap

Read assignment in full, relevant skills, prior S1/S2 memory and current code.
Resolved feature matrix; owner-selected Claude Opus 5.5/high overrides evaluation
route without waiving session/vendor independence. RTK missing. No secrets read.

## PLAN-EVAL round 1

FAIL_PLAN preserved in plan-eval-round-1.md. Resolved canonical export path/provenance, persistent sources, URL dispatch, explicit plugin wrapper/CI coverage, slice granularity, archetype mapping and init size cap before round 2.

PLAN-EVAL cycle two provided explicit conditional acceptance after two specific
amendments. Both applied verbatim; original verdicts retained. No third round.

## S1 — shared source composition

The importer script and plugin/CLI can now call one typed figmaTokenSources
function; resolver and component sources remain the existing authored inputs.
Structured check/lint/fmt: 3 files, zero findings, exit 0. Structured fixture
composition test: 1 passed, 0 failed/ignored. tokens:sources:check: PASS,
byte-identical source composition and all 96 resolver inputs. Independent
slice review pending. Reconcile: issue remains phase 1 only; PR #2504 is draft.

S1 source review FAIL_FIX identified circular resolver freshness: copying the
embedded resolver erased the code-derived preset context check. Moved the exact
original resolver construction into createTokenResolver; restored semantic alias
checks before output and deep-cloned authored documents. Re-review required.

S1 repaired independent slice review: PASS. Re-run source freshness, structured
4-file check/lint/fmt and fixture test: exit 0; 14 existing routing/resolver tests
also pass. Supervisor sign-off records source review and distinct gate evidence.

## S2 — licensed snapshot and DTCG transport

Selective upstream fork retains the exact MIT LICENSE and copyright. The RGB
normalizer now preserves alpha rather than rounding it to two decimal places.
Mock Plugin API export matches all ten archived fixture files byte-for-byte,
2,186 variables; structured tests 5/0/0. DTCG format and resolver validate with
the unchanged official schemas. STRING uses a fontFamily transport carrier;
BOOLEAN uses numeric 0/1 because DTCG has no generic string/boolean type. Original
Figma types stay in identity metadata. Single-mode Primitives uses a resolver
set; collections with multiple modes use modifiers.

Explicit plugin wrappers: check selected 6 files, lint/fmt selected and processed
5 plugin files, zero findings. Separate package source lint/fmt pass. Added zod
as a catalog dependency using the existing locked version: root lock membership
and private lock membership plus native same-version peer-key normalization only.

Draft docs build failed at S1 for missing public API symbols. Added all seven
symbols to the complete Fresh UI API table; docs:exports-drift now PASS. Reconcile:
this documentation repair is intentionally moved forward from S6; no labels,
issue closing keyword or READY claim. S2 independent review pending.

S2 independent source review PASS. Named structured gates pass, five fixture/
schema tests pass, docs:exports-drift passes. Recommendations for S3: alias-cycle
preflight, canonical mode/order validation, leaf converter contracts, per-file
upstream attribution, alpha-ff preservation and browser-main compatibility.

## S3 — native import, download, GitHub PR and browser bundles

Built minimal sandbox IIFE and browser UI separately. Shared name-only generated
inventory is synchronous, avoiding DOM/decompression globals in Figma main;
color/document metadata remains in the iframe. Native import validates names,
modes, type compatibility and cycles first; creates variable targets, clears old
alias edges with typed literals, then assigns final aliases. Existing IDs survive
and stale WEB syntax is removed. Explicit opaque-alpha bytes survive transport.

Structured tests: 11 passed, zero failed/ignored, including production main
execution with DOM/decompression globals absent. Mock GitHub proves one changed
tree entry and no credential-bearing bodies; complete item structural comparison
rejects non-value edits. S3 initial review FAIL_FIX caught JSON reformatting in
an otherwise values-only PR. Required canonical baseline bytes and stable key
order; compact/reordered baseline controls now refuse before mutations. Removed
the default fixture file key; only a real key enables snapshot downloads.

Native Figma host remains UNPROVEN as required; UI message-origin behavior and
host permissions/mode limits need manual acceptance. S3 repair review pending.

S3 terminal PASS: independent repair review, 11/0/0 structured tests,
14-file check and 13-file lint/fmt (nonzero plugin coverage), browser build,
source freshness and release preflight pass. Reconcile: next S4 adds required
CI coverage and the distributable name checker. No READY claim yet.

## S4 — required CI and portable name-check command

Independent source review PASS. figma:ci exits 0: 15 selected/processed source
files, no check/lint/fmt findings; 12 tests passed; pinned 2,186 variable names
and one portable fixture checked; browser bundles built. Real --theme file
negative control exits 1 naming Scheme/accent/border and its unknown CSS name.
The plugin's standalone npm zod pin matches the root catalog. npm-catalog and
zod alignment gates pass (existing unrelated catalog warnings retained).

Added the figma-ci allowlisted gate so required quality CI uploads a durable
receipt, including tools-only policy skips. This necessarily extends the initial
write surface to .llm/tools/gates/catalog.ts; recorded as tooling drift, not
framework scope. Reconcile: S4 complete; S5 URL/init application is next.

## S5 — URL presets and fresh-app acceptance

URL dispatch distinguishes local shared preset links, strict version-1 preset
JSON and published-schema registry theme/base items. Figma item metadata is
strictly validated by the shared importer. Compilation precedes staged writes;
S2 owns copying, hashes, edit conflicts, path containment and lock persistence.
Incoming sources install at tokens/source; app config selects that sourceRoot,
retains semantic overrides, and the URL lock entry owns sources/config/assets.
Existing theme baseline ownership transfers for replacement without disabling
local-edit checks. Custom roots and modified installed sources refuse writes.

init --preset is wired for public and local-source commands. The public command
presentation shrank to 55 lines by moving its flow to a feature helper. The
existing domain app-name derivation remains authoritative. Dry runs skip preset
fetch/apply. Public reference, help and the live option census ratify --preset;
existing command paths remain 111 direct / 176 recursive.

Structured URL service tests: 4/0/0. Existing init/preset regression plus new
public forwarding/dry-run test: 27/0/0. Native acceptance: 1/0/0; loopback-server
exported theme, single maintainer init --preset command, actual ui:apply, token
rebuild preserving changed values, generated workspace deno task check, bad
schema refusal preserving lock/CSS. The scaffold is cleaned up by its test.
S5 independent review pending; final carriers and broader gates remain S6.

S5 independent source review PASS. Scoped 18-file check/lint/fmt: zero findings;
docs:accuracy PASS (including live --preset option census), quality:gate PASS
with existing warnings. Four service tests, 27 regressions and native fresh-app
acceptance all pass. Reconcile: no labels; issue milestone0.0.9 mirrored to PR.
S6 will document context selection on imported sources, remove empty retired
portable theme lock entries, reuse the app-directory constant, regenerate
carriers, run remaining gates and obtain final IMPL-EVAL.

## S6a — Figma folder fitness

The final audit initially added cardinality warnings (adapters16, domain14).
Grouped Figma transport/import adapters and raw Figma contracts into actual
feature folders, restoring both parent roots to12 or fewer children. Import-only
moves preserve public tokens exports, all fixture/source bytes and the shared
resolver. figma:ci PASS:15 source files and12 tests; tokens:sources:check PASS
with96 inputs. Current and exact-baseline audits now have the same7 findings:
one existing contracts.json module-tag false positive plus existing warnings.
Independent S6a source review pending. Native fresh-app proof remains green;
full Aspire/Docker tier is explicitly UNPROVEN.

S6a terminal PASS: independent organization review plus fixture/source, plugin and matching-baseline fitness evidence. Next bounded CLI organization slice.

## S6b — CLI preset grouping and review refinements

Grouped URL/encoded preset application and the shared init applier under
ui/v2/presets. Parent v2 and scaffold folder counts return to their baseline
levels rather than deepening existing warnings. Public commands/ports remain
unchanged. Reuse SCAFFOLD_DIRS.APPS, remove fully empty retired portable-theme
lock entries after ownership transfer, and document that built-in codes select
contexts in the installed sources. Init preview/failure recovery is documented.
Focused URL/native/init rerun and independent source review in progress.

S6b terminal PASS after dependent-aware empty-entry cleanup. Focused URL/native/
init rerun14/0/0, new dependent retention control1/0/0; 16-file source wrappers
pass. Existing preset-tokens moved too, restoring v2 to12entries. Independent
repair review confirms S2 dependent protection, grouping and documentation.
Next S6c: complete source JSDoc, DTCG download links, carriers and final gates.


## S6c — downloadable DTCG files and final carriers

Added individual DTCG mode documents and a standalone resolver download beside
its lossless transport bundle. UI import accepts either the portable theme or
that bundle. Fixture tests validate the emitted resolver against the official
schema and import the bundle back to exact Figma state. Documented nine public
contract fields, restoring doc-lint to the exact baseline124 findings; the
public tokens entrypoint itself passes. Fixed the remaining init test import
after S6b's helper move.

Independent S6c source review PASS. Explicit plugin CI passes15 source files,
12 tests and the browser build. Root check, lint-report, fmt-check-report and
docs-accuracy durable receipts all PASS. Regenerated agent prose, assets barrel,
publish assets and MCP export corpus in order. No docs/site/deno.lock churn.
Reconcile: source and carrier slice complete; final check:* freshness checks,
publication gates, formal IMPL-EVAL and exact-head non-draft CI remain before
READY. Runtime and actual Figma host acceptance remain UNPROVEN as documented.
