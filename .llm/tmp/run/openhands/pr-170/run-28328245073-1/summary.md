# IMPL-EVAL Verdict: PR #170 — chore/plugin-167-harden

## Summary
Final implementation evaluation for PR #170 (`chore/plugin-167-harden`), the #167 scaffolder-hardening slice. All 8 verification areas passed independent gate checks. The implementation faithfully delivers the PLAN-EVAL cycle-2 contract: JSON Schema for `scaffold.plugin.json`, `$schema` tolerance, `plugins:check`/CI enforcement, version-coherence single-source, and dead-code sweep.

## Verification Results

### 1. Schema Fidelity — ✅ OK
- **File**: `packages/plugin/schema/scaffold.plugin.schema.json`
- **Validation**: `deno task plugins:schema:gen` produces byte-identical output (verified zero git diff).
- **Structure**: Faithfully encodes `PluginInstallerManifestSchema`:
  - `.strict()` → `additionalProperties: false` at root and all sub-objects
  - `z.record(z.string())` for `peerDependencies`
  - Enums (`PluginKind`, `PluginArch`) correctly constrained
  - Nullable fields (`peerDependencies`, `capabilities`) properly typed
  - Safe-export-path regex as `pattern` at lines 18, 34, 50, 66, 83
  - `schemaVersion: { type: "number", const: 1, default: 1 }` at line 78

### 2. `$schema` Tolerance — ✅ OK
- **Implementation**: `stripPluginManifestSchemaKey()` at `packages/plugin/src/protocol/manifest.ts:150-156`
  - Clones input (no mutation): `const cleaned = { ...input }; delete cleaned.$schema;`
  - Strips ONLY `$schema`, preserves all other keys
- **CLI Call Sites**:
  - `packages/cli/src/public/infra/jsr/fetch-jsr-plugin-validator.ts:98` ✅
  - `packages/cli/src/public/features/plugins/add/add-plugin.ts:238` ✅
- **Test Coverage**: `packages/plugin/tests/protocol/plugin-manifest_test.ts:96-119`
  - `stripPluginManifestSchemaKey allows editor schema hints before strict parsing` proves accept-all-5 + $schema-strip + extra-key-fails

### 3. Userland Schema URL (Adversarial MAJOR) — ✅ OK
- **Emitted URL**: `https://jsr.io/@netscript/plugin/${NETSCRIPT_VERSION}/schema/scaffold.plugin.schema.json`
  - Fetchable HTTPS (not `jsr:` specifier)
  - Version-pinned from each plugin's `deno.json`
- **Locations**: All 5 plugins (`plugins/{auth,sagas,streams,triggers,workers}/src/scaffold/artifacts.ts:31`)
- **Committed Schema `$id`**: `https://rickylabs.github.io/netscript/schemas/scaffold.plugin.schema.json` (stable, versionless)
- **No Stale Specifier**: Confirmed no `jsr:@netscript/plugin/schema` remains in production code (only in test fixture at `plugin-manifest_test.ts:98`, which is arbitrary test data, not emitted).

### 4. Version Single-Source — ✅ OK
- **Import Pattern**: All 5 plugins import `packageConfig` from relative `deno.json`:
  - `plugins/auth/src/scaffold/artifacts.ts:11` → `../../deno.json` with `with { type: 'json' }`
  - Same pattern for sagas, streams, triggers, workers
- **Version Derivation**: `const NETSCRIPT_VERSION = packageConfig.version;` (no hardcoded literal)
- **Stale-Pin Scan**: `check-plugins.ts:11-13` defines `NETSCRIPT_VERSION_CONST_PATTERN` that catches any literal assignment (`const NETSCRIPT_VERSION = ...`)
- **`plugins:check`**: Passes with zero stale-pin findings

### 5. CI Enforcement — ✅ OK
- **CI Workflow**: `.github/workflows/ci.yml:111` has `deno task arch:check` step
- **Task Definition**: `deno.json:18` defines `arch:check` → `deps:check && plugins:check && doctrine checks`
- **Exit Behavior**: `check-plugins.ts:34-36` uses `Deno.exitCode = 1` on any violation (not warning-only)
- **YAML Validity**: Confirmed valid YAML structure

### 6. JSR Publish Surface — ✅ OK
- **`@netscript/plugin` Dry-Run**: Success (exit code 0)
  - Includes `schema/scaffold.plugin.schema.json` (7.74KB) in tarball
  - `./schema` export resolves correctly
  - Warning about unanalyzable dynamic import at `packages/plugin/src/sdk/discovery/manifest-resolver.ts:33` is pre-existing and not related to this PR
- **All 5 Plugins Dry-Run**: Success (exit code 0 for auth, sagas, streams, triggers, workers)
  - Each plugin's `deno.json` is tarball-safe (no parent-escape)
  - JSON import `import packageConfig from '../../deno.json' with { type: 'json' }` is tarball-safe

### 7. Dead-Code + Hygiene — ✅ OK
- **Removed Barrel**: `packages/cli/templates/plugins/templates/public-plugin-generators.ts` (commit `4f832606`)
  - Confirmed unreferenced: `grep -rn 'public-plugin-generators'` returns zero hits
  - No over-removal: verified no dynamic registry path depends on it
- **Type Casts**: Only 2 sanctioned casts remain (pre-existing, not introduced by this PR)
- **No `any`**: Confirmed no new `any` types
- **`deno.lock` Churn**: Zero changes (clean working tree)
- **Commit Messages**: 1:1 mapping to slices (S1–S5 + adversarial fix)

### 8. Gate Re-Run — ✅ OK
All gates passed in the following order:
1. `deno task plugins:check` — exit 0, zero violations
2. `deno task arch:check` — exit 0 (warnings only from pre-existing doctrine debt, no FAILs)
3. Scoped type-check on `packages/plugin`, `packages/cli`, `plugins` — exit 0, zero type errors
4. Scoped lint on `packages/plugin`, `packages/cli`, `plugins` — exit 0, zero lint errors
5. Scoped fmt on `packages/plugin`, `plugins` — exit 0, zero formatting issues
6. `deno task test` — exit 0, 927 passed (425 steps), 0 failed, 12 ignored
7. `deno publish --dry-run` for `@netscript/plugin` — Success
8. `deno publish --dry-run` for all 5 plugins (auth, sagas, streams, triggers, workers) — Success

**Scaffold Runtime E2E Justification**: The generator justified skipping the full `scaffold.runtime` e2e (48/48) because the adversarial fix only changed the `$schema` string value in emitted manifests (from `jsr:@netscript/plugin/schema` to `https://jsr.io/@netscript/plugin/${NETSCRIPT_VERSION}/schema/scaffold.plugin.schema.json`). This is an inert string-value change that does not affect the manifest structure, validation logic, or scaffolder behavior. The justification holds.

## Adversarial Review Fix Verification

The adversarial review (`adv-review.md`) identified 3 issues. The fix commit (`010d560c`) addresses all three:

1. **MAJOR: Userland schema URL** — ✅ Fixed
   - Before: Emitted `jsr:@netscript/plugin/schema` (not fetchable)
   - After: Emits `https://jsr.io/@netscript/plugin/${NETSCRIPT_VERSION}/schema/scaffold.plugin.schema.json` (fetchable, version-pinned)
   - Verified at `plugins/{auth,sagas,streams,triggers,workers}/src/scaffold/artifacts.ts:31`

2. **MINOR: `plugins:check` stale-pin scan** — ✅ Fixed
   - Before: Scan did not fail on literal assignments
   - After: `NETSCRIPT_VERSION_CONST_PATTERN` at `check-plugins.ts:11-13` catches any literal
   - Verified: `plugins:check` passes with zero stale-pin findings

3. **MINOR: Unused import** — ✅ Fixed
   - Before: `packages/cli/src/maintainer/adapters/official-plugin-source.ts` had unused import
   - After: Import removed (verified by commit diff)

## Changes
- **Commits**: 6 commits on branch `chore/plugin-167-harden`
  - `71b4b7c8` (S1): Generate JSON Schema for scaffold.plugin.json
  - `9c109834` (S2): Wire schemas into CLI + plugins
  - `a97202a6` (S3): CI enforcement (arch:check → plugins:check)
  - `8af4f7ca` (S4): Derive version pins from deno.json (single-source)
  - `4f832606` (S5): Remove unused plugin generator barrel
  - `010d560c` (adversarial fix): Fetchable userland schema URL + harden plugins:check + drop unused import
- **Files Modified**: 23 files across packages/plugin, packages/cli, plugins/{auth,sagas,streams,triggers,workers}, .llm/tools/plugin, .github/workflows
- **Branch**: `chore/plugin-167-harden` (HEAD: `8e4651db`)

## Validation
- All 8 verification areas: ✅ PASS
- All gates: ✅ PASS (plugins:check, arch:check, test, lint, fmt, dry-run)
- Adversarial review fixes: ✅ ALL 3 DISCHARGED
- Working tree: Clean (no uncommitted source changes)

## Remaining Risks
- **Pre-existing Doctrine Debt**: The `arch:check` gate produces WARNings (not FAILs) for README code-fence count and missing `docs/architecture.md` across 5 packages. These are pre-existing doctrine debt items, not introduced by this PR.
- **Pre-existing NPM Catalog Debt**: The `deps:check` gate produces WARNings for NPM packages not using the root `package.json` catalog. These are pre-existing dependency management debt items, not introduced by this PR.
- **Dynamic Import Warning**: JSR publish dry-run for `@netscript/plugin` warns about an unanalyzable dynamic import at `packages/plugin/src/sdk/discovery/manifest-resolver.ts:33`. This is pre-existing and not related to this PR (the import is resolvable at runtime without an import map).

## Verdict
**PASS** — The implementation is ready to merge. All gates pass, the adversarial review fixes are complete and correct, and the working tree is clean. The PR delivers the full scope of the #167 scaffolder-hardening plan and prepares the repository for the alpha.13 cut.

### Merge Readiness Checklist
- [x] Schema fidelity verified (byte-stable regen)
- [x] `$schema` tolerance implemented and tested
- [x] Userland schema URL is fetchable HTTPS
- [x] Version single-source enforced (no stale literals)
- [x] CI enforcement wired (arch:check → plugins:check)
- [x] JSR publish surface validated (all 6 packages dry-run success)
- [x] Dead-code removed (verified unreferenced)
- [x] All gates pass (plugins:check, arch:check, test, lint, fmt, dry-run)
- [x] Working tree clean (no uncommitted changes)
- [x] Adversarial review fixes complete (all 3 issues discharged)

### Next Steps
1. Merge PR #170 into main
2. Cut alpha.13 release (per the existing `release:cut` workflow)
3. Verify alpha.13 publish to JSR includes the new schema surface
4. Address pre-existing doctrine and NPM catalog debt in a follow-up PR (not blocking)

---
*IMPL-EVAL completed by OpenHands agent on behalf of the user. This is the final gate before merge + the alpha.13 cut.*
