# Plan & Design — READY FOR REVIEW

Refs #2418, phase 1 only. Archetype 6 CLI/tooling with docs scope; shared token
adapter extends the existing integration boundary. Existing doctrine constraints
remain: presentation parses, injected edges perform effects, named typed exports.

## Locked decisions

1. A tools-side selective TokensBrücke fork preserves LICENSE, source header,
   upstream URL and exact SHA. No publishable plugin package.
2. Snapshot export is lossless and deterministic, reproducing all ten fixture
   JSON files byte-for-byte using explicit exportDate (default fixture date)
   and actual fileKey. Alias IDs are translated to collection/name.
3. A DTCG 2025.10 round-trip document carries each variable/mode as tokens;
   extensions preserve Figma names, scopes, syntax, type, mode order, raw float
   precision and oklch. Import validates everything before mutating; two passes
   create variables then resolve aliases. Preserve existing IDs on reimport.
4. Reuse importFigmaTokens and current resolver/documents to build portable
   theme items. A shared source-composition function replaces script-only
   compaction. Registry themes carry DTCG source files and declared metadata;
   CLI compiles these with the existing token engine before the S2 staged
   installer commits them. No remote code evaluation.
5. Generic registry:theme/base URLs use S2 schema/path/lock validation; preset
   JSON uses UiPresetSchema. Existing ns1 share links retain their semantics.
   Bad network, JSON, schema, names or compile inputs must leave apply unchanged.
6. init --preset selects the generated app and calls the same application flow;
   local maintainer init exposes the same option for clean-scaffold acceptance.
7. GitHub export uses Git Data API one-tree/one-commit branch + PR, only changed
   snapshot value files, refusing name/type/metadata changes. Token is input-only
   memory and never written to clientStorage/localStorage or repository files.

## Risks and mitigations

- Figma host unavailable in CI: mock actual Plugin API shape, exact fixture bytes,
  alpha/float/alias/Theme B controls; state manual host validation UNPROVEN.
- Browser build: keep snapshot main independent of Node; bundle UI shared import
  only (not Style Dictionary); exercise bundle task.
- Name drift: check every mapped WEB name against role-manifest with explicit
  migrations; reject unknown variables against approved collection inventory.
- URL trust: published schema, S2 containment, no forwarded credentials, preflight
  before physical writes; negative transport/schema/path tests.
- Values-only identity: fixture snapshot structural comparison before GitHub push;
  DTCG source compaction may legitimately regenerate references, so value-only PR
  proof concerns canonical Figma snapshots, not compiled artifacts.
- Carriers and locks: regenerate in existing order, inspect lock diffs, revert
  docs-site lock churn only. Root check:* baselines are recorded, never hidden.

## Open decisions

None requiring implementation rework. Safe to defer: Figma Community publishing,
manual host acceptance, Code Connect and gap components (phase 2 dependency).
No new architectural debt is accepted.

## Gates

Each slice: structured check/test/lint/fmt wrappers and substantive independent
slice review. Final: quality:gate, release:preflight, docs:accuracy, all root
check:* tasks, regenerated prose/corpus/barrel/publish carriers, jsr audits,
publish-size, fixture roundtrip/name negative controls, URL command acceptance,
one-command clean scaffold + deno task check, full scaffold.runtime command
(Docker unavailable => UNPROVEN), PLAN-EVAL and IMPL-EVAL using owner route.
