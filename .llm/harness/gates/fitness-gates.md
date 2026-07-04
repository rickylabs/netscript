# Fitness Gates

Fitness gates are the executable form of the doctrine. Doctrine source:
`docs/architecture/doctrine/09-anti-patterns-and-fitness-functions.md`.

The fitness surface is real and lives under `.llm/tools/fitness/*.ts`. This file names the actual
scripts, the aggregators that run them, and the evaluator reporting shape. It does **not** invent
script names: every path below exists in the tree. Run the aggregators for a verdict; reach for the
per-domain `check-*.ts` family when a single anti-pattern class needs an isolated check.

## Aggregators (entrypoints)

Prefer these for merge-readiness and package/JSR verdicts — each fans out to the per-domain scripts.

| Aggregator                                       | Runs                                                                                             | Use for                                    |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| `.llm/tools/fitness/check-architecture-gates.ts` | doctrine (`check-doctrine.ts`) + design-system gates (`check-ds-no-raw-hex.ts`, `check-ds-color-utilities.ts`); this is `deno task arch:check` | single merge-readiness architecture verdict |
| `.llm/tools/fitness/audit-jsr-package.ts`        | single-package JSR + doctrine audit; internal gates F-1 (folder vocabulary), F-2 (file-count caps), F-3 (no `I`-prefix), F-4 (no helpers/utils dumping ground), F-5 (`mod.ts` present), F-6 (`deno.json` JSR-valid), F-7 (publish dry-run clean); also docs/surface/slow-types/tests sections | per-package JSR + doctrine readiness (`--root <pkg>`) |
| `.llm/tools/fitness/audit-all-packages.ts`       | `audit-jsr-package.ts` across every `packages/*` (and `plugins/*` with `--include-plugins`)       | repo-wide package readiness roll-up        |
| `.llm/tools/fitness/release-readiness.ts`        | JSR (`audit-jsr-package.ts`) + doctrine (`check-doctrine.ts`) + standards (`check-netscript-standards.ts`) + CLI fitness (`check-cli-*.ts`) per package | release-gate roll-up (`_summary.md`)       |
| `.llm/tools/fitness/check-doctrine.ts`           | mechanical doctrine evaluator — axioms A1..A14 + anti-patterns AP-1..AP-30 at the granularity that can be checked mechanically; findings tagged `A##`/`AP-##`/`F-DOCT-##` | per-root anti-pattern coverage (`--root <pkg>`) |
| `.llm/tools/fitness/check-netscript-standards.ts`| cross-package public-surface uniformity (findings tagged `NS-S-##`); stricter than doctrine       | per-root standards readiness (`--root <pkg>`) |

## Per-domain `check-*` family

When a single anti-pattern class needs an isolated check (or an aggregator flags one domain), run the
matching script. All paths are under `.llm/tools/fitness/`.

| Domain                             | Scripts                                                                                                                                                                                             | Primary AP focus            |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| Structure / layering / composition | `check-abstract-coloc.ts`, `check-composition-shape.ts`, `check-extension-points.ts`, `check-instantiation-edges.ts`, `check-folder-cardinality.ts`, `check-manifest-integrity.ts`, `check-template-location.ts`, `check-template-registry.ts` | AP-4/5/6, AP-16/17          |
| Naming / edges                     | `check-no-i-prefix.ts`, `check-console-edges.ts`, `check-process-edges.ts`                                                                                                                          | AP-13, AP-15, AP-19         |
| CLI archetype                      | `check-cli-structure.ts`, `check-cli-barrels.ts`, `check-cli-file-size.ts`, `check-cli-isolation.ts`, `check-cli-naming.ts`, `check-cli-no-leak-markers.ts`, `check-cli-presentation.ts`, `check-cliffy-containment.ts`, `check-command-shape.ts` | AP-1, AP-14/15/16/17         |
| Design system                      | `check-ds-no-raw-hex.ts`, `check-ds-color-utilities.ts`, `check-token-drift.ts`                                                                                                                     | design-token discipline     |

Support files (not gate entrypoints): `cli-fitness-shared.ts` (shared lib), `check-ds-gates_test.ts`
(unit test), `generate-package-plans.ts` (plan generator).

> **Follow-up (#307-coordinated):** a faithful, exhaustive per-anti-pattern (AP-1..AP-30) → script
> map is intentionally not enumerated here — the real surface is 32 domain scripts against 30
> anti-patterns and the correspondence is many-to-one and partly aggregator-mediated. The canonical
> per-AP mapping belongs with the fitness-tool audit tracked under #307; until then,
> `check-doctrine.ts` is the mechanical AP-1..AP-30 authority and the family table above is the
> pointer.

## Reporting States

| State            | Meaning                                                               |
| ---------------- | --------------------------------------------------------------------- |
| `PASS`           | Script or manual equivalent found no violation.                       |
| `FAIL`           | Violation found and not accepted as debt.                             |
| `PENDING_SCRIPT` | No dedicated script exists for this domain yet; manual evidence required. |
| `N/A`            | Gate does not apply to the archetype or scope.                        |
| `DEBT_ACCEPTED`  | Violation exists and has a valid `arch-debt.md` entry.                |

## Manual Evidence When No Dedicated Script Exists

When a domain has no dedicated script, the generator/evaluator performs the narrowest manual check
that matches the gate. Examples:

- File size / folder cardinality: inspect line counts and folder shape for changed package files
  (or run `audit-jsr-package.ts` F-1/F-2 for the package).
- Layering: inspect imports across touched role folders (or run `check-instantiation-edges.ts` /
  `check-composition-shape.ts`).
- Public surface / doc coverage: run `deno doc --lint` and read exported symbols (or the docs/surface
  sections of `audit-jsr-package.ts`).
- Permission declaration: compare README permissions to touched `Deno.*`, network, KV, and process
  calls (or run `check-process-edges.ts`).
- Anti-pattern coverage generally: run `check-doctrine.ts --root <pkg>` before hand-auditing.

Manual evidence is temporary. When a domain gains a dedicated script it replaces the manual check.

## Debt Rule

A known violation can close only as `DEBT_ACCEPTED` when `../debt/arch-debt.md` has a matching,
time-bounded entry. Unrecorded violations cause `FAIL_DEBT` or `FAIL_FIX` depending on whether code
changes are required.
