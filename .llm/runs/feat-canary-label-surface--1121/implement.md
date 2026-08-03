use harness

Implement only slice 1 from the approved Design for run
`feat-canary-label-surface--1121` in `/home/codex/repos/ns004-canary`, and only after
`plan-eval.md` says `PASS`.

Do not commit, push, open/update the PR, change issue checkboxes, or start slice 2. The Tier-A
supervisor owns sign-off and GitHub lifecycle. Preserve `deno.lock`; do not delete caches or run
reload. Update `worklog.md` and `context-pack.md` with your implementation/gate evidence before
returning.

Slice 1 outcome: `release:canary` exposes the resolved identity as JSON through an explicit output
path, and `release-canary.yml` consumes that artifact rather than rereading `deno.json`. Keep the
change thin. Add the focused tests named in the Design. Every test/gate invocation must print an
explicit result.

## SKILL

- `.agents/skills/netscript-harness` — obey the approved slice and tracked run artifacts.
- `.agents/skills/netscript-release` — preserve the publish-mechanics boundary and canary identity
  rules.
- `.agents/skills/netscript-tools` — use scoped check/lint/fmt evidence and preserve lock hygiene.
- `.agents/skills/rtk` — prefix read-heavy git/grep and proxy Deno task output where useful.
- `.agents/skills/codex-wsl-remote` — remain in the daemon-attached tracked implementation thread.

Before editing, verify branch `feat/canary-label-surface`, clean ownership of changed files, and
PLAN-EVAL PASS. Return a concise list of files changed, exact gates/results, and any drift. End with
`DONE` when slice 1 is ready for supervisor review, or `BLOCKED: <reason>`.
