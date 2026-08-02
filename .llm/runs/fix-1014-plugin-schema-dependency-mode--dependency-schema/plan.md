# Plan: dependency-mode plugin Prisma schema resolution

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1014-plugin-schema-dependency-mode--dependency-schema` |
| Branch | `fix/1014-plugin-schema-dependency-mode` |
| Phase | `plan` |
| Target | `packages/cli` public/local plugin install and CLI E2E |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `none` |

## Archetype

Archetype 6 governs because the defect is in a user-run CLI install flow. Plugin packages remain
unchanged and are consumed as published Archetype-5 contributions.

## Current Doctrine Verdict

`@netscript/cli`: **Restructure** (existing debt). This focused adapter/use-case fix does not deepen
the known monolith debt or restructure unrelated CLI surfaces.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A2 | A declared database contribution must resolve explicitly, not through silent magic. |
| A7 | Reuse URL/fetch/metadata primitives and the existing fetcher seam. |
| A8 | Package retrieval stays at the public JSR adapter edge; target-layout policy stays in the kernel plugin DB adapter. |
| A13 | A missing declared schema becomes a typed `ScaffoldValidationError`. |
| A14 | Semantic unit and clean-userland gates prove the published install behavior. |

## Goal

Resolve published plugin Prisma fragments during dependency-mode installation, copy them to the
existing root schema layout, and reject declared-but-unresolvable schemas without changing local
copied-source or no-DB behavior.

## Scope

- Add an explicit copied-source → package-file source ladder to plugin DB integration.
- Reuse `ValidatedPluginDescriptor.versionMetadata.files` and `JsrPackageFileFetcher`.
- Preserve target path and filename rules.
- Fail only when DB is required, migrations are declared, and both sources resolve zero fragments.
- Add semantic unit tests and a true-userland root-fragment/content assertion.
- Add a semantic dependency-mode install-flow integration test using a JSR-shaped descriptor and
  injected package fetcher. Treat the local-path-only userland suite as non-evidence for box 4.

## Non-Scope

- No new `scaffold.plugin.json` field or plugin package changes.
- No consumption of `InstallSpec.prismaContract`; the static published manifest/file list is the
  backward-compatible public install contract for this slice.
- No legacy `PluginScaffolder` placeholder redesign.
- No push or PR operations, per owner instruction.

## Hidden Scope

- Package fragments must take precedence over a copied/generated placeholder when metadata lists
  real fragments.
- `--dry-run` returns before resolution, fetch, or writes.
- Errors must include plugin name and searched copied/package paths.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Extend the kernel copier with optional resolved package schema inputs rather than place target-layout policy in the public feature. | Kernel already owns engine selection, filename normalization, and root target layout. |
| D2 | Expose/reuse package-file URL construction beside `JsrPackageFileFetcher`; resolve bytes in the public install flow. | Network IO stays at the public JSR adapter edge and remains injectable. |
| D3 | Prefer package metadata fragments when present; otherwise fall back to copied source. | Prevents a generic placeholder from shadowing real published fragments while preserving local descriptors with `{}` files. |
| D4 | Use `hasDatabaseMigrations` as the declaration signal. | It exists in 0.0.2 and exactly matches first-party published Prisma presence. |
| D5 | Treat `requiresDb === false` as an early no-op before any fetch/failure. | Preserves `--no-db` and non-DB plugin behavior. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Exact resolved-fragment input shape | safe to defer to implementation naming | It is internal and tested; D1–D5 lock behavior and ownership. |
| Whether to repair the stale userland placeholder expectation | safe to defer | Repair cheaply if possible, but never count the local-path-only suite as dependency-mode evidence. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Slash-prefixed JSR paths produce invalid URLs | Normalize once in the shared URL helper and test both metadata filtering and fetch URL. |
| Package fetch occurs during dry run | Preserve the existing early dry-run return and add a no-fetch assertion. |
| Local install regresses | Keep package resolution optional; empty local metadata falls through to copied source; retain local tests. |
| Fetch succeeds but write naming/layout changes | Test named fragments and bare `database/schema.prisma` target rules. |
| Declared schema failure becomes too broad | Gate on all three conditions: DB required, manifest declaration true, zero resolved fragments. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-2 | risk | Reuse existing JSR fetcher/URL policy rather than duplicate fetch wrappers. |
| AP-11/AP-25 | risk | Keep network access in `public/infra/jsr`; kernel consumes resolved bytes only. |
| AP-18 | risk | Assert file presence and exact real schema content/model marker, not giant snapshots. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-1/F-3/F-5/F-10/F-11/F-12/F-15–F-19 | yes | `quality:gate`, scoped wrappers, review, focused tests |
| F-6/F-7/F-8/F-9 | no surface delta, reviewed | JSR scan records unchanged exports/metadata and compatible 0.0.2 file list |
| F-CLI-1…31 | applicable subset/manual | `arch:check` plus structural review; no command vocabulary/composition delta |
| Consumer install | yes | Semantic `installPlugin` integration with JSR descriptor + injected fetcher; published `scaffold.runtime --source jsr` remains release-train evidence once 0.0.3 exists |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| Existing CLI restructure debt | none | Focused changes stay within existing adapter/vertical feature locations. |
| `InstallSpec.prismaContract` zero-consumer seam | none | Scope-adjacent finding; report but do not deepen or depend on it. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | focused unit | `deno test -A packages/cli/src/kernel/adapters/plugin/ packages/cli/src/public/features/plugins/` | exit 0 |
| 2 | scoped check | `deno run -A .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx` | exit 0 |
| 3 | scoped lint | `deno run -A .llm/tools/run-deno-lint.ts --root packages/cli` | exit 0 |
| 4 | scoped fmt | `deno run -A .llm/tools/run-deno-fmt.ts --root packages/cli` | exit 0 |
| 5 | doctrine quality | `deno task quality:gate` | exit 0 or attributable existing debt only |
| 6 | semantic dependency install | focused `installPlugin` integration test in the unit command above | injected JSR fetcher writes the real fragment to the root schema path |
| 7 | local userland regression | `deno task e2e:cli run scaffold.userland-install` | optional/non-box-4: local-path-only lane; run only if stale assertion is repaired and a regression verdict is needed |
| 8 | published dependency E2E | `deno task e2e:cli:prod` / `scaffold.runtime --source jsr` | deferred to 0.0.3 publication; current 0.0.2 cannot contain this CLI fix |

## Dependencies

- JSR 0.0.2 version metadata and immutable published package files.
- Existing `JsrPackageFileFetcher`, file-system, and scaffolder ports.

## Drift Watch

- Any evidence that dependency-mode scaffold now emits a real plugin schema locally.
- Any mismatch between migration capability and published file list.
- Any need to change a public manifest or package export.
