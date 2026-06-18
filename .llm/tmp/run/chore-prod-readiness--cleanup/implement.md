# Implement brief — chore/prod-readiness (Group 1, repo cleanup)

ROLE: You are the **WSL Codex implementation agent** for the NetScript `chore/prod-readiness`
repo-cleanup run. This is harnessed NetScript work — activate the harness run loop (`use harness`).
You implement; you do NOT self-certify. A separate OpenHands qwen-3.7-max session runs IMPL-EVAL
afterward (the supervisor dispatches it).

Worktree: `/home/codex/repos/netscript-prod-readiness` (branch `chore/prod-readiness`, off
`release/jsr-readiness`). Run dir: `.llm/tmp/run/chore-prod-readiness--cleanup/`.

## Pre-flight (do first, in order)

1. `cd /home/codex/repos/netscript-prod-readiness`
2. `git fetch origin && git reset --hard origin/chore/prod-readiness && git status --short --branch`
   — must be clean and up to date with `origin/chore/prod-readiness`.
3. Read, in order:
   - `AGENTS.md`
   - `.agents/skills/netscript-harness/SKILL.md`
   - `.agents/skills/netscript-doctrine/SKILL.md`
   - `.agents/skills/netscript-cli/SKILL.md`
   - `.agents/skills/netscript-deno-toolchain/SKILL.md`
   - `.agents/skills/codex-wsl-remote/SKILL.md` (the native-worktree rule: run all Deno/Aspire
     gates from this ext4 path, never `/mnt/c`)
   - run artifacts: `.llm/tmp/run/chore-prod-readiness--cleanup/research.md`, `plan.md`,
     `worklog.md` (especially `## Design`), and `plan-eval.md` (the PLAN-EVAL **PASS** — read the
     implementer notes at the end)
   - `.llm/harness/debt/arch-debt.md` entries `database-connectivity-legacy-connstring-alias` and
     `mysqljsonextension-deprecated-removal-deferred`

## Task

Implement the plan **exactly, slice by slice**, in this order — one slice = one commit:
`G1-0, G1-1, G1-2, G1-3a, G1-3b, G1-3c, G1-4, G1-5, G1-6`. Follow the per-slice file list + LOC
budget and the removal method (consumer scan → remove/refactor → prove) in `plan.md` and the
`## Design` section of `worklog.md`. Never batch slices.

## Hard constraints (a violation is a process failure)

- **OFF-LIMITS — never edit:** `packages/aspire/src/public/mod.ts`;
  `packages/cli/src/kernel/constants/scaffold/scaffold-versions.ts`; any version pin; the root
  `deno.json` `catalog` block or any member `package.json` `catalog:` reference. **Never de-catalog.**
- **Functional workarounds F1/F2/F3 are OFF-LIMITS.** In particular F3: the
  `ConnectionStrings__{provider}db` env var (written by `servy-environment.ts:139`,
  `env-file-values.ts:130`, `env-file-content.ts:98`) is **functional** — it is READ by
  `packages/service/src/diagnostics/database-connectivity.ts:48,71,94`. Do NOT remove it.
- **PR-7 deprecate-before-remove:**
  - G1-3b: ADD `@deprecated` to `mysqlJsonExtension` (`packages/database/extensions/sql-json.extension.ts`
    ~line 571) and **DEFER its removal**. Only REMOVE the already-`@deprecated` `mssqlJsonExtension`
    (~line 556). Add the `mysqljsonextension-deprecated-removal-deferred` arch-debt entry in this slice.
  - G1-3c: this is a **behavioural REFACTOR** of `trustedConnection`, NOT a symbol delete — migrate
    the internal writer (`packages/database/adapters/mssql.adapter.ts` ~lines 414-416) to
    `authentication.type='ntlm'`, then drop the public option; add an adapter behavioural test.
- **Subtractive run:** deletions/relocations only — NO new abstractions and NO new back-compat
  shims/aliases. A removal is authorized ONLY after a zero-live-consumer scan (deno info import-graph
  + grep across `packages/ packages/cli/src/kernel/templates/ plugins/ ops/ .llm/tools/ docs/`).
- Do NOT delete lock files or caches; do NOT run `deno cache --reload`.
- Plan line numbers may be ±1 off — **grep the symbol, not the line**. The G1-5 scaffolder test
  fixture and the `mysqljsonextension-deprecated-removal-deferred` arch-debt entry are NEW files/rows;
  create them in their slices.

## Gates (per slice; native ext4 only)

- **Every slice:** scoped check on touched packages —
  `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root <pkg> --ext ts,tsx`
  (add `--unstable-kv` when checking workspace code) + that package's tests.
- **Public-surface slices G1-3a/b/c, G1-4:** also `deno task publish:dry-run` (expect 27 units,
  0 slow types) + a scaffold smoke `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`.
- **G1-5 (highest risk):** full `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`.
- **G1-0:** also `deno run --allow-read --allow-run .llm/tools/agentic/validate-claude-surface.ts`
  (it relocates `AGENTS-handoff.md` into the `openhands-handoff` skill — Claude-surface change).

## Per-slice loop (every slice, in order)

1. **Consumer scan** for the slice's targets. If a target marked "dead"/"shim" has a live consumer,
   STOP that removal, record it in `.llm/tmp/run/chore-prod-readiness--cleanup/drift.md`
   (severity + file:line evidence), and continue with the rest of the slice.
2. Make the change (single concern only).
3. Run the slice's gates. If a gate fails, fix within the slice. If the failure shows the plan is
   wrong, record drift and adapt minimally (do not expand scope).
4. Commit: message `chore(prod-readiness): <slice-id> — <summary>`, trailer
   `Co-Authored-By: Codex <noreply@openai.com>`.
5. `git push origin chore/prod-readiness`.
6. Append the commit to `.llm/tmp/run/chore-prod-readiness--cleanup/commits.md` (`- <sha>: <msg>`)
   and add a `## Gate Results` row in `worklog.md` with the evidence (gate, pass/fail, counts).
   Commit + push these bookkeeping updates (fold into the next slice's commit or a trailing
   bookkeeping commit).

## Reporting / stop conditions

- Keep `worklog.md` current; record any drift in `drift.md` first, before adapting.
- You have NO `gh` auth — do NOT attempt PR comments. Just push + maintain `commits.md`; the
  supervisor mirrors your slice progress to PR #54 via the PAT.
- If you hit **two consecutive gate failures on the same slice**, or anything that needs a scope
  decision, record it in `drift.md` and STOP for supervisor steering (the supervisor will
  `codex exec resume` this thread). Do NOT self-certify or open/merge anything.
- When all slices are done and `git status` is clean, write a `worklog.md` handoff summary
  (slices done, gates run + results, any drift) and STOP.
