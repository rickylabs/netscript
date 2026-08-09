# IMPL-EVAL — PR #1404 / issue #1102 (intent-aware MCP capability discovery)

**Role:** independent evaluator. You did not write this and must not defend it.
**Route:** Claude · Anthropic · Fable 5 · medium (native opposite-family; work is Codex-authored).
**Protocol:** `.llm/harness/evaluator/protocol.md` + `.llm/harness/evaluator/verdict-definitions.md`.
**Subject head (exact):** `fd92679066758aa21cd012f7d4b64fc33096260d`
**Read-only worktree:** `/home/codex/repos/ns005-impleval-1404` (already checked out there).

## Hard boundaries

- **Read-only.** No edits, commits, pushes, or `git` write commands anywhere.
- **Never enter** `/home/codex/repos/ns005-w3b1` (the implementer's worktree) or
  `/home/codex/repos/ns005-docs-consistency`.
- **Do not start Aspire, containers, or any `e2e:cli` runtime suite.** Unit tests, scoped checks,
  generators and the publish dry-run are fine — they start no containers.
- Your final message is the verdict artifact: `PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT`.

## What the slice claims

#1102 makes MCP capability discovery intent-aware. S1/S2 defined and ranked an intent-guidance
contract; S3 regenerated the agent-docs corpus from repaired `main@399f60185` and evaluated the
locked five-row / 15-citation ranking against the real release corpus. The lane's own PR comment on
#1404 lists its evidence — treat every line of it as a claim to verify, not as a result.

## Claims to falsify (executed evidence required)

1. **Tests are real and pass at this head.** Run the focused evaluation/retrieval/source-policy
   tests and the full `packages/mcp/tests/`. The lane reports 11/11 and 132/132. Confirm the counts,
   and judge whether the evaluation tests actually constrain ranking or merely assert whatever the
   current implementation returns. **A test that would pass under a shuffled ranking is a finding.**
   Try to construct that: perturb ranking inputs in a scratch copy outside the repo and show whether
   the suite still passes.
2. **Embedded vs filesystem parity is genuine.** The lane claims embedded and materialized-filesystem
   results are byte-equal and repeatable, with `llms#task-router` rank 1 on both. Verify
   independently. This parity is the point of the shared `normalizeDocsSlug` import — check it holds
   for `.md` paths *and* root `llms.txt`.
3. **The byte cap and the dropped quickstart.** The locked cap is 262,144 bytes; the 13-document
   selection was 274,497 and the lane dropped `pages/quickstart/index.md` to reach 253,511 / 12 docs,
   arguing quickstart supplies none of the locked 15 citations. Verify the arithmetic and that claim.
   Then judge the **product** question the arithmetic hides: do the five locked intents cover a
   getting-started / "how do I begin" intent at all? If an agent asks that of the embedded fallback
   corpus, what does it now get? If the answer is "nothing useful", say so — that is a finding about
   the locked evaluation's coverage even though it does not violate any acceptance row.
4. **Each of the 8 embedded additions is justified.** They ship inside the published
   `@netscript/mcp`. The lane maps each to a specific rank/citation. Spot-check at least three
   against the actual evaluation data and report any that are not load-bearing.
5. **The tool → package module boundary.** `.llm/tools/generate-publish-assets.ts` now imports
   `normalizeDocsSlug` from `packages/mcp/src/domain/docs/docs-corpus-port.ts`. Verify the generator
   still runs under its existing permissions, that `check:publish-assets` and the MCP
   `publish:dry-run` exit 0, and that this does not leak a build tool into the published surface or
   create a cycle. Judge whether importing genuinely beats duplicating the rule.
6. **Generated assets match their sources.** `packages/mcp/src/publish-assets.generated.ts`,
   `packages/cli/src/kernel/assets/agent-docs.generated.ts` and
   `.llm/assets/agent-docs/{prose.json.gz,provenance.json}` are all regenerated. Re-run the
   generators and confirm the checked-in output is exactly what they produce (no hand-editing).
   Confirm provenance records source commit `399f60185`.
7. **Doctrine/quality claims.** The lane reports `scan-code-quality --root packages/mcp/src` clean,
   and `check-doctrine --root packages/mcp` exit 1 **only** for #1403's unchanged baseline. Verify
   that the doctrine failure set is byte-identical to the same command on `origin/main` — i.e. that
   this slice added no new finding. Do not accept "pre-existing" without that comparison.
8. **No forbidden surfaces touched.** Confirm the diff contains no `docs/site/**`, no lockfile
   change, and nothing that weakens a gate. `git diff origin/main...HEAD --name-only`.
9. **Acceptance rows.** Read #1102's acceptance criteria and state, row by row, whether this head
   satisfies each with evidence you executed. Flag any row that is asserted but not demonstrated.

## Standard

Prior IMPL-EVALs in this run returned `PASS` only after independently reproducing the thing the
slice claimed. One resolved a `passed=76` aggregate arithmetically; another proved new gates could
fail by constructing the defect. Match that. If you cannot execute something, say so explicitly
rather than inferring it passed.

Report per claim: claim → command run → observed output → verdict. Then the overall verdict, and if
not PASS the minimal specific repair, phrased so the original implementing thread can act on it.
