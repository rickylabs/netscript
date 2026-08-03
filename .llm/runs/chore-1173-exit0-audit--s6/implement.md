use harness

## SKILL

Read `.agents/skills/netscript-tools/SKILL.md`. You are the implementation lane
(Codex · GPT-5.6 Sol · low) for slice **S6** of epic #1169, closing #1173 (read it in full:
`gh issue view 1173 --repo rickylabs/netscript`). Supervisor reviews before sign-off; commit but
do NOT push; no PRs.

Worktree `/home/codex/repos/ns004-s6-honesty`, branch `chore/1173-exit0-audit`.
Scope: `.llm/tools/agentic/**` (audit + fixes + tests), run-dir worklog. Nothing else.

### Task 1 — explain the observed exit-0 (evidence, not assertion)

The 0.0.4 cut observed a `duplicate_sender_risk` refusal exiting 0. Current code exits 4
(`launch-codex-slice.ts` blocked/create-race paths). Determine which explanation holds and record
it with evidence in the worklog:
- fixed since the observation (find the commit: `git log -S duplicate_sender_risk --oneline`), or
- a wrapper/alternate path launders the exit code (check every caller: `deno task` wrappers, shell
  helpers, `rtk proxy`, anything invoking launch-codex-slice or printing its diagnostics), or
- a different tool emitted the refusal (search `.llm/tools/agentic/` for other emitters).

### Task 2 — systematic exit-0 refusal audit

Sweep every CLI entrypoint under `.llm/tools/agentic/` (files with `import.meta.main` or wired as
`deno task agentic:*` in deno.json). For each: enumerate its refusal/blocked/no-op-when-work-was-
requested paths and the exit code each produces. Produce a table in the worklog:
`tool | refusal path | exit code | verdict (honest / laundered / silent)`. Fix every path where a
refusal exits 0; a legitimate "nothing to do" no-op may stay 0 only when that is the truthful
result of the request (state the reasoning per row).

### Task 3 — negative-case tests

Every refusal path fixed in Task 2 gets a test asserting non-zero exit (or the error return the
entrypoint maps to a non-zero exit). Where a test already exists, cite it in the table instead of
duplicating.

### Gates to run and record in `.llm/runs/chore-1173-exit0-audit--s6/worklog.md`

```
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/agentic --ext ts
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root .llm/tools/agentic --ext ts
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root .llm/tools/agentic --ext ts
deno test --allow-read --allow-env --allow-write --allow-run .llm/tools/agentic/
```

No `any`, no lint-ignores, no `as unknown as`. Do not launch any real agents/sessions while
auditing — static reads and unit tests with fakes only.

### Done means

Worklog carries the explanation (Task 1), the full audit table (Task 2), and gate evidence; one
commit on `chore/1173-exit0-audit`:
`chore(agentic): no refusal exits 0 — audit table, fixes, and negative-case tests (#1173)`.
Commit, do not push.
