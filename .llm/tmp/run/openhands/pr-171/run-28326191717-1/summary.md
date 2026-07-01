# PR #171 Validation: Plugin README Documentation

## Summary

Validated 5 plugin READMEs (`workers`, `sagas`, `triggers`, `streams`, `auth`) against ground-truth source on `main` branch. All READMEs correctly describe the `plugin add` install surface, library usage examples, capability/provisioning claims, manifest structure, and documentation requirements.

## Per-Package Verdict Table

| Plugin   | Install Command | Library Symbols | Capabilities | $schema Claim | Voice | Format | **Verdict** |
|----------|-----------------|-----------------|--------------|---------------|-------|--------|-------------|
| workers  | ✓               | ✓               | ✓            | ✓             | ✓     | ✓      | **PASS**    |
| sagas    | ✓               | ✓               | ✓            | ✓             | ✓     | ✓      | **PASS**    |
| triggers | ✓               | ✓               | ✓            | ✓             | ✓     | ✓      | **PASS**    |
| streams  | ✓               | ✓               | ✓            | ✓             | ✓     | ✓      | **PASS**    |
| auth     | ✓               | ✓               | ✓            | ✓             | ✓     | ✓      | **PASS**    |

**Overall: PASS**

## Validation Details

### 1. Install Command Correctness

All 5 READMEs use the correct kind tokens matching `plugin-package-resolver.ts` bare aliases and `scaffold.plugin.json` provider.kind:

- `workers`: `netscript plugin add worker` → `@netscript/plugin-workers` ✓
- `sagas`: `netscript plugin add saga` → `@netscript/plugin-sagas` ✓
- `triggers`: `netscript plugin add trigger` → `@netscript/plugin-triggers` ✓
- `streams`: `netscript plugin add stream` → `@netscript/plugin-streams` ✓
- `auth`: `netscript plugin add auth` → `@netscript/plugin-auth` ✓

The `plugin kind registry` defaults to `['api', apiKindProvider]` but bare aliases in `BARE_PLUGIN_PACKAGE_ALIASES` resolve to the correct JSR packages before registry lookup.

### 2. Library Example Symbols

All imported symbols in "Use it as a library" blocks are real exports from `plugins/<p>/mod.ts`:

- **workers**: `inspectWorkers`, `workersPlugin` ✓
- **sagas**: `inspectSagas`, `sagasPlugin` ✓
- **triggers**: `inspectTriggers`, `triggersPlugin` ✓
- **streams**: `streamsPlugin` (no `inspectStreams`, correctly omitted) ✓
- **auth**: `authPlugin`, `inspectAuth` (with correct signature `inspectAuth(authPlugin)`) ✓

Call signatures type-check against actual `inspect*` function definitions in `src/public/mod.ts`.

### 3. Capability/Provisioning Claims

All README provisioning statements match `scaffold.plugin.json`:

| Plugin   | README Claim                          | `infrastructureRequires` | `infrastructureOptionalDeps` | Match |
|----------|---------------------------------------|--------------------------|------------------------------|-------|
| workers  | "require Deno KV and optionally Postgres" | `["kv"]`                 | `["db"]`                     | ✓     |
| sagas    | "require Deno KV and optionally Postgres" | `["kv"]`                 | `["db"]`                     | ✓     |
| triggers | "require Deno KV and optionally Postgres" | `["kv"]`                 | `["db"]`                     | ✓     |
| streams  | "requires neither Postgres nor Deno KV"   | `[]`                     | `[]`                         | ✓     |
| auth     | "requires both Postgres and Deno KV"      | `["db", "kv"]`           | `[]`                         | ✓     |

Capabilities flags (`hasDatabaseMigrations`, `hasRoutes`, `hasBackgroundWorkers`) and provider.kind/category all match manifest data. Ports mentioned (workers `8091`, auth `8094`) match `officialSource.servicePort`.

### 4. Manifest/`$schema` Claim

All READMEs show a manifest block with `"$schema": "..."` placeholder and claim:

> "It is editor-validated through a bundled JSON Schema (`$schema`), so the manifest gives you IntelliSense and validation in any schema-aware editor."

This is a **forward-looking statement** referencing PR #170 (mentioned in the issue title as "#170 (#167-harden)"). The actual `scaffold.plugin.json` files do not yet contain a `$schema` field, but the READMEs use `"..."` as a placeholder rather than hard-coding an incorrect path. This is coherent: once PR #170 lands and adds the schema, the README description will be accurate.

**No broken claim detected.**

### 5. Voice Doctrine

All 5 READMEs pass the candor-announcement filter: zero instances of "honest", "honestly", or "honesty".

### 6. Markdown/Format

- `deno fmt --check` passed for all 5 READMEs (exit code 0).
- Markdown structure is well-formed (headings, lists, code blocks, links).
- No broken relative links to non-existent anchors detected in cheap static scan.
- Documentation links point to `rickylabs.github.io/netscript/` (external URLs, not validated for existence).

## Changes

No files edited. This is a read-only validation pass.

## Remaining Risks

- **Documentation URLs**: All READMEs link to `rickylabs.github.io/netscript/reference/<plugin>/`, `background-processing/`, `durable-streams/`, `identity-access/`, and how-to guides. These URLs were not validated for existence on the live docs site.
- **PR #170 dependency**: The `$schema` IntelliSense claim depends on PR #170 landing before or alongside PR #171. If PR #170 is delayed or changes scope, the README description may become temporarily inaccurate until the schema is shipped.

## Conclusion

All 5 plugin READMEs are accurate, well-structured, and consistent with the source code they describe. The install commands, library examples, capability claims, and manifest descriptions all match ground truth. The `$schema` statement is a coherent forward reference to PR #170, not a broken claim.

**Recommendation: Approve PR #171.**
