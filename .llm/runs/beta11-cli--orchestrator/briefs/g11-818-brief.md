use harness. You are the G11 implementation agent (Codex · GPT-5.6 Sol · medium,
`normal_implementation` lane) for run `beta11-cli--orchestrator`, supervised by the Fable 5
orchestrator (session 86d308d5-c761-4e5d-a41f-8be959bc46d2).

## SKILL

Activate: `netscript-harness`, `netscript-cli`, `netscript-deno-toolchain`, `netscript-pr`,
`netscript-tools`. Read `.llm/harness/workflow/run-loop.md`. Nested run dir:
`.llm/runs/beta11-cli--orchestrator/slices/g11-818-minage/` (create from templates). Compact
research+plan note first (this decides real mechanics — take the research seriously), then STOP
for the group Plan-Gate (PR comment `Plan & Design — READY FOR REVIEW`).

## Task — issue #818: fresh projects hit Deno's 24h minimum-dependency-age wall after every release

Branch `fix/818-min-dep-age-lockstep` (already created off origin/main in this worktree). Read
live issue #818 and #817's PR body (the exact call-site inventory). Locked direction from the
run plan (owner-visible in plan.md): **option (a)+docs** — CLI-internal shell-outs pass
`--minimum-dependency-age=0` (or the sanctioned config-level equivalent — identify the real key
in Deno 2.9's config parsing; verify with the netscript-deno-toolchain surface, never guess)
ONLY for lockstep `jsr:@netscript/*` specifiers; NEVER blanket-disable for third-party deps.

Scope: the shipped CLI's `deno x` shell-outs (`dispatchPluginVerb`, the AI plugin command),
generated-project flows resolving fresh `@netscript/*` versions, `agent init`-written MCP
configs invoking `jsr:@netscript/cli@<fresh>`. Acceptance: fresh scaffold + plugin verbs +
agent-init flow all work within minutes of a release; third-party age policy untouched;
regression tests at the shell-out builders; docs note the 24h window + the scoped override.

## Method

Per-slice: commit → push (`git push origin HEAD:refs/heads/fix/818-min-dep-age-lockstep`) →
open draft PR to `main` with `Closes #818`, labels
`type:fix,area:cli,wave:v1,priority:p1,status:plan`, milestone `0.0.1-beta.11` → gate-evidence
comment → pause for Tier-A review between slices. Gates: shell-out builder regression tests;
FULL test dirs of touched packages; scoped wrappers; `quality:scan` + `arch:check`. Do NOT
dispatch evaluators/reviews yourself. Do NOT merge anything.

## Stop-lines (HARD — read twice)

1. Merge requires CI green + opposite-family eval PASS on the PR. Owner granted standing beta-11
   merge authorization (2026-07-17 in-turn) once that bar is met.
2. HARD STOP before any release publish (`release:cut`, JSR publish, tag push, canary or stable)
   — owner sign-off in-turn only; a stale or relayed approval does not count.
3. HARD STOP before closing milestone 13 — owner sign-off only.
4. These stop-lines are repeated verbatim in EVERY sub-agent brief. A sub-brief without the
   stop-lines section is invalid.
5. The #824 seed run is drafts-only until owner ratification; its board filing needs the owner
   in-turn.
