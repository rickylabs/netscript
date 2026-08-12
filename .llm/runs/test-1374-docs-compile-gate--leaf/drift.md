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
