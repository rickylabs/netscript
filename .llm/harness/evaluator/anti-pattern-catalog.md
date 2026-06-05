# Anti-Pattern Catalog

Quick evaluator reference. Doctrine source:
`.llm/research/architecture-doctrine-docs-v2/doctrine/09-anti-patterns-and-fitness-functions.md#anti-pattern-catalog`.

| AP    | Summary                                              | Typical evidence                                                            |
| ----- | ---------------------------------------------------- | --------------------------------------------------------------------------- |
| AP-1  | Monolithic file                                      | `.ts` or `_test.ts` file beyond doctrine threshold without accepted debt    |
| AP-2  | Helper that renames a platform primitive             | local wrapper over Web Platform, `Deno.*`, or `@std/*` without policy/seam  |
| AP-3  | God interface                                        | broad port/interface with unrelated methods or optional adapter obligations |
| AP-4  | Cross-package implementation inheritance             | `extends` a base class from another package                                 |
| AP-5  | Multi-level base lattice without subtype distinction | abstract class chain with no caller-visible axis                            |
| AP-6  | Base class with concrete methods                     | orchestration, logging, state, or utilities in a base class                 |
| AP-7  | Telescoping factory                                  | many positional arguments instead of typed options or builder               |
| AP-8  | Premature DI container                               | container introduced without doctrine escalation conditions                 |
| AP-9  | Premature abstraction                                | flags/generic helper hiding divergent callers                               |
| AP-10 | Defensive `try/catch` inside handlers                | handler swallows/remaps errors instead of supervisor boundary               |
| AP-11 | Hidden globals                                       | module-load clients, env reads, loggers, stores, or implicit resources      |
| AP-12 | `Date.now()` and `setTimeout` in handlers            | time/scheduling bypasses a clock/scheduler port                             |
| AP-13 | `console.log` in published code                      | direct console use outside CLI presentation/examples                        |
| AP-14 | Re-exporting upstream packages                       | exported upstream npm/jsr symbols as package surface                        |
| AP-15 | `interface IFoo` or `type FooT` naming               | Hungarian or suffix naming forbidden by doctrine                            |
| AP-16 | `utils/`, `helpers/`, `common/`, `lib/` folders      | generic folder names under package source                                   |
| AP-17 | `interfaces/` folder for package interfaces          | ports/types not named by consumed role                                      |
| AP-18 | Giant generated-string snapshots                     | brittle snapshots where semantic assertions are needed                      |
| AP-19 | Permissions assumed silently                         | README omits actual Deno/network/KV/process permissions                     |
| AP-20 | Workspace lib override missing `deno.unstable`       | member config overrides lib without unstable Deno types                     |

## Evaluator Use

Only mark an AP `CLEAR` when the run scope touched or could reasonably affect that pattern. Use
`N/A` for patterns outside scope. Use `DEBT_ACCEPTED` only with a matching `../debt/arch-debt.md`
entry.
