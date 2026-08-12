# Plan: #1377 reference and CLI coverage gates

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1377-gate--leaf` |
| Branch | `fix/1377-docs-reference-gate-scope` |
| Phase | `plan` — selected PLAN-EVAL is a hard stop |
| Target | Release-readiness tooling and docs-accuracy tooling |
| Archetype | 6 — CLI / tooling (internal tooling application) |
| Scope overlays | Docs |

## Archetype and Doctrine

Archetype 6 is the closest fit because both owned production files are executable repository tools:
one is a release-readiness CLI and the other is a docs verification CLI. No `packages/cli` product
source changes are planned; the public tree is consumed through its existing registry/catalog
surface. The docs overlay applies to the path convention and command-reference coverage.

The doctrine verdict labels `@netscript/cli` **Restructure**, but this slice does not deepen or
restructure that package. It reuses its existing registry-derived catalog rather than adding a
second command vocabulary. Relevant avoidance rules are AP-2 (parallel implementation), AP-9
(stringly-typed finite vocabularies), AP-18 (opaque snapshots), AP-23 (command composition), and the
docs overlay's source-alignment and scope-separation rules.

## Goal

Make reference-page existence a visible release-readiness check over all 35 effective publish
members, align its path resolver with the convention PR-C recorded, and add a command-reference
coverage check derived from the materialized public command tree. Both required negative controls
must exit non-zero with package/command diagnostics.

## Scope

- Split reference-page existence out of `auditFirstPublishPackages` and run it directly over
  `publishSet.effective`.
- Declare four exact package-to-page aliases matching `docs/site/reference/index.md`.
- Add tree-derived root/immediate-subcommand coverage to `docs:accuracy` over the locked two-page
  command corpus with an exact asserted census.
- Add focused positive and negative tests and preserve raw non-zero negative-control evidence.
- Clarify the reference index once for both page paths and the two-page command corpus.
- Add the four missing deploy lifecycle rows and correct the command-reference completeness claim
  so the strict gate is green on arrival.

## Non-Scope

- Reference page content/export-map verification (#1108) or `check-exports-drift` expansion.
- README standard/staleness (#767), fenced-block extraction (#1374), installed-artifact proof
  (#1343), package renames, URL moves, or command behavior changes.
- Authoring package/API reference content beyond the bounded four command rows needed to activate
  the gate.
- The unreachable deploy `emit` operation (#1544).

## Locked Decisions

| ID | Decision | Criterion and rationale |
| --- | --- | --- |
| D-1 | Use a declared four-entry alias map; do not move the IA. | Criterion: preserve published URLs while making the release predicate agree with the measured site. Name-exact resolution misses exactly the four deployable plugins; the four aliases produce 35/35 coverage and match PR-C's enumerated convention. Moving four URLs would create avoidable user-facing breakage. The retracted claim that `check-accuracy-and-discoverability.ts` consumes the short sagas path is not part of this decision: it does not. The real hardcoded-path consumer, `check-exports-drift.ts`, covers eight other paths and remains #1108's untouched scope. |
| D-2 | Add a separate `docs-reference` readiness check immediately after `publish-set`. | `publishSet.effective` is the authoritative coordinated publish set. Placing the check here makes it independent of JSR registry discovery and prevents it being skipped with first-publish checks. `auditFirstPublishPackages` retains only README/tagline/license/export policy. If publish-set evidence is unavailable, `docs-reference` is explicitly `SKIP`; publish-set itself is already `FAIL`, so readiness cannot falsely pass. |
| D-3 | A missing page is release-blocking, with a bounded content escape hatch rather than a bypass flag. | A publishable member without a page turns `docs-reference` red. A maintainer unblocks by adding the canonical page resolved by the convention; when full prose cannot land before a cut, the release skill permits an explicit stub that names and links the tracked content follow-up. No ignore list, environment override, or silent exemption is added. #1108 remains responsible for content/export fidelity. |
| D-4 | Derive command obligations from the materialized public tree through `PublicCliCommandCatalog`; never parse `.command()` source and never hardcode verbs. | This executes the same tree users/MCP see and already walks every child. The checker selects all root entries plus each root entry's immediate children. This deliberately diverges from #1377's acceptance wording, which says command **group**: all 15 groups already have prose, so a group-only predicate is inert. The negative test therefore removes a direct **subcommand** from the documentation and audits the correction explicitly when acceptance evidence is posted. Deeper generated command families remain compactly documented and out of this slice's predicate. |
| D-5 | Treat colon-form `ui:*` names as complete root command paths. | A tree path `ui:add` renders as `netscript ui:add`; it must not be rewritten to `netscript ui add`. The normal nested form remains `netscript <group> <subcommand>`. |
| D-6 | Assert exact equality with the audited census, not a floor or a merely printed count. | Production code and tests require exactly 91 root-or-immediate-child paths on this baseline: 15 roots plus 76 direct children. A tree addition makes the census assertion red even if prose happens to match, forcing maintainers to inspect and ratify the new obligation and update the expected count. The constant is a count, never a literal verb list. Recursive census 149 is reported for context but is not the asserted coverage set. |
| D-7 | Lock the command coverage corpus to the union of exactly two files: `docs/site/reference/cli/commands.md` and `docs/site/cli-reference.md`. | Measured separately, each file misses 25 of 91 obligations; their union misses 4. The gate reads both and no other docs. The reference index records that the public command contract is the two-page union, while `commands.md` is amended so it no longer falsely promises completeness by itself. This makes the corpus stable and auditable instead of dependent on an implementer's interpretation of “the command reference.” |
| D-8 | Match documented commands structurally, never with raw substring `includes`. | Tokenize `netscript` invocations across the full locked Markdown corpus and resolve each against the recursive tree catalog. A root obligation is credited only by an explicit root declaration (a matching command heading/top-level entry or an exact root invocation), never by a descendant invocation: `netscript agent init` cannot satisfy `netscript agent`. A direct-child obligation is credited by that exact invocation or a resolved descendant whose immediate prefix is that child, so compact deeper-family examples still establish their direct parent. Tests lock root non-prefix behavior, sibling isolation, direct-parent projection, and colon-form ids as single exact tokens. Coverage remains the root/direct 91; recursive 149 is matching context, not a neighboring asserted census. |
| D-9 | S2 owns four bounded gate-enabling command rows. | `deploy start`, `deploy stop`, `deploy status`, and `deploy uninstall` are real registered direct children with dedicated handlers. S2 adds their rows to `commands.md`, changes its self-description to agree with the two-page-union convention, and records that convention in the reference index. This is the smallest executable unblock; it does not reopen PR-C's broader prose scope or touch the unrelated unrouted `emit` defect (#1544). |
| D-10 | Raw negative controls invoke the exported gate functions one case at a time. | A unit test that expects a rejection exits zero and is insufficient evidence. Each control command seeds exactly one missing page/command, invokes the real exported audit, prints its diagnostic, and leaves the process at raw exit 1. Tests separately lock the diagnostic contract. |

The reference-index change records D-1 once for page paths and D-7 once for command coverage. It
does not rename or add package pages.

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Path convention | resolved now | D-1 |
| Readiness placement and skip behavior | resolved now | D-2 |
| Missing-page release escape | resolved now | D-3 |
| Command-tree depth and `ui:*` normalization | resolved now | D-4/D-5 |
| Census assertion | resolved now | D-6 |
| Command corpus and matching semantics | resolved now | D-7/D-8 |
| Four prose gaps | resolved now, owned by this slice | D-9; bounded S2 rows make the strict baseline green |
| Deeper recursive command families | safe to defer | They are represented by compact family tables; a later structural Markdown grammar may expand from 91 to the full 149 without changing this slice's direct-subcommand acceptance. |
| Content correctness | safe to defer | Owned by #1108; this slice enforces existence only. |

No unresolved decision or external predecessor remains that would prevent S1 or S2 from starting
after PLAN-EVAL PASS.

## Exact Files

| File | Planned change |
| --- | --- |
| `.llm/tools/release/publish-readiness.ts` | Alias resolver, separate whole-publish-set audit/dependency/evidence row, remove docs check from first-publish audit. |
| `.llm/tools/release/publish-readiness_test.ts` | Ordered evidence update; 35/35-style whole-set positive; published-member missing-page negative; first-publish regression remains registry-scoped. |
| `.llm/tools/docs/check-accuracy-and-discoverability.ts` | Tree-derived command-reference coverage over the exact two-file corpus, structural root matching, tokenized recursive-path resolution, colon-aware rendering, exact census assertion, and `runAccuracyCheck()` integration. |
| `.llm/tools/docs/check-accuracy-and-discoverability_test.ts` | Synthetic public-tree positive and missing-direct-subcommand negative; root-prefix false-positive control; colon-form control; exact census behavior. |
| `docs/site/reference/index.md` | Declare the four page aliases and state once that CLI command coverage is the union of the curated and detailed command pages. No package page or URL move. |
| `docs/site/reference/cli/commands.md` | Add the four missing deploy lifecycle rows and replace the false claim that this page alone contains every command with the ratified two-page-union contract. |
| `.llm/runs/fix-1377-gate--leaf/{supervisor,research,plan,worklog,context-pack,drift}.md` | Harness decisions, evidence, per-slice results, resume state, and drift. |

`docs/site/cli-reference.md` is an input to the gate but is not edited. If implementation requires
any other product or prose file, stop and rescope through the orchestrator rather than silently
widening the slice.

## The Two Negative Tests

1. **Missing reference page:** fixture has a member in `publishSet.effective`, registry metadata says
   it is already published, and its resolved canonical page is absent. The report must contain
   `docs-reference: FAIL`, package name, resolved path, rule `docs-reference`, and `ok=false`. The raw
   one-case command must exit 1.
2. **Missing command-tree subcommand:** the synthetic two-page corpus documents the group but omits
   one direct child from a materialized tree. Coverage must identify the rendered
   `netscript <group> <subcommand>` path, report the audited/covered counts, and fail. Separate
   controls prove `netscript <group> <other-subcommand>` cannot satisfy the root or missing child,
   and that `ui:add` stays colon-form. The raw one-case command must exit 1.

## Commit Slices

| # | What the slice proves | Files | Named gate before commit |
| --- | --- | --- | --- |
| P | The decision-locked plan is reviewable and implementation has not begun. | Run artifacts only. | Plan-Gate checklist review; separate-session PLAN-EVAL must return PASS before S1. |
| S1 | Every effective publish member is audited at the PR-C path convention, independently of registry/new-package state, and a missing page fails. | Release tool/test, reference index, run artifacts. | Focused `deno test --allow-all .llm/tools/release/publish-readiness_test.ts`; raw missing-page control exit 1; scoped release check/lint/fmt wrappers. |
| S2 | The ratified two-page corpus covers every live public root/direct child, exact matching is prefix-safe and colon-safe, the exact 91 census is asserted, and an undocumented child fails. | Docs checker/test, `docs/site/reference/index.md`, `docs/site/reference/cli/commands.md`, run artifacts. | Focused `deno test --allow-all --unstable-kv .llm/tools/docs/check-accuracy-and-discoverability_test.ts`; raw missing-subcommand control exit 1; `rtk proxy deno task docs:accuracy`; `rtk proxy deno task docs:links`; scoped check/lint/fmt wrappers over owned tool roots. |
| S3 | The composed release/docs gate set stays green and leaves no incidental manifest/lock churn. | Run artifacts only unless reviewed fixes are required. | `docs:links`, `docs:accuracy`, `publish:dry-run`, repo tests, scoped release check/lint/fmt; immediate raw git status after dry-run. |

Each implementation slice updates `worklog.md` and `context-pack.md`, receives a separate
opposite-family substantive review before its sign-off commit, then is pushed and commented on the
draft PR before the next slice.

## Validation Plan

| Order | Gate | Command / evidence | Expected result |
| --- | --- | --- | --- |
| 1 | Release unit | `deno test --allow-all .llm/tools/release/publish-readiness_test.ts` | PASS |
| 2 | Docs checker unit | `deno test --allow-all --unstable-kv .llm/tools/docs/check-accuracy-and-discoverability_test.ts` | PASS |
| 3 | Missing-page raw negative | focused exported-audit command recorded verbatim in worklog | exit 1 with package + resolved page |
| 4 | Missing-command raw negative | focused exported-coverage command recorded verbatim in worklog | exit 1 with full rendered command path |
| 5 | Scoped type check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/release --ext ts,tsx` plus the same wrapper for `.llm/tools/docs` | PASS |
| 6 | Scoped lint | corresponding `run-deno-lint.ts` wrappers | PASS |
| 7 | Scoped format | corresponding `run-deno-fmt.ts` wrappers | PASS |
| 8 | Docs links | `rtk proxy deno task docs:links` | PASS |
| 9 | Docs accuracy | `rtk proxy deno task docs:accuracy` | PASS, strict command census asserted |
| 10 | Publish dry-run | `rtk proxy deno task publish:dry-run` | PASS; inspect status immediately, restore #1417 churn, no lock drift committed |
| 11 | Repo tests | `rtk proxy deno task test` | PASS |

The release-gate class (`scaffold.runtime`/production E2E) is N/A: this changes a readiness
predicate but not publish shape, generated output, CLI behavior, DB/Aspire wiring, or an actual
release cut.

## Risk Register

| Risk | Mitigation |
| --- | --- |
| False red blocks a canary/stable cut. | Audit `publishSet.effective`, preserve alias resolver in one constant, retain independent evidence, test published and new members. |
| Registry outage suppresses reference coverage. | Place check before and outside registry discovery. |
| Alias drift creates another hidden convention. | Exact four-entry constant plus index table and tests for alias and name-exact `-core` paths. |
| Command gate is inert, prefix-vacuous, or literal-list based. | Consume the materialized tree; require structural root matches and tokenized command-path resolution; run the raw synthetic-child negative; assert exact equality with 91 obligations, not only print it. |
| `ui:*` false negative. | Dedicated colon-form test and path renderer rule. |
| Corpus selection silently changes the result. | Read exactly the two locked files; index states their union; tests pass inputs separately and together. |
| Compact nested command families create false reds. | Lock this slice to root/immediate-child acceptance and defer recursive family grammar explicitly. |
| Existing four prose gaps make strict gate red. | S2 owns exactly four rows and the completeness-contract correction; no external predecessor remains. |
| `publish:dry-run` rewrites manifests/lock. | Immediate raw status/diff and restore only identified incidental churn; never commit it. |

## Arch-Debt Implications

No new architecture debt is planned. Existing `@netscript/cli` restructuring debt is unchanged;
the slice consumes its established public composition/catalog seam. Any need for a literal command
allowlist or a release bypass would be plan drift and requires rescope, not a debt entry hidden in
the implementation.

## Dependencies and Drift Watch

- Hard dependency: separate-session PLAN-EVAL PASS.
- Log drift if effective publish count differs from 35, command census differs from 91, aliases
  differ from PR-C's four, either locked command-corpus path changes, or implementation needs an
  additional production/prose file.

## Deferred Scope

- Full recursive 149-command structural coverage grammar.
- Reference content/export validation (#1108).
- Post-merge JSR landing-page observation; leave its #1377 box unticked and route verification to a
  follow-up issue.
- Any acceptance-row mutation until implementation evidence exists.
