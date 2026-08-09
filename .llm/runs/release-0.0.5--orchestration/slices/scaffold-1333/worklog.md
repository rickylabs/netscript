# Worklog: #1333

## Design

- **Public surface:** generated Fresh application structure and behavior; no framework export-map or
  public builder change planned.
- **Archetype/profile:** CLI/tooling Archetype 6 plus `SCOPE-frontend`.
- **Contract path:** generated database schema → versioned service contract → typed service client /
  query factory → route contract/resources/layers → QueryIsland/forms/views.
- **Ownership:** the canonical resource directory owns `(_lib)`, `(_shared)`, `(_components)`, and
  `(_islands)`; the CLI writer/manifest owns deterministic emission.
- **Runtime:** one token-granted full `scaffold.runtime` pass only after all non-Aspire gates.
- **Closure:** row 10 is observational and owned in substance by #1090; owner decision required
  before any closing keyword.

## Progress

- Clean branch created at `origin/main@35358886a`; upstream unset.
- Requested skills and harness/plan/frontend instructions read.
- Live #1333 acceptance body and owner follow-up read; #1090 measurement contract cross-checked.
- Current templates, writer, asset manifest, app-name resolution, DB contract seam, route seeds,
  focused tests, and runtime home gate opened before planning.
- Baseline measured: 50 app assets / 165,796 bytes; generated CLI barrel 283,217 raw / 62,035 gzip.
- `PLAN-EVAL: REQUIRED — pending owner-launched separate session.` No product source edited.

## Next handoff

Owner approved option A on 2026-08-09 and moved row 10 to #1090. Implementation of rows 1-9 is
authorized in S1-S6 order. S1 begins with omitted/explicit app-name negative controls.

## S1 — project-derived default app name

### Pre-fix RED

Command:

`deno test --no-lock --allow-all packages/cli/src/public/features/init/init-command_test.ts`

Raw exit **1**: 9 passed / 2 failed. The omitted-name assertion expected
`inventory-console-web` and received `dashboard`; the interactive prompt expected
`interactive-app-web` and advertised `dashboard`. The explicit `backoffice` authority control
passed in the same run.

### Implementation

- Added the pure `deriveDefaultAppName` domain rule and used it from shared option validation and
  the public interactive prompt.
- Omitted `inventory-console` becomes `inventory-console-web`; `storefront-web` and `web` do not
  duplicate the suffix; explicit `backoffice` remains authoritative.
- The derivation trims only the project prefix when necessary so a valid 64-character project name
  still emits a valid 64-character app name ending in `-web`.

### Gates

| Gate | Result |
| --- | --- |
| Focused domain + public + maintainer init tests | raw exit 0; 14 passed / 0 failed |
| Scoped check (`--unstable-kv --no-lock`) | raw exit 0; 5 files / 1 batch / 0 findings |
| Scoped lint | raw exit 0; 5 files / 1 batch / 0 findings |
| Scoped format | raw exit 0; 5 files / 1 batch / 0 findings |
| Package code-quality scan | raw exit 0; 0 findings / 6 existing allowances |
| Package doctrine scan | raw exit 1; FAIL=50 WARN=51 INFO=1 |
| Exact `origin/main` doctrine baseline | raw exit 1; FAIL=50 WARN=51 INFO=1, byte-identical finding set |

The first scoped-check attempt used unsupported `--deno-arg=--no-lock` syntax and exited 1 before
running a check. The required corrected form, `--deno-arg --no-lock`, then executed and exited 0;
the failed invocation is not reported as a product verdict. Package doctrine remains red solely on
the exact pre-existing baseline and introduces no new finding in S1.
