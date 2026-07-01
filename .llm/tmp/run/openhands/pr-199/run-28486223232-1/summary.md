# RE-IMPL-EVAL (cycle 2) — PR #199 Domain 2

## Summary

Cycle-2 verification of commit `24556e8f` ("docs(site): correct `plugin new` flag names (IMPL-EVAL #199 Domain 2 FAIL_FIX)") against the CLI source truth in `packages/cli/src/public/features/plugins/new/new-plugin-command.ts`. Verifying **only** Domain 2 (Domains 1 + 3 already passed in cycle 1).

## Changes

The prescribed fix in commit `24556e8f` touches **only** docs:
- `docs/site/cli-reference.md` (1 insertion, 1 deletion)
- `docs/site/how-to/author-a-plugin.md` (7 insertions, 5 deletions)

No changes outside `docs/site/`. No lock churn, no source churn.

## Validation

### CLI source truth (ground truth)

`packages/cli/src/public/features/plugins/new/new-plugin-command.ts` defines:
- `--feature`: boolean, default `false` → `kind: options.feature ? 'feature' : 'proxy'` (line 43, 53)
- `--force`: boolean, default `false` → `overwrite: options.force ?? false` (line 44, 54)
- `--project-root <path:string>`: string (line 42)
- **No** `--kind feature|proxy` flag
- **No** `--overwrite` flag

### Doc 1: `docs/site/cli-reference.md` (line 134)

✅ Example: `netscript plugin new billing` (proxy default)
✅ Description uses `--feature` (route-backed feature connector) and `--force` (overwrite)
✅ No `--kind` or `--overwrite` mentions

### Doc 2: `docs/site/how-to/author-a-plugin.md` (lines 64-74)

✅ Example: `netscript plugin new notifier` (line 65)
✅ Options prose (lines 68-70):
  - `--feature` — route-backed feature connector vs default proxy
  - `--force` — overwrite existing files
  - `--project-root <path>` — target alternative project root
✅ No `--kind` or `--overwrite` mentions

### Stray flag search

`grep -rn "\-\-kind" docs/site/` → exit 1 (no matches)
`grep -rn "\-\-overwrite" docs/site/` → exit 1 (no matches)
`grep -rn` broader check for `kind:` / `overwrite` → only legitimate non-flag usages remain (scaffold.plugin.json `provider.kind`, job `kind` fields, saga routing `kind`), all unrelated to `plugin new` CLI flags.

### Docs gates (from `docs/site/`)

**`deno task build`**: exit **0** (306 files generated in 5.08 seconds)
**`deno task check:links`**: exit **0** (18456 internal links across 130 pages — all resolve)

Both match the expected figures from the task specification.

## Remaining risks

None. Domain 2 verification complete. All three domains (1, 2, 3) now PASS.

**Overall PR verdict: PASS**
