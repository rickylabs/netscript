**S2 slice review: FAIL_DEBT**

S2 behaves correctly. The live adapters, the capability states, the credential handling and the rendered CLI commands all check out against source and evidence. One structural decision has to be written up before sign-off: every generated app now depends on the workers plugin package, even when workers isn't installed. The plan said "no accepted new architecture debt", and `drift.md` records this change only as an import-map note. Either record it as debt with its cost, or replace it. That is the only gating item.

This is a slice review. It isn't the final IMPL-EVAL; it doesn't judge visual fidelity or certify merge readiness. S3 and S4 remain.

## Debt item: the workers-core dependency is now unconditional
- **What changed:**
  - `packages/cli/src/kernel/assets/app/lib/scaffold-plugin-capabilities.ts.template:3` statically imports `@netscript/plugin-workers-core/contracts/v1`.
  - `packages/cli/src/kernel/adapters/templates/app/generate-app-deno-json.ts:50-51, 72-75` adds it, with `@netscript/sdk/discovery`, to every app's import map.
  - `packages/cli/src/kernel/adapters/scaffold/import-resolver.ts:31-32, 132-134` registers it for both JSR and local-source modes.
- **Costs:**
  - Scaffolds with no workers, including `--db none` with no plugins, still resolve and type-check the workers contract package.
  - The app's copy of the contract is pinned through the CLI's import resolver, not through the installed workers plugin. If the user later updates or removes the plugin separately, the app's view of `listJobs` can drift from the running service without any visible signal.
  - Auth and AI optional modules are discovered with `import.meta.glob`, so they load only when present; workers is the exception to that pattern.
- **To resolve, either:**
  - **(a)** Add a debt entry to `drift.md` (and the plan's debt section) that names the unconditional dependency and the version-skew risk, and states the mitigation: the same CLI resolver pins both the app import and plugin installs. Add a test asserting the two resolve to the same version. Or:
  - **(b)** Load the workers contract the way auth and AI modules are loaded, from the installed workers workspace, so a no-workers app has no workers dependency.

## Verified correct
- **Live service adapters:**
  - The variant is chosen per `dbEngine`: `scaffold-records.memory.ts.template` vs `scaffold-records.database.ts.template`. No-service keeps the import-free loader (`scaffold-records.ts.template`).
  - Memory reads use typed `list({limit, offset})`. Database reads use `list({page, limit, sortBy, sortOrder})` and `getById`.
  - Detail ids are validated, and a 404 maps to `notFound`.
  - Memory detail lookup is bounded at 20 pages. Running out of budget gives `unavailable`, not a false 404; this is tested (`workspace-capabilities_test.ts:103-155`).
  - `s2-service-browser.json` shows live rows on `/` and `/records`, a detail page, and "Record not found" at `/records/999999`.
- **Credential isolation:**
  - `scaffold-service-context.ts.template` discovers `auth/bff.ts` per request with `import.meta.glob` and uses the existing `createBrowserSessionClient` with `browserSessionContext(request)`. No static BFF import, and the token stays server-side.
  - `scaffoldReadFailure` passes only `unauthorized` or `unavailable` plus fixed copy to views; raw errors go to the server log only (tested at `:157-181`).
- **Plugin identity:**
  - The lookup keys on persisted `linking.canonicalName` / `officialSource.canonicalName`. Canonical names are bare (`workers`, `streams`), for example `packages/cli/src/kernel/adapters/config/plugin-registry.test.ts:155`.
  - It honors `resourceConfigKey`, app consumers and enabled app references.
  - Renamed resources, an unlinked app, and disabled-means-absent are tested (`:32-101`).
- **Honest runtime states:**
  - Workers reports `ready` or `empty` from a typed `listJobs`.
  - Streams `ready` requires `{ready: true}`; `{ready: false}` gives `unavailable` and 401 gives `unauthorized` (tested).
  - AI with no chat runtime gives `empty`.
  - Real scaffolds confirm the states:
    - `s2-plugins-browser.json`, before references were added: "not linked".
    - `s2-plugins-referenced-browser.json`, after references were set with the real `config` command (`s2-app-references.log`): `unavailableRuntime` and `emptyAiRuntime`.
- **CLI commands:**
  - `plugin info <pkg>` matches `plugin-verb-command.ts:47`.
  - Bare `netscript plugin doctor` matches the doctor command, which takes no positional argument. The correction to my earlier plan wording, recorded in `drift.md`, is right.
  - The service and plugin install commands are unchanged from S1.
- **Evidence:** 77 tests pass (`s2-tests.json`). The service, database and plugin app checks and the lint/fmt receipts were supplied.

## Non-blocking findings (fix in S3/S4 or record)
1. **Wrong service state in the live variant.** With a generated service, `readScaffoldCapabilities` still reports the service as `installed-unwired`, with a `generate resource` command (`scaffold-capabilities.ts.template:44-48`). It isn't rendered today, but #2571 or any other consumer of the projection would get a false state. Report it from the adapter's read result, or leave the service out of the projection in live variants.
2. **Lenient app-reference rule.** `!appRefs?.length` counts an app with no `PluginReferences` as linked (`:54`). With no reference, discovery fails and the page shows `unavailable`, so nothing is falsely reported as working. But it contradicts the stated "missing refs are installed-unwired" boundary, and no test covers it. Either align the rule or document and test it.
3. **One bad manifest blanks everything.** A malformed `scaffold.plugin.json` turns all five capabilities `unavailable`, including service (`:26-32` only tolerates NotFound). Consider skipping the bad manifest and logging it.
4. **The session token goes to every service.** When auth is installed, it is forwarded to all workspace services read through `scaffoldServiceClient`, workers included. That suits guarded services. For least privilege, forward it only when the target contract declares authentication.
5. **AI runtime is called on every request.** `runtime.chatModel()` runs on every overview render (`scaffold-plugin-capabilities.ts.template:39`). Confirm it never makes network calls, or cache the result per process.
6. **Detail "not found" returns HTTP 200.** The page says "Record not found" but the status is 200. A 404 status would be more correct.
7. **Thin receipts.** `s2-plugins-referenced-browser.json` holds booleans only. Add the rendered state text per capability, the way `s2-plugins-browser.json` does.
8. **Disabled-but-unlinked shows as unlinked.** A plugin that is both disabled and unlinked shows "not linked" instead of "disabled" (`:55-56`), because the scope check runs first. Swap the order of the two checks.

Record option (a) or implement option (b) above, and S2 can be signed off.
