use harness. You are the G9 implementation agent (Codex · GPT-5.6 Sol · low,
`light_implementation` lane) for run `beta11-cli--orchestrator`, supervised by the Fable 5
orchestrator (session 86d308d5-c761-4e5d-a41f-8be959bc46d2).

## SKILL

Activate: `netscript-harness`, `netscript-cli`, `netscript-pr`, `netscript-tools`. Read
`.llm/harness/workflow/run-loop.md`. Nested run dir:
`.llm/runs/beta11-cli--orchestrator/slices/g9-804-dryrun/` (create from `.llm/harness/templates/`).
Single-scope fix: a compact research+plan note in your slice dir, then implement — pause for
Tier-A review only if you discover scope beyond what's below.

## Task — issue #804: `--dry-run` on plugin `add` verbs writes real scaffold files

Branch `fix/804-dry-run-writes` (already created off origin/main in this worktree). Read live
issue #804. Evidence: `workers add job <id> --dry-run`, `sagas add saga <id> --dry-run`,
`triggers add scheduled <id> --dry-run` create real files (`workers/`, `sagas/`, `triggers/`,
`.netscript/` registries) instead of printing a plan.

Acceptance (issue): `--dry-run` performs ZERO filesystem writes across ALL plugin `add` verbs;
assert with a temp-dir regression test that snapshots the tree before/after; the printed plan
matches what a real run would write; audit sibling verbs (streams and any other plugin CLI `add`
verb) for the same defect and fix them in the same PR.

## Method

- Find the shared scaffold/write path in the plugin CLIs (`plugins/*/src/cli/`), fix the dry-run
  gating at the lowest shared seam (not per-verb copy-paste guards) so future verbs inherit it.
- Per-slice: commit → push (`git push origin HEAD:refs/heads/fix/804-dry-run-writes`) → open a
  draft PR to `main` titled `fix(plugins): make --dry-run on plugin add verbs write nothing`
  with body carrying `Closes #804`, labels
  `type:fix,area:cli,area:plugins,wave:v1,priority:p1,status:impl`, milestone `0.0.1-beta.11` →
  comment each slice with gate evidence.
- Gates: temp-dir regression test (before/after tree snapshot) per plugin verb; full test dir of
  each touched plugin (FULL dir, not curated files); scoped wrappers on touched roots;
  `deno task quality:scan` + `deno task arch:check`. If the issue's gate boxes on #804 exist,
  do NOT check them yourself — the supervisor checks them with evidence.
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
