# Alias repair and legacy recovery — final independent evaluation

**[PHASE: IMPL-EVAL] [VERDICT: PASS]**

Reviewed source4655c6b787af103e6ee71db58f9c2442e5fa5de5. Retained separate native Anthropic evaluator, exact `claude -p --model claude-opus-5-5 --effort high`, closed stdin/read-only Read/Glob/Grep tools, exit0, observed model usage claude-opus-5-5. Clean identical head before/after. Reviewer runs no commands and reads implementer reports/source. Provider-side identity attestation unavailable; private runtime identifiers are not published.

The first FAIL_FIX at7d3bcfd58 is retained in2026-10-31-alias-eval-round-1.md. Its one legacy-compatibility correction passes this same evaluator. Supervisor accepts current source/local sign-off. Publication was RUNNING when read by the reviewer, then completed PASS/exit0 at the same clean source; the supervisor verifies all six current durable receipts terminal PASS before this evidence commit. This does not rewrite the reviewer's prior observation.

Final remote readiness is pending at the final evidence head. Require completed SUCCESS for both ci.yml and e2e-cli.yml, actual8 shards/check-test/quality, scaffold-static and BOTH real scaffold-runtime full-suite/cleanup steps. deps-report's policy skip stays separate. Commit all evidence before that decisive run and post remote proof externally afterward; no further push after green. Cockpit owns merge.

## Evaluator response

REVIEWED 4655c6b787af103e6ee71db58f9c2442e5fa5de5

# Legacy-update correction (issue #2415, PR #2468): PASS for the source and local evidence

This fixes the blocker I raised at `7d3bcfd…`, and I found no new blockers. The alias and remove changes I accepted last round are unchanged. I ran no commands; the results below are from the implementer's receipts.

## The blocker is fixed
- **The installed set now matches what's on disk.** In `updateUiRegistry` (`packages/cli/src/kernel/application/ui/v2/registry-lifecycle.ts:20-34`):
  - **With a lock**, including an empty one, only lock entries count as installed. The lock stays authoritative even when unmanaged copies exist.
  - **Without a lock, with names given**, it uses the existing legacy discovery with `includePartial: true`. That adds each item that has at least one copy on disk, plus each collection with at least one present member.
  - Every name is checked before the legacy update or any v2 planning or remote resolution, so an unknown or namespaced name is refused with no writes.
  - Unnamed updates without a lock skip discovery and go to the unchanged legacy updater, as before.
- **The legacy discovery change is small.** `listUiRegistryItems` (`packages/cli/src/kernel/application/ui/registry.ts:135-157`) gains an optional `includePartial` argument:
  - The default is still every file present, and the response shape is the same, so existing callers are unaffected.
  - File presence is computed once with the existing target resolver and filesystem port.
  - No new helper, port or package export is added.
- **The new tests target the actual regression.** They use the same legacy installer the scaffold uses:
  - **Named collection update:** a `foundation` install with one copied file deleted and another edited. The update restores the missing bytes exactly, reports the edited file as drift and leaves its content, and creates no `fresh-ui.lock.json`.
  - **Partial theme recovery:** a `theme-ns-one` install with `theme-bridge.css` deleted. Default discovery reports the item as not installed, while `includePartial` reports it installed, and the named update restores the file.
  - **No credit for dependencies:** a named `button` update is refused with an unchanged filesystem snapshot, even though its dependencies' copies are present.
  - The earlier controls still pass: empty lock, populated lock, mixed names, no resolution before refusal, and remove-missing.
- **Receipts:**
  - against the rejected `7d3bcfd…` guard: 0 passed, 2 failed
  - after the fix: focused 12/0/0
  - full UI application, domain and presentation suite: 116/0/0, exit 0
  - seven-file check, lint and format: 0 findings, no refusals

## Durable receipts at `4655c6b…`
- **PASS, exit 0:** quality-gate, assets-barrel, publish-assets, mcp-export-corpus, agent-docs-prose.
- **publish-dry-run:** `RUNNING`, not terminal, so I'm not counting it as passed. It needs a terminal PASS at this head.

## Behaviour change to note (not a blocker)
Without a lock, a theme preset item or a collection counts as installed if *any* of its files exist. Theme presets share most of their targets with `theme-seed`, and most collections include `theme-seed`. So on a scaffolded app without a lock, a named update of a never-added preset or collection, such as `ui:update ai`, still copies in its missing files rather than refusing. This matches the "has an installed copy" rule I asked for. It's no worse than the legacy behaviour before S2 and is limited to apps without a lock.

## Remote readiness (not part of this verdict, pending until observed)
- **At the exact final pushed head**, after the final evidence commit, all of these must complete SUCCESS:
  - all eight test shards, `quality` and `check-test`
  - the whole `ci.yml` workflow and `e2e-cli.yml`
  - `scaffold-static` and both real `scaffold-runtime` jobs, with their full-suite and cleanup steps actually run
- **`deps-report` is a policy skip.** Its informational skip on PRs should be reported separately, not as a pass.
- **Earlier limitations still apply.** The earlier local runtime attempt with Docker unavailable stays unproven until a remote runtime job succeeds, and the 123 existing S3 component doc-lint findings remain.
