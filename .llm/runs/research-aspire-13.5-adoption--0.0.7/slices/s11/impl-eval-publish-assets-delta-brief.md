use harness

## SKILL

- `netscript-harness` — IMPL-EVAL protocol, verdict format, evidence rules.

## ROLE

INDEPENDENT IMPL-EVAL agent. Verdict only; do not edit files.

Repo: /home/agent/projects/netscript/worktrees/007-s11-eval (read-only, detached at the head below)
PR #1771 (S11), head `d77c026f3`.

**SINGLE-FILE DELTA EVALUATION.** The latest formal verdict for this PR is **FAIL_FIX at
`122e00a83`**. Head `d77c026f3` contains exactly one commit, which is the claimed repair for it.
Evaluate `git diff 122e00a83..d77c026f3` and nothing else:

    packages/mcp/src/publish-assets.generated.ts | 4 insertions(+), 4 deletions(-)

No runtime tiers, no rebase, no full evaluation, no broad test run. This is a docs slice with
`ci:skip-e2e`; the runtime tiers do not schedule for it.

### What the change claims to be

A pure regeneration of a generated carrier. S11 edits public docs; three carriers derive from them
and had to be refreshed in sequence — the agent-docs prose bundle, then the CLI assets barrel
(`122e00a83`), then this MCP publish-assets carrier. Each gate only reports the next link once the
previous is clean, which is why they surfaced one CI round at a time. The changed fields are the
embedded README string, `sourceCommit` (`d38158176` → `503a90b9e`), `sourceBytes`
(260933 → 261265) and `sha256`.

### Judge exactly this

1. **Is it genuinely generated, not hand-edited?** Run `deno task gen:publish-assets` on a clean
   checkout of this head and confirm it produces **no diff**. Then confirm the generator is
   idempotent (two consecutive runs, byte-identical output), so this converges rather than
   oscillating in CI.
2. **Does it close the FAIL_FIX?** `deno task check:publish-assets` must pass at this head. Also
   confirm the two upstream carriers did not regress: `check:agent-docs-prose` and
   `check:assets-barrel` must pass at the same head.
3. **Is the blast radius exactly one generated file?** Confirm `git diff --name-only
   122e00a83..d77c026f3` lists only `packages/mcp/src/publish-assets.generated.ts`, and that no
   authored content, public surface, or doc prose changed in this commit.
4. **Provenance sanity.** `sourceCommit 503a90b9e` is the head at which the earlier IMPL-EVAL chain
   terminated PASS. Confirm the recorded provenance is consistent with the committed prose bundle
   rather than an arbitrary value.
5. Anything here that would invalidate a finding the earlier PASS relied on.

Output STRICT JSONL, last line the verdict:
{"check":"<name>","ok":true|false,"evidence":"..."}
{"verdict":"PASS|FAIL_IMPL","summary":"..."}
Ground every claim in a command you actually ran. If the delta is sound, say so and stop.
