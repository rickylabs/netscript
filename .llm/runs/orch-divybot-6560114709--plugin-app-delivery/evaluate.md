**Verdict: PASS**

Both round-1 blockers are fixed, and I found no material regressions. I reviewed read-only: the updated implementation diff, the current source, the worklog, the context pack and the debt entry. The Docker `scaffold.runtime` CI run is still pending, so the runtime overview proof stays unproven until it runs. That is pending evidence, not a defect.

### Blocker 1 (update dropped the explicit `--app` selection): resolved

- **Selection now happens at planning time, before any writes.** `plan-plugin-install.ts` calls `resolvePluginAppReferences(request, fs, dependencies.appConsumers)`. Both install paths call it before the scaffolder runs and pass the package defaults explicitly (`install-plugin.ts:155-157`, `install-local-plugin.ts:123-127`).
- **The order of precedence is correct** (`plugin-app-references.ts:23-51`):
  1. An explicit `--app` is validated and wins.
  2. Otherwise, when the run is overwriting a named plugin, the consumer list in the installed manifest is used. It is looked up in the configured directory, then the root, then `plugins/`, and an empty `[]` counts as a real answer.
  3. Otherwise the package's declared consumers are used.
  4. Otherwise all enabled web apps.
- **The update path reaches step 2.** `update-plugin-command.ts:42-53` passes `pluginName` and `overwrite: true`, and planning reads the staged copy before the scaffolder overwrites the manifest.
- **One source of truth for what gets written.** `persistPluginMetadata` now writes `plan.appReferences` directly (`install-plugin.ts:1397-1400` in the diff).
- **The tests cover the original failure.** `update-plugin-command_test.ts` overwrites the manifest with `{}` inside the scaffolder, then checks that both `['web']` and `[]` survive. It also checks that `admin` gets no reference and that `web` gets `workers-api` only when it is listed. `plugin-app-references_test.ts` checks that an installed list beats package defaults and that `--app` beats both.

### Blocker 2 (unreachable local-CLI remediation): resolved

- **The local-CLI path is now reachable.** `plugins/workers/src/adapter/plugin.ts:1702-1716` resolves the repo-root CLI relative to the doctor module's own location (`../../../../packages/cli/bin/netscript-dev.ts`). It does this only when the module was loaded from a local file, so JSR-loaded doctors skip it.
- **The doctor's filesystem handles that absolute path correctly.** It uses `resolve(projectRoot, path)` (`doctor-plugin-use-case.ts:902-906`), which leaves absolute paths unchanged. The CLI copies inside the project remain as later candidates.
- **The command is complete.** It now includes `--project-root`, uses slash-normalised quoted paths, and keeps the version-pinned JSR command only as the last fallback. `@std/path` is already declared in `plugins/workers/deno.json:35`.
- **The proof is real, not faked.** The clean local-source composition test (`plugin-app-delivery_test.ts:583-592`):
  - deletes the worker registry and runs the real doctor;
  - isolates the workers-specific line and checks the CLI path and `--project-root`;
  - rejects any `jsr:@netscript/plugin-workers@` fallback;
  - executes the repair and confirms the registry exists again.
- **The E2E check can no longer pass on the generic hint.** `behavior-plugins-health-gate.ts:73` now requires the workers title and missing-registry message as one tab-joined string, so the host's generic `generate plugins` text no longer satisfies it.

### Regression sweep

- **Unchanged and still sound:** dry runs return before any writes in both flows; in-process AI still gets consumer metadata but no endpoint links; renamed-instance keys come from the rendered result; registry producer failures still fail the install; removal still reconciles and prunes. The live startup endpoint injection and the per-element overview assertion are also unchanged.
- **Size debt:** `CLI-PLUGIN-INSTALL-DELIVERY-SIZE` (`.llm/harness/debt/arch-debt.md:3245-3253`) records the 759→819 line growth and the 18→20 directory child count, with an owner and a target. That is acceptable for a leaf bugfix.

### Non-blocking notes

- Installs made before this change have no stored consumer list, so their first update falls back to package defaults or all enabled web apps. That is a reasonable migration default.
- Consumers read from an installed manifest are not re-checked against apps disabled since then. This is harmless because the AppHost skips disabled apps and reconciliation ignores missing entries.
- Remediation paths are quoted with JSON-style double quotes, so a path containing `$` would still be expanded by a POSIX shell. Cosmetic.