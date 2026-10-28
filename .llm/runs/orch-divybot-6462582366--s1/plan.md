# Tokens v2 — Plan & Design — READY FOR REVIEW

## Contract and locked decisions

Implement #2414 on S0, with NS One's existing CSS values as a compatibility
fixture. Use one DTCG 2025.10 resolver, three token tiers, and Style Dictionary
5.7.1 custom formats for every output. The wrapper only expands the resolver's
ordered sources and selected contexts; SD owns alias resolution and output.

Snapshot the seven approved Figma collections with provenance. A reproducible
source importer follows aliases in the target collection's selected mode,
rounds float noise, normalizes font styles, lifts raw values into primitives,
and creates alias-only semantic documents. Registered CSS names preserve WEB
syntax. Nodes and the theme mapping supply the extra named shape, font, key,
band, avatar, and hairline roles that do not yet have Figma variables.

The theme modifier has 18 contexts: NS One, seven Studio flavors, and the ten
other languages. Each gets a complete core map, including dedicated maps for
Bloom, Liquid, and Terminal despite their shared Figma Theme modes. Scheme has
light/dark contexts; density has comfortable/compact contexts. Build all 72
inputs, recording requested and effective axes. Theme presets apply their fixed
density after the density source, so unsupported user density requests do not
create a new visual preset. Record dense/airy/chunky as a schema follow-up.

Derived values keep an alias `$value`; `$extensions.netscript.derive` describes
their mix. SD's CSS formatter emits `color-mix()` with semantic `var()` operands;
JSON/Figma output receives the computed color. Figma output preserves collection,
mode, variable, scopes, and syntax shape and keeps alias metadata where valid.

The public `@netscript/fresh-ui/tokens` entry provides the build contract and
ships required JSON source assets. Runtime UI entrypoints do not import the
engine. CLI commands use filesystem/process ports through existing dependencies,
with a thin `tokens build|clean|init` group and semantic-only app overrides.
Override validation rejects primitives, components, unknown names, raw semantic
values, and cycles; the override applies last before SD resolution.

Keep `:root` as NS One light, retain the legacy `[data-theme='dark']` selector,
and add `data-theme`, `data-scheme`, `data-density`, and Studio `data-flavor`.
Update templates and theme toggle for the new attributes, preserving old stored
scheme preferences. Font imports and family choices come from generated tokens.
The design route reads generated JSON, including ramps and preset metadata.

## Commit slices and proving gates

1. Sources and resolver: `packages/fresh-ui/tokens/**`, token contracts, resolver,
   importer, focused tests, source documentation. Frozen source build, DTCG
   validation, target-mode/cycle/float/style and 72-input resolver tests.
2. Outputs: SD adapter and formats, build script, theme CSS/JSON/registry/Figma
   outputs, public export/publish assets. Frozen `tokens:build`, deterministic
   output checks, compatibility property diff, Figma shape/derived-color tests.
3. Checks: role manifest, contrast matrix/exclusions, token CI and negative
   controls. Unknown name, raw semantic, and seeded AA violation must fail.
4. CLI: `tokens` command group, port-driven use cases/adapters/composition and
   focused tests. Real scaffold `tokens init/build/clean` with semantic override.
5. Migration: app/design/font/toggle templates, registry asset generation, docs,
   browser harness baseline reconciliation. Scoped wrappers, browser/axe,
   quality/architecture, JSR/doc/publish checks, full scaffold.runtime command,
   then independent IMPL-EVAL and READY.

Every slice commits run evidence, pushes, and posts a PR scope/hash/gate comment.
Substantive review comes from a separate Anthropic-family evaluator; the
implementation session does not certify its own work.

## Required gate set

- Scoped structured check/test/lint/fmt wrappers for changed TS sources, with
  explicit CLI configuration when root exclusions would suppress coverage.
- Frozen `tokens:build` and deterministic `tokens:check`; source/alias/name/
  contrast gates including negative controls; compatibility evidence.
- fresh-ui test suite; CLI command/help/composition/registry/template tests.
- `quality:gate`, relevant design color/primitive guards, generated asset checks.
- Package JSR audits, complete-export doc lint, publish dry-run, dependency
  production-install evidence for the new export. No `any` or casting escape.
- S0 browser harness: NS One baseline and Studio Utility light/dark, no increased
  serious/critical axe findings, baseline selector deltas listed in the commit.
- `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`, one pass.
  Missing host prerequisites mean UNPROVEN, never PASS.

## Risks and mitigations

- Incomplete or ambiguous Figma values: preserve approved values and document
  role mappings; no color repair. Contrast exceptions name preset, scheme, pair,
  exact measured ratio, threshold, and Figma source; seeded violations still fail.
- CSS alias behavior vs flattened values: CSS references registered variables;
  tests override primary and confirm derived values remain live.
- Legacy NS One rendering: capture all effective pre-change declarations and
  compare light/dark maps and browser screenshots after build.
- Publication of data assets: update publish include and validate packed/export
  consumption, not only workspace imports. Keep engine off UI imports.
- Tooling unavailable: record exact error and unproven gate. No lock deletion,
  reload, private evidence, label changes, merge, tag, or release.

## JSR surface audit

Applied jsr-audit to the planned `./tokens` subpath: explicit documented exports,
annotated return types, module examples, required JSON in publish include,
no root runtime imports of Style Dictionary, no new slow-type carve-out. Validate
both affected packages with the existing audit and publish tools.

## Deferred and open decisions

No implementation decision is left open. Safely deferred: dense/airy/chunky
schema extensions, S3 component anatomy/state work, S8/S9 runtime fidelity,
Figma value corrections, default switch to Studio Utility, and release cuts.
Contributor entry: `packages/fresh-ui/tokens/README.md`.
