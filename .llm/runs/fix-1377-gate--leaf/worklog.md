# Worklog: #1377 gate half

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1377-gate--leaf` |
| Branch | `fix/1377-docs-reference-gate-scope` |
| Archetype | 6 — CLI / tooling |
| Scope overlays | Docs |

## Design

Recorded before implementation. PLAN-EVAL is selected and implementation is forbidden until a
separate session writes `plan-eval.md` with `PASS`.

### Public Surface

- `collectPublishReadiness()` — gains an ordered `docs-reference` evidence row over the effective
  publish set.
- `auditReferencePages()` (planned name) — exported pure filesystem audit used by readiness, tests,
  and raw negative evidence.
- `auditFirstPublishPackages()` — preserves README/tagline/license/export first-publish policy and
  no longer owns reference existence.
- `checkPublicCommandReference()` (planned name) — exported docs-policy audit accepting a command
  tree/catalog and the exact two-file Markdown corpus, invoked by `runAccuracyCheck()`.
- No new end-user CLI command, option, package export, or page URL.

### Domain Vocabulary

- `REFERENCE_PAGE_ALIASES` — exact package-name → path-segment exceptions.
- `ReferencePageViolation` — package, resolved path, rule, message (may reuse/rename the existing
  violation shape without widening semantics).
- `CommandReferenceResult` — audited count, documented count, missing rendered command paths.
- `CommandPath` — token lineage from the materialized Cliffy tree; colon-form root ids remain one
  token.
- `DIRECT_COMMAND_DEPTH` — root plus one child, the coverage boundary for this slice.

### Ports

- `auditPublishSet` dependency — authoritative publish membership.
- Existing `exists` filesystem seam — reference-page presence.
- Existing `PublicCliCommandCatalog` / enumerable Cliffy command seam — live public command tree.
- Markdown corpus — injected in tests; production reads exactly
  `docs/site/reference/cli/commands.md` plus `docs/site/cli-reference.md`.
- No new network, registry, filesystem abstraction, or source parser.

### Constants

- `REFERENCE_PAGE_ALIASES` — four entries: sagas, streams, triggers, workers.
- `EXPECTED_PUBLIC_DIRECT_COMMAND_COUNT` — `91`, asserted against the exact root/direct-child set.
- `NETSCRIPT_COMMAND_PREFIX` — `netscript` for rendered diagnostics.
- `COMMAND_REFERENCE_PATHS` — the exact two-file corpus, not a broad docs glob.
- Existing gate ids plus new `docs-reference`; no duplicate string list of commands.

### Command Surface / Composition Contract

- Composition authority stays
  `packages/cli/src/public/features/root/public-command-tree.ts`.
- Enumeration reuses `PublicCliCommandCatalog`; the docs checker does not import group factories or
  scrape `.command()` source.
- Current vertical-feature catalog, spine abstracts, registries, adapters, and ports are unchanged;
  this is a consumer of the existing tree, not an Archetype-6 restructuring slice.
- No layer-2 abstract or generated output is introduced.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| P | Decision-locked plan and Design checkpoint | Separate-session PLAN-EVAL | Run artifacts |
| S1 | Whole-publish-set path coverage and alias convention | Release unit + raw negative + scoped release wrappers | Release tool/test, index, run artifacts |
| S2 | Tree-derived direct-subcommand coverage plus bounded four-row unblock | Docs unit + raw negative + docs accuracy/links + scoped docs wrappers | Docs checker/test, reference index, commands page, run artifacts |
| S3 | Composed merge-readiness evidence and lock hygiene | Docs links/accuracy, publish dry-run, repo tests, scoped wrappers | Run artifacts only unless reviewed fix required |

### Deferred Scope

- Full recursive command-family expansion — direct-subcommand acceptance catches the documented
  defect without inventing a Markdown DSL for generated grandchildren.
- Reference content fidelity, README checker, snippet extractor, installed-artifact proof, deploy
  operation reachability, and post-merge JSR observation — owned by their cited issues.

### Contributor Path

To add a publishable package, add its canonical reference page at the scoped-name segment unless it
is one of the four declared aliases; run publish readiness. To add a public root/direct child
command, register it in the public tree and document the rendered `netscript …` path; the tree census
and coverage diagnostic name any missing path. Do not edit a command list in the gate.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-12 | P | Bootstrap | Wrote `supervisor.md` first; loaded named skills and harness policy. |
| 2026-08-12 | P | Arrival checks | Baseline exact; PR-C ancestor; alias convention yields 35/35 reference coverage. |
| 2026-08-12 | P | Design | Locked alias, check placement, release unblock, command-tree scope, census, and negative controls. |
| 2026-08-12 | P | FAIL_PLAN revision | Locked the two-page corpus, exact 91 equality, structural root plus tokenized path matching, four-row S2 unblock, and retracted the false sagas-path premise. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Four aliases, no IA move | Preserve public URLs and agree with PR-C | `plan.md` D-1 |
| Separate whole-set readiness check | Prevent registry/new-package skip | `plan.md` D-2 |
| Page/stub with follow-up is unblock; no bypass | Release gate needs a bounded repair path | `plan.md` D-3; release skill |
| Live tree, root/direct children, colon-safe | Predicate must be executable and nonliteral | `plan.md` D-4–D-6 |
| Exact two-page corpus and structural matching | Prevent implicit corpus drift and root-prefix false greens | `plan.md` D-7/D-8 |
| Four deploy rows owned by S2 | Make the strict gate executable without an ownerless predecessor | `plan.md` D-9 |

## Gate Results

All implementation gates are `NOT_RUN` by design in phase 1.

| Gate | Result | Evidence / notes |
| --- | --- | --- |
| Baseline identity | PASS | branch `fix/1377-docs-reference-gate-scope`; head `fa5d0d411…` |
| PR-C landed | PASS | `db1d79c68…` is an ancestor of HEAD |
| Reference arrival coverage | PASS | 35 effective, 35 present under locked alias resolver, 0 missing |
| PLAN-EVAL | FAIL_PLAN → REVISION_READY | Fallback evaluation failed head `5ba4bc339`; revised head requires a new automatic status-driven evaluation; this generator cannot self-evaluate |
| Type/lint/fmt/docs/publish/tests | NOT_RUN | Phase 2 only after PLAN-EVAL PASS |
| Raw negative controls | NOT_RUN | Phase 2 only; both raw exit codes and diagnostics required |

## Handoff Notes

- Evaluator should verify the exact two-file corpus, structural root plus tokenized path matching,
  exact 91 equality, and bounded four-row ownership satisfy B1–B3 without expanding into #1108.
- No implementation file has been edited.
