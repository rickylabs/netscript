use harness

## SKILL

Read these repo skills before any work (under `.agents/skills/<name>/SKILL.md`):
- `netscript-harness` — run mechanics, slice/commit-trail rules
- `netscript-doctrine` — doctrine layout + AP/F numbering context
- `netscript-tools` — scoped wrappers, gate-evidence rules, lock hygiene
- `netscript-pr` — branch/PR/label/milestone process
- `rtk` — prefix read-heavy git/grep with `rtk`

## Identity & scope

You are a WSL Codex implementation slice for **issue #305 — [S4] Doctrine revamp: the EARLY
QUICK-WIN PR only** (beta.5 chores wave, run `beta5-impl--supervisor`). The full 12-chapter
doctrine v2 rewrite is explicitly OUT of your scope (owner decision pending).

Worktree: `/home/codex/repos/netscript-305-quickwin` · branch `chore/305-doctrine-quickwin`
(cut from origin/main `1c175990`, NO upstream — keep it that way).

Deliverables (from #305's "Early quick-win PR" section — re-verify each finding against your
checkout before acting; the audit may be partially stale):

1. **Retire the live-misfiring gate** in `.llm/tools/fitness/check-doctrine.ts`: the Result rule
   demanding re-export from `@netscript/shared` (a package that no longer exists). Remove/replace
   it so the rule matches doctrine's inline-Result guidance. Keep the rest of the tool intact.
2. **Purge dead `../phase-0-research/*` links** across `docs/architecture/doctrine/*.md` (audit
   found them in every axiom of `01-thesis-and-axioms.md`; sweep all chapters). Replace with either
   a live citation or plain prose — no dead links remain.
3. **Reconcile AP/F numbering** between the doctrine chapters and `check-doctrine.ts`: produce a
   **ref-migration map** (old ref → new ref) as a committed doc (suggest
   `docs/architecture/doctrine/ref-migration-map.md`), and update `.llm/harness/debt/arch-debt.md`
   + the evaluator anti-pattern catalog (find it under `.llm/harness/evaluator/`) to use the
   reconciled refs in the same PR, so no `ref:` becomes untrusted.
4. If any of these findings no longer reproduce on main, record that in the PR body instead of
   forcing a change.

## Validation

- `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools --ext ts`
- Run `deno task arch:check` before AND after; the after-run must not regress, and the
  `@netscript/shared` misfire must be gone. Paste both summaries in a PR comment.
- Link check on edited doctrine files (grep for `phase-0-research` must return zero hits).

## Process

- Commit in small slices; push ONLY via `git push origin HEAD:refs/heads/chore/305-doctrine-quickwin`.
- Never force-push, never `git add -A`, zero `deno.lock` churn.
- Open a **draft PR** early: base `main`, title
  `chore(doctrine): #305 quick-win — retire @netscript/shared gate, dead links, AP/F ref map`.
  Body: **`Refs #305`** (NOT closing — the full doctrine v2 rewrite remains, owner scope decision
  pending). Labels: `type:chore`, `area:docs`, `priority:high`, `epic:road-to-stable`,
  `status:impl`; milestone `0.0.1-beta.5`.
- Comment per pushed slice with commit hash + evidence. End with a `SLICE-COMPLETE` comment.
