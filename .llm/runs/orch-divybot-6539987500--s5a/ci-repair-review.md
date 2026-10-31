**Verdict: PASS** (scoped CI-repair and merged-tree reconciliation)

The repairs fix both CI failures at their cause. No gate was weakened and the shared compiler is unchanged. One item is still open: `ci-repair-native.json` is empty because that run hadn't finished when I read it. This verdict does not cover it. It must show 15/0/0 before the push, and READY still needs green required CI on the exact next head.

## The two causes, confirmed in the CI logs

1. **The name inventory was out of date after main moved on.** In `ci-quality-failure.log`, the merge ref (#2504 into main `1d274c16`) fails 9 of 12 plugin tests with `Unknown Figma token name: Theme/ink/d-fg (no WEB syntax)`. In `ci-fresh-ui-failure.log`, the embed check reports `Stale embedded token assets: src/tokens/assets/figma-names.generated.ts`. #2506 changed the approved snapshot and the branch's synchronous inventory no longer matched it, so this is a stale carrier, not a logic defect.
2. **A timer type error.** `ci-test4-artifacts/test.report.json` shows `TS2322: Type 'Timeout' is not assignable to type 'number'` at the bundle test's `setTimeout`. Node ambient types reached that combined shard.

## Why the repairs are sound

- **Inventory regenerated, nothing hand-edited.** `figma-names.generated.ts` now contains `ink/d-fg`, as do the package and registry snapshot copies and the handoff fixture. Both `index.json` files list counts of 413 / 341 / 32 / 462 / 19 / 26 / 214 / 341 / 341, which total 2,189. The embed script, `figma-token-names.ts`, the round-trip converter, the composer and the resolver are not in the repair diff, so their behaviour is unchanged.
- **No weaker checks.**
  - The fixture test still compares all ten files byte-for-byte against the handoff directory. Its variable total now comes from `figmaIndex`, but `index.json` is itself one of those ten files, so the count is still pinned to the approved handoff and isn't circular.
  - The CLI name-command test takes its expected `pinned variables=` count from the same index. Its unknown-WEB-name control (exit 1, naming origin and CSS) and the built-in negative control are unchanged.
- **The timer fix is portable.** `ReturnType<typeof setTimeout>` type-checks under both Deno and Node ambient types. `ci-repair-ambient-check.json` covers the bundle test plus the Node-ambient corpus test (2 files, 0 failures).
- **The merge is intact.**
  - No conflict markers remain in `packages/`, `tools/`, `docs/`, `.llm/tools/` or `.github/`.
  - `legacy.generated.ts` keeps this branch's import path, `../adapters/figma/figma-token-source.ts`.
  - The only other repair edit is a new Aspire manifest row for a main-side docs page.
- **Evidence at the dirty merge tree:**
  - `receipts/ci-repair-figma.json`: PASS. Check, lint and fmt each processed 15 files, 12/0/0 tests, `pinned variables=2189`, browser build done.
  - `ci-repair-tokens.log`: embed freshness and canonical source freshness both pass, as do the official-schema, alias and name checks over 96 inputs. Token quality passes with #2507's contrast changes (0 exact exclusions, 58 exempt).
  - All four `ci-repair-gen-*.exit` files are 0.
- **Records.** The historical 2,186 evidence is left as it was, and `worklog.md`, `drift.md` and `context-pack.md` add a separate reconciliation entry.

## Before the push, then READY

1. **Pending:** `ci-repair-native.json` (the URL, native and init selection) must finish at 15/0/0. It's the only local proof that the CLI install path still works with the 2,189-variable snapshot.
2. **Not rerun locally after the merge:** `tokens:check` (88 outputs, theme registry sync), the root check/lint/fmt and quality gate. Required CI on the next head covers them.
3. **Still UNPROVEN, unchanged:** `scaffold.runtime` (Docker unavailable), optional Chromium UI and the real Figma host.
4. **READY:** every required check must be green on the exact next pushed head, and that head must be named in the READY report. Cockpit owns the merge.

OPENHANDS_VERDICT: PASS
