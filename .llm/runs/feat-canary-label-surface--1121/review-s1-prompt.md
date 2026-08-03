use harness

Perform an ordinary opposite-family review of uncommitted slice 1 for PR #1122 in
`/home/codex/repos/ns004-canary`. This is not PLAN-EVAL or IMPL-EVAL. Review only; do not edit source,
run artifacts, the index, `deno.lock`, GitHub, or commits.

Compare the working-tree diff with slice 1 in `plan.md`/`worklog.md`. Verify specifically that the
machine-readable resolved canary identity is emitted by `release:canary`, that the workflow consumes
that result rather than `deno.json` or log parsing, and that success has non-empty test/wrapper
evidence. Write findings and an explicit `PASS` or `CHANGES_REQUESTED` to
`.llm/runs/feat-canary-label-surface--1121/review-s1.md`. This review artifact is the only permitted
write.

## SKILL

- `.agents/skills/netscript-harness` — enforce the approved slice and no-self-certification review.
- `.agents/skills/netscript-release` — protect publish mechanics and canary identity semantics.
- `.agents/skills/netscript-tools` — verify artifact evidence and lock hygiene.
- `.agents/skills/rtk` — compress read-heavy diff/git inspection.
