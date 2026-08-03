use harness

Re-review slice 1 after your findings F1/F2 in session `e10ff8f5-dfb4-4036-9b2d-62b51e1b06ce`.
The implementer updated worklog/context evidence, changed workflow extraction to assignment-form
`jq -e` with null/non-empty guards, shared ref-name construction, removed the vacuous temp
`deno.json` assertion, and widened the workflow test to reject any `deno.json` reference in the cut
step. Focused tests are now 15/15 and non-empty wrappers select 34 files with zero findings.

Review only; do not edit source/index/lock/GitHub. Update only `review-s1.md` with a concise
re-review section and final explicit `PASS` or `CHANGES_REQUESTED`.

## SKILL

- `.agents/skills/netscript-harness` — enforce the slice review gate.
- `.agents/skills/netscript-release` — preserve release identity semantics.
- `.agents/skills/netscript-tools` — verify artifacts and lock hygiene.
- `.agents/skills/rtk` — compact read-heavy inspection.
