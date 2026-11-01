**Verdict: FAIL_FIX**

I reviewed it read-only against plan, worklog, drift, research and the current source. Most of the delivery is sound, but two blockers remain.

---

### Blocker 1: `plugin update` throws away an explicit `--app` selection

- `packages/cli/src/public/features/plugins/update/update-plugin-command.ts:42-53` re-runs `installPlugin` without `app`.
- `packages/cli/src/public/features/plugins/install/install-plugin.ts:353-357` therefore uses `descriptor.manifest.linking?.consumers.apps ?? plan.appReferences`.
- That descriptor is the package manifest, not the installed copy. First-party manifests have no `linking` (`research.md:4`), so the consumer list becomes every enabled web app.
- `plugin-reference-reconciler.ts:78-81` then adds `workers-api` to all of them.
- Result: `install workers --app web` followed by `update workers` silently links `admin` as well. That breaks the locked contract in `plan.md:11-12`: install, update and removal should share one source of truth.
- **Fix:** when `plan.app` is undefined, keep `linking.consumers.apps` from the installed instance's `scaffold.plugin.json`. Fall back to the default only when no installed declaration exists.
- **Regression test:** install with `--app web`, then update, then assert that `admin` has no reference and the manifest consumers are still `['web']`.

### Blocker 2: The workers doctor "local CLI" remediation can't trigger, and the E2E check would pass anyway

- `plugins/workers/src/adapter/plugin.ts:73-81` checks for `packages/cli/bin/netscript-dev.ts`.
- The doctor resolves every path against the project root (`doctor-plugin-use-case.ts:902-906`). Generated projects never contain `packages/cli/bin`; the repo's own composition test puts the project under `.llm/tmp` and keeps the CLI in the repo.
- So local-source workspaces still get the pinned-version `jsr:@netscript/plugin-workers@…/cli compile-registry` command. That is exactly the gap `research.md:11` identified, so acceptance item 3's "local CLI" half isn't delivered.
- Even if the check did match, the emitted `deno run -A packages/cli/bin/netscript-dev.ts generate plugins` has no `--project-root`.
- The new unit test (`plugins/workers/tests/adapter/plugin-doctor_test.ts`) fakes `exists()` to return true for that path, which hides the problem.
- The E2E check could also pass without the fix:
  - `behavior-plugins-health-gate.ts:73` now expects only `'generate plugins'`.
  - The host's drift message already contains that text (`runtime-registry-drift.ts:10`), so it is printed whatever the workers check says.
  - The workers-specific assertion was dropped.
- **Fix, either way:**
  - derive the local-source CLI from the doctor module's own `file:` location (absolute CLI path plus `--project-root`); or
  - always emit the host's `netscript generate plugins` remediation.
- Then restore a workers-specific assertion in the E2E check.

---

### Verified sound (no action needed)

- **App selection and persistence (item 1):**
  - `plugin-app-references.ts` rejects missing, disabled, task and desktop apps during planning, before any writes.
  - Headless projects get `[]`.
  - The composition test confirms `appsettings.json` is unchanged after an invalid `--app` and after a dry run.
- **Dry runs:** both install paths return before any writes (`install-plugin.ts:163-165`, `install-local-plugin.ts:131-133`). Registry compilation is additionally guarded.
- **In-process plugins:** the reconciler now adds discovery edges only when a `Plugins` entry exists, so AI keeps its consumer metadata without leaving a reference to a resource that doesn't exist.
- **Renamed instances:** the persisted `resourceConfigKey`/`backgroundConfigKey` come from the rendered scaffold result. They match the keys actually written to appsettings and the overview's `installedPlugins` lookup.
- **Third-party plugins:** an explicit `linking.consumers.apps` is kept unless `--app` overrides it. The other `consumers` fields are spread through unchanged.
- **Endpoint injection (item 2):** `generate-register-apps.ts:358-379` reads `config.Apps[name]?.ServiceReferences/PluginReferences` at AppHost startup. It uses the existing `getResourceEndpoint` and the existing Vite and server discovery variables. References that are disabled or unregistered emit nothing (`workspace-cors_test.ts`).
- **Registry producer failures (item 3):** non-zero exits, missing declared outputs and overlapping producers all throw (`installed-runtime-registry-generator.ts:55,116,401`), so the install fails. Non-blocking: the failure lands after appsettings and the manifest are written but before reconciliation, which leaves a partial install. That matches the install flow's existing lack of transactions. Also, compilation regenerates every installed runtime package, so one broken plugin can block an unrelated install.
- **Removal:** `remove-plugin.ts:106` reconciles, and pruning drops the removed key from Apps and Services.
- **Remote Docker (item 4):** the `mismatch` verdict now maps to `error`, so `plugin doctor` exits non-zero. The message and `docs/site/explanation/aspire.md` correctly say `AppHost:ContainerHostname` does not fix loopback-published ports.
- **Runtime overview assertion (item 5):** I see no way for it to false-pass.
  - Workers only shows `ready` when the live `listJobs` call through discovery returns at least one job. Streams needs `/health/ready` to return `{ready:true}`.
  - The `data-capability-state` markers appear only in the ready/empty render branch.
  - Matching is per element, with quoted attribute values, so `workers` can't match `workers-x` and markers split across elements fail.
  - Assertion failures are caught inside the retry loop and eventually fail the gate.

### Remaining unproven, not defects

- The Docker `scaffold.runtime` CI run is still pending, so the workers and streams `ready` runtime proof is unverified until it runs.
- The full type-check recheck after the composition dependency fix was not visible to me.

### Minor, non-blocking

The local install fallback (`renderLocalPlugin`, used when there is no plugin-owned scaffold) validates `--app` but never saves the consumer list.