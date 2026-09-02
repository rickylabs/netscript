# Research — workers-payload-type-contract--plan

## Re-baseline

- Carried-in source: issue #1455 and its full comment history; no earlier code changes.
- Re-derived against `origin/main` at `ec848e6b0334ec8fcd2bc66ba009305d35367b01` on 2026-09-02.
- What changed vs the issue's original description: #1451 / PR #1872 has already landed generated
  operational job definitions. Those exports are the baseline to preserve, not work to absorb.

## Findings

| # | Finding | How to verify |
| --- | --- | --- |
| 1 | Root workers `JobDefinition<TId>` has no payload generic and `JobBuilder.build()` returns that erasing type. | Baseline `deno doc @netscript/plugin-workers-core` for `JobDefinition` and `JobBuilder`. |
| 2 | The published `./builders` and `./runtime` definitions already use `<TId, TPayload, TResult>`, but no runtime payload schema is carried. | Baseline `deno doc` over both workers-core export subpaths. |
| 3 | `JobTriggerInput` is a non-generic broad record payload, and all exported workers contract values/types are non-generic. | Baseline `deno doc @netscript/plugin-workers-core/contracts/v1`. |
| 4 | Trigger-core infers `TPayload` independently from `EnqueueJobOptions` because its `job` accepts only `JobDefinition<TJobId>`. | Baseline `deno doc @netscript/plugin-triggers-core` and `./builders`. |
| 5 | Generated workers registries deliberately widen through `JobHandler<any>` and a homogeneous array before creating Maps. | `plugins/workers/scaffold.runtime.json`, `runtime-registry-generator.ts`, and `registry-compiler.ts`. |
| 6 | Workers-core already owns a structural Standard Schema abstraction suitable for a dependency-neutral public payload schema. | `packages/plugin-workers-core/src/domain/public-schema.ts`. |
| 7 | Generated operational `jobDefinitions` and `definitions` Maps from #1451 already exist and their policy projection must remain intact. | Issue #1455 comments plus current workers generator tests/source. |
| 8 | First-party/scaffold job modules commonly have a Zod schema but manually parse inside a schema-less `defineJobHandler` callback. | Focused search of workers scaffold, examples, and plugin test fixtures. |

## JSR-audit surface scan

- Surfaces: all exports in `packages/plugin-workers-core/deno.json`,
  `packages/plugin-triggers-core/deno.json`, and `plugins/workers/deno.json`.
- Published-type risks selected for explicit gates: Standard Schema must remain package-owned and
  structural; generated conditional/mapped types must avoid `any`, slow inference, and private type
  references; all new exports require JSDoc; default type arguments must preserve ordinary legacy
  references.
- Current known baseline debt: the workers plugin has 20 `private-type-ref` diagnostics across 13
  exports under its recorded debt allowance. The implementation may not increase the count or add a
  diagnostic class. Workers-core and triggers-core must remain clean.
- Publish evidence selected: per-root full-export doc lint plus the workspace
  `deno task publish:dry-run`; neither is replaced by source inspection.

## Open questions

None before implementation. The schema requirement, validation boundary, contract factory, literal
registry shape, compatibility defaults, deliberate source breaks, and #1451 boundary are locked in
`plan.md`.
