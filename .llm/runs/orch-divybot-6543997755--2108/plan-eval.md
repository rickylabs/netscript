**FAIL_PLAN.** The scope is right and the existing contracts are confirmed on main, but the plan leaves its own proof and gates unspecified, which fails the plan-gate's "commit slices name the gate that proves them" box.

**What checks out:** The research matches main.
- The store and projection resolvers exist in `packages/plugin-sagas-core/src/stores/` and have tests.
- `saga-kv-only-runner_test.ts` and `saga-canonical-backend_test.ts` exist.
- The `init` database choice accepts `none`.
- The generated Aspire helpers now only declare the DB variables when a plugin needs a database (`registration-preamble.ts`).
- The "separate release acceptance gate" note the issue asks to remove is already gone from `add-a-plugin.md`. The run record should say so, so that acceptance box gets evidence.

**Blockers:**

1. **The opt-in proof has no defined entry point and no defined method.** S1 and S2 say "opt-in proof" under `packages/cli/e2e/fixtures/kv-only/` but name no files, no command and no pass/fail or evidence contract. The plan also pushes "how each job, saga and trigger is started and how its stored KV state is checked" to after PLAN-EVAL. That is the core of the proof, so leaving it open could force rework. Fix:
   - Name the entry-point script and the exact command that runs it.
   - Make sure the normal test run (`deno task test`, CI) can't pick it up and start Aspire, for example by not naming it `*_test.ts` or by guarding it with an environment flag.
   - For each of the job, the saga and the trigger, state how it is started (plugin API call or CLI) and which stored KV record or API read proves it ran.
   - Do the same for saga replay and for the runner started outside Aspire.

2. **The generated KV-only project is never type-checked or linted.** The issue's own evidence for this exact setup was a lint failure in the generated `register-background` helpers. The CI runtime suite only covers PostgreSQL and SQLite, so nothing else checks this output. Fix: run `deno check --unstable-kv` and `deno lint` on the generated project, including the Aspire helpers. Put this in the S1 scaffold-only test (`kv-only-plugins_test.ts`) so CI runs it, and in the opt-in proof.

3. **The "red when reverted" requirement and the negative controls are undefined.** The assignment needs runner store and projection tests shown to fail when reverted. The plan only says "add negative control evidence" and "negative controls", and has no table linking each acceptance box to its evidence, which the READY report needs. Fix: list each control and its expected failure:
   - Runner ignores `NETSCRIPT_SAGA_STORE` → the backend test fails.
   - Projection setting removed or duck-typing put back → the projection test fails.
   - DB metadata or DB environment injected into the fixture → the consumer's no-DB check fails.
   - Duplicate replay processed twice → the replay check fails.

   Run them in a throwaway copy, never committed, and record sanitized output. Then add the acceptance-box → evidence table.

Everything else is adequate: the decision to keep this to tests, fixtures and docs, the PR-scope note, the risk register, the deferral of a new CI tier, JSR marked N/A, the write surface, and requesting the CI runtime verdict at READY.

VERDICT: FAIL_PLAN
