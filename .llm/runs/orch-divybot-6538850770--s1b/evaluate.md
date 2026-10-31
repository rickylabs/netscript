# IMPL-EVAL (final, same evaluator) — Tokens v2 S1b

**Verdict: FAIL_FIX**

The six new theme documents break the docs-site build, so the `check:agent-docs-prose` carrier gate fails. The token engine and registry code otherwise hold up. One documentation fix plus fresh evidence should clear this; I don't see a rescope or a debt question.

## Blocker

**B1. The new theme documents break `check:agent-docs-prose`.**
- `check-agent-docs-prose.log:19-27` shows the Lume build stopping with `Error: apple-classic: DESIGN.md requires YAML front matter`, thrown from `parseTheme` at `docs/site/_plugins/design-system.ts:109`.
- `loadDesignSources` (`design-system.ts:203-217`) reads every folder under `docs/design-system/themes/`. Each `DESIGN.md` there needs:
  - YAML front matter with `name`, `description` and `version`;
  - every group in `VALUE_GROUPS`;
  - the `THEME_SECTIONS` headings.
- All six new files (ledger, signal, glass, macos-27, apple-classic, fluent-2-web) are plain Markdown. `docs/design-system/themes/apple-classic/DESIGN.md:1` starts at `# Apple Classic` with no front matter and only "Preset contract" / "Values and validation" sections. Compare `bloom/DESIGN.md:1-25`.
- **Effect:** the docs site build fails, so this carrier check fails and the docs CI job will fail. The worklog's "four carrier checks running" has resolved: at least this one failed.
- **Fix (choose one):**
  - Write contract-compliant `DESIGN.md` files: front matter whose values are copied from the built preset contexts (Figma-exported, no new values), with the required sections, following `themes/_template/DESIGN.md`.
  - Or move the token-usage documents somewhere the site catalogue does not read, and point `sync-theme-registry.ts:32-36` at that location.
- Then rebuild the agent-docs prose and the corpus, rerun all four carrier checks, and rerun the registry tests, because those copy these files.

## Evidence gaps (not certified)

- **`check-assets-barrel.log`** ends at `Registry JSON embeddings generated.`, with no `generate-cli-assets-barrel` output and no `git diff --exit-code` result. Record the final exit code.
- **`check-publish-assets.log`** shows only the task lines and no explicit result. Record the exit code.
- **`root-check.json`** holds a single desktop-fixture line, not a root `deno task check` result. Root check is unproven until a real report exists.
- **`check-mcp-export-corpus.log`** shows a checksum summary. It is a preview built from dirty source, so it must be regenerated from clean source after the fix commit. The worklog already plans this.
- **`quality-receipt.json`** certifies the `quality:gate` command at f836d0256 with uncommitted changes present. It does not prove the final source.

## Integration review (no other blockers)

- **`scripts/sync-theme-registry.ts`:** deterministic. It is wired into `tokens:build`/`check` and its `--check` mode fails on a stale `registry.json`. No public CLI command is added.
  - Small robustness point: the `TOKEN_PRESETS.find(...)!` at `:13` throws a bare TypeError when an item in `theme-items.json` has no matching preset.
  - The preview inventory comes from `TOKEN_PRESETS` while theme items come from `theme-items.json`, and the script never checks that the two sets are equal. I'm relying on the tests' complete-set checks for that; adding an explicit equality check is optional.
- **Registry tests:** `registry-complete-tests.json` 283/0 supersedes the earlier failing runs (`registry-and-component-tests` 278/5, `registry-final-tests` 281/2). `registry-integration-tests-final` 11/0 and `theme-registry-tests` 7/0. The frozen `legacy-v1.json` is unchanged and its original items are asserted as an exact subset.
- **Token slice:** `token-final-tests.json` 41/0. `css-compatibility-tests.json` passes, covering the baseline-declaration superset and the 6,000-byte gzip cap. `cli-token-tests` 10/0, `final-publish-budget-test` passes, template lint 0, package check 265 files / 0 findings.
- **Debt and report:** the emphasis-name A1/A2 debt has an owner, target, cost and gate, and the README describes the limitation. The report records 531 failing pairs out of 9,132 uses, and the burn-down stays OPEN.
- **Inherited audit findings, reported as unchanged rather than green:** doc lint has the same 124 diagnostics as baseline with `tokens.ts` clean, and the JSR `contracts.json` @module finding is unchanged.
- **Runtime:** UNPROVEN because the Docker daemon is absent. The owner allows this. 0 owned survivors; foreign resources were not touched.

## To reach PASS

1. Fix B1, then regenerate the prose and the clean-source corpus.
2. Get recorded passing results for all four carrier checks and every `check:*` task, plus a real root-check report.
3. Rerun the registry tests and the token tests against the fixed docs.
4. Separately, before READY: all required checks green on the exact final head, which I have not verified. The PR keeps Refs #2450, no labels, and no merge.
