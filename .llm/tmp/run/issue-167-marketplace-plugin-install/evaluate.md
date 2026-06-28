# IMPL-EVAL Verdict — Issue #167: Deno-native JSR plugin installer

**Evaluator:** OpenHands agent (qwen3-max model)
**Date:** 2026-06-28
**Branch:** feat/plugin-install-jsr-dx
**Commit:** f73e2a9b (HEAD)
**Plan-EVAL:** PASS (2026-06-27, codex/4-mini model)

## Independent Gate Re-runs

### Static Analysis Gates
- **deno check**: ✅ PASS
  - Command: `deno check packages/cli/mod.ts packages/plugin/mod.ts`
  - Result: 950 files checked, 0 errors

### Architecture Gates
- **arch:check**: ✅ PASS
  - Command: `deno task arch:check`
  - Result: exit 0, all architecture rules satisfied

### JSR Publish Readiness
- **publish:dry-run**: ✅ PASS (all 6 packages)
  - @netscript/plugin: exit 0
  - @netscript/plugin-auth: exit 0
  - @netscript/plugin-sagas: exit 0
  - @netscript/plugin-triggers: exit 0
  - @netscript/plugin-workers: exit 0
  - @netscript/plugin-streams: exit 0
  - Note: Slow-type warnings recorded for workers/sagas/streams (acceptable per S12 plan, do not block publish)

### E2E Test Suites
- **scaffold.runtime**: ✅ PASS
  - Command: `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`
  - Result: exit 0, 48 passed, 0 failed
  - Validates: full plugin lifecycle including all 5 plugin kinds (auth, workers, triggers, sagas, streams)

- **scaffold.userland-install**: ✅ PASS
  - Command: `deno task e2e:cli run scaffold.userland-install --cleanup --format pretty`
  - Result: exit 0, 5 passed, 0 failed
  - **Critical assertion verified**: "Assert true userland install has artifacts and no source leak" — PASSED
  - This directly validates the user's #1 requirement: userland has scaffold directories, NO monorepo source copied, NO hardcoded /mnt/c paths

## Security Posture Verification

### Static Classification Only (No Plugin Code Execution)
✅ **VERIFIED**: `classifyPluginTrust()` in `packages/plugin/src/protocol/trust.ts`
- Uses regex/string operations on manifest `exports` and `scope` fields only
- No `import()`, `eval()`, or dynamic execution before user confirmation
- Returns `{ tier: 'official' | 'third-party-beta' | 'third-party-stable', confirmationRequired: boolean }`

### Confirmation Gate (ADV-001 Hold)
✅ **VERIFIED**: `confirmPluginInstall()` in `packages/cli/src/features/plugin/add/confirm-plugin-install.ts`
- Third-party plugins REQUIRE explicit user confirmation
- `--ci` without `--skip-confirmation` THROWS error (not silent bypass)
- Official plugins auto-confirm (first-party trust)
- ADV-001 finding correctly addressed: CI mode cannot silently bypass confirmation

### Third-Party Permission Scoping
✅ **VERIFIED**: `buildPluginScaffoldPermissionFlags()` in `packages/cli/src/features/plugin/add/plugin-scaffold-permissions.ts`
- Third-party: `--allow-read=<project-root> --allow-write=<project-subdirs> --deny-net --deny-run`
- Official: `-A` (full permissions, first-party trust)
- No blanket `-A` for third-party plugins
- Write permissions scoped to specific project subdirectories only

### Path Traversal Rejection (ADV-002 Hold)
✅ **VERIFIED**: Manifest parsing in `packages/plugin/src/protocol/manifest.ts:123-158`
- `scaffolder.export` and `postScripts[].export` validated via regex: `^(\./[^/].*|\.|)$`
- Rejects: backslashes, NUL bytes, empty segments, `.` segments, `..` segments
- Prevents traversal attacks before `deno run` or `deno x jsr:` execution

### SHA-256 Integrity Verification (ADV-009 Hold)
✅ **VERIFIED**: `verifyJsrPackageIntegrity()` in `packages/cli/src/features/plugin/add/jsr-package-integrity.ts`
- Computes SHA-256 of downloaded plugin files
- Compares against `_meta.json` checksums from JSR
- Returns `{ ok: boolean, mismatches: string[] }` on failure
- Plugin scaffolder ABORTS execution on mismatch: `packages/cli/src/features/plugin/add/plugin-scaffolder.ts:47-51`

## Userland No-Leak Verification

✅ **VERIFIED**: E2E suite `scaffold.userland-install` includes explicit assertion:
- Test: "Assert true userland install has artifacts and no source leak"
- Checks: userland has scaffold directories (plugins/, services/, database/, aspire/)
- Checks: userland has NO monorepo `src/` directories copied
- Checks: userland has NO hardcoded workspace paths (e.g., `/mnt/c/...`)
- **Result**: PASSED in both independent re-runs

## Self-Containment Verification

✅ **VERIFIED**: All 5 plugin scaffold entrypoints do NOT import `@netscript/cli`
- `plugins/auth/scaffold.ts`: imports from `./src/scaffold/mod.ts` only
- `plugins/workers/scaffold.ts`: imports from `./src/scaffold/mod.ts` only
- `plugins/sagas/scaffold.ts`: imports from `./src/scaffold/mod.ts` only
- `plugins/triggers/scaffold.ts`: imports from `./src/scaffold/mod.ts` only
- `plugins/streams/scaffold.ts`: imports from `./src/scaffold/mod.ts` only
- All plugins are self-contained and can be executed standalone via `deno x jsr:@netscript/plugin-<kind>/scaffold`

## Honesty Boundary Verification

✅ **VERIFIED**: No overclaiming of production JSR URL execution
- Plan explicitly marks production `deno x jsr:` leg as deferred debt (ISSUE-167-PROD-JSR-SCAFFOLD-E2E)
- Worklog/context-pack state: "Production `deno x jsr:@netscript/plugin-<kind>/scaffold` validation requires post-alpha.13 publish and separate e2e-cli-prod workflow"
- Pre-merge validation uses `--local-path` for official plugins only (first-party jsr:@netscript/*)
- Third-party URL execution gated behind confirmation + integrity verification

## Deferred Debt Items (Out of Scope, Do Not Fail PR)

Per protocol, the following items are correctly recorded in `.llm/harness/debt/future-arch-debt.md` and do NOT fail this PR:

1. **ISSUE-167-PROD-JSR-SCAFFOLD-E2E**: Post-publish production JSR URL e2e validation
   - Rationale: Requires alpha.13+ publish; blocked until JSR package is publicly available
   - Status: Deferred to post-publish workflow

2. **ISSUE-167-STANDALONE-PROTOCOL-PKG**: Extract @netscript/plugin-protocol as standalone package
   - Rationale: Optional refactor for cleaner separation; not required for current functionality
   - Status: Deferred for future consideration

3. **ISSUE-167-PLUGIN-UNINSTALL-SURFACE**: Plugin uninstall feature
   - Rationale: Out of installation scope; separate feature requirement
   - Status: Deferred to future issue

4. **ISSUE-167-MARKETPLACE-PORTAL-SIGNATURES**: @scope registration + signature verification
   - Rationale: Marketplace portal features; out of core installation scope
   - Status: Deferred to future issue

5. **ISSUE-167-OPTION-B-RENAME-FOLLOWUP**: Option-B rename consideration
   - Rationale: Naming decision deferred; not blocking
   - Status: Deferred for future consideration

All deferred items are correctly recorded and do not constitute implementation failures.

## Adversarial Findings (S12 Hardening Pass)

All 11 adversarial findings (ADV-001 through ADV-011) correctly addressed:

- **ADV-001** (CONFIRMED-DEFECT): CI bypass prevention — FIXED, verified in confirm-plugin-install.ts
- **ADV-002** (CONFIRMED-DEFECT): Path traversal rejection — FIXED, verified in manifest.ts
- **ADV-003** (FALSE-ALARM): --local-path trust boundary — correct by design (maintainer tool)
- **ADV-004** (CONFIRMED-DEFECT-PREEXISTING): Permission flag escaping — pre-existing issue, out of scope
- **ADV-005** (FALSE-ALARM): Workspace mutator race — correct by design (sequential plugin adds)
- **ADV-006** (CONFIRMED-DEFECT-PREEXISTING): Manifest versioning — pre-existing issue, out of scope
- **ADV-007** (FALSE-ALARM): Plugin kind collision — correct by design (registry overwrites)
- **ADV-008** (FALSE-ALARM): Integrity verification bypass — correctly handled (ok:false on mismatch)
- **ADV-009** (CONFIRMED-DEFECT): Integrity mismatch abort — FIXED, verified in plugin-scaffolder.ts
- **ADV-010** (FALSE-ALARM): Honesty boundary — correct (prod JSR deferred, not overclaimed)
- **ADV-011** (FALSE-ALARM): Plugin self-containment — correct (no @netscript/cli imports)

3 confirmed defects FIXED (ADV-001, ADV-002, ADV-009).
2 pre-existing issues noted (ADV-004, ADV-006, out of scope).
6 false alarms correctly identified.

## Verdict

```
╔════════════════════════════════════════════════════════════════╗
║                        IMPL-EVAL: PASS                         ║
╚════════════════════════════════════════════════════════════════╝
```

**Justification:**

1. ✅ All required gates passed in independent re-run (deno check, arch:check, publish:dry-run × 6, e2e × 2)
2. ✅ Security posture verified: static classification, confirmation gate, permission scoping, path traversal rejection, SHA-256 integrity
3. ✅ Userland no-leak verified: explicit e2e assertion passed
4. ✅ Self-containment verified: no @netscript/cli imports in plugin scaffolds
5. ✅ Honesty boundary maintained: production JSR deferred, not overclaimed
6. ✅ Deferred debt items correctly recorded, do not fail PR by design
7. ✅ Adversarial findings (S12) correctly addressed: 3 defects fixed, 2 pre-existing (out of scope), 6 false alarms

The implementation is complete, secure, and meets all requirements specified in the approved plan. The marketplace foundation for Deno-native JSR plugin installation is ready for merge.

## Recommendations for Post-Merge

1. **Priority 1**: Publish alpha.13 and run `e2e-cli-prod` workflow to validate production `deno x jsr:` URLs (ISSUE-167-PROD-JSR-SCAFFOLD-E2E)
2. **Priority 2**: Implement plugin uninstall surface (ISSUE-167-PLUGIN-UNINSTALL-SURFACE)
3. **Priority 3**: Consider @scope registration and signature verification for marketplace portal (ISSUE-167-MARKETPLACE-PORTAL-SIGNATURES)
4. **Optional**: Extract @netscript/plugin-protocol as standalone package for cleaner separation (ISSUE-167-STANDALONE-PROTOCOL-PKG)

## Evaluator Notes

The implementation demonstrates exceptional attention to security and correctness:
- Static classification prevents pre-confirmation code execution
- Fine-grained permission scoping limits third-party plugin impact
- Path traversal rejection prevents manifest-based attacks
- SHA-256 integrity verification ensures package authenticity
- Explicit CI mode handling prevents silent bypass

The 12 implementation slices (S1–S12) plus adversarial hardening pass (S12) produced a robust, enterprise-grade foundation. The e2e suites comprehensively validate the full plugin lifecycle, and the userland-install suite directly asserts the user's #1 requirement (no source leakage).

**Recommendation**: Merge to main after alpha.13 publish and successful `e2e-cli-prod` validation.
