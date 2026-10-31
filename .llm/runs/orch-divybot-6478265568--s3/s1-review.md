**FAIL_FIX.** The format itself is sound. Two small, concrete blockers remain before slice 1 should be signed off.

## Blockers

1. **The slice-1 test covers no contract fields.** `tests/contracts/format.test.ts:4-10` is named "preserves every serializable field deterministically", but its only fixture is `{ schemaVersion: 1, components: [] }`. That means no `ComponentContract` field is ever serialized or round-tripped. The plan's slice-1 gate is "schema tests", and this test proves only that an empty array survives `JSON.stringify`.
   - **Fix:** add at least one fully populated contract. It should use every optional field: `required`, `values` and `default` on a prop; `when`, `representation` and `planned` on a part; `default`, `parts`, `plannedValues` and `description` on an attribute. It should also have a `data-*` attribute key, slots, keyboard entries, token roles and notes. Assert that `JSON.parse(serialize(x))` deep-equals `x`, and that serializing twice gives byte-identical output.

2. **The published README will have a broken link.** The root `README.md` links to `src/contracts/README.md`, but `deno.json` `publish.include` only lists the root `README.md` and `tokens/README.md`. The contributor guide therefore isn't in the JSR package, and the link on the JSR page will 404. The tokens guide already set the pattern here: it was added to the include list for exactly this reason.
   - **Fix:** add `"src/contracts/README.md"` to `publish.include`.

## Checks that passed

- **Slow types:** none. `serializeComponentContracts` declares its `: string` return type. Everything else is interfaces or type aliases, and the facade's re-exports are type-only (`export type {…}`). The `` `data-${string}` `` record key is fine for JSR.
- **Side effects:** none. Nothing runs when the module loads, and there is no file access, `Deno.*` or global state. The serializer is a pure function.
- **Layering:** clean. `contracts.ts` imports only from `src/contracts/`, and `serialization.ts` uses `import type`. `mod.ts` doesn't re-export contracts, so the root runtime stays small. The subpath export and the `*.ts` / `src/**/*.ts` publish globs cover the new code.
- **Contract format:** the format matches the plan. It has `schemaVersion: 1` as a literal type, element, native, pseudo and context representations, `planned` and `plannedValues`, real `data-*` attribute names, slots, APG, keyboard and token roles. Nothing in it would force a later breaking change in slice 2 or 3.

## Non-blocking notes

- The `ContractAttribute.description` doc comment (`component-contract.ts:40`) describes pseudo states rather than saying what the field is.
- `ContractAttribute.parts?` says "empty means component root", but because the field is optional, leaving it out and passing an empty list are two different ways to say the same thing. Say which one is intended.
- Optional fields accept an explicit `undefined`, which `JSON.stringify` drops, so a round-trip can come back unequal. Either document "omit, don't set undefined" or have the slice-2 data tests reject it.
- `src/contracts/README.md` already describes `catalog/`, style-fixture render tests and negative controls, which arrive in slices 2 and 5. That's fine if the PR lands as one, but it isn't true yet at slice 1.
- Adding `contracts.ts` brings the `fresh-ui` package root to 21 children. The doctrine cap is 12, so this was already over the limit and only raises a warning.

I made no edits. I reviewed the source and the existing slice-1 run evidence, and didn't run any tests or checks myself.
