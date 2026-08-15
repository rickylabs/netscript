# Plan: generated design registry catalog drift gate

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-design-registry-catalog-drift-gate--0.0.7-wave1` |
| Branch | `fix/design-registry-catalog-drift-gate` |
| Phase | `plan` |
| Target | `@netscript/cli` generated Fresh route asset + `@netscript/fresh-ui` manifest drift gate |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `frontend` |

## Archetype

Archetype 6 applies because the user-visible defect is generated scaffold output owned by
`@netscript/cli`. The frontend overlay applies because that asset drives a Fresh 2.x design route.
`@netscript/fresh-ui` remains its assigned Archetype 4 package; this leaf does not change its public
DSL/runtime shape, only a cross-surface semantic test.

## Current Doctrine Verdict

- `packages/cli`: **Keep** — preserve the Archetype-6 kernel/surface split.
- `packages/fresh-ui`: **Keep** — keep registry and interactive foundations explicit.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A1 | The manifest/catalog schema is the contract; the template follows it. |
| A2 | Generated consumers see a complete, predictable catalog rather than hidden installable items. |
| A8 | The existing template and focused cross-cutting drift test retain one reason to change. |
| A9 | The CLI owns scaffold assets; fresh-ui owns the authoritative registry. |
| A14 | A semantic, symmetric test makes catalog completeness an executable fitness function. |

## Goal

Make the generated `/design/components` catalog represent all 66 live registry items and all eight
collections, then add a symmetric semantic gate that fails with named missing/extra or changed
items when names, kinds, layers, descriptions, collection membership, version, or total drift.

## Scope

- Update the app-owned static catalog template to the complete current manifest projection.
- Represent collection membership in the generated catalog surface.
- Extend the existing registry documentation drift test into the cross-package catalog drift gate.
- Add positive and symmetric negative fixture tests without mutating the checked-in manifest.

Frozen product/test surfaces:

1. `packages/cli/src/kernel/application/ui/registry.ts`
2. `packages/cli/src/kernel/assets/app/routes/(design)/design/(_shared)/registry.ts.template`
3. `packages/fresh-ui/registry.manifest.ts`
4. `packages/fresh-ui/tests/registry-doc-drift.test.ts`

The repair is expected to need only surfaces 2 and 4. Surfaces 1 and 3 are read/audited authority
inputs and will remain byte-unchanged unless implementation evidence proves otherwise.

## Non-Scope

- No gallery renderer, route, island, theme, component, registry schema, CLI command, generated
  `AGENTS.md`, or plugin-contributed UI change.
- No new generator or repository task outside the frozen surfaces.
- No E2E, Aspire, Docker, browser, or `fresh-browser` execution without a fresh coordinator lease.
- No dependency, lockfile, package export, milestone, or issue mutation.

## Hidden Scope

- The catalog must include the two missing non-AI items (`donut`, `dropzone`) as well as AI items.
- A correct gate is bidirectional and checks metadata/collections, not only the item count.
- Negative fixtures must exercise both manifest-only and catalog-only names and include the names in
  the thrown diagnostic.
- CLI template publication and exact internal pins require JSR and publish-dry-run evidence.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| LD-1 | Keep the generated catalog a checked-in, app-owned static projection. | Preserves the route's copy-ownership contract and avoids runtime asset/import-meta/self-import JSR traps. |
| LD-2 | Add a static `registryCollections` projection alongside the item catalog. | Makes collection membership explicit without duplicating collection names on every item. |
| LD-3 | Put the semantic comparator and its fixtures in `registry-doc-drift.test.ts`. | It is the authorized natural home, already owns manifest/document drift, runs in the package test lane, and is excluded from publication. |
| LD-4 | Compare ordered exact projections and also compute named missing/extra/change diagnostics. | Order is part of the generated navigation/reference contract; named symmetric errors satisfy issue acceptance and make failures actionable. |
| LD-5 | Build negative fixtures in memory and call the same comparator as the checked-in gate. | Proves both drift directions without editing/reverting source files or weakening lock hygiene. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Static projection versus runtime manifest import | Resolved now | LD-1; static copy preserves app ownership and publish portability. |
| Collection representation | Resolved now | LD-2; separate ordered collection projection. |
| Whether all four frozen files must change | Safe to defer | Only files required by evidence change; frozen scope is a ceiling, not a quota. |

## Commit Slices

| # | Slice | Proof | Files |
| --- | --- | --- | --- |
| S0 | Bootstrap red research, locked plan, design checkpoint, and run identity. | Reproduction command records 66/50/16 and PLAN-EVAL decision precedes implementation. | Run artifacts only. |
| S1 | Complete the generated catalog and collection projection from the current manifest. | Focused format/check plus semantic inventory probe reports 66 items, 0 missing/extra, 8 exact collections. | CLI registry template + `worklog.md` + `context-pack.md`. |
| S2 | Add the semantic symmetric catalog drift gate and negative fixtures. | Focused structured test wrapper passes the real comparison and both negative cases; authorized static/fitness/JSR gates follow. | Fresh-ui drift test + `worklog.md` + `context-pack.md`. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Manual transcription repeats the original omission. | Produce the projection mechanically from the imported manifest, apply it as a reviewed patch, then make the semantic test compare every field. |
| Regex parsing yields false positives from unrelated source text. | Parse only exported literal blocks with anchored patterns and fail closed on missing/duplicate declarations. |
| Gate reports only a count and is hard to repair. | Include named manifest-only, catalog-only, changed-item, collection, meta-version and meta-total diagnostics. |
| Cross-package test path becomes fragile. | Resolve from the test module URL to the repo-relative CLI asset and assert the expected declarations exist. |
| Publish graph accidentally gains runtime asset reads. | Keep all file reading in excluded tests; run CLI and fresh-ui JSR audits and package dry-runs. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-18 | Risk | Assert parsed semantic projections and named differences, never a giant snapshot string. |
| AP-19 | Avoid | Add no runtime permission; test-only read permission is already declared by the package test task. |
| AP-25 | Avoid | Add no runtime filesystem or `import.meta` effect to published CLI/fresh-ui code. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-1/F-10 | yes | Scoped wrapper and `arch:check`; no oversized new test/code. |
| F-3 | yes | No new cross-layer runtime import; test reads the published asset as data. |
| F-5/F-6/F-7 | yes | No public-export delta; JSR audits/doc surface review and both package dry-runs. |
| F-9 | yes | No new published permissions/effects. |
| F-15 | yes | No upstream re-export. |
| F-CLI-22/F-CLI-24 | yes/manual | Template remains under kernel assets; static catalog is checked bidirectionally against the authoritative manifest. |
| frontend route/browser | required, lease-blocked | `fresh-browser` remains NOT_RUN until the coordinator grants an explicit expensive-gate lease. |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| None | none | Both affected packages have Keep verdicts; this leaf neither deepens nor creates debt. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | focused test | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-read packages/fresh-ui/tests/registry-doc-drift.test.ts` | PASS, including two negative fixtures. |
| 2 | scoped check | structured `run-deno-check.ts` for the two owned package roots, with `--unstable-kv` passed to Deno where applicable | PASS. |
| 3 | scoped lint/fmt | structured `run-deno-lint.ts` and `run-deno-fmt.ts` for owned TypeScript | PASS. |
| 4 | package tests | structured `run-deno-test.ts` for affected package tests | PASS. |
| 5 | quality | `deno task quality:scan` | exit 0. |
| 6 | architecture | `deno task arch:check` | exit 0. |
| 7 | JSR audit | `.llm/tools/fitness/audit-jsr-package.ts` for `packages/cli` and `packages/fresh-ui` | exit 0 or pre-existing debt explicitly attributed; no new runtime asset/import-meta finding. |
| 8 | publish | package-local `deno publish --dry-run --allow-dirty --no-check=remote` for CLI and `deno publish --dry-run --allow-dirty` for fresh-ui | exit 0; exact pins and intended file lists. |
| 9 | browser | contract `fresh-browser` | STOP/NOT_RUN pending fresh coordinator lease. |

## Deferred Scope

- Browser/Fresh route proof is deferred only to the explicit coordinator lease boundary; it is not
  waived or substituted.
- Tier-A substantive review, sign-off commit, and opposite-family IMPL-EVAL are coordinator-owned.

## Drift Watch

- Any need to edit outside the four frozen product/test surfaces is a hard stop and significant
  drift entry.
- Any new package export, dependency, runtime filesystem/import-meta read, or lockfile change is a
  hard stop for coordinator review.
- Any gate requiring browser/E2E/Aspire/Docker execution is an authority boundary, not an implicit
  permission to run it.
