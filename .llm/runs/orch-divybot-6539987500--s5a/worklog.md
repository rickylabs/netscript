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
