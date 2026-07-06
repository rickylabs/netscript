# Anti-Pattern Catalog

Quick evaluator reference. Doctrine source:
`docs/architecture/doctrine/09-anti-patterns-and-fitness-functions.md#anti-pattern-catalog`.

Reference trust note: this catalog follows the current doctrine range `AP-1` through `AP-25`.
Historical checker refs such as `F-DOCT-*`, `A8/AP-9` for file size, or `AP-19` for default exports
must be translated through
`docs/architecture/doctrine/ref-migration-map.md` before an evaluator treats them as trusted refs.

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
| AP-9  | Premature abstraction (the Wet Codebase failure)                                | flags/generic helper hiding divergent callers                               |
| AP-10 | Defensive `try/catch` inside handlers                | handler swallows/remaps errors instead of supervisor boundary               |
| AP-11 | Hidden globals                                       | module-load clients, env reads, loggers, stores, or implicit resources      |
| AP-12 | `Date.now()` and `setTimeout` in handlers            | time/scheduling bypasses a clock/scheduler port                             |
| AP-13 | `console.log` in published code                      | direct console use outside CLI presentation/examples                        |
| AP-14 | Re-exporting upstream packages                       | exported upstream npm/jsr symbols as package surface                        |
| AP-15 | `interface IFoo` / `type FooT`               | Hungarian or suffix naming forbidden by doctrine                            |
| AP-16 | `utils/`, `helpers/`, `common/`, `lib/` folders      | generic folder names under package source                                   |
| AP-17 | `interfaces/` folder for the package's own interfaces          | ports/types not named by consumed role                                      |
| AP-18 | Test snapshots of giant generated strings                     | brittle snapshots where semantic assertions are needed                      |
| AP-19 | Permissions assumed silently                         | README omits actual Deno/network/KV/process permissions                     |
| AP-20 | Workspace `compilerOptions.lib` override missing `deno.unstable`       | member config overrides lib without unstable Deno types                     |
| AP-21 | Flat command-surface folder                          | `presentation/`/`routes/`/`handlers/` folder with >12 immediate children instead of vertical slicing |
| AP-22 | Useless re-export barrel                              | sub-`src/` `mod.ts`/`index.ts` that only `export *` without aggregation logic |
| AP-23 | Inline command body in composition                   | composition root containing `.command()`/`.option()`/`.action()`/route/handler bodies instead of wiring-only |
| AP-24 | Switch-over-tagged-union instead of registry         | `switch` over a variant union returning implementations instead of a typed registry |
| AP-25 | Side effect in non-edge file                         | `Deno.*`/`console.*`/`fetch`/`Date.now`/`setTimeout` in a non-edge file instead of injected port |

## Evaluator Use

Only mark an AP `CLEAR` when the run scope touched or could reasonably affect that pattern. Use
`N/A` for patterns outside scope. Use `DEBT_ACCEPTED` only with a matching `../debt/arch-debt.md`
entry.
