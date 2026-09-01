use harness

## SKILL

- `netscript-harness` — IMPL-EVAL protocol, verdict format, evidence rules.
- `netscript-doctrine` — package/plugin public-surface boundaries.

## ROLE

INDEPENDENT IMPL-EVAL agent. Verdict only; do not edit files.

Repo: /home/agent/projects/netscript/worktrees/007-eval-slot2 (read-only)
PR #1779, branch chore/aspire-13-5-s13-stale-surface-cleanup, head `6424bb942`.

**This is a DELTA evaluation, not a fresh one.** S13 already holds a full IMPL-EVAL **PASS**
at head `9b684e176` (verdict in `slices/s13/impl-eval-verdict.jsonl`). Since then the branch
was restacked from base `c9e3fcbe8` onto `e938ecd31` (the #1887 teardown baseline).

I ran the blob-identity carry check over S13's own footprint (own files at each head, against that
head's own base). Result: **55 of 66 identical**. One file (`packages/mcp/src/publish-assets.generated.ts`)
is upstream-only at the new head. The remaining **10 files below are the entire delta** you must
evaluate. Do not re-evaluate anything outside this list — the PASS carries for the other 55.

```
.claude/skills/netscript-harness/SKILL.md
.llm/runs/research-aspire-13.5-adoption--0.0.7/aspire-surface-manifest.tsv
.llm/tools/agentic/teardown/ownership.ts
.llm/tools/agentic/teardown/ownership_test.ts
deno.json
packages/cli/src/kernel/adapters/scaffold/import-resolver.ts
packages/cli/src/kernel/assets/embedded.generated.ts
packages/cli/src/kernel/templates/app/app-template-test-support.ts
packages/cli/src/kernel/templates/app/route-templates_test.ts
packages/mcp/README.md
```

Inspect with: `git diff 9b684e176..6424bb942 -- <path>` (384 insertions, 156 deletions total).

Judge only:
1. For each file, is the change **restack absorption** (upstream content S13 correctly took on) or
   **new S13 authorship**? Say which, per file.
2. For any new authorship: is it correct, and does it stay inside S13's subject
   (agent-doc corpus / skills / surface manifest)? `.llm/tools/agentic/teardown/ownership.ts` and
   its test are #1887's territory — verify S13 **preserves** #1887's detection and volume semantics
   rather than re-expressing or weakening them. That is the single highest-risk item here.
3. `embedded.generated.ts` and any other generated carrier: confirm it is a faithful regeneration,
   not a hand edit.
4. Does anything in the delta invalidate a finding the original PASS relied on?

Run whatever focused checks you need (`deno check --unstable-kv`, targeted `deno test`).

Output STRICT JSONL, last line the verdict:
{"file":"<path>","classification":"restack-absorption|new-authorship","ok":true|false,"evidence":"..."}
{"verdict":"PASS|FAIL_IMPL","summary":"..."}
Ground every claim in a command you actually ran.
