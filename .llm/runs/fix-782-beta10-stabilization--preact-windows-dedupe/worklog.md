# Worklog: fix #782 — Preact Windows dedupe

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `fix-782-beta10-stabilization--preact-windows-dedupe` |
| Branch | `fix/782-beta10-stabilization` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `frontend` |

## Design

### Public Surface

- `createNetScriptVitePlugin(options?)` remains the only affected public entry point.
- `@netscript/fresh/vite` keeps all existing exported names and signatures.
- Observable policy addition: returned Vite config dedupes Preact, and the resolver canonicalizes
  delegated Preact IDs.

### Domain Vocabulary

- **Preact import** — bare `preact`, a Preact subpath, or an optional versioned `npm:`/`npm:/`
  Preact specifier.
- **Delegated resolution** — Vite's normal resolution result obtained with this plugin skipped.
- **Canonical module ID** — the delegated `id` after Vite `normalizePath()` converts path
  separators to forward slashes.
- **Hooks runtime identity** — one Rollup module key for one physical Preact hooks file.

### Ports

- No new package port. Vite's plugin context `this.resolve` is the existing upstream seam used by
  the plugin hook and replaced by the focused regression fixture.

### Constants

- `PREACT_IMPORT_PATTERN` — finite matching policy for bare, subpath, and versioned npm Preact
  specifiers while excluding similarly prefixed packages.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| S0 | Activate and expose the harness plan | clean status and plan artifact review | `.llm/runs/fix-782-beta10-stabilization--preact-windows-dedupe/**` |
| S1 | Canonicalize Preact production module identity | focused Vite production fixture + package/static/fitness gates | `packages/fresh/src/application/vite/vite.ts`, `vite.test.ts`, `README.md`, run evidence |

### Deferred Scope

- General Windows filesystem-ID normalization — not proven safe for all Vite virtual/URL IDs.
- Native Windows browser hydration automation — supervisor/CI evidence; no implementation change
  is required to keep it available.
- Scaffold/runtime E2E — no scaffold output or runtime wiring changes.

### Contributor Path

Open `packages/fresh/src/application/vite/vite.ts` for the package-owned Vite policy, then copy the
controlled resolver/build pattern in adjacent `vite.test.ts` when adding another module-identity
regression. Update the adjacent README for any behavior visible to Vite-config consumers.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-07-16T22:32+02:00 | S0 | baseline | Verified branch HEAD and remote PR base are both `0daa575b`; worktree started clean. |
| 2026-07-16T22:35+02:00 | S0 | issue | Read issue #782 and all comments (none) through GitHub REST using `resolveGithubToken()`. |
| 2026-07-16T22:39+02:00 | S0 | reproduction | Existing focused suite passed 7/7. A simulated `preact/hooks` resolution returned `null` with `delegatedResolverCalled: false` for `C:\\...\\hooks.module.js`. |
| 2026-07-16T22:41+02:00 | S0 | consumer evidence | Read linked eis-chat PR #150 and isolated its proven Vite-config workaround. |
| 2026-07-16T22:43+02:00 | S0 | design checkpoint | Locked Preact-only delegated normalization, metadata preservation, regression shape, and gates before implementation edits. |
| 2026-07-16T22:55+02:00 | S1 | regression red | Added config, delegated-resolution, and production-build coverage. Unchanged code failed 3 tests: missing dedupe, missing delegated resolution, and missing merged Preact dedupe. |
| 2026-07-16T22:58+02:00 | S1 | implementation | Added package-owned Preact dedupe, alias-first delegated normalization, and adjacent Windows identity documentation. |
| 2026-07-16T23:00+02:00 | S1 | focused green | Focused Vite suite passed 9/9, including bare/subpath/npm forms, metadata, regex boundary, merged config, and one hooks patch. |
| 2026-07-16T23:02+02:00 | S1 | package runtime | Full Fresh suite passed 199/199. |
| 2026-07-16T23:06+02:00 | S1 | static and fitness gates | Scoped wrappers passed; root architecture and publish gates passed; baseline quality/doc findings were attributed and scoped changed surfaces remained clean. |
| 2026-07-16T23:09+02:00 | S1 | reconcile | Issue #782 remains open on beta.10; draft PR #789 has the required base, labels, and milestone. No evaluator/review comments arrived; closing keyword remains correct for full resolution. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Preact-only normalization | Proven fix without risk to unrelated Vite ID namespaces | issue #782 + consumer PR #150 |
| Vite `normalizePath()` | Upstream primitive is the canonical implementation | doctrine A7 + Vite API |
| Production build fixture at resolver layer | Reproduces Rollup string identity cross-platform and tests the owning framework layer | issue acceptance + plan D6 |
| Supervisor owns evaluations | Explicit owner constraint; generator must not self-certify | user directive + harness separation invariant |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| Current Codex thread is not present in daemon-managed runtime status | minor | yes |
| Evaluator dispatch is supervisor-owned instead of performed by this session | minor | yes |
| Linux Vite normalized the controlled backslash ID before load even on pre-fix code; the direct resolver simulation is the deterministic red test while the build fixture remains native-Windows-sensitive | minor | yes |
| Repository-wide quality and Fresh doc-lint report unrelated baseline findings | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| ---- | ---------------- | ------ | ----- |
| Baseline focused test | `deno test --allow-all packages/fresh/src/application/vite/vite.test.ts` | PASS | 7 passed, 0 failed before implementation. |
| Scoped check | `.llm/tools/run-deno-check.ts --root packages/fresh --ext ts,tsx` | PASS | 164 files, 2 batches, 0 findings. |
| Scoped lint | `.llm/tools/run-deno-lint.ts --root packages/fresh --ext ts,tsx` | PASS | 164 files, 0 findings. |
| Scoped format | `.llm/tools/run-deno-fmt.ts --root packages/fresh --ext ts,tsx` | PASS | 164 files, 0 findings. |
| Doc lint | `deno task doc:lint --root packages/fresh --pretty` | DEBT_ACCEPTED | Exit 0; `./vite` has 0 findings. All 25 findings are in untouched route `_internal/contract-types.ts`, tracked in doctrine file 10. |
| Publish dry-run | package `deno task publish:dry-run` | PASS | `@netscript/fresh@0.0.1-beta.9` dry-run complete. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| Repository `quality:scan` | FAIL_BASELINE | exact required command | Two findings in untouched `plugins/streams/services/src/proxy.ts` and `plugins/triggers/streams/producer.ts`; both files are byte-identical to baseline for this branch. |
| Scoped `quality:scan` | PASS | `deno task quality:scan --root packages/fresh/src/application/vite` | 0 findings, 0 allowances. Added-line scan also found no `any`, double cast, lint ignore, or TypeScript suppression. |
| `arch:check` | PASS | exact required command | Exit 0; emitted unrelated dependency/doctrine warnings only. |
| Fresh doctrine scan | PASS | `check-doctrine.ts --root packages/fresh` | 0 failures; 3 existing warnings and 1 info outside changed files. |
| Archetype 4 manual review | PASS | research + plan + diff review | No new surface, port, folder, suppression, or debt. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| Pre-fix module identity | FAIL (expected reproduction) | `result: null`, `delegatedResolverCalled: false` | Confirms owner-layer gap before edits. |
| Delegated Preact resolver | PASS | focused test | All four Preact forms normalize, preserve metadata, and use `skipSelf`; similarly prefixed package excluded. |
| Vite production module graph | PASS | focused build fixture | User + NetScript dedupe merge; direct + peer hooks imports produce `[1,1]` patch counts and one canonical loaded ID. |
| Full Fresh suite | PASS | package test task | 199 passed, 0 failed. |
| Full scaffold runtime | N/A | plan non-scope | Scaffold output/runtime wiring unchanged. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| -------- | ------ | -------- | ----- |
| Existing `@app` alias resolution | PASS | existing focused test | Must remain green. |
| eis-chat consumer workaround | PASS (external evidence) | merged PR #150 | Provides the proven policy mirrored at framework layer. |
| Vite config merge | PASS | production fixture `configResolved` | Retains `consumer-package` and adds `preact` dedupe. |

## Handoff Notes

- Evaluator should inspect `resolveId` ordering, `skipSelf`, metadata preservation, Preact regex
  boundaries, and the red/green focused evidence first. On Linux, Vite core normalized the fixture's
  controlled backslash ID even before the fix; native Windows is the authoritative build-host proof.
- This session will stop at `status:impl-eval`; it will not write evaluator verdicts or mark ready.
