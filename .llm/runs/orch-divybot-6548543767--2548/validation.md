# Validation commands

All source commands run from repository root. Rehearsals run from a separate disposable clone.

```sh
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all --unstable-kv .llm/tools/deps/bump-version-registry_test.ts .llm/tools/deps/bump-version_test.ts .llm/tools/validation/check-netscript-jsr-specifiers_test.ts .llm/tools/release/prepare-release_test.ts .llm/tools/release/cut_test.ts .llm/tools/release/canary_test.ts
```

52 passed. Exact registry/CLI test argv is in `reports/registry-cli-tests.json`: 83 passed.

```sh
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-check.ts --file .llm/tools/deps/bump-version.ts --file .llm/tools/deps/bump-version-registry_test.ts --file .llm/tools/release/prepare-release.ts --file .llm/tools/release/prepare-release_test.ts --file .llm/tools/validation/check-netscript-jsr-specifiers_test.ts --file packages/fresh-ui/tests/registry-authoring.test.ts --ext ts
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-lint.ts --root .llm/tools/deps/bump-version.ts --root .llm/tools/deps/bump-version-registry_test.ts --root .llm/tools/release/prepare-release.ts --root .llm/tools/release/prepare-release_test.ts --root .llm/tools/validation/check-netscript-jsr-specifiers_test.ts --root packages/fresh-ui/tests/registry-authoring.test.ts --ext ts --config .llm/runs/orch-divybot-6548543767--2548/lint-config.json
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-fmt.ts --root .llm/tools/deps/bump-version.ts --root .llm/tools/deps/bump-version-registry_test.ts --root .llm/tools/release/prepare-release.ts --root .llm/tools/release/prepare-release_test.ts --root .llm/tools/validation/check-netscript-jsr-specifiers_test.ts --root packages/fresh-ui/tests/registry-authoring.test.ts --ext ts
deno task release:preflight
deno task check:netscript-jsr-specifiers
deno task quality:gate
deno task check:agent-docs-prose
deno task check:mcp-export-corpus
deno task check:assets-barrel
deno task check:publish-assets
deno task check:aspire-version-parity
```

All exit 0. Carrier checks regenerate normally; tracked output and docs-site lock remain unchanged.

```sh
# In disposable clone, outside the active worktree:
deno task release:canary -- 0.0.9 --dry-run
```

Initial full rehearsal exit 0. Decoded/generated registry proof is in reports; final-source rehearsal is repeated after the carrier-staging correction.

```sh
deno task e2e:cli run scaffold.runtime --cleanup --format pretty
```

Attempted, exit 1: missing Docker daemon and failing Aspire doctor preflight. No generated runtime started. Local runtime proof is unproven. Ordinary-PR runtime CI is opt-in by workflow policy, and owner prohibits labels. Read-only leak-check left foreign resources untouched.
