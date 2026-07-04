# Fitness Gates

Fitness gates are the executable form of the doctrine. Doctrine source:
`docs/architecture/doctrine/09-anti-patterns-and-fitness-functions.md`.

The fitness surface is real and lives under `.llm/tools/fitness/*.ts`. This file names the actual
scripts and the evaluator reporting shape. It does **not** invent script names: every path below
exists in the tree. The surface is deliberately small — a mechanical doctrine evaluator plus a
per-package JSR/doctrine auditor plus the design-system token gates. There is **no** per-domain
`check-cli-*` / `check-*-edges` / `check-*-shape` family and **no** `release-readiness` /
`audit-all-packages` / `check-netscript-standards` aggregator; those were dead code and were
removed. For any domain that has no dedicated script, evaluators use manual evidence plus
`check-doctrine.ts` coverage (see `PENDING_SCRIPT` below).

## Gate scripts (entrypoints)

All paths are under `.llm/tools/fitness/`.

| Script                     | What it does                                                                                                                                                                                                                            | Use for                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| `check-doctrine.ts`        | Mechanical doctrine evaluator — axioms A1..A14 + anti-patterns AP-1..AP-30 at the granularity that can be checked mechanically; findings tagged `A##`/`AP-##`/`F-DOCT-##`. Takes `--root <pkg>` (defaults to repo-wide with no root).      | per-root anti-pattern coverage (`--root <pkg>`); this is the script `deno task arch:check` runs |
| `audit-jsr-package.ts`     | Single-package JSR + doctrine audit; internal gates F-1 (folder vocabulary), F-2 (file-count caps), F-3 (no `I`-prefix), F-4 (no helpers/utils dumping ground), F-5 (`mod.ts` present), F-6 (`deno.json` JSR-valid), F-7 (publish dry-run clean); also docs/surface/slow-types/tests sections. | per-package JSR + doctrine readiness (`--root <pkg>`) |
| `check-ds-no-raw-hex.ts`   | Design-system gate: no raw hex color literals; tokens only.                                                                                                                                                                              | design-token discipline (design-system packages) |
| `check-ds-color-utilities.ts` | Design-system gate: color utilities go through the token layer, not ad-hoc.                                                                                                                                                           | design-token discipline (design-system packages) |

Support file (not a gate entrypoint): `check-ds-gates_test.ts` — the unit test for the two
design-system gates.

## `deno task arch:check`

`deno task arch:check` runs `check-doctrine.ts --root <pkg>` over each owned package/plugin root in
turn (the exact root list lives in the `arch:check` task in `deno.json`), after `deps:check`.
`deno task arch:check:repo` runs `check-doctrine.ts` once repo-wide (no `--root`). `check-doctrine.ts`
is the mechanical AP-1..AP-30 authority; there is no separate architecture-gates aggregator.

## Reporting States

| State            | Meaning                                                               |
| ---------------- | --------------------------------------------------------------------- |
| `PASS`           | Script or manual equivalent found no violation.                       |
| `FAIL`           | Violation found and not accepted as debt.                             |
| `PENDING_SCRIPT` | No dedicated script exists for this domain; manual evidence required. |
| `N/A`            | Gate does not apply to the archetype or scope.                        |
| `DEBT_ACCEPTED`  | Violation exists and has a valid `arch-debt.md` entry.                |

`PENDING_SCRIPT` is the common case, not the exception. The gate scripts above cover doctrine
anti-patterns (`check-doctrine.ts`), per-package JSR readiness (`audit-jsr-package.ts`), and
design-system tokens (the two `check-ds-*` gates). Every other domain — CLI archetype shape, folder
cardinality beyond `audit-jsr-package.ts` F-1/F-2, layering/edges, naming, composition — has **no**
dedicated script and is evaluated with manual evidence backed by `check-doctrine.ts` coverage. Report
those as `PENDING_SCRIPT` (with manual evidence and no detected violation) or `PASS` (with manual
evidence), not as a missing gate.

## Manual Evidence When No Dedicated Script Exists

When a domain has no dedicated script, the generator/evaluator performs the narrowest manual check
that matches the gate. Examples:

- Anti-pattern coverage generally: run `check-doctrine.ts --root <pkg>` before hand-auditing — it is
  the mechanical AP-1..AP-30 authority and should be the first evidence for any structural,
  layering, naming, or edges gate.
- File size / folder cardinality / folder vocabulary: run `audit-jsr-package.ts --root <pkg>`
  (F-1/F-2/F-4) for the package, or inspect line counts and folder shape for the changed files.
- Public surface / doc coverage: run `deno doc --lint` and read exported symbols (or read the
  docs/surface/slow-types sections of `audit-jsr-package.ts`).
- Permission declaration: compare README permissions to the touched `Deno.*`, network, KV, and
  process calls by reading the changed files.
- Design tokens: run `check-ds-no-raw-hex.ts` / `check-ds-color-utilities.ts` for design-system
  packages.

Manual evidence is temporary. If a domain later gains a dedicated script, that script replaces the
manual check and this file is updated to name it.

## Debt Rule

A known violation can close only as `DEBT_ACCEPTED` when `../debt/arch-debt.md` has a matching,
time-bounded entry. Unrecorded violations cause `FAIL_DEBT` or `FAIL_FIX` depending on whether code
changes are required.
