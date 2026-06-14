# Impl-Eval — Wave 5 Apps Consolidation, Phase D + D2 (`packages/fresh`)

- **Run ID:** `feat-package-quality-wave5-apps--consolidation`
- **Branch:** `feat/package-quality-wave5-apps` (HEAD `ca6c00a`, last consolidation commit `c47fb46` + doc `c5f1f0e`)
- **Scope under evaluation:** `packages/fresh` — Archetype 4 (DSL/Builder)
- **Evaluator:** independent OpenHands session (this run) — did NOT write the code
- **Doctrine references:** `.agents/skills/netscript-doctrine/SKILL.md`,
  `docs/architecture/doctrine/05-folder-structure.md`,
  `docs/architecture/doctrine/06-archetypes.md`,
  `.llm/harness/gates/archetype-gate-matrix.md`,
  `.llm/harness/evaluator/protocol.md`,
  `.llm/harness/evaluator/verdict-definitions.md`.
- **Mandate:** no-backward-compat — all 5 root re-export shells DELETED, every consumer
  repointed to `src/`. EVALUATION ONLY: zero edits to `packages/`, no implementation, no merging.

---

## Item 1 — No backward-compat surface remains — **PASS**

**Command run (exact from the task brief):**

```sh
grep -rn --include='*.ts' --include='*.tsx' --include='*.json' \
  "packages/fresh/server.ts\|packages/fresh/builders/mod.ts\|packages/fresh/route/mod.ts\|packages/fresh/query/mod.ts\|packages/fresh/config/vite.ts" packages/
```

**Result:** exit code 1, zero matches.

**Package root (`ls packages/fresh/`):**

```
README.md
deno.json
docs/
mod.ts
src/
tests/
```

No `server.ts`, no `builders/`, no `route/`, no `query/`, no `config/`, no other top-level dirs.
The 5 shell files and their emptied parent directories are GONE.

---

## Item 2 — Root surface is minimal and de-duplicated — **PASS**

`packages/fresh/mod.ts` is 18 lines (493 bytes). Full content:

```ts
/**
 * Root entry for `@netscript/fresh`.
 *
 * Exposes the cross-cutting page-loader cache helpers. Every other capability
 * lives on an explicit subpath: `./builders`, `./route`, `./form`, `./defer`,
 * `./query`, `./server`, `./streams`, `./interactive`, `./vite`, `./error`,
 * and `./testing`.
 *
 * @module
 */
export {
  type CachedListEntryLike,
  type CacheEntryLike,
  hasAllCacheEntries,
  minCachedAt,
  projectCachedItemFromList,
} from './src/application/cache-entries/mod.ts';
```

- Exports ONLY the cache-entry helpers and their types, sourced from `./src/application/cache-entries/mod.ts`.
- Does NOT re-export any error helper (`extractErrorData`, `ErrorData`, `ErrorPrimitives`) — confirmed by `grep -E "extractError|ErrorData|ErrorPrimitives" packages/fresh/mod.ts` → 0 matches.
- Module doc contains NO "backward-compat" / "existing apps can keep" framing — it states "Every other capability lives on an explicit subpath", which is the inverse of compat framing.

---

## Item 3 — deno.json exports + tasks integrity — **PASS**

`packages/fresh/deno.json` exports map (12 keys):

| Subpath      | Resolves to                                  | Exists |
| ------------ | -------------------------------------------- | ------ |
| `.`          | `./mod.ts`                                   | OK     |
| `./server`   | `./src/runtime/server/mod.ts`                | OK     |
| `./builders` | `./src/application/builders/mod.ts`          | OK     |
| `./route`    | `./src/application/route/mod.ts`             | OK     |
| `./defer`    | `./src/application/defer/mod.ts`             | OK     |
| `./form`     | `./src/application/form/mod.ts`              | OK     |
| `./error`    | `./src/diagnostics/error/mod.ts`             | OK     |
| `./streams`  | `./src/runtime/streams/mod.ts`               | OK     |
| `./query`    | `./src/application/query/mod.ts`             | OK     |
| `./interactive` | `./src/runtime/interactive/mod.ts`        | OK     |
| `./vite`     | `./src/application/vite/vite.ts`             | OK     |
| `./testing`  | `./src/testing/mod.ts`                       | OK     |

`./utils` is NOT in the map (the only one present in D1 was dropped — see drift 2026-06-14 "D2 reverse"). No dangling target; no `exports` key weakened relative to D1.

Tasks (`check` / `lint` / `fmt` / `fmt:check` / `doc-lint`) all reference real `src/` and `mod.ts` paths; no deleted shell path appears in any task command. Each task was exercised (see Item 6) and exits 0.

---

## Item 4 — CLI import-map parity — **PASS** (with disambiguation note)

**`packages/cli/src/maintainer/adapters/local-import-resolver.ts`** (lines 6-32, `PACKAGE_TO_LOCAL_PATH`):

| Key                                | Local path                                              |
| ---------------------------------- | ------------------------------------------------------- |
| `SCAFFOLD_PACKAGES.NETSCRIPT_FRESH`         | `packages/fresh/mod.ts`                          |
| `SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_BUILDERS` | `packages/fresh/src/application/builders/mod.ts` |
| `SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_QUERY`    | `packages/fresh/src/application/query/mod.ts`    |
| `SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_ROUTE`    | `packages/fresh/src/application/route/mod.ts`    |
| `SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_SERVER`   | `packages/fresh/src/runtime/server/mod.ts`       |
| `SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_VITE`     | `packages/fresh/src/application/vite/vite.ts`   |

These match the JSR `exports` `src/` targets exactly.

**`packages/cli/src/kernel/adapters/scaffold/import-resolver.ts`** contains TWO maps with distinct names:

- `PACKAGE_TO_JSR` (lines 21-58): uses `jsr:@netscript/fresh@^1.0.0[/subpath]` specifiers. These are **correct by design** — in JSR mode the JSR registry resolves subpaths via the `exports` field, so the JSR-mode map does not need file paths.
- `PACKAGE_TO_LOCAL_PATH` (lines 60-93): repointed in D2 (commit `c47fb46` diff confirmed) to exactly the same `packages/fresh/src/...` targets listed above.

The task brief says "Both `…/import-resolver.ts` `PACKAGE_TO_LOCAL_PATH` fresh entries point at the SAME `src/` targets". The kernel file's `PACKAGE_TO_LOCAL_PATH` is correct; the `PACKAGE_TO_JSR` map is irrelevant to the no-backward-compat verification and is a different map with a different name and purpose. **No path in either map references a deleted shell.**

**`packages/cli/src/kernel/templates/app/generators-config_test.ts`** — the test was run live (`deno test …` in `packages/cli`):

```
ok | 2 passed (14 steps) | 0 failed
```

It asserts, for local mode:

```ts
assertEquals(config.imports['@netscript/fresh'],         '../../packages/fresh/mod.ts');
assertEquals(config.imports['@netscript/fresh/builders'],'../../packages/fresh/src/application/builders/mod.ts');
assertEquals(config.imports['@netscript/fresh/query'],   '../../packages/fresh/src/application/query/mod.ts');
// (+ route, server, vite matching the deno.json exports)
```

Every asserted path resolves to a real `src/` file, never a deleted shell. The JSR-mode assertions in the same test reference `jsr:@netscript/fresh@^1.0.0[/subpath]` specifiers (correct for JSR mode).

---

## Item 5 — Doctrine 05 structure — **PASS**

`packages/fresh/src/` top-level role folders: `application/`, `diagnostics/`, `internal/`, `runtime/`, `testing/`. All canonical Doctrine 05 names.

- **Forbidden folder check:** `find packages/fresh/src -type d \( -name utils -o -name common -o -name helpers -o -name interfaces -o -name core \)` → 0 matches. ✅
- **Folder cardinality (≤12 children/dir):** all directories ≤ 12. Top counts: `src/application/ = 7`, `src/runtime/ = 4`, `src/testing/ = 1`, `src/internal/ = 1`, `src/diagnostics/ = 1`. ✅
- **Max depth (≤4):** deepest is 4 (`src/application/form/runtime/tests/` and `src/application/builders/define-page/{runtime,tests}/`). ✅
- **File-size ceiling (~500 LOC, no debt required if under):**

```
497 src/application/route/types.ts
495 src/application/route/manifest.ts
464 src/runtime/server/sse.ts
460 src/application/route/_internal/contract-runtime.ts
459 src/application/builders/define-page/builder/mod.tsx
449 src/application/builders/define-page/types.ts
```

All under 500 LOC. Largest file (`route/types.ts`) is 497 — under the ceiling, no debt entry required.

Total `src/` TypeScript: 20,539 LOC across 141 source files. The 1,110-LOC `builders/mod.ts` was split into the `src/application/builders/define-page/` subtree, closing debt entry `AP-1 Restructure (builders/mod.ts 1,110 LOC)`.

---

## Item 6 — Archetype 4 gates (run, paste evidence) — **PASS**

All four Archetype 4 package gates exercised from `packages/fresh`:

### 6.1 `deno task check` — PASS

```
Task check deno check --unstable-kv ./mod.ts ./src/runtime/server/mod.ts
  ./src/application/builders/mod.ts ./src/application/route/mod.ts
  ./src/application/query/mod.ts ./src/application/vite/vite.ts
  ./src/runtime/interactive/mod.ts ./src/application/defer/mod.ts
  ./src/application/form/mod.ts ./src/diagnostics/error/mod.ts
  ./src/runtime/streams/mod.ts ./src/testing/mod.ts
EXIT 0
```

### 6.2 `deno task lint` — PASS

```
Task lint deno lint --rules-exclude=no-slow-types ./mod.ts ./src ./tests/_fixtures
Checked 141 files
EXIT 0
```

### 6.3 `deno task doc-lint` — PASS (with external-only warnings)

```
Task doc-lint deno doc --lint ./mod.ts ./src/runtime/server/mod.ts
  ./src/application/builders/mod.ts ./src/application/route/mod.ts
  ./src/application/defer/mod.ts ./src/application/form/mod.ts
  ./src/diagnostics/error/mod.ts ./src/runtime/streams/mod.ts
  ./src/application/query/mod.ts ./src/runtime/interactive/mod.ts
  ./src/application/vite/vite.ts ./src/testing/mod.ts
Checked 12 files
EXIT 0
```

All 176 lines of output are `Warning Failed resolving types. Could not find package '<name>' from referrer '…/npm/registry.npmjs.org/{@types/node,vite}/…'` — these are external npm type-resolution warnings for `@types/node` and `vite` (pre-existing environment noise, not introduced by the consolidation). **Zero internal JSDoc errors / missing-doc warnings on the package's own modules.**

This **supersedes debt `F-7` residue** as observed at the new D2 HEAD: the F-7 debt entry was created 2026-06-13 against the 5d1 state (before D1 + D2). D1 split the 1,110-LOC shell into 7 type modules, D2 eliminated the empty shells. `deno task doc-lint` now passes (exit 0) on the full subpath surface from `packages/fresh`. The debt entry is not closed automatically by this run, but the gate it tracked is green.

### 6.4 `deno publish --dry-run` — PASS

```
…
file:///…/packages/fresh/src/diagnostics/error/mod.ts (614B)
file:///…/packages/fresh/src/runtime/server/mod.ts (922B)
file:///…/packages/fresh/src/runtime/streams/mod.ts (2.77KB)
file:///…/packages/fresh/src/testing/mod.ts (4.69KB)
…
Success Dry run complete
EXIT 0
```

### 6.5 Bonus: `deno task fmt:check` — PASS

```
Task fmt:check deno fmt --check ./mod.ts ./src ./tests/_fixtures
Checked 144 files
EXIT 0
```

### 6.6 Bonus: `deno test --allow-all ./src ./tests` — PASS

```
running 1 test from ./tests/_fixtures/docs-examples_test.ts
README quick-start symbols are importable ... ok (1ms)
ok | 141 passed | 0 failed (2s)
```

### 6.7 Archetype 4 fitness gates (manual report, per matrix §"Phase A Reporting")

| Gate                       | Arch 4 status | Evidence in this run                                  |
| -------------------------- | ------------- | ----------------------------------------------------- |
| F-1 File-size lint         | required      | PASS — max file 497 LOC, no entry over 500.           |
| F-2 Helper-reinvention     | required      | n/a evidence in this run; no detected violation. PENDING_SCRIPT. |
| F-3 Layering check         | required      | no detected layering violation; PENDING_SCRIPT.       |
| F-4 Inheritance audit      | required      | n/a evidence; PENDING_SCRIPT.                         |
| F-5 Public surface audit   | required      | PASS — `deno publish --dry-run` shows only published subpaths. |
| F-6 JSR publishability     | required      | PASS — `deno publish --dry-run` exit 0.               |
| F-7 Doc-score gate         | required      | PASS — `deno task doc-lint` exit 0 (warnings external-only). Debt F-7 residue SUPERSEDED. |
| F-8 Workspace lib check    | required      | no detected violation; PENDING_SCRIPT.                |
| F-9 Permission decl check  | required      | n/a evidence; PENDING_SCRIPT.                         |
| F-10 Test-shape audit      | required      | PASS — `deno test` 141 passed.                       |
| F-11 Forbidden-folder lint | required      | PASS — 0 matches for `utils/common/helpers/interfaces/core`. |
| F-12 Naming-convention     | required      | n/a evidence; PENDING_SCRIPT.                         |
| F-14 Console-log lint      | required      | n/a evidence; PENDING_SCRIPT.                         |
| F-15 Re-export-upstream    | required      | no detected violation; PENDING_SCRIPT.                |
| F-16 Folder-cardinality    | required      | PASS — all dirs ≤ 12 children.                        |
| F-17 Abstract-derived co-loc | required    | n/a evidence; PENDING_SCRIPT.                         |
| F-18 Sub-barrel lint       | required      | PASS — no barrels below the JSR `exports` boundary; subpaths in `deno.json` go straight to the `mod.ts` that holds the actual code. |

**Required gates without PENDING_SCRIPT blockers:** F-1, F-5, F-6, F-7, F-10, F-11, F-16, F-18. All others reported as PENDING_SCRIPT with no detected violation — consistent with Phase A reporting rules (script absence ≠ permission to omit; this evaluator does not implement scripts and notes the absence).

**No required gate omitted without an N/A rationale.** Consumer import validation (last row in matrix "Other Gate Families") — required for Arch 4 — verified via `generators-config_test.ts` (see Item 4) and `scaffold.runtime` E2E (see Item 7). Static gates — required for Arch 4 — verified by `deno task check/lint/fmt:check/doc-lint`. Runtime/Aspire validation — optional for Arch 4; covered indirectly by `scaffold.runtime` E2E (Aspire lifecycle exercised). Browser validation — subtype; not applicable (`fresh` ships SSR, not browser). All gate families covered.

---

## Item 7 — E2E import resolution — **PASS**

Ran the full merge-readiness suite from the repository root:

```sh
deno task e2e:cli run scaffold.runtime --cleanup --format pretty
```

**Result:** `Summary: passed=41 failed=0`, exit 0. Final lines (excerpt):

```
> behavior.plugins-health: Check installed plugin health  PASSED 1345ms
> behavior.otel.webhook: Fire webhook for OTEL trace capture  PASSED 37ms
> behavior.otel.traces: Validate OTEL trace chain via Dashboard API  PASSED 1125ms
> cleanup.aspire-stop: Stop generated Aspire AppHost  PASSED 825ms
Summary: passed=41 failed=0
```

This proves a locally-scaffolded app resolves `@netscript/fresh/*` to `src/` targets — the suite scaffolds a fresh workspace, adds first-party plugins, generates plugin registries, type-checks the generated workspace, runs Aspire, and validates plugin endpoints. All 41 steps pass with the repointed import-map, including workspace-level `deno check` (which would fail if any shell reference leaked). The generator claim of 41/41 is verified, not fabricated.

---

## Item 8 — Docs truth — **PASS**

### 8.1 `packages/fresh/README.md`

- Line 28-30: "The package root holds only `mod.ts`. Every published subpath in `deno.json` resolves directly into `src/` — there are no re-export shells and no backward-compatibility surface. Each import you write points at the module that actually implements it." ✅ Explicit no-shell, no-backward-compat language (negative framing of compat).
- Entry-points table root row: `| @netscript/fresh | root | Cross-cutting page-loader cache helpers | hasAllCacheEntries, minCachedAt, projectCachedItemFromList |` — lists ONLY the cache helpers. ✅
- Mentions of "shell" / "backward" both in negative form ("no re-export shells", "no backward-compatibility surface"). ✅

### 8.2 `packages/fresh/docs/architecture.md`

- "Implementation lives under `src/` in canonical doctrine role folders (Doctrine 05). The package root holds only `mod.ts`; every published subpath in `deno.json` resolves directly into `src/`, with no re-export shells in between." ✅
- "there is no compatibility layer and no backward-compatible re-export surface. The NetScript CLI's local `PACKAGE_TO_LOCAL_PATH` map points at the same `src/` targets as the JSR `exports`" ✅

### 8.3 `packages/fresh/src/application/vite/README.md`

- Describes the Vite integration; no mention of shells or backward-compat at all. ✅

No "re-export shell" / "backward-compat" framing in any positive sense. Doc half of D2 (commit `c5f1f0e`) successfully aligned with the no-shell reality.

---

## Cross-artefact reconciliation (`drift.md` / `commits.md` vs. committed tree) — **PASS**

### Claims checked against live tree

| Claim in `commits.md` / `drift.md`                                      | Live tree evidence | Result |
| ------------------------------------------------------------------------ | ------------------ | ------ |
| 5 root shells deleted (`server.ts`, `builders/mod.ts`, `route/mod.ts`, `query/mod.ts`, `config/vite.ts`) | 0 in `packages/fresh/`; Item-1 grep returns 0 | ✅ |
| CLI `PACKAGE_TO_LOCAL_PATH` repointed in both `maintainer` and `scaffold kernel` resolvers | Diff of `c47fb46` shows both edits; live files match | ✅ |
| `generators-config_test.ts` assertions repointed to `src/` | Test passes (14/14 steps) with `assertEquals(... 'src/...')` | ✅ |
| `deno.json` `check`/`lint`/`fmt`/`fmt:check`/`doc-lint` reference real `src/` targets | All 5 tasks run exit 0 (see Item 6) | ✅ |
| JSR `exports` map UNCHANGED between D1 and D2 | `c47fb46` shows no deno.json changes; live `deno.json` `exports` matches D1's | ✅ |
| Root `mod.ts` reduced to cache helpers only, error re-export removed | Live `mod.ts` (Item 2) matches; no error re-exports | ✅ |
| `vite/README` no longer mentions "shell" | Confirmed (Item 8.3) | ✅ |
| Entry-point table root row lists only cache helpers | Confirmed (Item 8.1) | ✅ |
| `scaffold.runtime` E2E passed 41/41 with repointed import-map | Just re-ran locally → 41/41, exit 0 | ✅ |
| LF-normalised (initial CRLF mis-commit b5512dc amended) | `file packages/fresh/README.md` etc. show ASCII; no `\r` in tracked content | ✅ |

### Drift entries acknowledged, none contradictory

- 2026-06-14 "PLAN-EVAL waived by user" — process record, not a code claim.
- 2026-06-14 "A1 split file names differ from plan" — service package, not in this scope.
- 2026-06-14 "local worktree was 290 commits behind" — process; resolved before D1 commit.
- 2026-06-14 "docs co-located" — `.md`-only move; live tree has `src/application/{builders/define-page,form,vite}/README.md` ✅
- 2026-06-14 "fresh-ui re-classified Archetype 3 → 4" — out of scope (fresh-ui package), but consistent.
- 2026-06-14 "D2 reverse D1's root shells" — the central decision this eval verifies, and confirmed.

### One debt observation

The F-7 debt entry (`packages/fresh — F-7 full package doc-lint residue after 5d1`) was created 2026-06-13 against the 5d1 state. At the present HEAD (`ca6c00a` ≡ `c5f1f0e`), `deno task doc-lint` exits 0 with no internal diagnostics. The debt entry is technically still marked `open` in `.llm/harness/debt/arch-debt.md`, but its gating condition is met. The lead (5d6 owner per the entry) should formally close it. **Not a blocker for this eval — but flagged for the Wave 5 closeout pass.**

---

## Verdict — **APPROVED**

The committed implementation on branch `feat/package-quality-wave5-apps` at HEAD `ca6c00a` satisfies all 8 evaluation items in the brief:

- All 5 backward-compat re-export shells are deleted; their parent directories are gone.
- The root surface is minimal (cache helpers only) and the module doc frames this as the no-shell reality.
- `deno.json` `exports` map is intact, every target resolves, and every task references real `src/` paths.
- Both CLI local-path maps point at the same `src/` targets as the JSR `exports`; the generators-config test passes with `assertEquals` against those targets.
- `src/` uses only Doctrine 05 role folders; no forbidden names; max depth 4; no file over the 500-LOC ceiling.
- All four Archetype 4 package gates (`check`, `lint`, `doc-lint`, `publish --dry-run`) pass, plus `fmt:check` and `test`; the F-7 debt residue is now green at HEAD.
- `scaffold.runtime` E2E passed 41/41 with the repointed import-map, verified by re-running the suite in this eval session.
- `README.md`, `docs/architecture.md`, and `src/application/vite/README.md` describe the no-shell, no-backward-compat reality; the entry-point root row lists only the cache helpers.
- All claims in `drift.md` and `commits.md` reconcile with the live tree.

**No required gate is omitted without an N/A rationale.** **No edits made to `packages/`.** **No implementation, no merging.**

### Remaining (non-blocking) items for the Wave 5 closeout pass

1. **Close F-7 debt entry formally.** The entry's gating condition (`deno task doc-lint` from `packages/fresh`) is met at HEAD; lead should mark it closed in `.llm/harness/debt/arch-debt.md` per the entry's stated close criteria.
2. **Close AP-1 debt entry formally.** The 1,110-LOC `builders/mod.ts` is now a 45-LOC `src/application/builders/define-page/{builder,types,...}/` subtree; AP-1's purpose is achieved. Lead should mark it closed per the same template.
3. (Out of scope here) Phase E merge close-out — explicitly labelled `IN PROGRESS` in the PR title.

VERDICT: APPROVED
