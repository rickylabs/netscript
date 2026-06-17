# Drift Log

## 2026-06-17 — Step 0 Re-enumeration

- Severity: significant
- Divergence: Deno 2.8.3 did not simply reproduce the inventory failure set. The queue timer tests
  now pass, while `packages/plugin-workers-core/tests/executor/deno-runtime-adapter_test.ts` now runs
  and fails two tests.
- Decision: Remove queue timer work from the active fix list and add `worker-runtime-adapter` as a
  new root-cause sub-slice.

## 2026-06-17 — Catalog Resolution Gate Blocker

- Severity: significant
- Divergence: After all listed failing tests were fixed, `deno task test` still exited 1 even though
  the summary showed `0 failed`, because Deno emitted `Unsupported scheme "catalog"` while resolving
  member package graphs.
- Initial decision: Treat this as a green-gate blocker, not a test deletion/quarantine case.
- Rejected decision: `103f9a8` materialized member `catalog:` imports to per-member `npm:`
  specifiers; maintainer rejected that as the wrong model.
- Rejected decision: `9262399` / head `30ed34b` moved concrete npm specifiers to root `deno.json`
  `imports` and stripped member `catalog:` refs; maintainer rejected that too. This drift entry is
  superseded by the supervisor correction below.

## 2026-06-17 — Supervisor Correction: catalog restoration

- Severity: maintainer directive
- Divergence: Previous head `30ed34b` de-cataloged the workspace by removing all 67 member
  `catalog:` refs across 18 member `deno.json` files and by filling root `deno.json` `imports` with
  concrete npm specifiers.
- Decision: Restore catalog wiring to base `733388f`: root imports `{}`, 67 member `catalog:` refs,
  root catalog block retained. Commit: `20d6b03`.
- Verification: no `catalog:` diff versus base; current member count `67 refs across 18 files`;
  root imports `{}`; root catalog entries `33`.

## 2026-06-17 — Restored catalog remains a runtime blocker in this environment

- Severity: blocker / hard stop
- Precise failing command:
  `set -o pipefail; deno task test 2>&1 | tee .llm/tmp/run/test-suite-greenup--fix/final-test-catalog-preserved.txt`
- Exit code: `1`.
- Output tail:
  `ok | 484 passed (356 steps) | 0 failed | 12 ignored (46s)`, followed by
  `error: Unsupported scheme "catalog" for module "catalog:" ... at packages/contracts/src/application/contract-primitives.ts:1:20`.
- Narrow repro:
  - `deno run --allow-all packages/contracts/src/application/contract-primitives.ts` exits `1` with
    the same unsupported-scheme error.
  - `deno test --allow-all packages/contracts/src/application/contract-primitives.ts` exits `1`
    after `ok | 0 passed | 0 failed` with the same unsupported-scheme error.
  - `deno check packages/contracts/src/application/contract-primitives.ts` exits `0`.
- Verified environment:
  - cwd `/home/codex/repos/netscript-test-green-up`.
  - `deno --version` reports `deno 2.8.3`, V8 `14.9.207.2-rusty`, TypeScript `6.0.3`.
  - `deno eval 'console.log(Deno.execPath())'` reports `/home/codex/.deno/bin/deno`.
  - `deno install` exits `0`.
  - workspace globs cover `packages/*` and `plugins/*`; catalog completeness check found no
    missing root catalog keys.
- Root-cause hypothesis: this Deno 2.8.3 binary does not apply the repo-expected member
  `deno.json` import-map catalog resolver at runtime. It type-checks the graph, but runtime loading
  passes the member import-map value `catalog:` through as a literal unsupported module scheme.
  This matches the catalog failure mode previously recorded for stale 2.8.0 despite the local
  binary reporting 2.8.3.
- Constraint: per maintainer directive, do not remove, flatten, or materialize member `catalog:`
  refs as a workaround. Catalog remains intact.
