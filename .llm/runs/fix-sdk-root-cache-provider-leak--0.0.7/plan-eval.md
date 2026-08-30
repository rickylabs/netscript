# PLAN-EVAL — fix-sdk-root-cache-provider-leak--0.0.7 (cycle 1)

- Plan evaluator session: native Claude Fable 5 (opposite-family to the Codex author), fresh
  session, 2026-08-30. Session/thread identifiers deliberately not recorded.
- Run: `fix-sdk-root-cache-provider-leak--0.0.7`
- Plan commit evaluated: `1bf9c56724fb11184b7e022b4b3ca58ef80f7ad0` — re-verified equal to
  `origin/fix/sdk-root-cache-provider-leak` and to PR #1758 `headRefOid` at evaluation time.
- Base: `origin/main` @ `13878a80a50c55b9662099fed64555f2310ae4a3` (unchanged since the plan).
- Surface / archetype: `packages/sdk` public surface + `packages/fresh` server composition root;
  Archetype 2 — Integration (confirmed: `docs/architecture/doctrine/06-archetypes.md:402`).
- Scope overlays: none (agreed — no route/UI workflow change).
- Evaluator branch: `eval/plan-eval-1462-cycle-1`; read-only over source.

## What I verified against the tree (not re-derived from the plan)

| Claim                                              | Method                                                                                                                   | Result                                                                                                                                                                                                               |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Defect chain (research F1/F2/F4/F5)                | `packages/sdk/mod.ts:46`, `src/cache/mod.ts:22`, `src/cache/cache-query.ts:24`, `src/cache/kv-cache-store.ts:75`         | Holds. The only `@netscript/kv` runtime edge in the SDK is the dynamic import in `kv-cache-store.ts:75`; it is reachable from the root solely via `cache/mod.ts → cache-query.ts`.                                   |
| Root import registers; preset import does not      | Fresh `deno run` child, `window` aliased, `Deno` intact; import entry, then `hasCacheProvider()` from `src/query/mod.ts` | root → `true`; `src/presets/define-services.ts` → `false`. Moves 2+3 are therefore the necessary fix; move 1 is additive (D1 accepted).                                                                              |
| Preset graph has no server-cache edge              | `deno info --json src/presets/define-services.ts`                                                                        | Reaches `src/cache/{cache-provider,cache-provider-marker,cache-telemetry,defaults}.ts` only — all pure. No `cache-query.ts`, no `kv-cache-store.ts`, no `@netscript/kv`. Also reaches `src/discovery/*` + telemetry. |
| D2: removing the root re-export removes the edge   | Root graph reverse edges                                                                                                 | `kv-cache-store.ts` is imported only by `cache-query.ts`, itself only by `cache/mod.ts`. `query-client/kv-cache-persister.ts` has no static `@netscript/kv` import. D2 holds.                                        |
| Direct preset doc-lint is red with 10 private refs | `deno doc --lint packages/sdk/src/presets/define-services.ts`                                                            | Reproduced exactly: 10 `private-type-ref` diagnostics.                                                                                                                                                               |
| Curated entry can be doc-clean (D4)                | Temp curated entry in the job scratch dir (never committed)                                                              | Exporting the 6 named types cascades to 12 further refs; `export type *` of `ports/mod.ts` closes everything except the **pre-existing** `QueryClientPort → QueryClient` debt. Feasible; mechanism must be locked.   |
| CLI redundant bare import is covered (F7)          | `write-app-files.ts:198-204` + `assets/app/main.ts.template`                                                             | The bare import is injected into the app `main.ts`, which calls `defineFreshApp()`. Deferral is sound.                                                                                                               |
| No in-repo root cache-symbol consumers             | `rg` across `packages/`, `plugins/`, `docs/`                                                                             | Only the JSDoc example at `src/cache/kv-cache-store.ts:41` (in ceiling). Fresh imports cache symbols from `@netscript/sdk/cache`, not the root.                                                                      |
| `check:publish-assets` reads SDK reference prose   | `.llm/tools/generate-publish-assets.ts:225-300`                                                                          | **False.** It rebases version strings inside the existing `.llm/assets/agent-docs/prose.json.gz` and embeds `packages/mcp/README.md`; it never reads `docs/site/`. See F2.                                           |
| S2 red contract is executable as written           | Fresh child process, `delete globalThis.Deno`, `window` alias, dynamic-import root                                       | **Crashes** before observation: `ReferenceError: Deno is not defined` from `node:process` (`ext:deno_node/internal/options.ts`) while the root's npm deps load. See F1.                                              |
| jsr-audit cardinality claim                        | `.llm/tools/fitness/audit-jsr-package.ts:266-285`                                                                        | F-DOCT-5 counts immediate directory children, not export entries; `src/presets/` already exists, so a 13th export adds no new cardinality finding. Claim correct.                                                    |
| `arch-debt.md` has no open SDK entry               | `rg` on the registry                                                                                                     | Confirmed.                                                                                                                                                                                                           |

## Checklist results

| Plan-Gate item                          | Result | Evidence / location                                                                                                                                                                                               |
| --------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research present and current            | PASS   | `research.md` re-baselined to `13878a80`; findings 1–7 spot-checked above and hold; version drift (0.0.5 → 0.0.6) recorded.                                                                                       |
| Decisions locked                        | PASS   | `plan.md` D1–D8 each carry a rationale/dominance test; D1, D2, D4 independently confirmed above.                                                                                                                  |
| Open-decision sweep                     | FAIL   | The S2 test mechanism is an unflagged must-resolve-now decision: the locked shape is not executable (F1). The generated-derivative route for the site edit is likewise unresolved (F2).                           |
| Commit slices (< 30, gate + files each) | PASS   | Four ordered slices with files and proving gates (`plan.md` §Design checkpoint). S2's proving gate is invalid as written and is corrected under F1; slice structure itself is sound.                              |
| Risk register                           | PASS   | Nine risks with mitigations; the "existing red gates laundered as passes" and symbol-granularity rows are the right lessons from the sibling leaf.                                                                |
| Gate set selected                       | FAIL   | Missing `check:agent-docs-prose` / `gen:agent-docs-prose` (CI "Agent docs corpus freshness") and `docs:exports-drift` (pages.yml); gate 15's stale-negative rationale attributes to the wrong tool (F2, F3).      |
| Deferred scope explicit                 | FAIL   | "Other documentation pages" is a blanket exclusion that silently leaves three published pages teaching the removed behaviour (F4); the `.llm/assets/agent-docs/*` derivative is not mentioned at all (F2).        |
| jsr-audit surface scan (pkg/plugin)     | PASS   | Scan present with measured baselines (doc-lint red, 10-ref direct entry, two audit warnings). Curated-entry feasibility now measured by the evaluator; the closure mechanism should be locked (F5, non-blocking). |

## Findings

Severity: **blocking** = unchecked Plan-Gate box / would force rework if deferred; **minor** = must
be folded into the plan revision but does not by itself drive the verdict; **advisory** = recorded
for the coordinator, no plan change required.

### F1 — blocking — the locked S2 red contract crashes for an unrelated reason

- Derived from: `plan.md` §"S2 red-test contract" + gate row 1; measured with a fresh child process
  that deletes `globalThis.Deno`, installs `window`, and dynamically imports `packages/sdk/mod.ts`.
- Observed:
  `ReferenceError: Deno is not defined at isWarmupPhase (ext:deno_node/internal/options.ts)
  … addReadOnlyProcessAlias (node:process)`
  — Deno's Node-compat layer reads `Deno` while the root's npm dependencies load, before
  `hasCacheProvider` can be observed. The plan itself names "unrelated Deno-global crash" as an
  unacceptable red; it did not measure that its own shape produces exactly that. Control run with
  `Deno` intact: root import → `hasCacheProvider() === true`, preset import → `false`, i.e. the red
  is available without deleting the runtime.
- Required fix: re-lock S2 as a fresh child process **with the Deno runtime intact** (a `window`
  alias may stay as a label, but it is not what the assertion depends on): import root
  `defineServices`, then read `hasCacheProvider()` from `src/query/mod.ts` and require `false`. Red
  today is the observed `true`. Move "browser-shaped" evidence to a committed static-graph assertion
  (see F6) rather than to runtime global surgery. Update gate row 1's "failure is observed
  `hasCacheProvider() === true`" wording to match.

### F2 — blocking — the generated-derivative cascade is mis-attributed and the ceiling is missing its real outputs

- Derived from: `plan.md` ceiling rows for the two `publish-assets.generated.ts`, gate rows 15–16,
  `research.md` §"Generated-derivative cascade"; verified in
  `.llm/tools/generate-publish-assets.ts:225-300`,
  `.llm/tools/docs/build-agent-docs-bundle.ts:186-215`, `.github/workflows/ci.yml` ("Agent docs
  corpus freshness" → `check:agent-docs-prose`, runs when `RUN == 'true'`), and
  `.llm/tools/gates/catalog.ts:60-62`.
- Observed: `check:publish-assets` never reads `docs/site/`; it rebases the checked-in
  `.llm/assets/agent-docs/prose.json.gz`. The tool that turns red when
  `docs/site/reference/sdk/index.md` changes is `check:agent-docs-prose`, whose generator
  (`gen:agent-docs-prose`, a Lume site build) writes **`.llm/assets/agent-docs/prose.json.gz`** and
  **`.llm/assets/agent-docs/provenance.json`** — neither is in the ceiling, and the ceiling rule is
  rescope-and-stop. Only after that regeneration do the two `publish-assets.generated.ts` files go
  stale (they embed the gz). As written, S3 either stops on an undeclared path or ships a red CI
  gate.
- Required fix: add the two `.llm/assets/agent-docs/*` paths to the ceiling ("regenerate only
  through `gen:agent-docs-prose`"); insert gate rows `check:agent-docs-prose` (expected stale
  negative) → `gen:agent-docs-prose` → `check:agent-docs-prose` (PASS) **before** rows 15–16;
  correct row 15's rationale to "because the prose bundle was regenerated", not "because reference
  prose moved". State whether the leaf host can run the site build; if it cannot, that is a recorded
  blocked gate, not an `N/A`.

### F3 — blocking (folds into F2) — `docs:exports-drift` is the gate that proves the `./presets` row on the reference page, and it is absent

- Derived from: `.llm/tools/docs/check-exports-drift.ts:108-118` (sdk mapping, `entrypoints-only`),
  `.github/workflows/pages.yml:145`; plan gate table has no such row.
- Observed: adding `./presets` to `packages/sdk/deno.json` without a matching entrypoint row in
  `docs/site/reference/sdk/index.md` fails `deno task docs:exports-drift`. The page is in the
  ceiling, but nothing in the plan measures it.
- Required fix: add a gate row for `deno task docs:exports-drift` with required outcome PASS after
  S3.

### F4 — blocking — the compatibility contract leaves three published pages teaching the removed behaviour

- Derived from: `plan.md` §"Compatibility contract" (D7: "README/site migration note"), ceiling
  exclusion "other documentation pages"; `rg` over `docs/site/`.
- Observed, all outside the ceiling:
  - `docs/site/web-layer/query-bridge.md:305-323` — presents `import '@netscript/sdk/cache';` as the
    registration mechanism and explains that the module body calls `setCacheProvider` at import
    time; line 100 quotes verbatim the provider-not-initialized message the plan rewrites in
    `cache-provider.ts:213`.
  - `docs/site/web-layer/server.md:89` — states `@netscript/fresh/server` registers by re-export
    side effect.
  - `docs/site/services-sdk/sdk.md:186` — "Importing /cache auto-registers the shared provider".
    After S3 each of these is false and would send a custom-server author down the exact path the
    plan declares a behavioural break. These pages are also inside the same prose bundle as F2, so
    including them adds no new gate.
- Required fix: add the three pages to the ceiling with a one-line planned change each (rewrite to
  explicit `setCacheProvider(cacheQuery)` at the composition root; refresh the quoted message),
  **or** record them as an explicit deferred item with a filed follow-up reference and a note in the
  PR body that published docs will be transiently wrong. Inclusion is recommended: it is docs-only
  prose, and the plan's own D7 rationale is that migration prose must be correct.

### F5 — minor — D4's "every dependent SDK type" is open-ended; lock the mechanism

- Derived from: `plan.md` D4 and ceiling row for `src/presets/mod.ts`; measured with a scratch
  curated entry (not committed).
- Observed: exporting the six directly-referenced types (`ContractLike`, `QueryParams`,
  `CreateServiceClientOptions`, `ServiceClient`, `QueryFactory`, `ServiceQueryUtils`) cascades to 12
  more private refs (`ContractProcedureLike`, `ActionMethod`, `ContractProcedureNames`,
  `ServiceClientContract`, `ServiceClientShape`, `ProcedureInputFromNode`,
  `ProcedureOutputFromNode`, `ServiceOperationKey*`, `ServiceOperationType`,
  `ServiceProcedureQueryUtils`). Re-exporting the `ports/mod.ts` type surface closes all of them but
  drags in the pre-existing `QueryClientPort → QueryClient` debt, so the entry must be the ports
  type surface **minus** `QueryClientPort`, plus `CreateServiceClientOptions`. The resulting type
  surface is roughly the ports contract; the runtime graph stays minimal, which is what matters, but
  AP-22's justification should say so.
- Required fix: state the closure mechanism in D4 (enumerated ports types excluding
  `QueryClientPort`) so gate 8 measures a locked design rather than an implementer's search.

### F6 — minor — "prove absence" of the server edge should be a committed assertion, not a review step

- Derived from: gate row 18 ("exact import graph/search … review") and the supervisor's question
  whether the plan proves rather than asserts browser safety.
- Observed: the graph absence is checkable mechanically (`deno info --json` over `mod.ts` and
  `src/presets/mod.ts`; assert no module specifier matches `src/cache/cache-query.ts`,
  `src/cache/kv-cache-store.ts`, or `@netscript/kv`). A review step does not survive the next root
  re-export.
- Required fix: fold this into the S2/S3 regression test file (already in the ceiling) as a second
  assertion, keeping gate 18 as its evidence row.

### F7 — minor — Fresh registration test is order-dependent as described

- Derived from: risk row "Fresh imports register too early" and ceiling row
  `define-fresh-app.test.ts`.
- Observed: `deno test` loads every module of a run in one isolate and the provider is a module
  singleton, so "`hasCacheProvider() === false` after importing the server module and before
  invoking" is only true if no earlier test in the process registered. Today only
  `define-fresh-app.test.ts` calls `defineFreshApp()`, but the assertion must not depend on that.
- Required fix: capture `hasCacheProvider()` at module top level of the test file (before any
  `Deno.test` body runs) or call `resetCacheProvider()` first; observe via the same
  `@netscript/sdk/query` (or `/cache`) instance the Fresh package resolves.

### F8 — advisory — D1 wording

- The dominance argument is sound (measured: preset-only is inert today, root is not; moves 2+3 are
  the fix, move 1 is a durable additive boundary). The phrase "minimal graph" overstates it: the
  preset graph still contains `src/discovery/*` and `@netscript/telemetry` via `cache-telemetry.ts`.
  Say "no server-cache/KV edge" rather than "minimal".

### F9 — advisory — a neighbouring leak in `packages/fresh` (out of leaf scope)

- `packages/fresh/src/application/cache-entries/cache-entry.ts:1` imports `isCacheEntryStale` from
  `@netscript/sdk/cache` although `@netscript/sdk/ports` exports the same pure helper
  (`ports/mod.ts:18`), and `packages/fresh/mod.ts:33` re-exports that module from the Fresh root.
  After S3 this no longer registers a provider, but it keeps `KvCacheStore` reachable from the Fresh
  root graph. Not this leaf's ceiling; the coordinator should decide whether it is a follow-up
  before issue #1462's "production client chunks contain no server KV adapter" box is ticked for
  Fresh apps.

## Open-decision sweep (evaluator-run)

1. S2 mechanism (F1) — must resolve now.
2. Prose-bundle derivative ownership and host ability to run `gen:agent-docs-prose` (F2) — must
   resolve now.
3. Curated-entry closure mechanism (F5) — should resolve now; cheap.
4. Three site pages: own or defer with a reference (F4) — must resolve now because of the
   rescope-and-stop ceiling rule.

Everything else in the plan's own sweep is correctly marked; the CLI deferral and the real-browser
gate deferral are accepted as safe.

## Verdict

`FAIL_PLAN`

### Required fixes (cycle 1)

1. F1 — re-lock the S2 contract with the Deno runtime intact; fix gate row 1 wording.
2. F2 — add `.llm/assets/agent-docs/prose.json.gz` and `.llm/assets/agent-docs/provenance.json` to
   the ceiling; add `check:agent-docs-prose` → `gen:agent-docs-prose` → `check:agent-docs-prose`
   gate rows before rows 15–16; correct row 15's rationale; state host ability to build the site.
3. F3 — add a `deno task docs:exports-drift` gate row.
4. F4 — add `docs/site/web-layer/query-bridge.md`, `docs/site/web-layer/server.md`,
   `docs/site/services-sdk/sdk.md` to the ceiling (recommended) or record an explicit deferred
   follow-up with a reference and a PR-body caveat.
5. F5 — lock the curated-entry closure mechanism in D4.
6. F6, F7 — fold the graph assertion into the committed test and make the Fresh inertness assertion
   order-independent.

No implementation slice (S2 onward) may begin until a revised plan commit passes a second PLAN-EVAL.
This is cycle 1 of the two permitted `FAIL_PLAN` cycles.

## Notes

- Nothing was argued `N/A` that should have been measured, with the single exception of the
  prose-bundle cascade, which the plan did not know existed (F2). The e2e/Aspire/Docker/browser
  `NOT RUN / prohibited` rows are correct for this lane.
- The plan's honesty posture (measured negatives recorded as negatives, no baseline rewrite — D8) is
  exactly right and should be preserved through the revision.
- Scratch probes lived only under the job scratch directory; no source file was modified. Evaluator
  commit is artifact-only.
