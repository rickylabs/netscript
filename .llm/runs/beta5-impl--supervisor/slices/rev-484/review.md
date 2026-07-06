use harness

## SKILL

Read these repo skills before any work (under `.agents/skills/<name>/SKILL.md`):
- `netscript-harness` — evaluator/anti-pattern catalog context
- `netscript-doctrine` — the doctrine chapters this PR edits
- `netscript-tools` — gate-evidence rules (arch:check)
- `rtk` — prefix read-heavy git/grep with `rtk`

## Identity & scope

You are an UNORIENTED ADVERSARIAL REVIEWER for draft PR #484
(`chore/305-doctrine-quickwin` — retire the misfiring `@netscript/shared` Result gate in
`.llm/tools/fitness/check-doctrine.ts`, purge dead `phase-0-research` links, AP/F
ref-migration map). You did NOT write this; assume it is wrong until proven otherwise.
READ-ONLY: never edit, commit, or push. Worktree: `/home/codex/repos/netscript-rev484`.

Review `git diff origin/main...HEAD`. Attack surfaces:
1. **check-doctrine.ts edit**: did retiring the Result rule weaken any OTHER rule (shared
   helpers, regex scoping, rule ids)? Run `deno task arch:check` yourself and compare against
   main's behavior — no new misfires, no silently-disabled checks.
2. **Dead-link purge**: `rg phase-0-research docs/architecture/doctrine` must be zero; verify
   replacements are live citations or prose, not new dead anchors.
3. **ref-migration-map.md**: spot-check 5+ old→new AP/F mappings against the actual chapter
   headings and against `.llm/harness/debt/arch-debt.md` + the evaluator anti-pattern catalog —
   a wrong mapping silently invalidates debt refs. Check no `ref:` in arch-debt/catalog now
   points at a nonexistent id.
4. **Scope creep**: anything beyond the quick-win scope (full doctrine v2 rewrite is owner-gated).
5. Run artifacts: confirm nothing outside `.llm/runs/beta5-impl--supervisor/slices/305-quickwin/`
   plus the deliverable files is touched; zero deno.lock churn.

## Output

Post ONE PR comment on #484 titled `**[PHASE: ADVERSARIAL-REVIEW] [Codex]**` with: verdict
`CLEAN` or `CAVEATS`, then numbered concrete caveats (file:line + why + suggested fix) or
explicit "no findings" per attack surface. End your turn with the same verdict word.
