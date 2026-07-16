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

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| ---- | ---------------- | ------ | ----- |
| Baseline focused test | `deno test --allow-all packages/fresh/src/application/vite/vite.test.ts` | PASS | 7 passed, 0 failed before implementation. |
| Scoped check/lint/fmt | planned | NOT_RUN | S1 gate. |
| Doc lint | planned | NOT_RUN | S1 gate. |
| Publish dry-run | planned | NOT_RUN | S1 gate. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| `quality:scan` | NOT_RUN | planned | Required because S1 touches `packages/**`. |
| `arch:check` | NOT_RUN | planned | Required because S1 touches `packages/**`. |
| Archetype 4 manual review | PASS | research + plan | No new surface, port, folder, or debt. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| Pre-fix module identity | FAIL (expected reproduction) | `result: null`, `delegatedResolverCalled: false` | Confirms owner-layer gap before edits. |
| Vite production module graph | NOT_RUN | planned S1 fixture | Must fail red before implementation, then pass. |
| Full scaffold runtime | N/A | plan non-scope | Scaffold output/runtime wiring unchanged. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| -------- | ------ | -------- | ----- |
| Existing `@app` alias resolution | PASS | existing focused test | Must remain green. |
| eis-chat consumer workaround | PASS (external evidence) | merged PR #150 | Provides the proven policy mirrored at framework layer. |

## Handoff Notes

- Evaluator should inspect `resolveId` ordering, `skipSelf`, metadata preservation, Preact regex
  boundaries, and the red/green production fixture first.
- This session will stop at `status:impl-eval`; it will not write evaluator verdicts or mark ready.

