# worklog.md — chore-release-one-shot--tooling

## Implementation

### S1 — D2 remove rejected `deno ci --prod` flag

- Updated `.llm/tools/deps/prod-install.ts` to run `deno ci --prod` and keep `--skip-types` support.
- Added `.llm/tools/deps/prod-install_test.ts` to assert the resolved args never include the rejected flag.
- Removed remaining toolbelt-doc mentions from `.llm/tools/README.md` and `.llm/tools/entry.md`.

Gate evidence:

| Gate | Result | Evidence |
| --- | --- | --- |
| `git grep -nF -- '--frozen' .llm/tools/` | PASS | Exit 1, zero matches. |
| `deno test --allow-read --allow-run .llm/tools/deps/prod-install_test.ts` | PASS | 2 passed, 0 failed. |
| `deno fmt --check .llm/tools/deps/prod-install.ts .llm/tools/deps/prod-install_test.ts` | PASS | Checked 2 files. |
| `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --file .llm/tools/deps/prod-install.ts --file .llm/tools/deps/prod-install_test.ts --ext ts` | PASS | 2 files selected, 0 occurrences. |
| `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools --ext ts --unstable-kv` | BLOCKED | Wrapper rejects literal `--unstable-kv` as an unknown wrapper argument; wrapper help shows `--unstable-kv` is passed by default and `--no-unstable-kv` disables it. |
| `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools --ext ts` | BASELINE FAIL | Fails only in pre-existing `.llm/tools/fitness/check-manifest-integrity.ts` because it imports missing `packages/fresh-ui/registry/manifest.ts`; no S1 files reported. |

### S2 — D3 text-import preflight gate

- Added `.llm/tools/release/preflight-text-imports.ts` with a narrow two-pass scan:
  collect `const <id> = new URL(<literal>, import.meta.url)` and direct `fromFileUrl(new URL(...))`
  declarations, then flag only `Deno.readTextFile` / `Deno.readFile` calls that read those identifiers
  or inline `new URL(..., import.meta.url)`.
- Added positive, negative, and allowlist fixtures under `.llm/tools/release/tests/fixtures/`.
- Added `deno task release:preflight`.
- Wired `.github/workflows/publish.yml` to run `deno task release:preflight` before `Publish dry-run`.

Gate evidence:

| Gate | Result | Evidence |
| --- | --- | --- |
| `deno test --allow-read .llm/tools/release/preflight-text-imports_test.ts` | PASS | 3 passed, 0 failed. |
| Positive fixture CLI: `deno run --allow-read .llm/tools/release/preflight-text-imports.ts --file .llm/tools/release/tests/fixtures/positive-openapi-break.ts` | PASS | Expected non-zero; flags read line 6 with URL declaration line 1. |
| Negative fixture CLI: `deno run --allow-read .llm/tools/release/preflight-text-imports.ts --file .llm/tools/release/tests/fixtures/negative-url-composition.ts` | PASS | Exit 0, no findings. |
| Focused `run-deno-check` on S2 tool and fixtures | PASS | 5 files selected, 0 occurrences. |
| `deno fmt --check` on S2 tool and fixtures | PASS | Checked 5 files after scoped formatting. |
| Focused lint wrapper on S2 tool and fixtures | TOOLING LIMIT | Reports 0 lint occurrences, but exits 1 because the underlying `deno lint` sees no target files under the repo config that excludes `.llm/`. Raw `deno lint` returns `error: No target files found.` |
| `rg -n "\bas\b" .llm/tools/release/preflight-text-imports.ts .llm/tools/release/preflight-text-imports_test.ts .llm/tools/release/tests/fixtures` | PASS | Exit 1, zero matches; no new type casts in S2. |
| `deno task release:preflight` | TRUE FINDING | Exits 1 on `packages/service/src/primitives/openapi.ts:155`, whose `scalarJsUrl` is declared from `new URL(..., import.meta.url)` on line 29. This is outside the SCOPE-tools edit boundary; recorded and not suppressed. |

### S3 — D1 `release:cut` orchestrator

- Added `.llm/tools/release/cut.ts` and `deno task release:cut`.
- Implemented exact semver validation, coordinated root/member/lock version rewrite, residue scan,
  ordered gates, dry-run mode, and branch/commit/push/PR creation via `gh pr create --body-file`.
- Added `.llm/tools/release/cut_test.ts` for root/member/lock bump coordination, nested workspace
  member coverage (`packages/cli/e2e` shape), residue, version ordering, and task `--` separator
  parsing.
- Fixed the S2 scanner and S3 residue filters to evaluate repo-owned exclusions relative to the scan
  root; this avoids false passes when a full checkout is copied under `.llm/tmp` for dry-run proof.

Gate evidence:

| Gate | Result | Evidence |
| --- | --- | --- |
| `deno test --allow-read --allow-write --allow-run --allow-env .llm/tools/release/cut_test.ts` | PASS | 3 passed, 0 failed. |
| Focused `run-deno-check` on S3 tool/test | PASS | 2 files selected, 0 occurrences. |
| `deno fmt --check .llm/tools/release/cut.ts .llm/tools/release/cut_test.ts` | PASS | Checked after scoped formatting. |
| `rg -n "\bas\b" .llm/tools/release/cut.ts .llm/tools/release/cut_test.ts` | PASS | Exit 1, zero matches; no new type casts in S3. |
| `deno task release:cut -- 0.0.1-alpha.99 --dry-run` in copied checkout under `.llm/tmp/release-cut-dry-run-copy` | BLOCKED BY TRUE FINDING | Bump and residue completed, then fail-fast stopped at `release:preflight` on `packages/service/src/primitives/openapi.ts:155`. No branch, commit, push, or PR was created. Copy was removed after the run. |
