S-conform-triggers — post-#181 trigger connector conformance

Merge commit: `38d1cef0` (`Merge remote-tracking branch 'origin/main' into chore/plugin-rearch-v2`)

Implementation commit: `26b0e07b` (`feat(triggers): conform manifest and router assembly`)

Scope:

- Merged `origin/main` forward after PR #192 landed as squash `6e67f956`; no rebase or force-push.
- Verified the merged triggers v1 contract with `deno doc` on the core source subpath and connector re-export.
- Preserved the now-backed v1 route set: `describe`, `listTriggers`, `getTrigger`, `listEvents`, `getEvent`, `fireTrigger`, `testWebhook`, `previewSchedule`, `enableTrigger`, `disableTrigger`, and `subscribeEvents`.
- Deleted local `TriggersPluginManifest`/contribution/dependency/inspection mirror types.
- Deleted `inspectTriggers`; README/tests/reference docs now use or point to shared `inspectPlugin(triggersPlugin)`.
- Replaced connector-local `AnyRouter` service assembly with shared `assemblePluginContractRouter(...)`.

Gate evidence:

- `deno doc packages/plugin-triggers-core/src/contracts/v1/mod.ts` and `deno doc plugins/triggers/contracts/v1/mod.ts` — PASS, `triggersContract`/`triggersContractV1` exported; route block includes the five prior routes plus six PR #192 backed routes.
- `rg "TriggersPluginManifest|inspectTriggers" -n` — PASS, 0 hits.
- `rg "AnyRouter" plugins/triggers/services/src/router.ts -n` — PASS, 0 hits.
- `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin-triggers-core --root plugins/triggers --ext ts,tsx` — PASS, 139 files, 0 diagnostics.
- `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/plugin-triggers-core --root plugins/triggers --ext ts,tsx` — PASS, 139 files, 0 diagnostics.
- `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/plugin-triggers-core --root plugins/triggers --ext ts,tsx` — PASS, 139 files, 0 findings.
- `cd plugins/triggers && rtk proxy deno task test` — PASS, 19 passed (9 steps), 0 failed, 12 ignored.
- `cd packages/plugin-triggers-core && rtk proxy deno task test` — PASS, 33 passed, 0 failed.
- `cd plugins/triggers && rtk proxy deno task publish:dry-run` — PASS, dry run complete; existing dynamic-import warnings remain.
- `cd packages/plugin-triggers-core && rtk proxy deno task publish:dry-run` — PASS, dry run complete using existing `--allow-slow-types` carve-out.
- `rtk proxy deno task arch:check` — PASS exit 0, `FAIL=0`; existing WARN/INFO doctrine findings remain.
