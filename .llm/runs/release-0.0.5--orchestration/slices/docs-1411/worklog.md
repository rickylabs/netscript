# Worklog — docs #1411

## 2026-08-09 — Plan gate

- `PLAN-EVAL: N/A` — this is a small mechanical docs-source correction with the exact four known
  omissions, established `releaseSpecifier` pattern, fixed boundaries, and required gates supplied
  by issue #1411; no architecture, sequencing, or scope decision remains open.
- Baseline: `origin/main@399f60185d5d01ae68764a8f48d1f716ca3a51aa` on
  `fix/docs-versionless-jsr-specifiers`.
- Scope overlay: `.llm/harness/archetypes/SCOPE-docs.md`; no package/plugin archetype applies.
- Source edits have not started at this checkpoint.

## Design

- Public surface: rendered documentation install commands and import-map examples only.
- Domain vocabulary: `releaseSpecifier`, versioned NetScript JSR specifier, docs-source occurrence.
- Ports: Lume/Vento rendering through the existing docs-site build; no new abstraction.
- Constants: reuse the existing `releaseSpecifier`; introduce no new finite values.
- Commit slices: S1 repairs every verified unpinned `jsr:@netscript/*` source occurrence and is
  proven by the docs build/static gates plus `check:netscript-jsr-specifiers`.
- Deferred scope: generated corpus/assets, packages, plugins, lockfiles, runtime E2E, Aspire, and
  containers remain owner-excluded.
- Contributor path: copy the existing expression-string pattern from
  `docs/site/data-persistence/how-to/database-migration.md` or the Vento interpolation pattern used
  throughout `docs/site`.

## Gate evidence

### Whole-tree sweep

- Raw textual inventory on `399f60185`: 76 `jsr:@netscript/` prefixes under all of `docs/site`,
  including private `_plan` history, the `_includes/readme-template.md` placeholder, wildcard/prose
  references, and repeated descriptive/checklist text.
- Defect-class inventory: five version-less install/import specifiers across the four owner-named
  sites (three CLI install targets and two import-map targets). All five now append the established
  `releaseSpecifier` value.
- The pre-fix root `deno task check:netscript-jsr-specifiers` exited 0 with `failures=0` because the
  corrected docs have not yet been regenerated into `packages/mcp/src/publish-assets.generated.ts`.
  No allowance or narrowing was added. A direct docs-source guard would close that timing gap, but
  adding validation tooling is beyond this deliberately mechanical docs-source slice; the mandatory
  corpus-regeneration guard remains the downstream enforcement point.

### Commands

| Command | Raw exit | Evidence |
| --- | ---: | --- |
| `cd docs/site && deno task build` | 0 | source format OK; 617 files generated; rendered homepage semantics OK |
| `cd docs/site && deno task check:links` | 0 | 32,772 internal links across 220 pages resolve |
| `cd docs/site && deno task check:caveats` | 0 | 18 caveat markers across 14 pages resolve |
| `cd docs/site && deno task test:source-format` | 0 | 3 passed, 0 failed |
| `deno task check:netscript-jsr-specifiers` | 0 | scanned 2,328; allowances 1; ranges 0; failures 0 |
| `git diff --check` | 0 | no whitespace errors |

Rendered spot checks found all five repaired targets at `@0.0.4` in the generated pages: the three
CLI install commands and both `author-a-plugin` import-map values.

## Reconcile

- Issue #1411 is fully resolved by this slice, so the draft PR body must contain `Closes #1411`.
- No scope, doctrine, or debt readjustment was discovered. IMPL-EVAL, CI, and merge remain with the
  orchestrator; this Tier-D lane does not self-certify.
- Implementation commit `9d27817e8` was pushed with the explicit refspec
  `HEAD:refs/heads/fix/docs-versionless-jsr-specifiers`.
- Draft PR #1412 targets `main`, carries `Closes #1411`, milestone `0.0.5`, docs-only CI labels,
  and exactly one lifecycle label: `status:impl-eval`. The structured IMPL evidence comment is
  https://github.com/rickylabs/netscript/pull/1412#issuecomment-5230514313.

## 2026-08-09 — Round 2 review correction

- The orchestrator accepted the original five repairs and found four additional published
  version-less `deno add jsr:@netscript/ai` instructions that the first sweep misclassified.
- Corrected audit contract: reject every published `deno add`, `deno install`, or `deno x` command,
  and every import-map value, that names `jsr:@netscript/*` without a version. Exclude unpublished
  `_plan/**` and `_includes/**`; package placeholders remain valid when `releaseSpecifier` follows
  the placeholder.
- This is a review correction inside the existing mechanical slice. PLAN-EVAL remains N/A;
  source edits had not begun at this Round 2 checkpoint.

### Round 2 implementation and sweep

- Pinned four additional published `deno add jsr:@netscript/ai` instructions in `ai/engine.md`,
  `ai/index.md`, and `tutorials/chat/05-mcp.md` using `{{ releaseSpecifier }}`.
- Final defect total: nine unpinned published install/import specifiers repaired across eight source
  sites. The first round repaired five; Round 2 repaired four.
- Definition-driven final sweep: 55 published candidates (53 `deno add` / `deno install` /
  `deno x` commands and two import-map values), zero unpinned. All underscore-owned non-source
  trees were excluded; already-pinned package placeholders remained valid.
- Rendered spot checks found all four Round 2 instructions at `jsr:@netscript/ai@0.0.4`.

### Round 2 gate evidence

| Command | Raw exit | Evidence |
| --- | ---: | --- |
| published-source command/import-map sweep | 0 | candidates 55; commands 53; import-map values 2; unpinned 0 |
| `cd docs/site && deno task build` | 0 | source format OK; 617 files generated; rendered homepage semantics OK |
| `cd docs/site && deno task check:links` | 0 | 32,772 internal links across 220 pages resolve |
| `cd docs/site && deno task check:caveats` | 0 | 18 caveat markers across 14 pages resolve |
| `cd docs/site && deno task test:source-format` | 0 | 3 passed, 0 failed |
| `deno task check:netscript-jsr-specifiers` | 0 | scanned 2,328; allowances 1; ranges 0; failures 0 |
| `git diff --check` | 0 | no whitespace errors |

The root guard remains downstream-only evidence until corpus regeneration. No direct docs-source
guard was added; the orchestrator will carry the demonstrated reachability gap to follow-up work.
