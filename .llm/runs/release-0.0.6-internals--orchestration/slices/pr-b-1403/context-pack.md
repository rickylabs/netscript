# Context pack: PR-B #1403

## Current state

- Draft PR #1570 is open from bootstrap commit `059576fcd`.
- The formal quality-rail plan revision 4 passed PLAN-EVAL cycle 5.
- RED-first fixtures cover B1 and B3 and currently fail because both planned contracts are absent.

## Locked implementation

- Discover exactly the 36 top-level package/plugin units; never use every workspace member.
- `packages/cli/e2e` is nested and excluded, with the reason written into doctrine.
- `arch:check` consumes discovery in the same change that removes the curated task list.
- The PR selector includes `packages`, `plugins`, and `.llm/tools`, reports empty explicitly, and
  diffs `BASE...HEAD`.
- Findings are triaged only; package/plugin source is out of scope.

## Next

Implement B1/B2/B3, run slice gates, update these artifacts in the same commits, push, and comment
on draft PR #1570 after each slice.
