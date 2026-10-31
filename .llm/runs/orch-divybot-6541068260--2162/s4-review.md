# S4 independent slice review

The S4 test change is correct and weakens no gate. The old assertion was stale. I made no changes and didn't re-run the test file; the 29/29 result is from your run.

- **Why the old assertion was stale:** the test `plugin generation removes the last workers registry when its source disappears` required the generated workers registry to be deleted once its last job was removed. That was the old early-`null` behaviour, which the approved contract for #2162 reverses: removing the last definition and regenerating must keep a valid empty registry. The plugin README section from S2 already says so.
- **What the new test checks:**
  - **Before and after regeneration:** after the last job file is removed, `inspect` still reports `drift` before regeneration, and the command still exits 0.
  - **The empty registry:** the retained registry is actually imported, and both `registry` and `jobDefinitions` must have size 0.
  - **The output lists:** the read-only check must report `current`. The registry must appear in both the report's output list and the workers producer's output list.
  - **Read-only:** the project files must be unchanged before and after the read-only inspection.
  - **New negative check:** deleting the retained registry must give `drift` with a `missing` finding for that exact path. `missing` is a real drift kind, emitted at `packages/cli/src/kernel/adapters/service/generated-surface-inventory.ts:70`.
- **Unchanged tests:** the AI test still requires removing an inactive output it owns, via `assertMissing` at `plugin-check-command_test.ts:365`, with its `extra` drift check before regeneration. The foreign-ownership tests from line 408 onward are untouched, so the delete-what-it-owns and keep-what-it-doesn't rules are still covered.
- **Scope:** besides the run directory, only this test file changed. No runtime source or dependencies changed. `toFileUrl` was already imported (line 3), and `assertMissing` is still used, so nothing new goes unused.

The final IMPL-EVAL on the exact pushed head, after final CI, is still to come.

VERDICT: PASS
