# Collection repair and S3 main integration — independent evaluation

**[PHASE: IMPL-EVAL] [VERDICT: PASS]**

Reviewed source609e648132d9bfa73542d1ad10592f6f1d404ba1, normal two-parent merge of collection fixbcb8db6b2 and main204a71b1e. Retained separate native Anthropic evaluator, exact `claude -p --model claude-opus-5-5 --effort high`, closed stdin/read-only Read/Glob/Grep tools, exit0, observed model usage claude-opus-5-5. Source clean/unchanged before/after. Reviewer runs no commands and reads implementer reports. Provider-side identity attestation unavailable; private native identifiers not published.

Supervisor accepts source/local sign-off. Membership is inferred from all member lock keys, including members installed individually; no explicit collection installation-history key is recorded or claimed. Current six durable receipts are terminal PASS at this clean source, docs accuracy111/111, combined tests220/0/0 plus streams9/0/0 and embedding/publish3/0/0, seven-file wrappers zero findings/drops/refusals. Full Fresh UI doclint124 is identical to exact-main per-file/per-entrypoint finding counts; added registry-v2 entrypoint has0. No pass is invented for that upstream baseline.

Final evidence commit precedes decisive full CI; require actual8 shards/check-test/quality and wholeci.yml SUCCESS plus wholee2e-cli.yml with scaffold-static and BOTH actual full runtime/cleanup steps SUCCESS at final head. deps-report's unchanged policy skip remains distinct. Remote readiness pending; Cockpit owns merge, no further push after green.

## Evaluator response

REVIEWED 609e648132d9bfa73542d1ad10592f6f1d404ba1

# Locked collection updates and the S3 main merge (issue #2415, PR #2468): PASS for the source and local evidence

I found no blockers in either the collection fix or the main merge. I ran no commands; the results below are from the implementer's receipts and reports.

## Locked collection updates are fixed
- **Why it failed:** after `ui:add surface-core`, the lock records the five member items but no `surface-core` key. So `ui:update surface-core` was being refused as not installed.
- **The fix** (`packages/cli/src/kernel/application/ui/v2/registry-lifecycle.ts:21-30`):
  - A collection counts as installed only when it has members and every member is an own lock entry. Empty, partial and never-added collections are still refused.
  - The extra metadata lookup only runs when there is a non-empty lock and at least one requested name isn't a lock key. Direct item names and empty locks skip it, so an empty lock stays authoritative.
  - Every requested name is checked before `installUiRegistry`, so a mix of an installed collection and a missing item is refused with no writes.
  - The no-lock path through legacy discovery is unchanged.
- **One collection definition for both paths.** `collections()` (`packages/cli/src/kernel/application/ui/v2/registry-client.ts:83-84`) reads only the embedded built-in metadata through the existing `collectionsSchema`, and `resolve()` now uses the same method. It uses the existing `UiRegistryCollection` type, and it adds no package export, lock-schema field or collection keys in the lock.
- **The tests are meaningful:**
  - **Real built-in collection:** `surface-core` is installed, with no collection key in the lock and all five member keys present. A deleted `card` copy is restored byte-for-byte; an edited `panel` copy is reported as drift and kept; and no collection key is added afterwards.
  - **Injected controls (empty, partial and complete locks):** missing, unknown and namespaced items, empty groups, incomplete groups, and a valid group mixed with a missing item are all refused with unchanged filesystem snapshots. They also cause zero file-content reads (counted via a property getter) and zero remote transport requests.
  - **Complete group update:** updating a fully installed group rewrites both members to the new version.
  - **Updated existing test:** the populated-lock case now allows exactly one local metadata read and still refuses before any content resolution.
- **Receipts:**
  - before the fix: 2 passed, 2 failed (`surface-core` and the fully installed fixture group)
  - after the fix: focused suite 9/0/0

## The main merge keeps both S2 and S3
- **Conflict resolutions (`merge-resolutions.diff`) keep both sides:**
  - The public command tree has the S2 commands (`ui:build`, `ui:apply`, `ui:view`/`search`/`docs`/`info`, `ui:registry`, `ui:preset`) alongside S3's `ui:migrate`. The `ui:migrate` dependencies are unchanged; only its formatting was reflowed.
  - The local command-tree test lists all of them.
  - `packages/fresh-ui/deno.json` has the `./registry-v2` export next to S3's `./contracts` and `./contracts.json`. Its publish include has the registry README and the upstream schema LICENSE next to S3's contracts README and `contracts.json`, plus the `registry:embed` and `registry:embed:check` tasks.
  - The README `ui:*` row covers both.
  - The docs command count goes from 99 to 111, and the docs-accuracy log reports `111/111 root/direct public commands from 176 recursive paths`.
- **S3 and upstream source is unchanged.** The implementer's equality record reports byte-equality with main `204a71b1e` for the S3 contracts, the registry components, the migrate feature, Fresh runtime streams, worker streams and the service source.
- **S3 components still match the registry.** Registry components don't import S3 contracts, so S3's component changes don't introduce copy imports that `registry.json` wouldn't ship.
- **Generated files were regenerated, not hand-picked.** The conflicted carriers were regenerated in dependency order, and the carrier gates at this head pass.

## Receipts at `609e648…`
- **Merged tests:**
  - combined UI, migration, contracts and command-tree suite: 220/0/0
  - streams: 9/0/0
  - registry embedding parity and the native 5 MB publish cap: 3/0/0
- **Wrappers:** check, lint and format over 7 files, 0 findings. Lint exits 0.
- **Other checks:** release preflight PASS, root quality PASS, review threads 0 unanswered.
- **Durable gates:** all six (quality-gate, assets-barrel, publish-assets, mcp-export-corpus, agent-docs-prose, publish-dry-run) record actual head `609e648…` with outcome PASS and exit 0.

## Limitations that stay visible (not passes)
- **Fresh UI doc-lint now has 124 findings** (96 private-type, 28 missing JSDoc), up from 123 because the merge brought in S3. The implementer's comparison shows identical per-file and per-entrypoint counts on main `204a71b1e`, and the new `./registry-v2` entrypoint has 0 findings. This is an upstream baseline that still fails, not a pass.
- **The scaffold runtime is unproven locally.** The earlier local attempt with Docker unavailable stays unproven until a remote runtime job actually succeeds.

## Remote readiness (not part of this verdict, pending until observed)
- **At the exact final head**, after the final evidence commit, all of these must complete SUCCESS:
  - the whole `ci.yml`, with all eight test shards, `check-test` and `quality`
  - the whole `e2e-cli.yml`, with `scaffold-static` and both `scaffold-runtime` jobs actually running their full-suite and cleanup steps
- **`deps-report` is a policy skip.** Its informational skip on PRs should be reported separately, not as a pass.
- **No READY claim is made here.**
