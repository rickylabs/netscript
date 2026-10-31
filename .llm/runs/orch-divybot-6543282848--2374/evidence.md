# Validation evidence

All command paths below are repository-relative. Structured wrapper results are summarized from actual process results; full private runner output is retained separately and is not a public artifact. Source checks use `--unstable-kv` (the check wrapper supplies it by default). No local scaffold.runtime run was started.

## Acceptance

| Acceptance | Evidence |
| --- | --- |
| Minimal composed example registers `agent-action` | `packages/cli/src/public/features/generate/plugins/installed-saga-declarations_test.ts`: actual native `defineSaga` factory in application-core path, default export in `sagas/agent-action.ts`, separate config declaration; generated registry loads with exactly that key and handles ActionAdmitted. |
| Undeclared non-saga stays out | Direct generator test asserts exactly one source and no helper import; installed fixture contains a throwing undeclared module and loads successfully. |
| Declared unresolved saga fails generation | Both dry-run and write use cases reject missing declared path with config/id/target remediation; previously generated registry bytes are preserved. Direct tests cover path, export, exclusion and duplicate-declaration failures. |
| Zero declarations remain valid | Generated empty map imports successfully; root doctor's matching registry check is warning rather than error. Existing zero-item and first-line ignore integration coverage still passes. |
| Plugin doctor agrees | Exact source check used by root plugin doctor (`checkRuntimeRegistryDrift`) rejects stale complete-empty output, then returns healthy after regeneration. Root-config declarations outside scan roots also return healthy. |
| Discovery is static | Config throws if executed; runtime writes a sentinel if imported. Neither write generation nor frozen dry-run creates the sentinel. Only the separate generated-registry import creates it. |

## Commands and results

- `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all --unstable-kv plugins/sagas/tests/cli plugins/sagas/tests/adapter/plugin-doctor_test.ts packages/cli/src/public/features/generate/plugins/installed-saga-declarations_test.ts packages/cli/src/public/features/generate/plugins/installed-runtime-registry-integration_test.ts packages/cli/src/public/features/plugins/doctor/runtime-registry-drift_test.ts packages/cli/src/public/features/plugins/doctor/doctor-plugin-registry-drift_test.ts packages/cli/src/public/features/generate/plugins/generate-plugin-registries-command_test.ts` — exit 0, 81 passed, 0 failed/ignored. Restored-source rerun recorded before review. Five additional regressions cover shared-root mutation safety and division tokenization.
- `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root plugins/sagas/src/cli --root plugins/sagas/tests/cli --ext ts,tsx --pretty` — exit 0, zero diagnostics. Separate check wrapper for the new CLI integration test also exits 0, zero diagnostics.
- Structured lint/fmt wrappers over saga CLI source/tests and the new CLI integration test — 19 selected/processed files, exit 0, zero findings. A scoped config copies root style/rules and removes only include/exclude filters so the root's CLI exclusion cannot silently skip the new test. The initial no-control-regex finding was fixed without suppression.
- `deno run --allow-read --allow-write --allow-run --allow-env .llm/tools/gates/run-gate.ts --gate quality-gate --id sagas-2374-repaired-quality --output <private-project-run>/repaired-quality-receipt.json` — full root `quality:gate` (quality scan, dependency checks and architecture checks), exit 0. Baseline also exited 0. Receipt proves command execution in the precommit working tree, not exact final-head sufficiency.
- `deno run -A .llm/tools/fitness/audit-jsr-package.ts --root plugins/sagas --out <private-project-run>/implementation-jsr.json` — exit 0, no FAIL findings. Existing cardinality and slow-types notices exactly match baseline.
- `deno run --allow-read --allow-run .llm/tools/run-deno-doc-lint.ts --root plugins/sagas --pretty` — exit 1, 30 existing private-type-ref diagnostics; reproduced with all three changed existing source files restored to baseline. Changed `./src/cli/mod.ts` entrypoint: 0 diagnostics. No new documentation error and no claim of full-package doc-lint green.
- `git diff --check` — exit 0. No deno.lock changes, no new dependencies or lint suppressions.

## Negative controls (sources restored in finally)

1. Restore **all existing changed saga source files** (generator, inspector and CLI barrel) to baseline `14816a409e31505bc528714332b0bf4670be2fcb`, then run the new installed integration file through the test wrapper: exit 1, **3 failed / 1 passed**. Factory discovery, documented root-config discovery and unresolved-declaration rejection all fail. The zero-declaration baseline test correctly still passes.
2. Restore only the old generator while retaining new inspector metadata: direct+installed declaration tests exit 1, **27 failed / 9 passed**. This is a narrower mutation control, not a claim about the full old source tree.
3. Deliberately append `sagas/helper.ts` to the selected runtime paths: direct declaration/non-saga test exits 1, **1 failed**. This proves the undeclared-file protection assertion is sensitive.
4. Deliberately reject an empty selected source list: zero-active-declaration test exits 1, **1 failed**. This proves the intentionally-empty-install protection is sensitive.

The preserved behaviors (undeclared exclusion and valid empty installs) already work on main; a full reversion should preserve them, so their regressions are proved with targeted mutants rather than a false claim that every test fails on main. 5. Restore the original local runtime backend while retaining new discovery metadata: all **4 shared-root update/remove safety regressions fail** (exit 1). The repaired backend is restored before the final positive suite.

Every modified source byte was restored before the final positive suite.

## Remaining external evidence

Full exact-head `e2e-cli` scaffold.runtime CI is required. The owner prohibits a local run and assigns the e2e-cli-gate label to the coordinator. Local source selection, registry load and doctor tests do not certify the full generated-app runtime. Final pushed-head review and CI snapshot are linked in PR phase comments and the READY issue reply.

## CI quality follow-up

The initial ready head's quality job failed README fence integrity on the new app-owned factory import (one additional TS2307). The complete example now contains a checked application-core factory fence at the actual imported path, using the existing snippet compiler's first-line file convention. No exemption or ratchet change: `readme-fences` exits 0 with 36 READMEs, 112/112 TypeScript-like fences checked, zero exempt, zero syntax failures, and the unchanged baseline five type errors in four other READMEs.

The follow-on `check:mcp-export-corpus` was stale from the new saga CLI metadata. Native `gen:mcp-export-corpus --allow-dirty` regenerated the embedded API data. The dirty read set was only the reviewed README; runtime source was committed and unchanged. Decoding and comparing the generated data proves the only changed row is `plugin-sagas` / `./cli`, adding SagaRuntimeDeclaration and the two updated inspector fields. No other API row changed.

Follow-up gates: `check:mcp-export-corpus`, `check:agent-docs-prose`, `check:assets-barrel`, `check:publish-assets` all exit 0. The emitted-samples receipt passes: 48 TypeScript samples from 38 artifact paths. Structured MCP corpus source check has zero diagnostics; eight existing embedded-corpus/flow/mirror tests pass. Runtime source and the earlier 81-test saga proof remain unchanged.
