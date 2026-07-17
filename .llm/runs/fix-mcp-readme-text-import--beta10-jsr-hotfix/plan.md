# Plan: registry-safe MCP README embedding and publish preflight

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-mcp-readme-text-import--beta10-jsr-hotfix` |
| Branch | `fix/mcp-readme-text-import` |
| Phase | `plan` |
| Target | `packages/mcp`, publishable package/plugin surfaces, release tooling/docs |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `none` |

## Archetype

Archetype 6 is the smallest fit because `@netscript/mcp` publishes an executable stdio CLI entrypoint and this hotfix changes its bundled runtime documentation asset. The cross-workspace sweep is release fitness tooling, not a new public runtime abstraction.

## Current Doctrine Verdict

The doctrine's current package table predates `@netscript/mcp`; the adjacent `@netscript/cli` verdict is `Restructure`. This hotfix does not broaden that debt and applies A14 at the actual JSR boundary.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A7 | Generated constants use platform file reads only in the maintainer generator, never at published runtime. |
| A8 | Generated assets and their generator each have one clear reason to change. |
| A14 | The release gate must reproduce the registry failure class, including a witnessed negative case. |

## Goal

Remove all import attributes from publishable NetScript source, embed MCP README/package assets through reproducible generated constants, and make release preflight reject any future `with { type: ... }` attribute before JSR does.

## Scope

- Generate and consume an internal MCP README constant and generated package metadata/constants needed to remove publishable JSON attributes.
- Sweep all publishable `packages/**` and `plugins/**` source selected by each member's publish rules.
- Add regeneration and freshness tasks, with a green run and a seeded stale-output failure.
- Add an import-attribute release-preflight finding, tests, user-facing failure output, and seeded CLI failure proof.
- Correct canonical and mirrored release/JSR-audit guidance; run the sync check.

## Non-Scope

- Test-only JSON import attributes excluded from publish tarballs.
- Import-attribute text embedded inside scaffold template string constants; it is userland generated source, not syntax in the published module graph.
- Cutting, publishing, retrying beta.10, merging the PR, or closing issue #808.
- Existing archetype restructuring debt unrelated to the registry hotfix.

## Hidden Scope

- Publish-rule-aware scanning must ignore comments/string/template content to avoid false positives in generated asset constants.
- Generated files must be included by each owning package's existing `**/*.ts`/`src/**/*.ts` publish rules.
- Wording in `.agents/skills` and `.claude/skills` must remain synchronized.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Generated TypeScript constants are the sole sanctioned bundled-asset form. | JSR registry rejected import attributes despite local dry-run success. |
| D2 | Extend repo maintainer generation with a dedicated publish-assets generator and diff freshness task. | Mirrors the proven `check:assets-barrel` pattern and makes source drift visible. |
| D3 | Preflight rejects every `with { type: ... }` attribute on the publish-rule-filtered source surface. | The registry limitation is attribute-type agnostic from the release policy perspective. |
| D4 | Tests and emitted scaffold strings remain out of the syntax gate. | They are outside the published module graph or are string data, not module syntax. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Generator/file placement | resolved now | Internal `*.generated.ts` files live inside each owning publishable member. |
| Attribute parser strategy | resolved now | A lexical code-only scan preserves line numbers and rejects syntax without matching strings/comments. |
| Post-publish beta retry | safe to defer | Explicitly outside this PR; release owners fix-forward after merge. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Sweep misses an included source file. | Reuse existing publish member discovery and include/exclude filtering in `scanPublishSurface`. |
| Gate flags scaffold strings or comments. | Add lexical tests covering actual syntax versus inert text. |
| Generated metadata drifts. | Regeneration-plus-`git diff --exit-code` freshness task and negative seed proof. |
| Release docs remain contradictory. | Update both named skills in canonical/mirrored trees and run `agentic:check-claude`. |
| Local dry-run gives a false sense of registry equivalence. | Record it as static-only evidence and retain the registry failure rationale. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-11 | risk | Published runtime never reads repo files; generator owns filesystem IO. |
| AP-18 | risk | Freshness compares deterministic generated output; focused behavior tests avoid giant snapshots. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-5 public surface | yes | MCP check/tests; no public API change |
| F-6 JSR publishability | yes | MCP `publish:dry-run`, release preflight green and witnessed red |
| F-7 docs | yes | README remains published and embedded byte-for-byte |
| F-9 permissions | reviewed | No runtime permission expansion |
| F-10 test shape | yes | Focused scanner and MCP tests |
| F-19 scoped runners | yes | changed roots/files through repo wrappers where applicable |
| code quality | yes | changed-file `quality:scan` and `arch:check` |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `.llm/harness/debt/arch-debt.md` | none | The known release defect is fixed in scope; no violation is deferred. |

## Commit Slices

1. Harness bootstrap and approved design — proven by separate PLAN-EVAL; files under this run directory.
2. Registry-safe generated publish assets and full publish-surface sweep — proven by focused checks/tests, freshness green/red, and zero publish-surface attributes; package/plugin sources, generator, tasks, run artifacts.
3. Release preflight doctrine correction — proven by scanner tests, CLI seeded red, full preflight green, skill sync; release tool/tests and skill mirrors.
4. Final gate/evaluator evidence — proven by required gate table and separate IMPL-EVAL; run artifacts and PR phase trail.

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | focused MCP | package check and focused tests | exit 0 |
| 2 | generator freshness | new check task | exit 0; seeded drift exits non-zero |
| 3 | release scanner tests | focused Deno test | exit 0 |
| 4 | release preflight | `deno task release:preflight` | exit 0; seeded attribute exits non-zero |
| 5 | MCP JSR static gate | `cd packages/mcp && deno task publish:dry-run` | exit 0 |
| 6 | changed quality | `deno task quality:scan` scoped to changed files | exit 0 |
| 7 | doctrine fitness | `deno task arch:check` | exit 0 |
| 8 | skill mirror | `deno task agentic:check-claude` | exit 0 |
| 9 | IMPL-EVAL | separate formal evaluator session | `PASS` |

## Dependencies

- Existing workspace discovery/publish rules and generated-assets conventions.
- No new runtime or registry dependency.

## Deferred Scope

- Actual publish retry and `e2e-cli-prod` remain post-merge release operations.

## Drift Watch

- Any newly discovered attribute outside test/generated-string exclusions, generator nondeterminism, or gate requiring unrelated source churn is recorded before proceeding.
