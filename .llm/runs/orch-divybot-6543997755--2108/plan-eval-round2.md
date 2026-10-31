**PASS.** All three round-1 blockers are fixed.

1. **Proof entry point and method:** fixed.
   - The plan now names the entry point (`run-adoption.ts`), the command that runs it and the files it uses.
   - The normal test run can't start Aspire: the script isn't named `*_test.ts` and only runs when called directly.
   - It writes a sanitized JSON receipt with named steps, exits non-zero on any failed step, and tears down only its own AppHost.
   - Each workflow now has a defined start call and a stored-state read that proves it ran. The job uses the workers trigger and executions APIs, the saga uses publish plus the instance API, and the trigger uses its webhook plus the events API. I spot-checked these routes against the plugin contracts on main.
   - Saga replay is proven with a duplicate idempotency key followed by a fresh barrier message, then a check of the final state and version.
   - The runner outside Aspire is proven by stopping only the `sagas` resource, launching the generated runtime directly with Deno, and requiring the expected stored state before restoring the resource.

2. **Generated project check and lint:** fixed. The structured check and lint wrappers run against the consumer's own `deno.json` over userland code, generated registries and the Aspire helpers. This runs in the scaffold-only regression test and in the opt-in proof. A control puts back an unused DB variable in a helper and expects lint to fail.

3. **Negative controls and evidence map:** fixed. Each acceptance box now has its positive evidence and a matching control in a throwaway copy:
   - runner ignoring `NETSCRIPT_SAGA_STORE`;
   - projection setting ignored;
   - `RequiresDb` or DB environment injected;
   - duplicate-replay protection removed.

   Mutations are restored and file hashes compared before the normal gates run. The release-gate note's existing absence is recorded as evidence.

**Non-blocking points for IMPL-EVAL to check:**
- Confirm CI actually runs `kv-only-plugins_test.ts`, either through the root test or quality tasks. It should match how the sibling auth consumer test is picked up.
- The runner-outside-Aspire control (fail on early exit) is weaker than the others. The receipt should show the saga version advancing only after the direct runner is ready.
- Exact route prefixes should come from the generated contracts, not be hardcoded guesses.

VERDICT: PASS
