**Verdict: FAIL_FIX**

This is a substantive slice-1 review. Native import, export, commands and build belong to slice 2, so I did not count them as missing. Most of the slice holds up, but one rejection rule required by the plan is missing, and two coverage requirements are not enforced or not tested.

### What I verified

**Gates (run from the repo root, read-only):**
- `run-deno-check.ts --root tools/figma-component-library --ext ts,tsx`: 9 files, 0 findings, exit 0.
- `run-deno-lint.ts … --config tools/figma-component-library/lint.deno.json`: 9 files processed, 0 findings. Without `--config`, the wrapper refuses all 9 files as "all-excluded". The worklog should record the exact command with `--config`.
- `run-deno-fmt.ts … --ext ts,tsx`: 9 files processed, 0 findings.
- `run-deno-test.ts -- --allow-all tools/figma-component-library/tests/generate_test.ts`: 8 passed, 0 failed.

**Real-data probes** (scratch scripts in `$TMPDIR` only):
- **Inventory counts reproduce:** 52 entries, 35 unregistered contracts (14 shipped, 21 planned), and 1,958 variants without prose plus 88 for prose, which is 2,046 in total.
- **Only gap:** across all 87 contracts, the only role failure is `prose/h4/tracking`. Full generation throws before returning anything.
- **Subset round trip:** all 51 non-prose items as one subset report `complete:false` with `markdown` omitted. The JSON → `validateLibrary` round trip passes, and every embedded contract is byte-identical to the source contract.
- **Tamper rejection:** an edit to `contract.notes` is rejected.
- **Role rules:** `SF:` roles bind to Theme set only; `padding-x|y` expands to both values (`app-shell` is the positive control); `chart/1..5` resolves.
- **Limits:** the per-component and whole-library variant limits are enforced before output.
- **No out-of-scope edits:** nothing changed in `packages/`, `deno.json`, `deno.lock` or `tools/figma-plugin`.

### Defects to fix (blocking)

1. **Two registry items can map to the same contract** (`src/inventory.ts:42-64`, `:78`). The plan says to "Reject stale overrides, unknown targets and duplicate logical/source mappings", but only duplicate physical sources are rejected.
   - Reproduced: fixture style map `{example-button, alt-button}` plus alias `alt-button → example-button` produced two components, both with contract `example-button`.
   - Fix: reject when a contract has already been claimed by another entry, and add a negative test for it.
2. **A missing `root` part is not rejected** (`src/validate-contract.ts:62-79`, used by `src/generate.ts:60`).
   - Per `ComponentContractAttribute.parts`, an empty or missing `parts` means the component root, so the generator writes `['root']`. The tool's validator never checks that a `root` part exists. Only the upstream catalog test does, and the tool accepts any input.
   - Reproduced: a contract whose only part is `label` generated an axis scoped to a `root` part that does not exist.
   - Fix: require `root` in `validateContracts` and add that case to the malformed-contract test.
3. **No test covers the list of unmatched contracts** (`tests/fixture.ts`, `tests/generate_test.ts:173-201`).
   - The fixture has a single contract, which is mapped, so `unregisteredContracts` is never exercised. The real-data test only asserts `entries.length > 0`.
   - As a result, the 52/35/14/21 figures in the worklog and drift record are not backed by any executed check.
   - Fix: add an unmapped shipped contract and an unmapped planned contract to the fixture, and assert that both are listed with the correct `shipped` flag and are not generated as components. On real data, assert that the generated entries and the unregistered contracts together cover the whole catalog with no overlap. This is a derived check, not a hardcoded list.

### Should fix (not blocking)

- **Whitespace in variant values** (`src/validate-contract.ts:5`): values with leading or trailing spaces are accepted, so `rest` and ` rest` are both allowed. Figma likely trims variant values, so the two could collide. Require non-space characters at both ends.
- **Leading zeros in ranges** (`src/token-bindings.ts:15-18`): `chart/01..03` silently becomes `chart/1…3`, which changes the token identity. Reject leading zeros.
- **Ambiguous component source** (`src/inventory.ts:57`): the first `.ts`/`.tsx` file is taken as the source. No current item has more than one, but if one ever does, reject it rather than picking the first.
- **Negative tests don't check the error message** (`tests/generate_test.ts:62-64, 89-96, 116-121, 148`): they use bare `assertThrows`, so a test could pass because of an unrelated error. Matching the message would prove each test hits the check it targets.
- **Role syntax only checked for selected items:** role syntax for unselected and unregistered contracts is only checked when those items are resolved. It could be checked across the whole catalog without resolving bindings, which keeps the partial `--items` path working.

### Acceptance status

The current-source behaviour is correct. The `prose/h4/tracking` gap is labelled UNPROVEN in the test, and full generation is asserted to throw rather than being made to pass. Subsets carry `complete:false`. All-S5, editor, MCP and publication acceptance stay with #2418 and #2412.

I made no edits, commits, comments or agent launches. Please keep this session for the final IMPL-EVAL after slice 2.
