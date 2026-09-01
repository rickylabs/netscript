# Drift Log: oRPC family 1.15.0

## 2026-09-01 — Strict lock-only scope cannot satisfy the single-copy gate

- **What:** The current tree contains exact `1.14.6` source imports and generated/scaffold source
  specifiers, while `packages/plugin-workers-core/deno.json` is explicitly prohibited from editing.
- **Source:** Root `deno task test` after raising owned manifest ranges; targeted
  `deno update --lockfile-only` after restoring manifests.
- **Expected:** All oRPC v1 packages resolve at `1.15.0`, root gates pass, and no source or
  #1876-owned manifest changes are needed.
- **Actual:** Raised manifests make tests fail on the prohibited manifest and scaffold source;
  restored manifests make the exact compatibility-fixture imports retain `1.14.6`, yielding two
  `@orpc/shared` copies. Explicit lock-only updates report `Updated 0 dependencies`.
- **Severity:** significant
- **Action:** rescope
- **Evidence:** Root test exit 1 (4 conflicting-import failures plus one scaffold catalog mismatch);
  `deno update --lockfile-only` exit 0 with `Updated 0 dependencies`; `deno why @orpc/shared`
  shows `1.14.6` and `1.15.0` after the valid regenerated lock.

## 2026-09-01 — Corrected key-level manifest boundary

- **What:** The owner corrected the #1876 overlap from file ownership to key ownership.
  `@orpc/contract` and `@orpc/server` in `packages/plugin-workers-core/deno.json` belong to #1879;
  only `@netscript/plugin-streams-core` keys in that manifest and `plugins/triggers/deno.json`
  remain owned by #1876.
- **Source:** Owner follow-up in the active harness thread.
- **Expected:** The original brief prohibited the whole manifests.
- **Actual:** All manifest `@orpc/*` keys are authorized for this slice; streams-core keys remain
  prohibited.
- **Severity:** significant
- **Action:** accept
- **Evidence:** Raised `packages/plugin-workers-core/deno.json` oRPC keys to `^1.15.0`; no
  streams-core or source line changed.

## 2026-09-01 — Exact SDK fixture decision remains owner-escalated

- **What:** `packages/sdk/tests/type-fixtures/service-query-utils-upstream_type.ts` imports
  `npm:@orpc/client@1.14.6` and `npm:@orpc/tanstack-query@1.14.6` exactly.
- **Source:** Owner follow-up and focused source enumeration.
- **Expected:** No source changes in this implementation pass.
- **Actual:** Whether the fixture is an intentional upstream-compatibility oracle is unresolved and
  expressly reserved for the owner.
- **Severity:** significant
- **Action:** defer
- **Evidence:** The file remains byte-for-byte untouched.

## 2026-09-01 — Raised manifests leave stale 1.14.6 lock package keys

- **What:** After every manifest oRPC key was raised and `deno install --lockfile-only` exited 0,
  the lock still retained old package keys. `deno why` labels `@orpc/shared@1.14.6` as having no
  dependency path, but the exact no-mixed audit still finds five package names at two versions.
- **Source:** Post-correction load-bearing proof commands.
- **Expected:** Exactly one `@orpc/shared@1.15.0` copy and one version per oRPC package.
- **Actual:** Mixed keys remain for `client`, `shared`, `standard-server`,
  `standard-server-fetch`, and `standard-server-peer`.
- **Severity:** significant
- **Action:** rescope
- **Evidence:** `deno why @orpc/shared` captured exit 0; no-mixed audit captured exit 1. Per owner
  instruction, stopped before manual pruning, frozen install, check, or a new test run.

## 2026-09-01 — Coordinator approved upstream-tracking fixture update

- **What:** The coordinator ruled that the two exact oRPC imports in
  `packages/sdk/tests/type-fixtures/service-query-utils-upstream_type.ts` track current upstream
  compatibility rather than intentionally freezing 1.14.6.
- **Source:** Owner ruling in the active harness thread, supported by the fixture history at
  `82abaa6a1` and `6e2f66b95`.
- **Expected:** The earlier brief prohibited all source edits and therefore left an exact 1.14.6
  lock root after every manifest key moved.
- **Actual:** The two exact imports are now explicitly in scope at 1.15.0; no behavioral source is
  authorized.
- **Severity:** significant
- **Action:** accept
- **Evidence:** The targeted type fixture check exits 0 at 1.15.0; the regenerated lock has only
  1.15.0 oRPC package keys.

## 2026-09-01 — Lock-only framing originated in the brief

- **What:** The initial `lock-only` constraint was incompatible with the load-bearing single-copy
  acceptance gate because workspace ranges and exact fixture imports still selected 1.14.6.
- **Source:** Initial owner brief; disproved by the implementation investigation.
- **Expected:** `deno update --lockfile-only` would move the family without manifest or fixture
  edits.
- **Actual:** With the original carets restored the command exited 0 with `Updated 0 dependencies`;
  raising every dependency declaration was required. This was scope drift in the brief, not an
  implementation assumption or analysis error.
- **Severity:** significant
- **Action:** accept
- **Evidence:** Captured lock-only exit 0/zero-update result, corrected owner ruling, and final
  single-copy/no-mixed/frozen-install proofs.

## 2026-09-01 — Scaffold catalog was direct dependency-catalog fallout

- **What:** After the complete manifest and fixture move, the root suite had one failure in
  `packages/cli/src/kernel/constants/scaffold/scaffold-app-catalog_test.ts`, test
  `scaffold runtime npm imports match workspace, Fresh, and SDK catalogs`.
- **Source:** Root `deno task test` after the coordinator-approved scope correction.
- **Expected:** Generated scaffold dependency declarations match the root catalog.
- **Actual:** Six oRPC-only scaffold catalog constants still declared `^1.14.6`.
- **Severity:** local
- **Action:** accept
- **Evidence:** Updating only those six dependency catalog constants to `^1.15.0` made the focused
  test pass (2/2) and the full root suite pass (4,639 passed, 0 failed, 19 ignored). No behavioral
  failure remained and no behavioral source was changed.
