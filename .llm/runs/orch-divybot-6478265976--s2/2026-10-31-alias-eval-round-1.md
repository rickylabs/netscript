# Alias repair IMPL-EVAL — first verdict

**[PHASE: IMPL-EVAL] [VERDICT: FAIL_FIX]**

Source7d3bcfd580dcf4cf1e87af9d0056b7f754084e4f. Retained separate native Opus5.5 High read-only session, closed stdin, exit0, observed model usage claude-opus-5-5, source clean/unchanged before and after. Reviewer executes no commands; results attributed to implementer reports. Provider-side attestation unavailable.

Supervisor accepts the blocker: unconditional named no-lock refusal breaks real legacy scaffold copies. Fix once using existing file-based discovery with explicit partial-copy inclusion. Preserve default discovery behavior and named legacy item/collection updates; refuse only missing explicit lock entries or unknown/no-copy legacy names. Same evaluator must review corrected source. No READY.

## Evaluator response

REVIEWED 7d3bcfd580dcf4cf1e87af9d0056b7f754084e4f

# Alias-precedence and diagnostics repair (issue #2415, PR #2468): FAIL_FIX

The alias fix is correct, but the new `ui:update` check breaks named updates for every app without a lock file. That includes every newly scaffolded app, so this is one blocker. I ran no commands; the test and gate results below come from the implementer's receipts.

## Blocker: `ui:update <name>` now fails on apps without a lock

**What changed.** `updateUiRegistry` (`packages/cli/src/kernel/application/ui/v2/registry-lifecycle.ts:21-25`) now throws ``Registry item '<name>' is not installed. Use ui:add to install it first.`` for any named update when no lock exists. It throws before reaching the legacy path at line 26.

**Why that hits almost every app.** No current install path creates a lock:
- The project scaffold installs the default UI items with the legacy `installUiRegistryItems` (`packages/cli/src/kernel/application/scaffold/writers/write-app-files.ts:212`), which writes no `fresh-ui.lock.json`.
- Plugin installs (`packages/cli/src/public/features/plugins/install/install-plugin.ts:162`) and the local plugin path use the same legacy installer.
- All apps scaffolded before S2 also have no lock.

**What users see.** On a fresh scaffold, `netscript ui:update button` now fails and says `button` is not installed, even though the scaffold just copied it. Before this round, the same command used the legacy fallback (`updateUiRegistryItems` in `packages/cli/src/kernel/application/ui/registry.ts:156-188`): it restored missing files and reported drifted ones without overwriting them.

**Why it's a blocker and not a judgment call.**
- Locked plan decision 3 says legacy apps keep the file-based fallback.
- The repair record itself only promises that *unnamed* legacy discovery is unchanged; the named legacy path wasn't kept.
- The new test `named update without a lock refuses installation and leaves the app untouched` (`packages/cli/src/kernel/application/ui/v2/tests/ui-lifecycle_test.ts:220-230`) builds this regression into the suite: an app with no lock and a `button` request, with no check of whether `button` is actually present.
- No test covers a named update of a legacy-installed item, so the 114/0/0 suite can't catch it.

**Required fix.** Keep the owner's diagnostic, but base it on what is actually installed:
- **With a lock:** refuse names missing from the lock before any resolution or writes. The current `Object.hasOwn` check does this correctly.
- **Without a lock:** decide installed-or-not with the same file-based discovery the legacy path already uses (for example, `listUiRegistryItems`). Refuse only names that are unknown or have no installed copy, and send installed legacy names to `updateUiRegistryItems` as before.
- **Tests:** replace the test above with two cases:
  - a legacy-scaffolded item with no lock still updates by name, restoring a missing file and reporting drift without overwriting
  - an uninstalled name in a no-lock app is refused with zero writes and no registry resolution

## Not blocking: the rest of the round is sound
- **Alias precedence:**
  - `planUiCopies` (`packages/cli/src/kernel/application/ui/v2/copy-files.ts:70-74,107-119`) builds every `@<alias>/` and `@/<…>/` prefix once and sorts them longest first. `@/components/ui/` now wins over `@/components/` regardless of config order.
  - All prefixes end in `/`, so `@/components/uikit/` can't match the `ui` alias.
  - Extension and index lookup, source scoping and destination safety are unchanged.
  - The fixture covers a static import, a re-export and a dynamic import, with and without an extension. It also covers the `@ui` short form, an ordinary `components` import and the `uikit` boundary, and checks that the rewritten paths resolve to copied files under both custom and default aliases.
  - Before the fix, the fixture was 4 passed, 1 failed: only the custom-`ui` case failed, resolving to `components/ui/x` instead of `widgets/x.ts`. After it, 8/0/0.
- **Remove diagnostics:**
  - With a lock, removing an item that isn't installed now throws before any mutation (`registry-lifecycle.ts:47`).
  - The command prints `Nothing to remove…` instead of `Removed 0 files` (`packages/cli/src/public/features/ui/remove/remove-ui-command.ts:75-78`).
  - Apps without a lock still use the legacy remover.
- **Other receipts:**
  - diagnostics before-controls: 0 passed, 3 failed
  - full UI suite: 114/0/0
  - wrappers on all 6 files: 0 findings, no refusals
  - preflight: PASS
  - review threads: 0 unanswered

## Durable receipts at `7d3bcfd…`
- **PASS, exit 0:** quality-gate, assets-barrel, publish-assets, mcp-export-corpus, agent-docs-prose.
- **publish-dry-run:** `RUNNING`, not terminal, so I'm not counting it as passed.

## Remote readiness (not part of this verdict, pending until observed)
At the final pushed head, both `ci.yml` and `e2e-cli.yml` must complete SUCCESS:
- all eight test shards, `check-test` and `quality`
- `scaffold-static` and both real `scaffold-runtime` jobs, with their full-suite and cleanup steps run for real rather than short-circuited by policy

`deps-report`'s informational skip on PRs should be reported separately, not as a pass. The earlier local runtime attempt (Docker unavailable) remains unproven until a remote runtime job actually succeeds. The 123 existing S3 component doc-lint findings remain disclosed.
