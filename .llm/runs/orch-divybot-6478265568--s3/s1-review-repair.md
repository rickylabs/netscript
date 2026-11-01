**PASS.** Both slice-1 blockers are fixed and nothing else blocks this slice.

1. **Round-trip test:** `tests/contracts/format.test.ts:5-48` now uses a fully populated contract, and every optional field appears in it:
   - **Prop:** `required`, `values`, `default` and `description`.
   - **Part:** one part with no options and one with `when`, `representation: 'native'` and `planned`.
   - **Attribute:** a `data-variant` attribute with `default`, `parts`, `plannedValues` and `description`.
   - **Everything else:** `booleans`, `slots`, `keyboard`, `tokenRoles` and `notes`.

   The test still checks that parsing the output gives back the input, that serializing twice gives identical output, and that the output ends with a newline.

2. **Publish surface:** `deno.json:35` now includes `src/contracts/README.md`, so the root README's link to the contributor guide will work on JSR.

The doc fixes are also in. `ContractAttribute.parts` now says "omitted or empty means component root" (`component-contract.ts:36`). The `description` comment now describes the field itself (`:40`).

I re-read only these files and didn't run the test or any checks. Before sign-off, have the slice record the actual exit codes from the scoped test, check, lint and format runs.
