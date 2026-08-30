# Context Pack: plugin doctor generator-selected source authority

## Current Phase

S6 plan amendment only. IMPL-EVAL cycle 1 returned `FAIL_FIX` at evaluated head `61b8bf52` because
doctor treats the manifest candidate walk as authoritative when the AI generator legitimately
excludes discoverable `ai/tools/skill-loader.ts` by source shape. The code through `c1e21c1b` and the
Tier-A artifact at `61b8bf52` otherwise stand. No product or test change is authorized before a
fresh separate PLAN-EVAL approves the amended plan.

## Ruled Contract

- Optional manifest capability: `runtimeRegistryGenerator.inspectionProtocol: 1`.
- only a present `inspectionProtocol` key activates inspection; version `1` uses
  `--inspect --inspection-protocol 1 --manifest-json <json>`, omits both `--manifest` and
  `--allow-write`, and accepts one strict JSON document on stdout. Invalid advertised declarations,
  process failures, and invalid reports all remain generator-inspection errors — none can enter the
  legacy manifest-walk path.
- Absent key: current manifest walk unchanged and no generator process invocation in dry-run.
- The injected `ProcessPort` runs the same external generator.
- One pure selector in `ai-registry-compiler.ts` supplies both inspect and compile. The host never
  copies AI's source-shape predicate.
- Strict v1 validation covers version/schema, exact declared registry target set, target/source
  duplicates, canonical project-relative paths, and regular source files.
- Advertised failures make doctor unhealthy under the distinct `Generator runtime registry
  inspection` surface; there is no silent fallback or false regeneration remediation.

## No-Write Proof

Flag omission is necessary but not sufficient. Prove no writes at three levels:

1. AI pure-selector test: in-memory write map unchanged.
2. Installed-generator unit test: complete memory filesystem unchanged and process args omit both
   `--allow-write` and `--manifest`.
3. Real AI integration: after normal generation, snapshot every project file and byte, run doctor,
   and assert the complete snapshot is unchanged.

## Required Red-Before

Extend the existing real AI integration case: generate a ready tool registry that correctly excludes
discoverable `ai/tools/skill-loader.ts`, then assert doctor stays healthy. Commit that test alone in
S7 against the current product, record the expected failure and exact counts, and do not begin S8 in
the same slice.

## Scope

The eleven coordinator-authorized product/test paths are listed exactly in `plan.md`: seven prior CLI
paths plus the AI manifest/compiler/entrypoint/compiler-test additions. The proposed new
`runtime-registry-source-report.ts` is removed; parsing and validation stay in
`installed-runtime-registry-generator.ts`.

One existing path is separately flagged:
`installed-runtime-registry-integration_test.ts` is retained under the supervisor's reading that
existing test paths may be amended. `drift.md` records this interpretation for PLAN-EVAL/coordinator
review. No other path is implied.

Workers, sagas, and triggers do not adopt protocol v1 here. F4/workers profile/include/conditional
include/plugin-dir/dotfile adoption is knowingly deferred. A later workers manifest can advertise the
same v1 contract and feed it from its own selector without host/schema redesign.

## Sequence

1. S6 amendment commit/push/comment/body update, then stop.
2. Fresh separate PLAN-EVAL.
3. S7 real AI `skill-loader` healthy regression, red-before and committed alone.
4. S8 shared AI selector, AI inspect mode, manifest advertisement, AI tests.
5. S9 host parsing/validation/consumption, fail-closed surface, doctor evidence, green regression.
6. S10 author-owned gates plus required supervisor-owned runtime report, then fresh IMPL-EVAL.

Each slice commits, pushes by explicit refspec, posts the structured PR comment, maintains the PR
Validation block, and stops on an unlisted path need.

## Gate Authority

- Structured wrappers own focused test/check/lint/fmt verdicts.
- Required plugin suites include the AI compiler test, full `plugins/ai` test task, and AI/CLI package
  checks, plus installed generator unit/integration and focused doctor tests.
- `check:mcp-export-corpus` and `check:publish-assets` remain measured outcomes.
- Raw `git diff --exit-code -- deno.lock` must remain exit 0.
- `scaffold.runtime` is required and supervisor-coordinated under the cluster-wide singleton lease.
  The author must not run it. Because `e2e:cli` is not in the gate catalog, its durable evidence is
  the runner's `--report` JSON.
- Runtime cleanup is `agentic:leak-check`, then `agentic:teardown --apply` only for proven resources,
  with `--owned-root` when anything starts outside the worktree; terminal state is Aspire/Docker zero.
- Host baseline: DinD at `10.4.12.19`, project `DOCKER_HOST=tcp://netscript-dind:2375`, Docker
  client/server 28.5.2, sandbox observed zero, inotify instances 1024. No below-28 or expected inotify
  exception exists; any runtime failure is a real finding to investigate.
- `.llm/tmp/gate-receipts/` is gitignored/local-only. Reproducible commands, evaluated SHA, exits,
  counts, and the runtime runner report are review evidence.

## Evidence Corrections

- F3: S3 preserved `GeneratedPluginRegistry` shape but changed `registrableItems` from the base
  plugin-wide sum to a per-target count; no production consumer reads it.
- F5: local gate receipts are not durable fresh-checkout evidence.
- If the head-tests/base-product comparison is restated, `0/5` requires `--no-check`; default
  type-checking runs zero tests because the head test does not compile against base.

## Stop Condition

Stop now for PLAN-EVAL after the amended plan commit is explicitly pushed and its structured PR
correction is posted. Do not start S7, run the runtime smoke, mutate issue/acceptance state, flip draft,
relabel, merge, or self-certify.
