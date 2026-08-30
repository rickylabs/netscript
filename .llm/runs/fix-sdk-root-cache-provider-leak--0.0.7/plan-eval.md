# PLAN-EVAL — fix-sdk-root-cache-provider-leak--0.0.7 (cycle 2)

- Plan evaluator session: native Claude Fable 5 (opposite-family to the Codex `gpt-5.6-sol`
  author), fresh session, 2026-08-30. Session/thread identifiers deliberately not recorded.
- Run: `fix-sdk-root-cache-provider-leak--0.0.7`
- Plan commit evaluated: `9a0f5876161df00e27719bcb4a080decd879c3a9` (revision of `1bf9c567`) —
  re-verified at evaluation time equal to `origin/fix/sdk-root-cache-provider-leak` and to PR #1758
  `headRefOid` (PR still draft, `status:plan`, milestone `0.0.7`).
- Base: `origin/main` @ `13878a80a50c55b9662099fed64555f2310ae4a3` (unchanged since cycle 1).
- Cycle 1 verdict read first: `7c6ca56e` on `eval/plan-eval-1462-cycle-1` (`FAIL_PLAN`, F1–F7
  required). This cycle judges **sufficiency** of the revision, not presence of the fixes.
- Surface / archetype: `packages/sdk` public surface + `packages/fresh` server composition root;
  Archetype 2 — Integration (unchanged, confirmed in cycle 1).
- Scope overlays: none (agreed).
- Evaluator branch: `eval/plan-eval-1462-cycle-2`; read-only over source. Scratch probes lived only
  under the job scratch directory; `git status` stayed clean throughout.

## What I measured against the tree (not re-derived from the plan)

| Cycle-1 fix under test                              | Method                                                                                                                                                                                               | Result                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1 — S2 red is real with the Deno runtime intact    | Fresh `deno run` child, `Deno` untouched: dynamic-import entry, verify `defineServices` is a function, then `hasCacheProvider()` from `packages/sdk/src/query/mod.ts`                                 | Root `packages/sdk/mod.ts` → `true`; `src/presets/define-services.ts` → `false`. No crash. The locked red (observed `true` where `false` is required) is exactly what unmodified base produces; the graph phase never runs at base because the first assertion throws, so the base run yields exactly one failed test.           |
| F2 — host can run the Lume prose gate (claimed)     | `deno task check:agent-docs-prose` on this host at `9a0f5876`                                                                                                                                       | **Reproduced:** exit 0, "638 files generated in 5.95 seconds", `{"fresh":true,"stalePaths":[]}`, wall time 6.9 s. Working tree unchanged afterwards. The claim is a measurement, not a reasoned gate.                                                                                                                       |
| F2 — the four owned site pages are in the bundle    | `provenance.json` file list printed by the check                                                                                                                                                     | `pages/reference/sdk/index.md`, `pages/web-layer/query-bridge/index.md`, `pages/web-layer/server/index.md`, `pages/services-sdk/sdk/index.md` all present → gate 16's stale negative is guaranteed once any of them is edited.                                                                                                |
| F2 — gate ordering (site → prose bundle → assets)   | `deno.json` tasks; `.llm/tools/generate-publish-assets.ts:34,232-236,300,344`; `.llm/tools/docs/generate-export-surface-corpus.ts:183-273`; `docs/site/_plugins` grep                              | `gen:agent-docs-prose` = site build + bundle; `check:*` = `gen:* --check`; publish-assets embeds only `prose.json.gz` + `packages/mcp/README.md`; the MCP corpus reads package `deno.json` exports (so `./presets` makes row 14 stale); the site build reads nothing under `packages/`. Rows 13 → 14/15 → 16–18 → 19/20 are in the correct dependency order. |
| F3 — `docs:exports-drift` is green at base          | `deno task docs:exports-drift`                                                                                                                                                                       | `Exports & Symbols drift check: PASS`, exit 0 — so a post-S3 PASS (row 13) is a meaningful signal, and the sdk page is `entrypoints-only`, so the `./presets` row is what it will demand.                                                                                                                                       |
| F5 — D4 closure is decidable and sufficient         | Scratch curated entry (job scratch dir only): `export *` of `define-services.ts` + `export type { … }` of every type name in `src/ports/mod.ts` at `13878a80` minus `QueryClientPort` (68 names); `deno doc --lint` | **Exit 0, zero diagnostics.** Control: adding `QueryClientPort` back yields exactly one diagnostic (`QueryClientPort` → `QueryClient`, the pre-existing debt). Control: the direct file still shows the 10-ref baseline. D4 is now a finite, enumerated set an implementer can copy, and it is proven doc-clean.                    |
| F6 — the committed graph assertion is red-then-green| `deno info --json` for root and preset at base                                                                                                                                                      | Root contains `src/cache/cache-query.ts` and `src/cache/kv-cache-store.ts` (red at base); preset contains neither. See M1 for how `@netscript/kv` actually appears in the JSON.                                                                                                                                                 |
| F7 — Fresh contract is order-independent            | Plan §"Fresh registration test contract"; `packages/fresh/src/runtime/server/define-fresh-app.test.ts:2,39-186`; `deno info` on `define-fresh-app.ts`                                              | Fresh child: reset → dynamic import → assert false → `defineFreshApp()` → assert true, in its own process, is order-independent by construction. Fresh resolves `@netscript/sdk/cache` to the **workspace** `packages/sdk/src/cache/mod.ts` (not JSR), so "the same module instance" is achievable. Symbol home is imprecise — see M2. |
| Ceiling completeness — hidden pins on exports/root  | `packages/sdk/tests/package-manifest_test.ts`, `tests/readme-doctest_test.ts`, `.llm/tools/quality/check-root-coverage.ts`, `rg` for side-effect `import '@netscript/sdk/cache'` and root cache-symbol value imports | The manifest test pins npm deps only; the README doctest imports only surviving root symbols (`ServiceClient`, `safe`, …); root-coverage checks quality-task roots, not re-exports. The only side-effect import outside the ceiling is the doc page already in it; the only root cache-symbol importers are `README.md` and the `kv-cache-store.ts` JSDoc, both in the ceiling. **No path is missing.** |
| Ceiling — nothing listed is unnecessary             | Same inputs                                                                                                                                                                                          | Every one of the 19 paths is either a product edit the design requires, a test the contracts require, a prose page the compatibility contract requires, or a generated derivative that turns stale in the measured cascade. `provenance.json` will change (`sourceCommit` is rewritten by `gen:`) so owning it is correct.        |
| `check` task + publish include for the new entry    | `packages/sdk/deno.json`                                                                                                                                                                             | `check` task enumerates entries by hand (plan adds `./presets` — required); `publish.include` is `**/*.ts` with `tests/` excluded, so `src/presets/mod.ts` ships and the new test does not.                                                                                                                                       |

## Checklist results

| Plan-Gate item                          | Result | Evidence / location                                                                                                                                                                                                              |
| --------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research present and current            | PASS   | `research.md:6` re-baselined to `13878a80`; the defect chain re-measured above (root `true` / preset `false`).                                                                                                                  |
| Decisions locked                        | PASS   | `plan.md` D1–D8. D4 now names a finite enumeration that I measured doc-clean; D1's dominance test (subpath alone / purity alone / bootstrap alone each leave one consumer class broken) is sound and none of the three moves is redundant. |
| Open-decision sweep                     | PASS   | Both cycle-1 must-resolve items are resolved with measurements (S2 mechanism; Lume availability). My own sweep found no decision that would force rework if deferred (M1/M2 are assertion-detail refinements inside S2's own artifact). |
| Commit slices (< 30, gate + files each) | PASS   | S1–S4, ordered; S2 is test-only and its proving gate is now the observed boolean, with any other failure explicitly rejected as a red (`plan.md` §"S2 red-test contract").                                                     |
| Risk register                           | PASS   | Nine risks with mitigations; the two cycle-1 mechanisms (child-process reset, committed graph parse) are now in the register.                                                                                                     |
| Gate set selected                       | PASS   | Rows 13 (`docs:exports-drift`), 16–18 (prose stale → gen → fresh), 19–20 (assets stale → gen → fresh) are present, in dependency order, and row 17's host capability is a reproduced measurement. Nothing argued `N/A` should have been measured. |
| Deferred scope explicit                 | PASS   | Explicit list incl. F9 follow-up reference, CLI bare import, real-browser gate; the four published pages are owned, not deferred.                                                                                              |
| jsr-audit surface scan (pkg/plugin)     | PASS   | Baselines pinned (doc-lint red, two audit warnings, 13 exports after); the new subpath's own `deno doc --lint` is row 8 with a required zero, and I measured that the locked design meets it.                                    |

## Findings

Severity: **blocking** = unchecked Plan-Gate box / would force rework if deferred; **minor** = fold
into S2/S3 as written, no plan re-cycle; **advisory** = for the coordinator, no change required.

### No blocking findings.

### M1 — minor — make the graph assertion match how the KV edge actually appears in `deno info --json`

- Derived from: `plan.md` §"S2 red-test contract" / gate 22; measured with `deno info --json` on
  `packages/sdk/mod.ts` at base.
- Observed: in a workspace-resolved graph the literal `@netscript/kv` **never appears in
  `modules[].specifier`** — it resolves to `file:///…/packages/kv/**` (adapters, `auto-detect.ts`,
  …). It appears only as the raw `dependencies[].specifier` on `src/cache/kv-cache-store.ts`, with
  `isDynamic: true`. A test that scans module specifiers for the string `@netscript/kv` is a no-op
  today and would silently pass if a future module reached KV through any path other than the two
  named files. The plan's own durability argument ("survives the next root re-export") depends on
  this not being a three-name denylist.
- Fix (inside S2's own test file, no plan edit): reject (a) resolved module specifiers containing
  `/packages/kv/` or `jsr:@netscript/kv`, (b) raw dependency specifiers equal to `@netscript/kv`,
  and (c) — this is what turns sampling into a proof of browser-shaped purity — any `node:`
  specifier and any `/packages/logger/` module. Measured at base: root carries `node:async_hooks`
  (via KV → logger → logtape) and 4 logger modules; the preset graph carries zero of each, so (c) is
  red-then-green with no false positive.

### M2 — minor — `resetCacheProvider` lives on `./cache`, not `./query`

- Derived from: `plan.md` §"Fresh registration test contract" ("imports `resetCacheProvider` and
  `hasCacheProvider` from the same SDK query module instance") and the compatibility contract line
  "provider registration functions already remain on `./query`".
- Observed: `src/query/mod.ts:22` exports only `hasCacheProvider`/`setCacheProvider`;
  `resetCacheProvider` is exported from `src/cache/mod.ts:60` (`cache-provider.ts:236`). The Fresh
  child should import `resetCacheProvider` from `@netscript/sdk/cache` (inert after S3) and
  `hasCacheProvider` from `@netscript/sdk/query`; both alias the single `cache-provider.ts` module
  in the workspace graph, so the "same instance" property holds. Wording only; no design change.

### M3 — minor — gate 3 should run the whole `packages/sdk/tests/` suite, not a hand-picked subset

- Derived from: gate row 3 ("entry-isolation test, SDK provider/query/cache suites,
  `define-fresh-app.test.ts`").
- Observed: `tests/readme-doctest_test.ts` imports from `../mod.ts` and the README is in the
  ceiling; nothing in the row names it. The SDK `test` task is in-memory and cheap — run it whole
  (`deno task --cwd packages/sdk test` or the structured wrapper over `packages/sdk/tests/`) so the
  root-surface change is exercised by every consumer test the package already owns.

### A1 — advisory — D4's "including `CreateServiceClientOptions`" is redundant

- It is already in the `service-client.ts` block of `src/ports/mod.ts` (line 226 of that file
  defines it). Harmless; the enumeration is still finite and exact.

### A2 — advisory — `rtk` is unavailable on this host

- Recorded in `drift.md` by the author; confirmed here (`command -v rtk` empty). Not a plan issue.

## Open-decision sweep (evaluator-run)

None that would force rework if deferred. M1 and M2 are refinements of a test file that S2 creates
from scratch; folding them there is cheaper than a plan re-cycle and does not change any locked
decision, ceiling path, or gate row.

## Verdict

`PASS_PLAN` (Plan-Gate `PASS`)

Implementation may begin at S2 with M1–M3 folded into the S2/S3 artifacts as written above. This
was the second and final permitted plan cycle; every cycle-1 required fix is not merely present but
measured sufficient on this host.

## Notes

- The one claim I was asked to verify rather than accept — that this host runs
  `check:agent-docs-prose` green — reproduced exactly (exit 0 / 638 files / `fresh: true`).
- The plan's honesty posture from cycle 1 (measured negatives stay negatives, no baseline rewrite,
  no real-browser claim from static evidence) is preserved in the revision.
- Evaluator commit is artifact-only; no source file was modified.
