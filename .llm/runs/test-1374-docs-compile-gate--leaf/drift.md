# Drift Log: docs snippet compile gate for #1374

Drift is append-only.

## 2026-08-12 — PLAN-EVAL cycle 1 concrete probes

- **Severity:** significant plan drift; no implementation had started.
- **Observed:** the locked D2 command using the real root lock with `--frozen` exits 1 for green and
  red synthetic configs because their workspace metadata cannot match the real workspace. The
  original merge recipe also omitted root-catalog-only bare imports such as
  `@opentelemetry/api`.
- **Disposition:** D2 now seeds a temporary lock copy, omits `--frozen`, discards all synthetic
  lock rewrites, and materializes root catalog entries as `npm:` mappings.
- **Observed:** the planned accuracy demotion removed the only page-containment rule preventing
  valid dialect B from returning to golden-path pages, and removed Fresh-root coverage from the
  uncovered corpus.
- **Disposition:** keep the exact one-page `createServiceQueryUtils` rule and keep
  `checkFreshRootImports`/`ALLOWED_FRESH_ROOT_SYMBOLS` unchanged; remove only the three named
  positive reference needles and the other named positive assertions.
- **Observed:** `typescript` was an unchecked, reason-free opt-out and the policy treated a checked
  count drop as informational.
- **Disposition:** recognize `typescript` as a `ts` alias, apply the same reason grammar, and fail
  below 35 candidates or 21 checked, or above 14 exemptions.
- **Observed:** one proposed exemption is actually a broken barrel snippet, while two others are
  complete primary island examples that only need typed local support modules.
- **Disposition:** fix the barrel binding inside its code fence, materialize the two support
  modules, and compile all three unmarked. The honest floor changes from 18/17 to 21/14.
- **Observed:** the mutation-family count was 18, and the workflow assertion was conditional.
- **Disposition:** correct the count and make the structural `pages.yml` assertion unconditional
  in slice 4.

## 2026-08-12 — PLAN-EVAL cycle 2 mandatory D2 amendments

- **Severity:** non-blocking implementation amendment required before slice 2; PLAN-EVAL verdict is
  `PASS`.
- **Observed:** materialized top-level imports do not satisfy `"catalog:"` inside member configs
  auto-discovered through file-URL workspace source. Without a root `catalog` section in the
  synthetic config, every input exits 1 with `Package 'zod' not found in catalog` before type-check.
- **Disposition:** copy the root catalog (38 entries at evaluation) verbatim into the synthetic
  config. The evaluator's identical green control then exits 0.
- **Observed:** literal merge comparison reports 40 false conflicts because root major shorthand
  such as `jsr:@std/assert@1` is Deno-equivalent to member `jsr:@std/assert@^1`.
- **Disposition:** compare canonicalized package/version requirements. Current canonicalized
  declared-import conflicts and declared-versus-catalog conflicts are both zero. Both checks remain
  fail-closed config guards: a future conflict makes the build red; neither is claimed as a current
  negative-test predicate.
- **Known ratchet window:** the three removed positive needles on
  `docs/site/reference/sdk/index.md` are not compiler-covered until reference wave 4. Exact
  one-page `createServiceQueryUtils` containment continues to block the wrong dialect on all
  golden-path pages; only positive presence on the sanctioned page is deferred.

## 2026-08-12 — Slice 1 scoped format baseline

- **Severity:** mechanical, no behavioral drift.
- **Observed:** the required exact `.llm/tools/docs` format wrapper found Deno-format drift in the
  new slice files and in pre-existing `check-exports-drift.ts` plus its test.
- **Disposition:** ran `deno fmt` only on the six selected TypeScript files. The two pre-existing
  files changed formatting only; their checker behavior, mapping, and tests were not altered. The
  exact scoped wrapper then exited 0.

## 2026-08-12 — Slice 3 real-corpus support inventory

- **Severity:** bounded implementation drift; no contract or coverage change.
- **Observed:** the first real Tier-1 compile reached two checked island fences whose documented
  relative imports (`apps/dashboard/lib/orders.ts` and `apps/dashboard/lib/widgets.ts`) were not in
  the planned support inventory. The gate exited 1 with TS2307 at
  `web-layer/examples.md:40` and `web-layer/interactive.md:92`, followed by response-type errors.
- **Disposition:** materialize both modules from Zod/oRPC contracts plus public
  `createServiceClient` and `createQueryFactories` APIs. They contain no casts or `any`. The same
  35/21/14 corpus then exits 0; no fence was exempted to accommodate the harness.

## 2026-08-12 — Orchestrator pre-merge F-1 negative-task entry point

- **Severity:** significant fail-open control-entry drift; the three named raw controls remained
  valid and were independently reproduced, but the aggregate task name was misleading.
- **Observed:** `deno task docs:snippets:negative` supplied `--negative` without a value. The CLI
  interpreted the missing value as positive mode, enforced the ordinary corpus floor, printed
  `PASS`, and exited 0. That invocation proved no negative predicate.
- **Disposition:** the presence of `--negative` now requires one of the five declared fixture
  names before any corpus analysis starts. Missing and unknown names exit 1 with
  `deno task docs:snippets:negative <case>` usage and the complete fixture list. A task-level
  regression test exercises both fail-closed paths.
