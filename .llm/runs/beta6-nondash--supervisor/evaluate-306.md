# IMPL-EVAL — #306 doctrine-06 / archetype-5 reconciliation + remaining folds

- Evaluator session: OpenHands qwen-3.7-max (run 28812388187), 2026-07-06
- Run: `beta6-nondash--supervisor`
- PR: #549 (branch `chore/306-harness-skills-revamp`)
- Baseline: `a1669f60` (true base, origin/main)
- Surface: docs / harness / skills (no `packages/`/`plugins/` source)
- Scope: PROG-306 (remaining bullets after `52cf7ec7` already merged bullets 2/3/5)

## Independent verification

### 1. No duplication with `52cf7ec7` (#486)

**PASS.** `52cf7ec7` touched 9 files: `jsr-audit/SKILL.md` (+mirror), `SCOPE-frontend.md`,
`arch-debt.md`, `evaluator/protocol.md`, `gates/README.md`, `archetype-gate-matrix.md`,
`release-gates.md`, `run-loop.md`. This PR's 3 commits (`d6a4b0db`, `5b2cd93c`, `68353c59`)
touched 6 files: `06-archetypes.md`, `05-folder-structure.md`, `ARCHETYPE-5-plugin.md`,
`.llm/tools/agentic/README.md`, `openhands-handoff/SKILL.md` (+mirror). **Zero file overlap** —
no conflicting re-drop. The PR correctly scopes to genuinely remaining work.

### 2. Doctrine-06 ↔ Archetype-5 folder-shape reconciliation

**PASS.** The rewritten `06-archetypes.md` Archetype-5 section states:

- Contribution folders (`contracts/`, `services/`, `database/`, `jobs/|sagas/|triggers/`,
  `streams/`) sit at the package root as **siblings of `src/`**, not nested under it.
- `mod.ts`, `verify-plugin.ts`, `deno.json` at root.
- `src/` for internal wiring/composition.
- `tests/` as a sibling.
- Scaffold edge files (`cli.ts`, `scaffold.ts`, `scaffold.plugin.json`, `scaffold.runtime.json`,
  `package.json`) noted as "edges, not doctrine contribution axes."
- Thinness law: convention-bearing primitives live in sibling `@netscript/plugin-<kind>-core`.
- Old `contracts.ts` → `contracts/` (directory, not file).

**Cross-check against live plugin tree:**

| Plugin | Actual top-level layout | Matches doc? |
|--------|------------------------|--------------|
| `plugins/workers` | contracts/, database/, jobs/, services/, src/, streams/, tests/ + mod.ts, verify-plugin.ts, cli.ts, scaffold.*.json, scaffold.ts, package.json | ✓ |
| `plugins/sagas` | contracts/, database/, services/, src/, streams/, tests/ + mod.ts, verify-plugin.ts, cli.ts, scaffold.*.json, scaffold.ts, package.json | ✓ |
| `plugins/triggers` | contracts/, database/, jobs/, services/, src/, streams/, tests/ + mod.ts, verify-plugin.ts, cli.ts, scaffold.*.json, scaffold.ts, package.json | ✓ |
| `plugins/auth` | contracts/, database/, services/, src/, streams/, tests/ + mod.ts, verify-plugin.ts, cli.ts, scaffold.plugin.json, scaffold.ts, package.json | ✓ |
| `plugins/streams` | services/, src/, tests/ + mod.ts, verify-plugin.ts, cli.ts, scaffold.plugin.json, scaffold.ts, package.json | ✓ |
| `plugins/ai` | contracts/, src/, tests/ + mod.ts, verify-plugin.ts, cli.ts, scaffold.*.json, scaffold.ts, package.json | ✓ |

All 6 first-party plugins match the described shape. Optional folders (database/, streams/,
jobs/|sagas/|triggers/) correctly marked optional in the doc. No aspirational drift — the doc
describes what already exists.

**ARCHETYPE-5-plugin.md**: Deferral note correctly flipped from "tracked under #305/#306" to
"reconciled into doctrine as of #306", pointing to `06-archetypes.md#archetype-5--plugin-package`.

**05-folder-structure.md**: Convergence note updated to reference the new Archetype-5 section.

### 3. Folded gotchas

**PASS.**

- **`gh-watch.ts` row** in `.llm/tools/agentic/README.md`: "Background CI/verdict watch —
  polls a PR's OpenHands summary until the IMPL/PLAN-EVAL verdict is terminal, then exits to
  re-wake the supervisor (token-free re-wake, no polling loop in agent context)." Verified against
  the tool header: exit codes aligned with verdict outcomes (0=PASS, 10=FAIL_*, 12=no-verdict),
  token from env only. ✓

- **`gh-token.ts` row**: "Durable GitHub-token resolver/store — `check` validates a token
  from any healthy source (env → `gh auth token` → GCM) printing source+login only; `store`
  persists one stdin PAT to Windows GCM + WSL `gh`." Verified against the tool header: `check`
  resolves from env candidates → `gh auth token` → bounded GCM `git credential fill`, validates
  against GET /user, reports source+login only. ✓

- **IMPL-EVAL file-set-reconcile clause** in `openhands-handoff/SKILL.md`: "The lock is not the
  only churn: an IMPL-EVAL commit-back can also push scratch/junk files alongside the verdict
  artifact. Verify the committed file set before merge — the intended change is the run's
  `evaluate.md`/`plan-eval.md` plus any authorized fix, not a re-resolved `deno.lock` or stray
  workspace files; drop anything outside that set." Accurate extension of the existing lock-churn
  pitfall. ✓

### 4. `.claude/` mirror regenerated from `.agents/` (S5 acceptance / beta gate)

**PASS.**

```
sync-claude-skills --check → OK: 17 skill(s), 21 mirrored file(s), 0 stale files
validate-claude-surface    → all 5 checks pass:
  CLAUDE.md ✓
  .claude/settings.json ✓
  .gitignore ✓
  .claude/skills sync ✓
  claude hook lock check ✓
```

The `.claude/skills/openhands-handoff/SKILL.md` diff is byte-identical to
`.agents/skills/openhands-handoff/SKILL.md` (same hash `ad09df84..51ccca33`), confirming
regeneration from source, not hand-editing.

### 5. Lock hygiene

**PASS.** `deno.lock` is unchanged vs `a1669f60` — zero diff.

### 6. Merge close-gate for #306

**Verified.** PR body carries `Closes #306`. Issue #306 is `status:impl` and OPEN. Epic
#389 (`Adopts: #306`) is correctly excluded — no closing keyword on the epic, per its own
instruction: "Do not put closing keywords on this epic; it closes by hand when all children
are done." On merge, #306 auto-closes; #389 stays open. ✓

## Verdict

All four load-bearing claims independently verified. Changes are docs/harness/skills only —
no `packages/`/`plugins/` source touched. Surface-sync validators green. No deno.lock churn.
No duplication with `52cf7ec7`. Merge close-gate correct.

OPENHANDS_VERDICT: PASS
