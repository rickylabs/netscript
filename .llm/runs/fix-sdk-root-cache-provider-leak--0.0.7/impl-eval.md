# IMPL-EVAL — cycle 1 — #1462 / PR #1758 — SDK root cache-provider leak

| Field            | Value                                                                                                                                                                                                           |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Evaluator        | Fresh native Claude Fable 5 session; opposite-family to the Codex `gpt-5.6-sol` author; separate from the fixes topic supervisor and both PLAN-EVAL sessions                                                    |
| Evaluator branch | `eval/impl-eval-1462-cycle-1` (this artifact is its only commit)                                                                                                                                                |
| Evaluated head   | `83b7109cf6a59edfb6e52a705e3753f742e85ca5` — supervisor Tier-A sign-off                                                                                                                                         |
| Head identity    | local `HEAD` == `origin/fix/sdk-root-cache-provider-leak` == PR #1758 `headRefOid` == `83b7109c`; tree clean                                                                                                    |
| Ancestry         | `1dd64dae` (product), `1ccddd6e`, `bfad0c15` (evidence), `13878a80` (base) all `merge-base --is-ancestor` of head; merge-base with `origin/main` == `13878a80`                                                  |
| Immutable base   | `origin/main` @ `13878a80a50c55b9662099fed64555f2310ae4a3`                                                                                                                                                      |
| Prior gates      | PLAN-EVAL c1 `FAIL_PLAN` @ `7c6ca56e` (on `origin/eval/plan-eval-1462-cycle-1`); PLAN-EVAL c2 `PASS_PLAN` @ `53fd529d` (on `origin/eval/plan-eval-1462-cycle-2`) — both branches present on `origin`            |
| Mode             | Read-only over source. No `e2e:cli`, Aspire, Docker, browser gate, or runtime lease. Base measurements taken in a detached throw-away worktree at `13878a80` under the job tmp dir; nothing there was committed |

## Verdict

**`PASS_IMPL`**

Every claim the implementation makes was reproduced on this host, including the two the brief asked
to be treated with suspicion (root purity beyond the tested paths; the graph assertion having no
red-state run of its own). Four low-severity findings are recorded; none blocks. No `FAIL_FIX`,
`FAIL_RESCOPE`, or `FAIL_DEBT` condition is present.

## Process gates (protocol rules 2, 3, 13)

| Rule                                   | Evidence                                                                                                                                                                                          | Result                                                           |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| PLAN-EVAL passed before implementation | `worklog.md` progress log: c1 `FAIL_PLAN` at `1bf9c567`, c2 `PASS_PLAN` at `9a0f5876`; S2 commit `ddf66a6f` is after `9a0f5876` in `git log 13878a80..HEAD`; both eval branches exist on `origin` | PASS                                                             |
| Design checkpoint in `worklog.md`      | `## Design` with public surface, vocabulary, ports/adapters/composition-root, constants, commit slices, deferred scope, contributor path                                                          | PASS                                                             |
| Slice review gate (A1)                 | `83b7109c` is the supervisor's sign-off commit; `worklog.md` "Supervisor Tier-A sign-off — bfad0c15" records independent re-derivation, incl. corrected finding T-1                               | PASS                                                             |
| `## SKILL` chapter in briefs           | This evaluator's brief carries one. The Codex implementation brief is not committed in the run dir (`implement.md` absent), so it is not verifiable from artifacts                                | N/A — not verifiable, noted                                      |
| Close-gate (rule 12)                   | PR is draft with `status:impl-eval`; not at `status:ready-merge`. Issue acceptance boxes are unticked, as the boundary requires at this phase                                                     | N/A at this phase (see F-3 for what must happen before the flip) |

## The central question: is every claim warranted by what is verified?

### Root is genuinely side-effect-free — CONFIRMED beyond the tested paths

- Static: `grep` over `packages/ plugins/` finds exactly one non-test `setCacheProvider(` call site
  at head — `packages/fresh/src/runtime/server/define-fresh-app.ts:88`, inside the function body. No
  bare `import '@netscript/sdk/cache'` remains in `packages/` or `plugins/` source (the one
  remaining emitter is the CLI scaffold template string — see F-4).
- Dynamic, at the **published specifier level** (the committed tests use file URLs, so this is
  additional coverage): a fresh `deno eval` child that imports `hasCacheProvider` from
  `@netscript/sdk/query`, then dynamically imports the entry, observed `false` for **all five** of
  `@netscript/sdk`, `@netscript/sdk/presets`, `@netscript/sdk/cache`, `@netscript/fresh/server`, and
  `@netscript/fresh`. The docs' new sentence "Importing `@netscript/fresh/server` alone is inert" is
  therefore true, even though the committed Fresh test imports `define-fresh-app.ts` by file URL
  rather than the subpath.

### `./presets` is genuinely browser-safe — CONFIRMED, with the predicate probed

Re-implemented the committed predicate over `deno info --json` (job-tmp `graph.ts`) and added two
stricter probes: the plan's original S2 contract (`cache-query.ts`, `kv-cache-store.ts`,
`@netscript/kv` anywhere in the module list) and a scan of every `file://` module for a `Deno.`
reference.

| Entry                                         | Tree            | Modules | Committed predicate | Plan-contract predicate | Notes                                                                                             |
| --------------------------------------------- | --------------- | ------- | ------------------- | ----------------------- | ------------------------------------------------------------------------------------------------- |
| `packages/sdk/mod.ts`                         | base `13878a80` | 147     | **19** unsafe       | 2 hits                  | KV package modules, 2 `node:async_hooks` edges, 5 logger modules — reproduces the supervisor's 19 |
| `packages/sdk/mod.ts`                         | head            | 89      | **0**               | **0**                   |                                                                                                   |
| `packages/sdk/src/presets/mod.ts`             | head            | 75      | **0**               | **0**                   |                                                                                                   |
| `packages/sdk/src/presets/define-services.ts` | base            | 71      | 0                   | 0                       | the preset file was already clean at base; the leak was root-only                                 |
| `packages/sdk/src/cache/mod.ts`               | head            | 107     | 19                  | 2 hits                  | server entry; expected — and proves the predicate still fires on a server graph at head           |

Can the committed predicate be satisfied while a server edge exists by another shape? The shapes I
could construct are: (a) the SDK's own `cache-query.ts` / `kv-cache-store.ts` being reachable
without the `@netscript/kv` dependency edge — impossible because `kv-cache-store.ts` carries a
literal `@netscript/kv` dependency and the predicate inspects `dependencies[].specifier` as well as
module specifiers; (b) a `Deno.*` runtime call reached at module top level. For (b), the `Deno.`
references in the preset graph are `discovery/kv-connection.ts`, `discovery/service-url.ts` (guarded
with `typeof Deno !== 'undefined'`), `telemetry/src/config/environment.ts`,
`telemetry/src/context/payload-context.ts` — all call-time, inside functions — plus
`ports/cache-store.ts` which is only `type CacheKey = Deno.KvKey`. The same four runtime files were
already in the base `define-services.ts` graph, so this is pre-existing shape, not something the
leaf introduced. The predicate does not catch call-time `Deno.env` reads, but nothing in #1462's
acceptance asks it to, and the intact-runtime child import proves load-time safety.

### Type-only compatibility exports are really type-only — CONFIRMED

`packages/sdk/mod.ts` restores `CachedEntry`/`CacheEntry` under `export type { … }`.
`deno doc packages/sdk/mod.ts` at head lists both as `interface`; the only cache-named **functions**
left on the root are `setCacheProvider`/`hasCacheProvider` (pure registry accessors from `./query`,
which the issue itself uses as the probe) and `createKvCachePersister` (query-client, browser-side).
`cacheQuery`, `CacheQuery`, and `KvCacheStore` are gone from the root. The head root graph has 0
unsafe edges, so no runtime edge came back with the types.

### `defineFreshApp()` registration holds; server module import stays inert — CONFIRMED

- `define-fresh-app.ts:88` calls `setCacheProvider(cacheQuery)` unconditionally as the first
  statement — before app construction, `preConfigure`, middleware, or the invalidation route — so no
  option path can skip it, and re-calling is idempotent for the default provider.
- `define-fresh-app.test.ts`: exit 0 · **11 passed / 0 failed** (structured wrapper). The new test
  resets in a fresh child, imports the server module dynamically, asserts `false`, calls
  `defineFreshApp()`, asserts `true` — matching the plan's "Fresh registration test contract"
  exactly (no static top-level import of the unit under test).
- Order dependence: see F-2 (low) — the only order-sensitivity is the reverse case, a custom
  provider registered _before_ `defineFreshApp()` is overwritten.

### The stated asymmetry (graph half never ran red at base) — RESOLVED by demonstration

At base, the committed test throws on the child assertion first (`observed true`, 0 passed / 1
failed — reproduced), so its graph loop indeed never executed there. To give the assertion its own
red state I ran a copy of the committed test with the child phase removed (graph loop only) in the
base worktree: **0 passed / 1 failed**, reporting `packages/kv/mod.ts`,
`packages/logger/config.ts -> node:async_hooks`, `node:async_hooks`, … for `packages/sdk/mod.ts`.
The predicate as committed does fire on the defect. The supervisor's measurement-based red-before
was adequate as evidence; it is now also test-demonstrated. (The variant was deleted; it is not part
of any commit.)

### Legacy/server behaviour unchanged — CONFIRMED

No cache algorithm file changed (`cache-query.ts` untouched; `kv-cache-store.ts` diff is one JSDoc
import line). Suites: `packages/sdk/tests/` exit 0 · **70 / 0**; `packages/sdk/src/cache/` provider
diagnostic test 1 / 0; `packages/fresh/src/runtime/server/` (incl.
`query-cache-invalidation.test.ts`) **17 / 0**.

## #1462 acceptance criteria — met by the code

| AC                                                                                                | Evidence                                                                                                                                                                           | Status                                                                                        |
| ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Browser/Vite import of the `defineServices` entry leaves `hasCacheProvider()` false               | Committed child test (root + presets) green at head; my five-specifier probe; PR-prohibited real Vite chunk execution replaced by the static graph measurement, as the plan locked | met (static + intact-runtime)                                                                 |
| Browser `queryOptions().queryFn()` calls an injected typed client and never loads `@netscript/kv` | `query-factory.ts` path selection is unchanged and keyed on `hasCacheProvider()`, which is now `false` on every browser entry; presets graph contains no `@netscript/kv` edge      | met                                                                                           |
| Production client chunks contain no server KV adapter                                             | Graph-level: 19 → 0 unsafe edges on root, 0 on presets. A real production Vite build was outside this leaf's boundary and mine; recorded, not laundered                            | met at graph level; bundle-level verification is a coordinator option, not a gap in this leaf |
| `defineFreshApp`/server bootstrap still registers the provider explicitly                         | `define-fresh-app.ts:88`; 11 / 0                                                                                                                                                   | met                                                                                           |
| Server cache miss/hit/invalidation tests remain green                                             | 70 / 0, 17 / 0, 1 / 0 above                                                                                                                                                        | met                                                                                           |

## Supervisor/author facts — reproduced or refuted

| Claim                                                                | My measurement                                                                                                                                                                     | Status                                  |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Root 19 → 0 unsafe edges; presets 0                                  | 19 (base) → 0 (head); presets 0                                                                                                                                                    | reproduced                              |
| SDK suite 70 / 0; `define-fresh-app.test.ts` 11 / 0                  | 70 / 0; 11 / 0                                                                                                                                                                     | reproduced                              |
| `deno.lock` byte-unchanged                                           | `git diff --stat 13878a80..HEAD -- deno.lock` empty                                                                                                                                | reproduced                              |
| SDK `doc:lint` baseline-red, 3 errors / 3 private refs at both trees | base and head: `totalErrors 3, totalPrivateTypeRef 3, missingJSDoc 0`, same three files; `./src/presets/mod.ts` entry 0 diagnostics                                                | reproduced                              |
| `surface:diff` 542 → 552, +10 entirely SDK (45 → 55)                 | base 542 / SDK rows 45; head 552 / SDK rows 55                                                                                                                                     | reproduced — T-1 correction is accurate |
| Workspace `publish:dry-run` exit 0                                   | exit 0, "Dry run complete" (the word "error" appears only in `diagnostics/error/*` filenames)                                                                                      | reproduced                              |
| SDK `deno publish --dry-run --allow-dirty` OK, 13 entries            | Success; JSR audit lists 13 exports incl. `./presets`, dry-run OK, 2 pre-existing warnings (F-DOCT-5 cardinality 13 > 12 — `src/` had 13 children at base too; F-JSR-7 slow types) | reproduced                              |
| `quality:scan`, `arch:check`, `docs:exports-drift` green             | `quality:scan` ok, 0 findings; `arch:check` exit 0 with only pre-existing DEPS-NPM-CATALOG warnings outside SDK/Fresh; exports-drift PASS                                          | reproduced                              |
| Scoped check/lint/fmt on the nine owned files                        | `deno check --unstable-kv` / `deno lint` / `deno fmt --check` over the 9 files: all clean                                                                                          | reproduced                              |
| Ceiling containment                                                  | `git diff --stat` base..head: 25 files, all inside the locked ceiling (sdk, fresh server, mcp generated, agent-docs assets, 4 site pages, run dir)                                 | reproduced                              |

Nothing in the supervisor's or author's record failed to reproduce.

## Findings

| ID  | Severity | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Where                                                                                                                  | Required action                                                                                                                               |
| --- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| F-1 | low      | The committed graph predicate differs from the plan's S2 contract and the PR body's DoD line. Plan/DoD name `cache-query.ts`, `kv-cache-store.ts`, `@netscript/kv`; the test rejects `/packages/kv/`, `jsr:@netscript/kv`, `node:`, `/packages/logger/` modules and `@netscript/kv`/`node:` dependency edges. The committed form is stricter on transitive server edges but does not name the two SDK files. Both predicates measure 0 at head, so this is a bookkeeping gap, not a coverage gap — but `drift.md` does not record the substitution. | `packages/sdk/tests/query/define-services-browser-import_test.ts:38-61`; `plan.md` "S2 red-test contract"; PR body DoD | Append a drift row naming the substituted predicate and why; optionally add the two file names to the predicate in a follow-up. Non-blocking. |
| F-2 | low      | `defineFreshApp()` calls `setCacheProvider(cacheQuery)` unconditionally and `setCacheProvider` replaces without a guard, so a custom provider registered _before_ `defineFreshApp()` is silently overwritten. Plan D5 locked this shape and PLAN-EVAL accepted it; no public doc describes a custom-provider path, and `server.md` now documents registration as bootstrap step 1. Recorded as a follow-up design note, not a defect against the plan.                                                                                              | `packages/fresh/src/runtime/server/define-fresh-app.ts:88`; `packages/sdk/src/cache/cache-provider.ts:200`             | Coordinator follow-up: either document "register custom providers after `defineFreshApp()`" or guard with `hasCacheProvider()`. Non-blocking. |
| F-3 | low      | PR #1758 body is stale relative to the head it carries: "This draft still contains plan artifacts only", slices S2–S4 unchecked, every DoD box unchecked, Validation lists only S1-era gates. The per-slice comments are accurate; the body is not.                                                                                                                                                                                                                                                                                                 | PR #1758 body                                                                                                          | Must be refreshed (slices, validation rows, DoD) before any draft→ready flip; `netscript-pr` body template. Non-blocking for this verdict.    |
| F-4 | low      | CLI scaffold still emits `import '@netscript/sdk/cache';` when `cache` is selected (`emitSelectedBackendImports`), and `write-app-files_test.ts` asserts on it. The import is now inert. Scaffolded `app/main.ts` calls `defineFreshApp` (embedded template), so generated apps keep caching; the plan explicitly deferred this cleanup.                                                                                                                                                                                                            | `packages/cli/src/kernel/application/scaffold/writers/write-app-files.ts:319`                                          | File a follow-up issue to drop the dead import and its test assertion. Non-blocking; outside this leaf's ceiling by design.                   |

Informational (no action): the preset graph reaches `discovery/kv-connection.ts`/`service-url.ts`
and two telemetry env readers that call `Deno.env` at call time; identical to the base
`define-services.ts` graph, load-safe, and outside #1462's acceptance. PLAN-EVAL F9 (Fresh-root
reachability) remains a coordinator reference, unchanged by this leaf.

## Debt

`.llm/harness/debt/arch-debt.md` is unchanged base..head. The leaf removes an AP-11/AP-25 violation
rather than introducing one; the F-DOCT-5 cardinality and slow-type warnings pre-exist at base with
the same counts. No `FAIL_DEBT` condition.

## Boundaries honoured

Read-only over source. No merge, draft flip, relabel, issue edit, acceptance tick, second cycle, or
next leaf. No `e2e:cli`/Aspire/Docker/browser gate; no runtime lease. No thread ids, rollout paths,
or daemon handles are recorded here.

**Verdict: `PASS_IMPL`** — four low findings (F-1 … F-4), zero blocking.
