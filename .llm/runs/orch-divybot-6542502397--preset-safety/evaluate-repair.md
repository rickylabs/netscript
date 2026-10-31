# Independent repair evaluation

Requested and observed model: claude-opus-5-5. High effort requested; effort not independently attested. Separate read-only session and vendor family from implementation.

**Verdict: PASS.** The repair meets all three contract items, and I found no blockers. This is not READY yet: the repair is uncommitted, so there are no exact-head CI checks, and the broad CLI/protocol suites and root checks had not finished when you sent this. I did not assume either result.

Scope: the whole diff against `69951eb22268d40cfb51373f79b3da838150976b`, which is 5 source/test files, `docs/site/reference/cli/commands.md`, the generated `agent-docs-prose` carrier, and the run-directory changes. I worked read-only and changed nothing.

## Contract check

**(1) Unknown theme in any preset form is rejected before writes, in both binaries — met.**
- `packages/cli/src/kernel/application/ui/v2/presets/resolve-preset.ts:15-17`, `:33` and `:47` now send plain/`ns1_` codes, share links and URL preset JSON through one helper, `registeredPreset` (`:69-79`). It checks the theme against `tokenEngine.defaults().presets`. That is the same source `buildAppTokens` uses later (`packages/cli/src/kernel/application/tokens/build-app-tokens.ts:39`), so the early check cannot disagree with the later one.
- `prepareInitPreset` calls `resolveUiPreset` before any scaffold write. Both the public wiring (`packages/cli/src/public/features/root/public-command-dependencies.ts:332-353`) and the maintainer wiring (`packages/cli/src/maintainer/features/root/maintainer-command-dependencies.ts:82-85`) supply `tokenEngine`.
- `packages/cli/src/public/features/init/init-preset-safety_test.ts:43-68` adds the unknown plain, encoded, share, share-encoded and JSON cases. Each runs against both `bin` entry points and asserts exit code 1, zero entries in the target directory, and the expected diagnostic.

**(2) Registry URLs need HTTPS, with HTTP only on exact loopback hosts, everywhere — met.**
- `packages/cli/src/kernel/domain/ui/ui-config.ts:27` and `:84-89` now hold the one exact loopback set (`localhost`, `127.0.0.1`, `[::1]`) inside `uiRegistryUrl`. The old inline copy in `resolve-preset.ts` is gone. A repo search finds no other copy in CLI source.
- Coverage is complete because every network read passes through `uiRegistryUrl`:
  - the client's single `read` choke point (`packages/cli/src/kernel/application/ui/v2/registry-client.ts:88`), which covers items, files, includes and transitive `registryDependencies`;
  - direct and namespaced refs (`registry-client.ts:139` and `:153`);
  - the fetch adapter (`packages/cli/src/kernel/adapters/ui/fetch-ui-registry.ts:17`);
  - config schema validation (`ui-config.ts:28-38`);
  - share-link origins (`resolve-preset.ts:29-32`), which strip the query and hash first so the policy can be applied without echoing the preset payload.
- Tests: `packages/cli/src/kernel/application/ui/v2/tests/ui-client_test.ts:25-78` covers dependencies (external and look-alike hosts plus `[::2]` are rejected with zero dependency reads; exact loopback hosts are accepted). `packages/cli/src/public/features/ui/add/add-ui-command_test.ts:29-50` covers `ui:add` (no reads, no file changes).
- No redirect/SSRF expansion. The existing `redirect: 'error'` setting is unchanged.

**(3) A test fails if the early `registry:theme`/`registry:base` guard is removed — met.**
- `init-preset-safety_test.ts:63-67` serves a schema-valid `registry:ui` item and asserts zero files in both binaries. The guard itself is unchanged at `resolve-preset.ts:51-53`.
- Run evidence `red-item-type` shows 3 failures (public and maintainer zero-file steps plus the parent test), and the run memory explains why a test at the apply level would not catch the removal. I did not repeat this mutation myself, because that would mean editing source. The test's structure supports the claim.

## Evidence I verified myself
- Focused wrapper run (`.llm/tools/run-deno-test.ts`, `--no-check --unstable-kv --frozen`) on `ui-client_test.ts`, `add-ui-command_test.ts` and `init-preset-safety_test.ts`: exit 0, 34 passed, 0 failed, 0 ignored.
- Broader wrapper run on `packages/cli/src/kernel/application/ui/v2/tests/`, `packages/cli/src/kernel/adapters/ui/`, `packages/cli/src/public/features/ui/`, `packages/cli/src/kernel/domain/ui/` and `packages/cli/src/public/features/agent/mcp/create-cli-ui-registry-catalog_test.ts`: exit 0, 104 passed, 0 failed. This includes the existing `url-preset_test.ts` HTTPS/loopback test, so the stricter rule broke nothing there.
- I decoded the `pages/reference/cli/commands/index.md` entry in `packages/cli/src/kernel/assets/agent-docs-prose.generated.ts`. It contains the new text ("including registry dependencies", "Plain and `ns1_` preset codes", "registered built-in theme"), so the carrier matches the doc edit.
- No stale "HTTP or HTTPS" registry wording remains in `docs/site` or the CLI/fresh-ui READMEs.
- Run artifacts agree with each other: red baseline 11 failed / 11 passed, mutation run 3 failed / 16 passed, green run 23 passed (`repair-regressions.json`). The worklog records PLAN-EVAL as N/A for this bounded owner-specified repair, and the drift log records the scope expansion and the skip-policy change. The leak report contains a verdict and counts only.
- I did not re-run the scoped check/lint/fmt, quality:gate, docs:accuracy, release:preflight or the JSR audit. Those results are the implementer's.

## Advisories (not blockers)
1. **Misleading message when no token engine is wired** (`resolve-preset.ts:73`). If `deps.tokenEngine` is missing, every themed preset fails with "Unknown token preset". All production wirings supply one, and the old code also failed later in that case (`preset-tokens.ts:23`), so only the message changes.
2. **Behavior change:** `ui:apply --only font` with a code naming an unknown theme now fails early, where before the theme was ignored. This matches the contract.
3. **Edge case:** share links are checked with the full `uiRegistryUrl` rules, including the `github.com` path-shape rule. A share link like `https://github.com/?preset=…` would fail with "Invalid public GitHub registry URL". The default origin (`rickylabs.github.io`) is unaffected.
4. **User-facing breaking change** (`ui-config.ts:28-38`): an existing `fresh-ui.json` that points a registry at a non-loopback `http://` URL now fails schema validation. This is intended, but a release note would help.
5. The working tree kept changing during my review. `research.md`, `repair-gates.json`, `memory-repair-validation.md` and `.llm/2026-10-31-preset-import-safety-repair.md` appeared after the prompt's snapshot, and I did not review them. The dated lesson file is on the supervisor's authorized write surface.

## Risks and limits
- The runtime check (`scaffold.runtime`) is UNPROVEN because Docker is unavailable. The 24 unproven leak survivors were left untouched, and I did not inspect raw leak data.
- READY still needs:
  - the repair committed and pushed to PR #2518 with `Refs #2516` only (no closing keyword, no labels);
  - every required check on that exact head green or skipped by policy (`deps-report` skipping is expected);
  - the broad CLI/protocol suites and root checks to finish green.
- Cockpit owns the merge.

## Same-evaluator final evidence review

**Verdict: PASS.** The repair slice is approved, with no blockers. It is not READY until exact-head CI is green.

## What I reviewed
- **Source, test, doc and generated-file changes are the same size as at my earlier review.** Per-file added/removed line counts are identical for all seven files: `packages/cli/src/kernel/application/ui/v2/presets/resolve-preset.ts` +22/−17, `packages/cli/src/kernel/domain/ui/ui-config.ts` +19/−12, `ui-client_test.ts` +55, `init-preset-safety_test.ts` +47/−4, `add-ui-command_test.ts` +30/−1, `agent-docs-prose.generated.ts` +1/−1, `docs/site/reference/cli/commands.md` +4/−2. I did not re-run tests, as you asked.
- **The diff stays in scope.** Outside the run directory, the only new tracked change is the dated lesson file `.llm/2026-10-31-preset-import-safety-repair.md`, which the supervisor approved. The run directory adds evidence files (`repair-gates.json`, `repair-tests.json`, `repair-source-gates.json`, `repair-regressions.json`), memory notes and `evaluate-repair.md`, and makes small edits to the plan, context, drift, worklog, research and leak-report files. Nothing in production changed beyond what I already reviewed.
- **The new files contain:**
  - `research.md` repair section: why the work resumes PR #2518, the theme-check gap for code and share-link presets, why the policy moved into `uiRegistryUrl`, and why the later apply-step check would hide a missing early check. It agrees with the code.
  - `repair-gates.json`: quality-gate and docs-accuracy PASS; 12 root checks and 4 site checks exit 0; release:preflight, the CLI JSR audit and review-threads exit 0; runtime UNPROVEN with exit 1 because Docker is unavailable; assets-barrel scheduled after the commit. Commands are relative and raw output is recorded only as hashes.
  - `repair-tests.json`: the broad CLI suite (101 passed) covering public and maintainer init, `ui:apply`, `ui:add`, the v2 tests and the registry test; the protocol suite (4 passed).
  - `repair-source-gates.json`: check, lint and fmt on the same 5 files, 0 findings, no files dropped or refused.
  - `memory-repair-validation.md`: corrects the test-path selection to the `ui/protocol` folder, which explains the earlier invocation error.
  - The dated lesson file: generic lessons only, no identifiers.
- **No private data in the public run files.** I searched every changed and untracked `.llm` file for home or temp paths, Windows or WSL paths, UUIDs, session-ID patterns and agent IDs. The only match is the phrase "no-session-id policy" in `supervisor.md:9`, which describes the policy and is not an identifier. `leak-report.md` contains only the verdict and counts (24 survivors, 24 unproven).

## Correction to my earlier advisory 4
This CLI keeps registry settings in `components.json` (`UI_CONFIG_FILE`, `packages/cli/src/kernel/domain/ui/ui-config.ts:4`), not `fresh-ui.json`. Corrected advisory: an existing `components.json` that points a registry at a non-loopback `http://` URL now fails schema validation. This is intended and documented. The other non-blocking advisories are deferred, as the owner's bounded scope allows.

## Gate and CI limits
- **Runtime:** UNPROVEN. The scaffold runtime suite exited 1 because Docker is unavailable. The 24 unproven leak survivors were left untouched, and I did not look at raw leak data.
- **assets-barrel:** not run yet. It compares Git diffs, so it can only run once the regenerated docs file is committed.
- **Gates I did not re-run:** the root, site, quality, docs, release and audit gates, plus the broad and protocol suites. Those results come from the implementer's evidence files. They were run on the uncommitted working tree, and the receipts themselves say they do not prove anything about a later commit.
- **What READY still needs:**
  - commit and push to PR #2518 with `Refs #2516` only, no closing keyword and no labels;
  - every required check on that exact head green or skipped by policy (`deps-report` skipping is expected);
  - assets-barrel passing on that head.
- Cockpit owns the merge.
