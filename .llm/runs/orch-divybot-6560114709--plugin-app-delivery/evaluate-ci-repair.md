**Verdict: PASS**

The CI repair is safe to commit. Each stale expectation has been swapped for one that checks the current behaviour at least as tightly, and every repaired check can still fail. I found no blockers. The Docker runtime tiers stay unproven until they are re-dispatched after this repair is committed.

### 1. Lint fix in the example route templates

- **Single source:** `write-app-files.ts` is the only place that renders `examples/index.tsx.template` and `examples/crud.tsx.template` (`write-app-files.ts:354-374`). Both use the same `appTemplateVars` object, which now carries `serviceExampleHref` and `serviceExampleEntries`. No other caller can render the templates without those variables.
- **Same behaviour:** both new values use the same condition as `hasService` (`write-app-files.ts:50-57`).
  - With a service, the rendered code is `canonicalHref` / `serviceHref` set to `appRoutes.serviceExample.href()`, and the same two example entries are spliced in.
  - Without a service, the href is `undefined` and no entries are added.
  - This is exactly what the old `true ? … : …` / `false ? … : []` expressions evaluated to, minus the constant condition the linter flagged.
- **Carriers are in sync:** the regenerated asset bundle (`embedded.generated.ts`) contains the new fields.
- **Tests got stricter, not looser:**
  - `workspace-pages_test.ts` renders both variants.
  - It now asserts that no `true ?` or `false ?` text survives in the output.
  - `route-templates_test.ts` checks the resolved href.
- **No suppression:** no lint rule was suppressed or gate removed.
- **Non-blocking:** the entry title now uses `options.serviceName` where the old template used `plan.service?.name`. Both come from the same validated, kebab-case init input.

### 2. Webhook adoption test (`outbound-webhook-adoption_test.ts`)

- **Why it changed:** the negative-control gate now deletes the registries that install creates. Running it repeatedly would hit a NotFound on the second delete, and running it for the before/after comparisons would destroy the very state being compared.
- **The fix:**
  - The test runs the destructive gate once and requires exit code 1.
  - It then compares state with a read-only `plugin doctor` command.
  - That read-only command reuses the gate's `stdoutIncludes`, so the workers-specific and sagas remediation requirements still apply.
- **Can't false-pass:** if the gate's delete step ever ran against files that weren't there, it would exit non-zero without the expected output and the check would still fail.

### 3. Auth reconciler and runtime-gates tests

- **`browser-auth-reconciler_test.ts`** used to search for a literal `services__auth__http__0` string that the generator no longer emits. It now checks two things:
  - the stored link itself: `Apps.web.PluginReferences` must equal `['auth']`;
  - the helper's startup-time discovery loop: it must contain the `PluginReferences` read, `_plugins.get(ref)` and `services__${ref}__http__0`.
- **Covered elsewhere:** the injected runtime values are verified by `workspace-cors_test.ts`.
- **`runtime-gates_test.ts`** now pins the `workers` / `streams` arguments that the app-home gate passes to the probe.

### 4. Docker topology and suite-runner tests

- **`docker-topology_test.ts`** asserts both new message pieces: "Remote Docker is unsupported" and the explanation that `AppHost:ContainerHostname` only controls the reverse direction.
- **`suite-runner_test.ts`:** its fake executor's output now matches the stricter workers-specific missing-registry string the gate expects.

### 5. Readiness fixture test (`prepare-readiness-fixture_test.ts`)

- **Expected duplicates:** the exact-list check `duplicateConstBindings(...) === ['endpoint', 'vite']` reflects the discovery loops reusing these names in separate block scopes, which is valid.
- **Still catches new conflicts:** any additional duplicated name would fail the exact match.
- **Still compiles:** `assertGeneratedModuleChecks(injected)` still type-checks the whole spliced module, so a real lexical conflict cannot pass.
- **Fixture matches reality:** the config fixture now declares `ServiceReferences` / `PluginReferences`, which the generated helper reads.

### Overall

- **No dependency, lockfile, gate-removal or rule-suppression changes.**
- **The core implementation's earlier PASS stands.** Nothing in this slice touches the install, reconcile, discovery or doctor logic.