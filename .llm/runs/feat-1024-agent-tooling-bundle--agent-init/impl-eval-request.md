use harness

# IMPL-EVAL request: agent init tooling and offline docs bundles

Evaluate the implementation on PR #1092 only. Do not implement product changes, tick issue boxes,
rewrite acceptance evidence, mutate `deno.lock`, or launch `scaffold.runtime`: the supervisor has
already completed the serialized runtime and consumer runs.

## SKILL

- `.agents/skills/netscript-harness` — evaluator protocol, IMPL-EVAL verdict, tracked authority.
- `.agents/skills/netscript-cli` — `agent init`, scaffold output, and consumer fixture expectations.
- `.agents/skills/netscript-tools` — shipped `.llm/tools` and trustworthy validation evidence.
- `.agents/skills/netscript-doctrine` — Archetype 6 plus docs-overlay architecture fitness.
- `.agents/skills/netscript-pr` — structured IMPL-EVAL PR comment and repository targeting.
- `.agents/skills/rtk` — compact read-heavy git/grep inspection.

## Scope and authority

- Repository: `rickylabs/netscript`
- Branch: `feat/1024-agent-tooling-bundle`
- Run: `.llm/runs/feat-1024-agent-tooling-bundle--agent-init/`
- Issues: #1024 and #1061; read both bodies and all eleven acceptance criteria.
- Review the full diff from `e5bae2858` through current branch head, not only the latest commit.
- Read `research.md`, `plan.md`, `plan-eval.md`, `worklog.md`, `context-pack.md`, `drift.md`, both
  slice review prompts, and the runtime leak report.
- Treat the tracked evaluator artifact as authoritative; do not accept prose summaries over code,
  tests, generated artifacts, or command evidence.

Challenge especially:

1. whether all generated/installed paths resolve from a fresh project and no fixture/repo artifact is
   mutated by tests or by running installed tools from a foreign process CWD;
2. whether the eight-tool boundary is dependency-closed, symptom-routed, missing-binary safe, and
   actually runs host-port validation after final scaffold/plugin generation;
3. whether clone-independent consumer mode truly selects an exact public CLI and avoids repository
   dependencies;
4. whether `--with-docs` remains absent-by-default, fails before any project write, resolves exact
   installed package versions, and runs `deno doc` over every export subpath;
5. whether prose provenance/router assertions prevent stale or silently incomplete bundles, and
   whether the generated docs asset is included in the JSR publication surface at an informed size;
6. whether tests cover `Deno.Command` launch throws and the excluded-file exit-zero trap;
7. whether public package JSDoc, architecture boundaries, lock hygiene, and generated-asset freshness
   are clean;
8. whether issue/PR boxes already checked are supported by evidence. #1024 criterion 5 is checked:
   a fresh installed tool, invoked from `/tmp`, completed 22 exact-release steps and its final-artifact
   validator then rejected all six pinned host ports emitted by public `0.0.3`. Criterion 6 remains
   unchecked because the current public scaffold cannot pass that enforced gate. The PR therefore
   uses `Refs #1024`, not a closing keyword. #1061 is fully evidenced and remains `Closes #1061`.

Static verification at final product head `04757a018` is green: root check selected 2,524 files in 22
batches; root test passed 2,535 tests (564 steps), zero failed and 16 ignored; changed-file
check/lint/fmt, quality scan, architecture check, CLI doc lint, asset freshness, and publish dry-run
all pass. A quiet-host local-source `scaffold.runtime` passed 47/48 and cleanup, failing only the
pre-existing `behavior.service-health` Prisma/database-unhealthy shape. Do not treat that as a green
runtime result. Judge whether the PR may pass its honestly reduced close scope: full #1061 closure
plus the independently useful and evidenced #1024 tooling work, with #1024 deliberately left open
for the scaffold-owned criterion 6.

## Required output

Write the complete evaluation to
`.llm/runs/feat-1024-agent-tooling-bundle--agent-init/impl-eval.md`. Use the harness implementation
verdict vocabulary and end in exactly one authoritative verdict: `PASS`, `FAIL_FIX`, `FAIL_RESCOPE`,
or `FAIL_DEBT`. Include concrete findings with file/line references, distinguish blockers from
advisory observations, and state whether every currently checked issue box is evidenced.

Commit and push only the tracked evaluator artifact needed for this evaluation. Do not mutate product
code, generated assets, `deno.lock`, issue bodies, or unrelated run files. Post one structured PR
comment beginning `[PHASE: IMPL-EVAL]` and include the exact machine line matching the chosen verdict,
for example `OPENHANDS_VERDICT: PASS` or `OPENHANDS_VERDICT: FAIL_FIX`. The tracked artifact is
authoritative if a summary disagrees.
