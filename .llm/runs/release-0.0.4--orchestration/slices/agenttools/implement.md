use harness

# Slice: ship the agent tooling bundle with `agent init` (#1024, #1061)

Worktree: `/home/codex/repos/ns004-agenttools` · branch `feat/1024-agent-tooling-bundle` · base
`origin/main` @ `ab0fa13fe`.

## SKILL

- `.agents/skills/netscript-harness` — run loop, slice contract, commit trail.
- `.agents/skills/netscript-cli` — `agent init`, scaffold output, fixture tests.
- `.agents/skills/netscript-tools` — the `.llm/tools` surface this slice ships.
- `.agents/skills/netscript-pr` — `Closes #N` in the PR **body**; every `gh` call passes
  `--repo rickylabs/netscript`.
- `.agents/skills/rtk` — prefix read-heavy `git`/`gh`/`grep` with `rtk`.

## Why this is its own slice

These two were originally grouped with the scaffold agent-surface PR (#1078). That PR's close-gate
showed **15** unchecked acceptance boxes — 6 on #1024, 5 on #1061, 4 on #1071 — and neither of these
two had been implemented at all. They were split out so they do not block the p0/p1 agent-surface
work, and so nothing merges a closing keyword over an unimplemented issue.

Read both issue bodies in full. Between them they carry **11** acceptance criteria; that is the
definition of done, not the titles.

- **#1024 (p2)** ship the agent-grade `.llm/tools` with `agent init` — JSON check/lint, host-port
  validation and scaffold e2e never reach consumers.
- **#1061 (p2)** `agent init --with-docs` — install a local documentation bundle for agents working
  offline against an unfamiliar framework.

## Context that should shape the work

Wave four is why these exist. `agent init` already installs a real diagnostic surface — skills, an
MCP server, `help.md` indexed by symptom — and it went **largely unused**, because installed-but-never-loaded
is indistinguishable from absent. A wave-four agent put it plainly: *"Optional docs lose to curl
every time."*

So shipping more tooling that an agent must think to look for repeats the mistake. Whatever you
install must be discoverable at the moment of need. Coordinate conceptually with #1072 (the
"gate, not suggest" work landing on `/home/codex/repos/ns004-scaffold`) — **do not edit its files**;
if your work needs a change there, stop and report it.

#1061 is offline-bundle work: the docs task router from #1068 must be included in the bundle build
(`.briefing/build-docs-bundle.sh`). A concurrent docs slice owns that router — do not author it here.

## Rules

- Every path in anything you generate must resolve in a freshly initialised project. Assert it with a
  fixture test; do not eyeball it. A file naming a path that does not exist is worse than none.
- A gate that has only ever run on this machine is not evidence. `Deno.Command` **throws** on a
  missing binary rather than returning non-zero, so a check that passes locally because a tool is on
  PATH can fail on CI's deno-only lane. Test the missing-binary path.
- No untracked artefacts written into the repo, and no checked-in fixture mutated by a test run —
  both were just found in a sibling slice. Resolve any generated directory against the project root,
  not the process CWD.
- `packages/**` that is published must satisfy `deno doc --lint`; `missing-jsdoc` is a publish bar,
  not a style preference.

## close-gate is part of the work

`close-gate` reads the `- [ ]` boxes on #1024 and #1061 and fails the PR until each is ticked. Four
PRs in this release stalled by discovering that at the end. Verify each criterion as you land it,
tick it on the issue, and post the evidence — command, observed output, and for tests proof they fail
against pre-fix behaviour. **Tick nothing you cannot evidence.** An unmet criterion is a legitimate
outcome: drop that closing keyword and state the remaining scope.

## Gates

`deno task check` · `deno task test` · scoped lint/fmt wrappers · `deno task quality:scan` ·
`deno task arch:check` · `deno doc --lint` for touched published packages. Verify the artefact, never
the exit code.

**Do not run `scaffold.runtime` concurrently with another slice** — three concurrent runs on this
15 GB box earlier in the release produced two failures that were contention, not defects. Check
`agentic:leak-check` for a foreign apphost or Postgres first.

## Deliverable

One draft PR closing #1024 and #1061, driven to ready-for-merge. Commit per slice; push and comment
commit hash + gate evidence before the next slice.
