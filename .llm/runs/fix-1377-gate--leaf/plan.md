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
- Add tree-derived root/immediate-subcommand coverage to `docs:accuracy` with an asserted census.
- Add focused positive and negative tests and preserve raw non-zero negative-control evidence.
- Clarify the reference-index convention once so it describes the gate contract, not only observed
  layout.

## Non-Scope

- Reference page content/export-map verification (#1108) or `check-exports-drift` expansion.
- README standard/staleness (#767), fenced-block extraction (#1374), installed-artifact proof
  (#1343), package renames, URL moves, or command behavior changes.
- Authoring missing package pages or filling PR-C command prose. Missing content is reported to the
  orchestrator.
- The unreachable deploy `emit` operation (#1544).

## Locked Decisions

| ID | Decision | Criterion and rationale |
| --- | --- | --- |
| D-1 | Use a declared four-entry alias map; do not move the IA. | Criterion: minimize irreversible public-URL and cross-gate change while making the release predicate agree with the already published site. Aliases change one resolver, preserve inbound links and `docs:accuracy`, and match PR-C's enumerated convention. Moving four URLs would create avoidable user-facing breakage and broader proof obligations. The inconsistency is bounded and explicit rather than inferred. |
| D-2 | Add a separate `docs-reference` readiness check immediately after `publish-set`. | `publishSet.effective` is the authoritative coordinated publish set. Placing the check here makes it independent of JSR registry discovery and prevents it being skipped with first-publish checks. `auditFirstPublishPackages` retains only README/tagline/license/export policy. If publish-set evidence is unavailable, `docs-reference` is explicitly `SKIP`; publish-set itself is already `FAIL`, so readiness cannot falsely pass. |
| D-3 | A missing page is release-blocking, with a bounded content escape hatch rather than a bypass flag. | A publishable member without a page turns `docs-reference` red. A maintainer unblocks by adding the canonical page resolved by the convention; when full prose cannot land before a cut, the release skill permits an explicit stub that names and links the tracked content follow-up. No ignore list, environment override, or silent exemption is added. #1108 remains responsible for content/export fidelity. |
| D-4 | Derive command obligations from the materialized public tree through `PublicCliCommandCatalog`; never parse `.command()` source and never hardcode verbs. | This executes the same tree users/MCP see and already walks every child. The checker selects all root entries plus each root entry's immediate children. That is the acceptance level that catches a new group subcommand while respecting compact documentation of deeper generated command families. |
| D-5 | Treat colon-form `ui:*` names as complete root command paths. | A tree path `ui:add` renders as `netscript ui:add`; it must not be rewritten to `netscript ui add`. The normal nested form remains `netscript <group> <subcommand>`. |
| D-6 | Assert the exact audited census, not a neighboring or merely printed count. | Production evidence reports and asserts 91 root-or-immediate-child command paths on this baseline (15 roots plus 76 direct children). The test also asserts the derived path set; any public-tree growth changes the count and requires corresponding documentation. The count is computed from the tree and compared to the ratified floor, not used as a literal verb list. |
| D-7 | PR-D will not author four newly discovered deploy lifecycle prose entries. | The focused arrival check found `deploy start`, `deploy stop`, `deploy status`, and `deploy uninstall` absent as exact public command paths. PR-C owns prose. The orchestrator must land/authorize its content follow-up before the implementation slice can claim `docs:accuracy` green. The gate remains strict; it will not be weakened to hide these four paths. |
| D-8 | Raw negative controls invoke the exported gate functions one case at a time. | A unit test that expects a rejection exits zero and is insufficient evidence. Each control command seeds exactly one missing page/command, invokes the real exported audit, prints its diagnostic, and leaves the process at raw exit 1. Tests separately lock the diagnostic contract. |

The reference-index change records D-1 once: normal scoped-name stripping plus exactly four declared
aliases. It does not rename or add pages.

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Path convention | resolved now | D-1 |
| Readiness placement and skip behavior | resolved now | D-2 |
| Missing-page release escape | resolved now | D-3 |
| Command-tree depth and `ui:*` normalization | resolved now | D-4/D-5 |
| Census assertion | resolved now | D-6 |
| Four prose gaps | resolved now, external dependency | D-7; do not start implementation if the strict baseline cannot be made green without violating scope |
| Deeper recursive command families | safe to defer | They are represented by compact family tables; a later structural Markdown grammar may expand from 91 to the full 149 without changing this slice's direct-subcommand acceptance. |
| Content correctness | safe to defer | Owned by #1108; this slice enforces existence only. |

No unresolved decision remains that would force implementation rework. D-7 is a sequencing
dependency, not permission to modify the predicate.

## Exact Files

| File | Planned change |
| --- | --- |
| `.llm/tools/release/publish-readiness.ts` | Alias resolver, separate whole-publish-set audit/dependency/evidence row, remove docs check from first-publish audit. |
| `.llm/tools/release/publish-readiness_test.ts` | Ordered evidence update; 35/35-style whole-set positive; published-member missing-page negative; first-publish regression remains registry-scoped. |
| `.llm/tools/docs/check-accuracy-and-discoverability.ts` | Tree-derived command-reference coverage, colon-aware rendering, asserted census, `runAccuracyCheck()` integration. |
| `.llm/tools/docs/check-accuracy-and-discoverability_test.ts` | Synthetic public-tree positive and missing-direct-subcommand negative; colon-form control; census behavior. |
| `docs/site/reference/index.md` | One bounded convention sentence declaring that the four listed paths are gate aliases. No page content or URL move. |
| `.llm/runs/fix-1377-gate--leaf/{supervisor,research,plan,worklog,context-pack,drift}.md` | Harness decisions, evidence, per-slice results, resume state, and drift. |

If implementation requires any other product or prose file, stop and rescope through the
orchestrator rather than silently widening the slice.

## The Two Negative Tests

1. **Missing reference page:** fixture has a member in `publishSet.effective`, registry metadata says
   it is already published, and its resolved canonical page is absent. The report must contain
   `docs-reference: FAIL`, package name, resolved path, rule `docs-reference`, and `ok=false`. The raw
   one-case command must exit 1.
2. **Missing command-tree subcommand:** a synthetic materialized tree adds a direct child under an
   otherwise documented group without adding reference prose. Coverage must identify the rendered
   `netscript <group> <subcommand>` path, report the audited/covered counts, and fail. A separate
   colon control proves `ui:add` stays colon-form. The raw one-case command must exit 1.

## Commit Slices

| # | What the slice proves | Files | Named gate before commit |
| --- | --- | --- | --- |
| P | The decision-locked plan is reviewable and implementation has not begun. | Run artifacts only. | Plan-Gate checklist review; separate-session PLAN-EVAL must return PASS before S1. |
| S1 | Every effective publish member is audited at the PR-C path convention, independently of registry/new-package state, and a missing page fails. | Release tool/test, reference index, run artifacts. | Focused `deno test --allow-all .llm/tools/release/publish-readiness_test.ts`; raw missing-page control exit 1; scoped release check/lint/fmt wrappers. |
| S2 | Every public root/direct-child command is derived from the live tree, colon-safe, census-asserted, and an undocumented child fails. | Docs checker/test, run artifacts. | Focused `deno test --allow-all --unstable-kv .llm/tools/docs/check-accuracy-and-discoverability_test.ts`; raw missing-subcommand control exit 1; `rtk proxy deno task docs:accuracy`; scoped check/lint/fmt wrappers over owned tool roots. |
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
| Command gate is inert or literal-list based. | Consume materialized tree; raw synthetic child negative; assert 91 obligations, not only print it. |
| `ui:*` false negative. | Dedicated colon-form test and path renderer rule. |
| Compact nested command families create false reds. | Lock this slice to root/immediate-child acceptance and defer recursive family grammar explicitly. |
| Existing four prose gaps make strict gate red. | D-7 orchestrator dependency; do not weaken or author prose in this slice. |
| `publish:dry-run` rewrites manifests/lock. | Immediate raw status/diff and restore only identified incidental churn; never commit it. |

## Arch-Debt Implications

No new architecture debt is planned. Existing `@netscript/cli` restructuring debt is unchanged;
the slice consumes its established public composition/catalog seam. Any need for a literal command
allowlist or a release bypass would be plan drift and requires rescope, not a debt entry hidden in
the implementation.

## Dependencies and Drift Watch

- Hard dependency: separate-session PLAN-EVAL PASS.
- Sequencing dependency: the orchestrator resolves D-7 before strict `docs:accuracy` can be claimed
  green without PR-D writing prose.
- Log drift if effective publish count differs from 35, command census differs from 91, aliases
  differ from PR-C's four, another file hardcodes the path convention, or implementation needs a
  third production file.

## Deferred Scope

- Full recursive 149-command structural coverage grammar.
- Reference content/export validation (#1108).
- Post-merge JSR landing-page observation; leave its #1377 box unticked and route verification to a
  follow-up issue.
- Any acceptance-row mutation until implementation evidence exists.
