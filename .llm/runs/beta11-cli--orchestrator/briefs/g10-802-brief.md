use harness. You are the G10 implementation agent (Codex · GPT-5.6 Sol · low,
`light_implementation` lane) for run `beta11-cli--orchestrator`, supervised by the Fable 5
orchestrator (session 86d308d5-c761-4e5d-a41f-8be959bc46d2).

## SKILL

Activate: `netscript-harness`, `netscript-cli`, `netscript-pr`, `netscript-tools`. Read
`.llm/harness/workflow/run-loop.md`. Nested run dir:
`.llm/runs/beta11-cli--orchestrator/slices/g10-802-help/` (create from `.llm/harness/templates/`).
Single-scope fix with ONE decision to make at your mini plan step (see below).

## Task — issue #802: help-text `usage:` strings advertise `ns-<plugin>` shorthand nothing installs

Branch `fix/802-plugin-cli-help` (already created off origin/main in this worktree). Read live
issue #802. The workers plugin CLI help (e.g. `plugins/workers/src/cli/commands.ts:74,94,112`)
prints `usage: 'ns-workers add job …'` but no scaffold/install step creates that binary. Working
forms: `deno x -A jsr:@netscript/plugin-workers@<version>/cli <verb>` or user-run
`deno install -gArf -n ns-workers …`.

Decision (a/b/c from the issue): make a reasoned choice in your plan note BEFORE implementing,
with one-paragraph rationale grounded in what the CLIs actually print elsewhere (consistency
wins). Supervisor pre-disposition: option (c) — keep the short `ns-<plugin>` form in usage but
print a one-time install hint alongside — unless you find the codebase convention argues for (b).
Record the choice + rationale in your slice worklog; the supervisor reviews it with the slice.

Scope: source-side help strings across ALL sibling plugin CLIs (workers, sagas, triggers,
streams if present) — audit each for the same pattern; docs-side prose is handled elsewhere.

## Method

- Per-slice: commit → push (`git push origin HEAD:refs/heads/fix/802-plugin-cli-help`) → open a
  draft PR to `main` titled `fix(plugins): truthful plugin CLI usage strings` with body carrying
  `Closes #802`, labels `type:fix,area:cli,area:plugins,wave:v1,priority:p2,status:impl`,
  milestone `0.0.1-beta.11` → comment with gate evidence.
- Gates: help-output snapshot/regression tests for each touched CLI; FULL test dir of each
  touched plugin; scoped wrappers; `deno task quality:scan` + `deno task arch:check`.
- Do NOT dispatch evaluators/reviews yourself. Do NOT merge anything.

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
