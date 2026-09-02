# Research — feat-cli-resource-slice-contract--1354-c

## Re-baseline

- Carried-in source: `origin/feat/cli-resource-slice-plan` master plan, Slice C.
- Re-derived against `origin/main` at `850cc7757d11d420b9061dbe6a61536357ab77fe`
  on 2026-09-02.
- The owner reports the master plan verdict as `PASS_PLAN_WITH_FINDINGS` with the D3 narrowing and
  generated-carrier amendment applied. This slice does not re-plan those locked decisions.
- Live D9 measurement: #1664 head `d155db116db16b0d9d82f31bd8401a5d07505d42`;
  `git diff --name-only 850cc7757...d155db116` reports 163 paths and zero paths under
  `packages/cli/src/kernel/application/resource-slice/`. Intersection with Slice C's ten-file
  product touch set is empty.

## Findings

| # | Finding | How to verify |
| --- | --- | --- |
| 1 | The requested ten product paths do not exist at the baseline. | `find packages/cli/src/kernel/application -maxdepth 2 -type f` |
| 2 | `packages/cli` is Archetype 6 with current doctrine verdict `Keep`. | `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md` |
| 3 | Application code may import domain/ports and platform-pure libraries, but no adapters, presentation, `Deno.*`, console, network, or filesystem calls. | doctrine 05; `ARCHETYPE-6-cli-tooling.md` R-A6-N8/F-CLI-28 |
| 4 | The stock router imports `routePatterns` and `routes as generatedRoutes`, and exposes `export const appRoutes = { ... } as const`. | `packages/cli/src/kernel/assets/app/router.ts.template` |
| 5 | The package already maps `@std/text`; its casing functions provide the naming primitives needed by the normalized contract. | `packages/cli/deno.json`; `deno doc @std/text` |
| 6 | Web `crypto.subtle` is the doctrine-authorized SHA-256 primitive and requires no package dependency. | doctrine 04 lookup table |
| 7 | No current debt entry is specific to resource-slice reconciliation; the known future directory-cardinality warning is locked as observation, not new debt. | `.llm/harness/debt/arch-debt.md`; master plan Slice C |

## jsr-audit surface scan

- Surface scanned: internal `packages/cli/src/kernel/application/**` only; `mod.ts`, exports,
  `deno.json`, and public JSDoc do not move.
- Slow-type / surface risks: none introduced because this slice adds no package export.
- Full package publishability remains a later assembled-wave gate; scoped check/lint/fmt plus
  doctrine/quality gates are required here.

## Open questions

- None. The master plan and the owner's D3 narrowing resolve all behavior choices for Slice C.
