# Research — docs-1554-codenames--leaf

## Re-baseline

- Carried-in source: owner brief and live issue #1554.
- Re-derived against `origin/main` at `fa5d0d411054ba8aea272df392eb4e85b57c0d41` on 2026-08-12.
- PR #1541 is merged at the baseline: the trigger-core reference page exists and faithfully carries
  the stale `deno doc` descriptions.
- The dispatch snapshot's six `Group X` files omitted additional `Tn` JSDoc. An AST-shaped comment
  census found 26 matching tokens in 14 files across two published packages.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | `plugin-triggers-core` publishes seven `Group F` tokens and five `T1` tokens in JSDoc. | Comment-block census over `packages/*/src` and `plugins/*/src`. |
| 2 | `plugin-sagas-core` publishes two `Group E` tokens and twelve `T1`/`T2`/`T3` tokens in JSDoc. | Same census; inspect the `./ports` and `./stores` export entrypoints. |
| 3 | `T1`/`T2`/`T3` are internal planning tiers, while lowercase `'t1'`/`'t2'`/`'t3'` are real public `SagaDurabilityTier` and `TriggerDurabilityTier` values. | `deno doc` plus `src/domain/constants.ts` in both packages. |
| 4 | `deno doc packages/plugin-triggers-core/mod.ts` exposes seven stale summaries; `plugin-sagas-core/mod.ts` exposes one from the root, with more reachable through subpath entrypoints. | `deno doc` and `deno.json` exports. |
| 5 | Two non-comment raw matches exist: a Zod schema description in sagas and a generated README template string in CLI. Editing either changes executable statements, which the owner made a hard stop. | Raw source grep excluding generated files. |
| 6 | The current docs reference pages exist for trigger core, saga core, and CLI. Only descriptions represented in their symbol tables require follow-through. | `docs/site/reference/{plugin-triggers-core,plugin-sagas-core,cli}/index.md`. |
| 7 | Issue acceptance requires a negative check; no existing package-JSDoc wording gate covers this class. | Live issue #1554 and its owner comment. |

## Baseline JSDoc census

```text
TOTAL=26
FILES=14
GROUP=9
TIER=17
```

Package split:

| Package | `Group X` | `Tn` | Total |
| ------- | --------- | ---- | ----- |
| `packages/plugin-triggers-core` | 7 | 5 | 12 |
| `packages/plugin-sagas-core` | 2 | 12 | 14 |
| Total | 9 | 17 | 26 |

## jsr-audit surface scan

- Surfaces scanned: all export entrypoints in both package `deno.json` files, learned through
  `deno doc` before source reads.
- Documentation risk: internal planning vocabulary currently renders on JSR; replacing it must keep
  every summary factual and preserve the existing export/signature surface.
- Slow-type risk: none introduced because the slice changes comments and a wording-policy test only.
- File-list/metadata risk: none; package metadata and publish include/exclude rules are unchanged.

## Open questions resolved

- `Tn` prose is not public tier vocabulary: lowercase quoted values are the public durability
  values. Descriptions will name actual behavior or quote the relevant lowercase value.
- Executable string matches remain untouched because the owner explicitly authorized prose inside
  comments only. They are logged in `drift.md` for orchestrator rescoping.
- A compact source-policy test is warranted by explicit acceptance and does not require a new
  standalone tool. It will parse JSDoc blocks only, so generic parameters and executable literals
  are deliberate exclusions.

## Fallback re-baseline at `944dbbe07`

The fallback evaluator upheld every original replacement but demonstrated that the measured regex
was narrower than #1554's class. The regression predicate was therefore widened before source
changes to cover:

- title-cased `Group` / `Phase` / `Wave` / `Epic` planning labels;
- exact `Tn` tier and `Wn` wave shorthand;
- bare `#n` and `netscript#n` issue references in JSDoc prose.

The required red run found 52 additional tokens in 24 files across CLI, config, Fresh, service,
plugin-sagas-core, plugin-triggers-core, and the streams plugin. Classification was 48 issue
references, `Phase 7d` twice, `Phase A` once, and `Wave 6` once. All 52 were reworded by mechanism.
Combined with the earlier 26-token sweep, the issue-defined JSDoc census is 78 found, 78 fixed,
0 remaining.

The scanner now excludes publish-config-equivalent test, E2E, fixture, and generated files. Within
JSDoc it excludes tag lines, `@example` bodies/fences, inline code, and inline links; the test fixture
proves `@template T1`, `Pair<T1, T2>`, and `{@link T1}` are not treated as planning prose. The raw
repository sweep found no real generic type-parameter occurrence in the publish source.

## Fallback cycle-2 re-baseline at `0152e9795`

The second evaluator found that the guard's `/src/` discovery heuristic was not equivalent to the
published surface. `packages/aspire/deno.json` declares `./constants.ts` as the `./constants`
entrypoint, and `deno doc --json` renders two issue references in `AppHealthCheckPath`, but the guard
did not open that file.

The replacement discovery model starts at every export target in each top-level package/plugin
`deno.json` and follows local module edges within the package. It therefore covers root entrypoints
and their implementation declarations without treating every included support/test/script file as
consumer-facing documentation. A fixture locks three important closure cases:

- `packages/aspire/constants.ts` — direct root export;
- `packages/kv/adapters/redis.adapter.ts` — dependency of the `./redis` export;
- `packages/database/scripts/patch-prisma-client.ts` — dependency of the `./scripts` export.

The `Phase` predicate now distinguishes numbered algorithm steps from planning codenames. Plain
`Phase 1` / `Phase 2` / `Phase 3` prose passes; letter phases and number-plus-letter forms such as
`Phase A` and `Phase 7d` remain forbidden. Existing JSDoc code-context discrimination is unchanged.

Two raw pre-fix proofs establish the scope:

1. Cycle-1 discovery on `944dbbe07` still reports exactly the reproduced 52 findings.
2. Export-closure discovery on the cycle-1 fixed tree reports exactly the two Aspire issue tokens.

A cumulative replay at pre-remediation commit `a8303d738` reports 80 terms: the prior 78 plus
Aspire `#954` and `#1012`. All 80 are fixed and the final published-entrypoint-closure census is
zero.
