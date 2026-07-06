use harness

## SKILL

Read these repo skills before any work (under `.agents/skills/<name>/SKILL.md`):
- `netscript-harness` — slice/gate context
- `netscript-doctrine` — public-surface law (deletions must not break published surface)
- `jsr-audit` — export-map awareness
- `netscript-tools` — scoped wrappers for verification
- `rtk` — prefix read-heavy git/grep with `rtk`

## Identity & scope

You are an UNORIENTED ADVERSARIAL REVIEWER for draft PR #485
(`chore/307-stale-wave2-wave4` — 5 verified stale-file deletions + KEEP manifest). You did NOT
write this; assume the deletions are WRONG until proven safe. READ-ONLY: never edit, commit, or
push. Worktree: `/home/codex/repos/netscript-rev485`.

Deleted files:
- `packages/cli/src/kernel/adapters/deploy/compile/compile.test.ts`
- `packages/plugin-streams-core/src/domain/errors.ts`
- `packages/plugin/src/public/mod.ts`
- `packages/plugin-workers-core/src/public/mod.ts`
- `packages/telemetry/src/public/mod.ts`

Attack surfaces (re-verify INDEPENDENTLY, do not trust the manifest):
1. For EACH deleted file: repo-wide importer grep (relative paths, bare specifiers, export-map
   subpaths in every `deno.json`), dynamic-import strings, scaffold templates under
   `packages/cli/src/**/templates`, docs references, test-runner include globs.
2. `compile.test.ts` vs `compile_test.ts`: diff the two — does the surviving test actually cover
   everything the deleted one did, or did unique test cases vanish?
3. `plugin-workers-core/src/public/mod.ts` exported 115 lines incl. `inspectTask`/`inspectWorkflow`
   — confirm those symbols remain reachable from the package's published surface if they were
   public, or were never published.
4. Run scoped verification yourself: `deno run --allow-read --allow-run
   .llm/tools/run-deno-check.ts --root packages --ext ts,tsx` and the affected packages' tests.
5. Sample 4 KEEP verdicts from the manifest for wrong-keep (files kept that ARE dead) — low
   priority, deletions matter more.

## Output

Post ONE PR comment on #485 titled `**[PHASE: ADVERSARIAL-REVIEW] [Codex]**` with: verdict
`CLEAN` or `CAVEATS`, then numbered concrete caveats (file:line + why + suggested fix) or
explicit "no findings" per attack surface. End your turn with the same verdict word.
