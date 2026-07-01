# IMPL-EVAL Verdict — chore/jsr-alpha1-publish-prep (PR #116)

**Verdict: PASS**

## Evidence Matrix

### Q1 — Version alignment
- **Command:** `grep -rn '"version":' packages/*/deno.json plugins/*/deno.json deno.json | grep -v '0.0.1-alpha.1'`
- **Result:** Empty — all 32 workspace members + root at exactly `0.0.1-alpha.1`.
- **Cross-ref check:** `grep -rn 'jsr:@netscript' packages/*/deno.json plugins/*/deno.json | grep -v '0.0.1-alpha.1'` — empty.
- **Adversarial fixes re-verified:** `1a21808f` corrected root `deno.json`, `release-eject-constants.ts`, and config README fixture. All three now read `0.0.1-alpha.1`.

### Q2 — Single version source
- `jsr-specifiers.ts` imports `cliPackageJson` from `../../../deno.json` (type: json, side-effect-free).
- `NETSCRIPT_RELEASE_VERSION` = `cliPackageJson.version` (drift-free).
- `netscriptJsrSpecifier()` builds exact specifiers — no `^`, no `1.0.0`.
- `release-eject-constants.ts` consumes `NETSCRIPT_RELEASE_VERSION` (not hardcoded).
- `rg -n 'jsr:@netscript/.+@\^?1\.0\.0' packages/cli/src` — 0 matches.
- `prisma-adapter-mysql` added to `NetscriptPackage` union — it IS a real workspace member (verified: `packages/prisma-adapter-mysql/deno.json` has `"name": "@netscript/prisma-adapter-mysql"`, `"version": "0.0.1-alpha.1"`, and the root workspace glob `"packages/*"` covers it).

### Q3 — JSONC→JSON drift
- `packages/cli/deno.json` diff: removed one comment line (`// DEBT_ACCEPTED...`). No config semantics lost — the comment was documentation only. File remains valid JSON for all consumers (deno task resolution, publish, Lume import).

### Q4 — Docs version + voice
- `docs/site/_data.ts` single-sources `releaseVersion` from `packages/cli/deno.json` (JSON import).
- Banned "honest/honesty/candor" framing: only in `docs/site/_plan/` (planning docs, not published content). Allowed.
- The `1.0.0` hits in docs/site are all **example code** (service `version: '1.0.0'` — user service version, not NetScript package version). Correct and intentional.
- `docs/site/why.vto:133` — the allowed open-debt marker remains.
- `packages/config/` — zero `0.0.1-alpha.0` or `^1.0.0` hits.

### Q5 — Publish workflow
- `.github/workflows/publish.yml`: trigger `on: push: tags: ['v*']` ✓
- `permissions: {id-token: write, contents: read}` ✓
- No GITHUB_TOKEN publish step ✓
- `publish:dry-run` runs before `deno publish` ✓
- `denoland/setup-deno@v2` pinned to `2.8.3` ✓
- Workspace-root `deno publish` (not per-package) ✓
- No premature release-tag push ✓

### Q6 — Lock hygiene
- `git diff origin/main -- deno.lock` — empty. No lock churn.

### Q7 — Gates re-run (REQUIRED)
| Gate | Exit Code | Result |
|------|-----------|--------|
| `deno task publish:dry-run` | 0 | All 32 members publish successfully |
| `deno task check:scaffold-versions` | 0 | "10 scaffold pin(s) are stable" |
| CLI test suite (5 named files) | 0 | 11 tests passed, 0 failed |
| `docs/site` build | 0 | 306 files generated in 6.54s |

### Q8 — Casts
- `git diff origin/main` checked for `+.* as ` lines (excluding `as const`) across all 5 changed source files.
- Result: only pre-existing `as { ... }` type annotations in `plugin-import-rewriter.ts` (import-map parsing). No new casts added.

## Out-of-scope observations (NOT this PR's regression)
- `0.0.1-alpha.0` in plugin runtime constants (`AUTH_PLUGIN_VERSION`, etc.) — internal version identifiers for plugin self-identification, separate from deno.json publish versions. Out of scope.
- `0.0.1-alpha.0` in per-package README files and docs — deferred to PR2 per plan.
- `1.0.0` in docs/site example code — user service version strings in code samples, not NetScript package version pins. Correct.
