# Worklog — RFC 0013 S1

## Design Checkpoint & Plan-Gate Record

- **Plan-Gate:** N/A — slice executes accepted RFC 0013 §4.1 Phase 0a item 1 (`rfcs/0013-orpc-v2-readiness.md`, owner-accepted 2026-11-27 in PR #2674) with no unapproved scope expansion.
- **Start Gate:** Satisfied (`#2674` merged `7eecfe5`, `#2693` merged `6c16607`). Worktree branched from `origin/main` (`6c166075b`).

## Execution Log

- **2026-11-28 (Pass 1 — commit `25b112eaa`):**
  - Filed sub-issue `#2701`, opened PR `#2704`.
  - Independent IMPL-EVAL Pass 1 (Sol 6.2 xhigh, PR comment `IC_kwDOSxcnO88AAAABr2OKCQ`) returned `VERDICT: CHANGES_REQUESTED` with 7 findings, matching CI failures on `check-test-shard (browser)` and shards 2–6.
- **2026-11-28 (Pass 2 remediation):**
  - Finding 1 (P1) + shards 2–6 external-config failures: removed `@orpc/*` from all 11 workspace `deno.json` `imports` and declared `"@orpc/*": "catalog:"` in each member's `package.json`; restored `resources/examples/expo-streams/{deno.json,deno.lock}`; extended `.llm/tools/release/publish-workspace.ts` and `packages/cli/src/maintainer/adapters/plugin-import-rewriter.ts` to materialize `package.json` `"catalog:"` dependencies at publish/local-copy time; updated Fresh in-repo browser fixture `vite.config.ts` plugins to resolve root-catalog packages (including subpaths); refreshed workspace/reference locks cleanly.
  - Finding 2 (P1) + Finding 4 (P2): updated `.llm/tools/deps/workspace.ts` to collect plain npm semver strings in `package.json` and literal dynamic `import('npm:...' | 'jsr:...')`, fixed Windows backslash nested-config exclusion via `isPathWithinAnyDirectory`, and added negative CLI + Windows path tests in `scan-npm-catalog-compliance_test.ts`.
  - Finding 3 (P2): updated `packages/cli/src/kernel/constants/scaffold/scaffold-app-catalog_test.ts` and `packages/sdk/tests/package-manifest_test.ts`.
  - Finding 5 (P2): registered `'deps-check'` in `.llm/tools/gates/catalog.ts` and added the required `deps-check` step to `.github/workflows/ci.yml` `quality` job.
  - Finding 6 & 7 (P2/P3): updated harness `context-pack.md`, `drift.md`, and `worklog.md`; preparing updated verification receipts and Pass-2 IMPL-EVAL (Hydrogen xhigh).
- **Pass-2 Local Verification (Deno 2.9.8):**
  - `deno ci` — PASS (frozen lockfile clean, 0 `@orpc/*@1.15.*` peer warnings)
  - `deno task deps:check` — PASS (`reference-lock PASS locks=3`, `scan-npm-catalog-compliance.ts --fail-on-package-prefix=@orpc/` 0 `@orpc/` violations including plain `package.json` & dynamic-import checks, `private-lock-workspace PASS locks=1`, `zod-alignment PASS`, `db-alignment PASS`)
  - `deno task check:desktop-native-fixture` — PASS (`15 reachable SDK modules; 0 unmapped specifiers`)
  - `deno task check` — PASS (`4396 files, 37 batches, 0 errors`)
  - `deno task lint` — PASS (0 errors)
  - `deno task fmt:check` — PASS (0 findings)
  - `deno task quality:cli` — PASS (0 lint/fmt findings)
  - `deno task check:netscript-jsr-specifiers` — PASS
  - `deno task quality:gate` (`quality:scan` + `arch:check`) — PASS
  - `deno task publish:dry-run` (all 37 publishable workspace packages, with `package.json` `"catalog:"` dependencies materialized into published `deno.json` `imports`) — PASS
  - Vite SSR + build probes across all 5 Fresh browser fixtures (`query-hydration-age-browser`, `defer-client-navigation-browser`, `route-binding-browser`, `route-purity-browser`, `db-collection-browser`) — ALL 5 PASS
  - Frozen sanitized unit/probe suite (`scan-npm-catalog-compliance`, `check-reference-locks`, `check-zod-alignment`, `rpc-query-currency`, `check-private-lock-workspace`, `run-gate`, `publish-workspace`, `contracts/tests`, `sdk/tests/{package-manifest,client-contribution-observability}`, `fresh/tests/package-manifest`, `locked-probes`, `install-generated-probe`, `installation-provisioning`, `scaffold-app-catalog`, `packages-copier`, `ci-receipt-policy`) — **86 passed, 0 failed**
  - Previously failing external-config & shard 2–6 test suites (`project-config-loader`, `streams/resources`, `streamdb-headers-contract`, `aspire-check-command`, `workspace-mutator`, `aspire-cli-task`, `generate-apphost-deno-json`, `doctor-plugin-registry-drift`, `installed-runtime-registry-integration`, `generate-aspire`, `aspire-compat-health-checks`, `aspire-lifecycle-check-command`) — **18 + 65 passed (25 steps), 0 failed**
