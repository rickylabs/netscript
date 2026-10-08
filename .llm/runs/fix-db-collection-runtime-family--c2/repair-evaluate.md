# Independent IMPL-EVAL — PR #2089 Main Integration Evaluation

## Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-db-collection-runtime-family--c2` |
| Target | Issue #2039 / PR #2089, branch `fix/db-collection-runtime-family` |
| Archetype | `ARCHETYPE-2-integration` (`packages/sdk` + `packages/fresh`) with `packages/cli` scaffold catalog overlay |
| Scope overlays | `SCOPE-frontend` (Fresh live-query and StreamDB surface) |
| Evaluator Route | Authorized Google fallback (`gemini-3.8-flash-high` / Google Gemini family); invoked after primary evaluator (`opencode-go/glm-5.3-flash max`) produced no verdict in bounded three-minute run. |
| Evaluator Session | Independent evaluator session; vendor and session separation strictly satisfied (Google Gemini evaluator vs OpenAI `gpt-6.1-sol high` generator). No delegation. |
| Brief | `2089-eval-brief.md` |

### Evaluated Git Identities

- **Exact Evaluated HEAD (full SHA):**
  ```
  9b25aea44e5c00a40221b7a8f1a7dbc851f96efb
  ```
- **Reviewed PR Baseline:**
  ```
  a60a839668efd4b6b9cb7d4d47f5ebf4aef4e94b
  ```
- **Merged Main:**
  ```
  102f40e92501bb9e500c4a2cbc615604f134194e
  ```
- **Merge Commit:**
  `9ca0f90b35e9f86da61b6aeac3d8b1c6c48996b7` (parents: baseline `a60a839668...` and main `102f40e925...`)

---

## Scope & Plan-Gate Adjudication

The integration deterministicly reconciles two reviewed, passing contracts:
1. Current `main` (`102f40e92501bb9e500c4a2cbc615604f134194e`): StreamDB bounded checkpoint recovery, lazy preload, reconnect status, stop/dispose cancellation semantics, and desktop RPC document reload reconnect.
2. Reviewed PR #2089 baseline (`a60a839668efd4b6b9cb7d4d47f5ebf4aef4e94b`): Exact TanStack DB Collection family pins (`@tanstack/db` 0.6.17, `@tanstack/query-db-collection` 1.2.1, `@tanstack/react-db` 0.1.95, `@durable-streams/state` 0.3.1), strict cold dependency guard (`check-db-alignment.ts`), worker-stream / Fresh / SDK query collection identity tests, and browser hydration qualification.

**PLAN-EVAL: N/A** is justified and recorded: the merge performs mechanical, deterministic reconciliation of existing reviewed interfaces without introducing new architecture, public policy, or contract departures.

No source, dependencies, branch refs, commits, or public operations were altered during this evaluation.

---

## Semantic Preservation Proof

### 1. Source Integration (`create-stream-db.ts` & StreamDB Engine)

- **`packages/fresh/src/runtime/streams/create-stream-db.ts`:**
  - Main's complete implementation is preserved intact: lazy `preload()`, `status` getter, finite exponential backoff reconnect adapter, and `stop()` / `dispose()` cancellation hooks.
  - The PR's native consumer requirement is satisfied by exposing the documented optional interface member `readonly close?: () => void;` and aliasing `close: stop` on the returned handle.
  - This preserves the PR's native consumer hook while routing through main's existing, verified `stop` cancellation and checkpoint shutdown path, introducing zero duplicate state or divergence.
- **`packages/fresh/src/runtime/streams/create-stream-db_test.ts`:**
  - Preserves main's full test suite:
    - Persistent stream recovery without replay (`createNetScriptStreamDB recovers after the persistent stream server is killed without replay`).
    - Immediate stop and dispose settling pending preload on healthy server (`createNetScriptStreamDB immediate stop and dispose settle pending preload on a healthy server`).
    - Stop settling concurrent preloads while response headers are pending (`createNetScriptStreamDB stop settles concurrent preloads while response headers are pending`).
  - Preserves PR #2089's unique integration test:
    - `default worker stream Collection enters the actual Fresh adapter and SDK query family` (verifies BaseQueryBuilder, SDK Collection constructor identity, preload, and close lifecycle).
- **`packages/fresh/src/runtime/streams/stream-db-recovery-adapter.ts` & `stream-db-recovery-adapter_test.ts`:**
  - Preserved intact; all 9 unit tests pass without regressions.

### 2. Documentation and Manifests Integration

- **`packages/fresh/README.md` & `packages/sdk/README.md`:**
  - Both appended documentation blocks are retained: `Supported Collection runtime` (exact DB pins, coordinated release requirements, `deps:check:db` guard description) and `StreamDB recovery` (finite backoff, status lifecycle, stop/dispose idempotency) alongside main's `Desktop RPC` document reload guidance.
- **`packages/fresh/deno.json`:**
  - Retains both the browser regression task (`test:browser` including `./tests/db-collection_browser.ts`) and main's desktop reload task (`test:desktop-reload-native`).
  - Contains exact dependency pin `@tanstack/react-db: 0.1.95`.
- **`packages/sdk/deno.json`:**
  - Retains exact dependency pins `@tanstack/db: 0.6.17` and `@tanstack/query-db-collection: 1.2.1`.
- **`packages/cli/src/kernel/constants/scaffold/scaffold-app-catalog.ts`:**
  - Retains exact scalar constants aligned to the D1 family (`TANSTACK_DB: '0.6.17'`, `TANSTACK_QUERY_DB_COLLECTION: '1.2.1'`, `TANSTACK_REACT_DB: '0.1.95'`).
- **Root `deno.json`:**
  - Catalog retains exact pins for `@tanstack/db: 0.6.17`, `@tanstack/query-db-collection: 1.2.1`, `@tanstack/react-db: 0.1.95`.
  - Task `deps:check` chains `deps:check:db`. Task `deps:check:db` runs `.llm/tools/deps/check-db-alignment.ts`.

### 3. Semantic Lock Preservation

Both lockfiles were compared via independent structured JSON inspection against `main` (`102f40e92501bb9e500c4a2cbc615604f134194e`):

| Lockfile | Section | Main Count | Current Count | Main Records Preserved | Semantic Delta |
| --- | --- | --- | --- | --- | --- |
| `deno.lock` | `npm` | 570 | 570 | **True** (100% byte-identical) | 0 added / 0 removed / 0 modified |
| `deno.lock` | `jsr` | 63 | 63 | **True** (100% byte-identical) | 0 added / 0 removed / 0 modified |
| `deno.lock` | `remote` | 14 | 14 | **True** (100% byte-identical) | 0 added / 0 removed / 0 modified |
| `deno.lock` | `specifiers` | 190 | 193 | **True** (100% preserved) | +3 exact DB alias specifiers |
| `deno.lock` | `workspace` | 37 members | 37 members | **True** (all preserved) | Owning workspace catalog entries updated to exact pins |
| `packages/fresh-ui/deno.lock` | `npm` | 511 | 511 | **True** (100% byte-identical) | 0 added / 0 removed / 0 modified |
| `packages/fresh-ui/deno.lock` | `jsr` | 55 | 55 | **True** (100% byte-identical) | 0 added / 0 removed / 0 modified |
| `packages/fresh-ui/deno.lock` | `remote` | 0 | 0 | **True** | 0 added / 0 removed / 0 modified |
| `packages/fresh-ui/deno.lock` | `specifiers` | 154 | 157 | **True** (100% preserved) | +3 exact DB alias specifiers |

- Every resolved version and peer identity (including React 19.2.8, BetterAuth, and TypeScript 7.0.2) is unchanged.
- Native lock resolver peer rewrites were discarded in favor of exact graph preservation.
- Corroborates `2089-lock-preservation.json`.

### 4. Canonical Asset Generation Commits

The four asset generation commits follow the required sequential commit trail:
1. `cdeae51cf`: `chore(assets): regenerate agent-docs-prose after main integration` — Canonical generator exited 0; no generated diff; worklog recorded.
2. `940bb48e0`: `chore(assets): regenerate assets-barrel after main integration` — Canonical generator exited 0; no generated diff; worklog recorded.
3. `139bd8cd6`: `chore(assets): regenerate publish-assets after main integration` — Canonical generator exited 0; no generated diff; worklog recorded.
4. `45443dc99`: `chore(assets): regenerate mcp-export-corpus after main integration` — Canonical generator exited 0; updated `packages/mcp/src/export-surfaces/export-surface-corpus.generated.ts` with updated provenance (`sha256: ab54b4091242ebe3d1668bc7d9ae886325366a52879efdbb5ba7bac19a3cd419`).

No hand edits or budget bypasses were detected.

---

## Independent Raw Gate Results

The evaluator independently executed live runs at exact HEAD `9b25aea44e5c00a40221b7a8f1a7dbc851f96efb` to corroborate private generator evidence (`2089-gate-results.json`, `2089-extra-results.json`, `2089-*.log`):

| Gate / Command | Raw Exit Code | Live Result Summary | Corroborated Evidence File |
| --- | --- | --- | --- |
| `deps:check` | `0` | PASS; scans pass, zod-alignment PASS, `deps:check:db` chained | `2089-extra-results.json` |
| `deps:check:db` | `0` | PASS; sdk-fresh + fresh-only both resolve single `@tanstack/db@0.6.17_typescript@7.0.2` | `2089-extra-results.json`, `2089-deps-db.log` |
| `deno install --frozen` | `0` | PASS; lockfile clean and frozen | `2089-extra-results.json`, `2089-install-frozen.log` |
| Streams Suite (`packages/fresh/src/runtime/streams`) | `0` | **15 passed, 0 failed, 0 ignored** | `2089-streams.log` |
| PR Tests (`check-db-alignment_test.ts`, `scaffold-app-catalog_test.ts`, `generators-config_test.ts`) | `0` | **5 passed (19 steps / 24 total assertions), 0 failed** | `2089-pr-tests.log` |
| Carrier Tests (`.llm/tools/generate-publish-assets_test.ts`, etc.) | `0` | **21 passed, 0 failed, 0 ignored** | `2089-carrier-tests.log` |
| Fresh UI Frozen Check (`packages/fresh-ui`) | `0` | 150 files selected, 2 batches, 0 failed batches, 0 diagnostics | `2089-ui-frozen.log` |
| Fresh UI Frozen Tests (`packages/fresh-ui`) | `0` | **172 passed, 0 failed** | `2089-ui-tests.log` |
| Owning Frozen Check (`packages/sdk`, `packages/fresh`) | `0` | 341 files selected, 3 batches, 0 failed batches, 0 diagnostics | `2089-owning-check.log` |
| Scoped Check (amended & changed PR files) | `0` | 6 files selected, 1 batch, 0 diagnostics | `2089-check.log` |
| Scoped Lint (amended & changed PR files) | `0` | 6 files processed, 0 occurrences, 0 rule violations | `2089-lint.log` |
| Scoped Fmt (amended & changed PR files) | `0` | 6 files checked, 0 findings | `2089-fmt.log` |
| Full SDK + Fresh Test Suites | `0` | **542 passed, 0 failed, 0 ignored** | `2089-tests.log` |
| `quality:gate` | `0` | PASS; pre-existing legacy WARNs only | `2089-quality-gate.log`, `2089-quality-gate-receipt.json` |
| JSR Audit: Fresh | `0` | PASS (dry-run OK, slowTypeWarnings=1, 2 pre-existing WARNs) | `2089-gate-results.json` |
| JSR Audit: SDK | `0` | PASS (dry-run OK, slowTypeWarnings=1, 2 pre-existing WARNs) | `2089-gate-results.json` |
| JSR Audit: MCP | `0` | PASS (dry-run OK, slowTypeWarnings=1, 3 pre-existing WARNs) | `2089-gate-results.json` |
| Publish Dry-Run: Fresh | `0` | PASS (`Success Dry run complete`) | `2089-publish-fresh.log` |
| Publish Dry-Run: SDK | `0` | PASS (`Success Dry run complete`) | `2089-publish-sdk.log` |
| Publish Dry-Run: MCP | `0` | PASS (`Success Dry run complete`) | `2089-publish-mcp.log` |
| Production Browser (`db-collection_browser.ts`) | `0` (retained `1` raw preflight) | **1 passed, 0 failed, 0 ignored** (SSR, hydration, 2 worker stream updates, 2 viewport sizes, teardown 0 subscribers, 0 browser errors); initial environment sandbox failure honestly retained. Source unchanged. | `2089-browser.log`, `2089-browser-sandbox-failure.log` |

---

## Documentation Debt Adjudication

In accordance with harness rules, raw documentation lint failures are **not marked green**. The evaluator independently ran `doc:lint` across the packages and compared each entrypoint and diagnostic type against the accepted baselines (`db-doc-baseline-2039`, `desktop-doc-baseline-2041`, and `chat-send-doc-baseline-2068` in `.llm/harness/debt/arch-debt.md`):

| Package | Raw Exit Code | Diagnostic Counts | Status in Registry | Corroboration & Verdict |
| --- | --- | --- | --- | --- |
| `packages/fresh` | `1` | 45 total (28 privateTypeRef, 17 missingJSDoc, 0 other). Streams entrypoint: 11 privateTypeRef, 0 missing. | `db-doc-baseline-2039` (DEBT_ACCEPTED) | Byte-for-byte identical to baseline. Zero new diagnostics introduced. |
| `packages/sdk` | `1` | 3 total (3 privateTypeRef, 0 missingJSDoc, 0 other). Pre-existing individual entrypoint failures. | `db-doc-baseline-2039` (DEBT_ACCEPTED) | Byte-for-byte identical to baseline. Zero new diagnostics introduced. |
| `packages/mcp` | `1` (wrapper) | Combined 0, but `cli.ts` (3 private) and `mod.ts` (3 private) exit 1 each. | `desktop-doc-baseline-2041` / `chat-send-doc-baseline-2068` (DEBT_ACCEPTED) | Byte-for-byte identical to baseline. Zero new diagnostics introduced. |

**Adjudication:** `DEBT_ACCEPTED`. No new documentation debt or interface regressions were introduced.

---

## Release & Merge Readiness Boundaries

1. **Owner Release Gate:** Coordinated publication of the fixed SDK and Fresh packages, as well as downstream verification of the published consumer without local overrides, remains an owner release gate. Source-level qualification does not substitute for publication.
2. **Core CI Gate:** Core CI qualification at the final head remains the owner gate.

---

## Privacy & Resource Hygiene

- No operator paths, hostnames, IP addresses, network ports, access tokens, or private session identifiers are contained in this evaluation report.
- All evidence citations reference repository-relative paths and artifacts by filename.
- Working copy state: Clean (`git status --porcelain` shows only the generator's pre-existing unstaged evaluator-fallback note in `drift.md` and this evaluation report). No source files or dependencies were modified.

---

## Verdict

| Field | Value |
| --- | --- |
| **Verdict** | **PASS** |
| Exact Evaluated HEAD | `9b25aea44e5c00a40221b7a8f1a7dbc851f96efb` |
| Reviewed Baseline | `a60a839668efd4b6b9cb7d4d47f5ebf4aef4e94b` |
| Merged Main | `102f40e92501bb9e500c4a2cbc615604f134194e` |
| Model / Family | Authorized Google fallback (`gemini-3.8-flash-high` / Google Gemini family) |
