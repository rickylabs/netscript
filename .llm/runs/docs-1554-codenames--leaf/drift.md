# Drift Log: published JSDoc internal-codename cleanup

Drift is append-only.

## 2026-08-12 — Broader JSDoc census than dispatch examples

- **What:** The exact JSDoc-block census found 26 tokens in 14 files across two packages: nine
  `Group X` and seventeen `Tn` tokens.
- **Source:** Comment-block scan of non-generated `.ts`/`.tsx` under `packages/*/src` and
  `plugins/*/src`.
- **Expected:** Dispatch measured six `Group X` files across three packages and ten trigger-core
  tokens, while warning that the broader `Tn` pattern needed classification.
- **Actual:** Published saga-core subpath JSDoc contains additional planning-tier prose; CLI's match
  is not JSDoc.
- **Severity:** minor
- **Action:** fix every JSDoc occurrence within scope and report exact package/token counts.
- **Evidence:** `research.md` baseline census.

## 2026-08-12 — Executable-string matches excluded by hard boundary

- **What:** Two raw codename matches are not comments:
  `packages/plugin-sagas-core/src/contracts/v1/sagas.contract.ts` describes `T1` deduplication in a
  Zod schema string, and
  `packages/cli/src/maintainer/features/release/eject/producer-root-files.ts` emits `Group B` in a
  generated CONTRIBUTING file.
- **Source:** Raw repo-wide source grep followed by context inspection.
- **Expected:** Scope is prose inside comments only; any executable-statement change under
  `packages/**` is a hard stop.
- **Actual:** Fully eliminating raw codenames would require executable-statement changes.
- **Severity:** significant
- **Action:** defer to the orchestrator for an explicitly authorized follow-up/rescope; leave both
  statements unchanged and exclude them from the JSDoc-only negative test.
- **Evidence:** Exact paths above; final raw census will preserve these two deliberate exclusions.

## 2026-08-12 — Fallback evaluation widened the issue-defined class

- **What:** FALLBACK IMPL-EVAL found the initial `Group [A-Z]` / `Tn` sweep narrower than #1554's
  class. A widened JSDoc predicate found 52 additional tokens: 48 issue references, three phase
  labels, and one wave label across 24 files in seven publish roots.
- **Source:** Evaluator findings B1/B2 plus the required red run of
  `.llm/tools/fitness/check-public-jsdoc-codenames_test.ts` before source changes.
- **Expected:** The regression guard should reject title-cased group/phase/wave/epic planning
  labels, exact `Tn`/`Wn` shorthand, and issue-number references in published JSDoc.
- **Actual:** The old guard was green while `Phase 7d` and `Wave 6` remained.
- **Severity:** blocking, fixed.
- **Action:** Widen the predicate; exclude non-published test/E2E/fixture source and JSDoc code
  contexts; prove it red; reword all 52 findings by mechanism; prove it green after formatting.
- **Evidence:** Worklog fallback guard proof and final 78-token issue-defined census.

## 2026-08-12 — Expanded raw sweep adds one executable-string exclusion

- **What:** The issue-number arm additionally matches the executable CLI diagnostic string
  `packages/cli/src/public/adapters/agent/deno-agent-docs-generator.ts` containing `#1068`.
- **Source:** Independent raw post-format source sweep.
- **Expected:** Only comment prose may change; executable-statement changes are a hard stop.
- **Actual:** Three executable strings now remain deliberately outside authority: the existing saga
  Zod `T1` description, generated CLI `Group B` template prose, and this CLI `#1068` diagnostic.
- **Severity:** significant, unchanged boundary.
- **Action:** Leave all three untouched and report them explicitly; the JSDoc guard does not scan
  executable strings.

## 2026-08-12 — Saga reference row was stale

- **What:** The source-first correction had changed `SagaStorePort` to “Persistent boundary for saga
  state, transitions, and correlation indexes,” but `docs/site/reference/sagas/index.md` still
  described `T1` runtime guarantees.
- **Source:** Post-format reference sweep and direct `deno doc --json` comparison.
- **Expected:** Reference symbol tables follow `deno doc`.
- **Actual:** One saga row retained the old tier wording.
- **Severity:** minor, fixed.
- **Action:** Copy the authoritative `deno doc` summary into the saga table and re-run docs gates.

## 2026-08-12 — Cycle-2 evaluator found a root-entrypoint scan gap

- **What:** FALLBACK IMPL-EVAL cycle 2 found two issue-number tokens in the JSDoc for
  `packages/aspire/constants.ts` `AppHealthCheckPath`. The package exports `./constants` directly,
  but the guard required `/src/` in every scanned path and therefore could not see it.
- **Source:** Evaluator BF-1 plus direct `packages/aspire/deno.json` export inspection and
  `deno doc --json packages/aspire/constants.ts`.
- **Expected:** “Published JSDoc” means declarations reachable from a package/plugin export
  entrypoint, regardless of whether the file is rooted under `src/`.
- **Actual:** The path heuristic covered the first 78 tokens but omitted published root files.
- **Severity:** blocking, fixed.
- **Action:** Discover every top-level package/plugin export target from its `deno.json`, follow
  static local import/export and literal dynamic-import edges inside that package, and scan the
  resulting entrypoint closure. This shape was chosen over an all-file walk because it follows the
  actual consumer surface and naturally excludes unpublished scripts, tests, fixtures, and E2E
  source.
- **Evidence:** The discovery fixture asserts that Aspire constants, the exported KV Redis adapter,
  and the exported database patch script are all traversed. The widened guard fails on the two
  Aspire tokens before their source fix and passes afterward.

## 2026-08-12 — Numbered algorithm phases are not planning labels

- **What:** Export-closure traversal reaches legitimate algorithm documentation in
  `packages/kv/adapters/redis.adapter.ts` (“Phase 1” / “Phase 2”) and the published database scripts
  surface (“Phase 1” / “Phase 2” / “Phase 3”).
- **Source:** Evaluator trap plus direct export-closure inspection.
- **Expected:** The guard rejects internal phase codenames without rejecting numbered steps in an
  algorithm.
- **Actual:** The cycle-1 `Phase` arm treated every plain `Phase N` as a planning label.
- **Severity:** blocking false-positive risk, fixed before final green.
- **Action:** Keep codenamed forms such as `Phase A` and `Phase 7d` forbidden, but allow plain
  integer `Phase N` prose. Add an explicit regression fixture and assert that both real files are in
  the published closure. All prior tag/link/backtick/example exclusions remain unchanged.
