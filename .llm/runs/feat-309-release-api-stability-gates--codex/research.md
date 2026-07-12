# Research — feat-309-release-api-stability-gates--codex

## Re-baseline

- Carried-in source: issue #309 slice brief.
- Re-derived against `eac57c5f5ac4c10b9c1cc5b17874ae821b27a20d` on 2026-07-12.
- The repository has no `docs/architecture/doctrine/10-versioning-*` file. Stability and semver
  policy currently live in `02-public-surface.md`, with export-path breaking-change rules in
  `05-folder-structure.md`; the deprecation convention belongs in `02-public-surface.md`.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | Base and branch preflight pass; the opening tree is clean. | `git -C /home/codex/repos/ns-b9-309 rev-parse HEAD`, branch, raw status |
| 2 | `version:bump` invokes `.llm/tools/deps/bump-version.ts`, which only proxies native `deno bump-version`; release-cut uses a separate coordinator in `cut.ts`. | root `deno.json` tasks and both tool files |
| 3 | `coordinateVersionBump` updates root plus manifests found only below `packages/` and `plugins/`; it does not derive the full root `workspace` declaration. | `.llm/tools/release/cut.ts` |
| 4 | The real root workspace declares `packages/*`, `packages/cli/e2e`, `plugins/*`, `examples/*`, and `apps/*`; current versioned members are root, packages, nested CLI E2E, and plugins. | root `deno.json`; manifest inventory |
| 5 | `deno.lock` contains 59 `@netscript/*` mirror/dependency occurrences under `workspace.members`; a coordinated replacement must leave no old-version residue. | parsed lock inventory |
| 6 | Publishable members already have one canonical discovery function: `discoverWorkspaceMembers` in `publish-workspace.ts`, limited to publishable `packages/` and `plugins/`. | `.llm/tools/release/publish-workspace.ts` |
| 7 | Deno 2.9 `deno doc --json` emits schema version 2, with modules under `nodes[specifier]` and public symbols under `symbols[].declarations[]`. | local `deno doc --json packages/config/mod.ts` probe |
| 8 | CI currently has no API surface job. The existing `ci.yml` PR trigger is limited to `main`/`feat/package-quality`; a dedicated workflow can use native `paths: ["packages/**"]`. | `.github/workflows/ci.yml` and workflow inventory |
| 9 | Repo policy assigns release/fitness helpers to `.llm/tools/`; `tools/` is reserved for public developer tooling. | `netscript-tools` skill |
| 10 | The Claude skill mirror is generated from `.agents/skills`; it must be synchronized with `agentic:sync-claude`. | root tasks and agentic README |

## jsr-audit surface scan

- N/A: this is a release-infrastructure/tooling wave and does not modify any package export or
  publish manifest. The new gate consumes existing `deno doc --json` surfaces.
- Surface risks addressed by the plan: subpath identity, signature normalization, removals,
  additions, changed declarations, and stale deprecation metadata.

## Open questions resolved

- Baseline placement: `.llm/tools/release/baselines/`, beside the CI-only release gate.
- Major declarations: an explicit checked-in declaration file, separate from the baseline, so
  baseline refresh cannot silently approve a breaking change.
- Rollout: dedicated PR workflow, package-path filtered, with `continue-on-error: true` for beta.
- Signature policy: compare normalized declaration `kind` + public definition, stripping source
  locations, JSDoc, bodies, and resolution paths; documentation-only/refactor-only changes remain
  patch-class.
