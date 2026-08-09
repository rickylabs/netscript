# Plan: #1373 one golden-path client module and query dialect

## PLAN-EVAL

`PLAN-EVAL: N/A` — bounded source-alignment correction. The live issue locks the module pattern
(`apps/<app>/lib/<service>.ts`), canonical API (`createQueryFactories`), the one-page legacy API
exception, symbol derivation, aliases, negative gates, and boundaries. No naming, API, architecture,
or product trade-off remains open. Owner-controlled opposite-family IMPL-EVAL remains mandatory.

## Profile

- Archetype 6 — CLI/tooling for the `service add --with-client` scaffold template.
- `SCOPE-docs` overlay for published documentation and accuracy guards.
- Current CLI verdict remains Restructure; this slice changes the existing asset/test seam and
  adds no abstraction, export, dependency, or folder.

## Locked decisions

1. Service-derived exports use the existing Vento `camelCase` service name:
   `<service>Name`, `<service>RouterName`, `<service>Contract`, `<service>ListInvalidation`,
   `<service>Client`, and `<service>Queries`.
2. Every default-scaffold consumer uses the same substitution; the default file path remains the
   existing generated `lib/example-service.ts`, while `service add orders --with-client` writes
   `lib/orders.ts` with `orders*` exports.
3. Published golden-path pages teach `createQueryFactories` positional action calls and the
   per-service module path. `createServiceQueryUtils` remains documented only on the generated SDK
   reference page, which must explicitly state `queryOptions({ input })`, no KV tier, and do-not-mix.
4. Accuracy checking sweeps publishable `.md`/`.vto` sources under `docs/site`, excluding generated
   `_site` and private underscore directories, and fails on retired paths/aliases or a legacy API
   occurrence outside the single allow-listed reference page.
5. Do not edit `_site`, `_plan`, `.llm/runs` history, #1374 compile-proof scope, or unrelated SDK
   implementation.

## Commit slices

| Slice | Scope | Proving gate |
| --- | --- | --- |
| S0 | Research, design, PLAN-EVAL N/A, draft PR | clean baseline and artifact review |
| S1 | Service-derived client-template symbols and all generated consumers | pre-fix RED; focused CLI template/scaffolder tests; canonical asset regeneration |
| S2 | Published docs convergence and durable negative accuracy checks | 192-source sweep; mutation REDs; docs accuracy/build/link/caveat gates |
| S3 | Aggregate static/fitness gates and handoff | scoped check/lint/fmt, quality scan, arch check, clean diff |

## Failure matrix

| Contract | Pre-fix state | Kind |
| --- | --- | --- |
| non-default service symbols | `orders.ts` exports `exampleService*` | behavioral |
| one module path | ten published pages teach the nonexistent aggregate file | docs correctness |
| CSS entry | quickstart labels `client.ts` as a data client | docs correctness |
| one dialect | golden path mixes positional and `{ input }` query options | docs correctness |
| flag discovery | only CLI command reference names `--with-client` | docs correctness |
| aliases | samples contain unresolved `@contracts` and `@/lib/...` | docs correctness |
| durable guards | accuracy checker accepts every retired spelling/API occurrence | behavioral gate |

## Validation

1. Add non-default symbol assertions before the template change; require raw exit 1 quoting the
   missing `orders*` exports, then green after implementation.
2. Add accuracy guards and prove each with isolated scratch mutations: a retired module/alias and a
   legacy API on an unapproved page must each make `docs:accuracy` exit non-zero; clean rerun exits 0.
3. Sweep all 192 publishable source pages and report final occurrence/page counts and changed-page
   count.
4. Run focused CLI tests, canonical asset check, docs build/link/caveat gates, scoped wrappers,
   `quality:scan`, and `arch:check`; no Aspire/container/E2E run.
