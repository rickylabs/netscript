# IMPL-EVAL — PR #1953 docs(skills): aspire-upgrade skill, immutable head c231fbe5e (bounded)

You are the separate-session evaluator (NetScript harness, `.llm/harness/evaluator/protocol.md` and
`verdict-definitions.md`). Route: OpenRouter z-ai/glm-5.3-flash, effort xhigh. You are in a fresh
detached worktree checked out at exactly `c231fbe5ecbf65195db68bf59c70c48dea475817`. Do not commit,
push, checkout, rebase, or modify any tracked file. Read-only against git; write only the two output
files named below. Two prior GitHub-hosted evaluators returned no verdict because they never wrote
their verdict file — you MUST write both output files and end with exactly one verdict line.

## Scope — judge ONLY this two-file documentation PR

Diff base is `88fc6d69d`. Run `git diff --stat 88fc6d69d..HEAD` and confirm exactly:
- `.agents/skills/aspire-upgrade/SKILL.md` (new, ~178 lines)
- `.agents/skills/README.md` (+2 lines: scope-table row and routing line)

No `packages/`, `plugins/`, `skills/`, `.claude/skills/`, generated carrier, or lockfile may be touched.

## Context you must weigh (do not re-derive)

- The skill is the reusable playbook distilled from the Aspire 13.4.6 → 13.5.3 adoption (epic #1712).
  Its value is factual accuracy: every path, task name, constant, workflow file, and fixture it cites
  must exist at this head. A prior independent audit found two defects that were repaired in
  `c231fbe5e`: (1) `.mise.toml` is NOT tracked in the repo (host-side pin at the external project
  root); (2) the consumer skill bundle (`skills.generated.ts`, `embedded.generated.ts`) is generated
  from the top-level `skills/` tree via `skills/manifest.json`, while `.agents/skills/` is the
  authoritative agent-skill source bridged by the one-file router `.claude/skills/repo-skills`.
  Verify the repaired text now states both correctly.
- Exact-head hosted evidence already obtained (do NOT rerun): `quality` SUCCESS, `check-test`
  SUCCESS at c231fbe5e; runtime tiers correctly skipped (docs-only classification).
- Cycle-1 hosted evaluator (before it failed to preserve its verdict) noted two LOW items: some
  `.llm/runs/...` citations in the skill may not resolve at this head, and no `PLAN-EVAL: N/A`
  record exists. Confirm or refute the first with `test -e`/`git ls-files`; treat the second as
  informational only (docs PRs have no PLAN-EVAL requirement).

## Checks (each row needs evidence: file:line or command output)

1. Citation resolution: extract every repo path, `deno task` name, workflow filename, constant name,
   and script path cited in SKILL.md; verify each with `git ls-files <path>`, `grep -n` in
   `deno.json`/`.github/workflows/`, or `grep -rn <constant>`. List any that do not resolve with the
   SKILL.md line number. A citation to an untracked or run-scoped `.llm/runs/...` artifact is
   acceptable only if the text labels it as run evidence rather than a repo surface.
2. Pin map correctness: the enumerated Aspire pin locations (scaffold constants, three workflow
   files, parity constant, version-suffixed fixtures) actually contain an Aspire version literal at
   this head (`grep -rn "13\.5\.3"` is a fast cross-check).
3. The patch/minor/major classification and the fixture re-record table are internally consistent
   with `packages/cli/e2e` fixture names that exist.
4. README: scope-table row and routing line present, alphabetical/format consistent with neighbours.
5. Run exactly: `deno fmt --check .agents/skills/aspire-upgrade/SKILL.md .agents/skills/README.md`
   and `deno run --allow-read --allow-env .llm/tools/agentic/claude/validate-claude-surface.ts`
   (if it requires other flags, read its header; do not run anything broader — no `deno task test`,
   no `deno task check`, nothing that starts Aspire/Docker).
6. Doctrine/boundary: no mirror created under `.claude/skills/`; no product or carrier files touched.

## Output

- Write `.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/docs-1953/evaluate.md` (create the
  directory) using `.llm/harness/templates/evaluate.md`: severity-ranked findings with evidence,
  required action per finding, and exactly one verdict line `VERDICT: PASS|FAIL_FIX|FAIL_RESCOPE|FAIL_DEBT`.
  Unresolvable citations that would mislead a future operator are FAIL_FIX; purely cosmetic items are LOW/PASS.
- Also write `.llm/tmp/impl-eval-1953-comment.md`: a compact (≤ 50 lines) PR-comment version with the
  same findings and the same verdict line, first line `IMPL-EVAL (separate session, OpenRouter
  z-ai/glm-5.3-flash xhigh) — head c231fbe5e`.
- Finish your final message with the single verdict line. Do not explore the wider repository.
