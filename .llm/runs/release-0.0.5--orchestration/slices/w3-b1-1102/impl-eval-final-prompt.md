# IMPL-EVAL (final) — PR #1404 / issue #1102, post-rebase + corpus regeneration

**Role:** independent evaluator, read-only. You did not write this and must not defend it.
**Route:** Claude · Anthropic · Fable 5 · medium (native opposite-family; Codex-authored).
**Protocol:** `.llm/harness/evaluator/protocol.md` + `.llm/harness/evaluator/verdict-definitions.md`.
**Subject head (exact, immutable):** `dc6bf133c237c4d92ddf6b7904526afd8d1904b1`
**Worktree:** `/home/codex/repos/ns005-impleval-1404` — already checked out at that head; verify with
`git rev-parse HEAD` before starting. Confirmed identical across `git ls-remote`, the writer's local
head, and the GitHub PR head.

## Boundaries

- Read-only. No edits, commits, pushes, git write commands.
- **Never enter** `/home/codex/repos/ns005-w3b1`, `ns005-docs1411`, `ns005-deno295`, or `ns005-docs-consistency`.
- No Aspire, containers, or `e2e:cli`. Tests, generators, scoped checks and publish dry-runs are fine.
- Final message is the verdict artifact. Do not end by saying you will wait for anything.

## What changed since the last PASS

An earlier cycle passed at `f47d22329`. Since then the branch was **rebased onto `main@4f96aec40`**
(which carries #1412's specifier pinning and #1414's Deno 2.9.5 standardization) and the agent-docs
corpus was **regenerated** from post-repair sources. Prior cycles verified the intent-guidance
contract, ranking, byte-cap arithmetic, the eight embedded additions, the module boundary, and the
stale-count test repair. Those stand unless the rebase or regeneration disturbed them.

## Claims to falsify (execute; do not infer)

1. **The corpus is genuinely regenerated from post-repair sources, not hand-edited.** Re-run the
   generators and confirm the checked-in `packages/mcp/src/publish-assets.generated.ts` and
   `packages/cli/src/kernel/assets/agent-docs.generated.ts` are exactly what they produce
   (`check:publish-assets`, `check:assets-barrel` with a clean tree afterwards). Confirm
   `provenance.json` records a source commit that is a descendant of `4f96aec40`. If you can rebuild
   the prose payload independently and compare byte-for-byte, do so.
2. **`check:netscript-jsr-specifiers` reports `failures=0`** from the repo root. This is the sole
   condition that earns `Closes #1411`. Run it and quote the raw line. Then check whether the PR body
   actually carries that keyword, and whether it is justified by your own result — a keyword present
   without `failures=0` is a blocking finding, and so is the reverse omission.
3. **`version-drift_test.ts` passes**, and the CLI pair
   (`packages/cli/e2e/tests/agent/agent-mcp-stdio_test.ts` +
   `packages/cli/src/public/features/agent/init/init-agent_test.ts`) passes. The second is where a
   stale count-lock previously hid; confirm the assertion is still exact (`count: 3`, full ordered
   doc list including `llms`) and still able to fail — perturb it in scratch if in doubt.
4. **Byte budget honesty.** Report the current embedded total and document count against the 262,144
   cap. The previous state was 253,511 / 12 after a *recorded* quickstart drop. **If the document
   count fell below 12, a second document was dropped — find out which, and whether it was recorded
   in `drift.md` or silently absorbed.** A silent drop is a blocking finding regardless of whether
   the budget now fits.
5. **The locked evaluation is unchanged and still passes.** Five rows / 15 citations, byte-equal
   across embedded and materialized-filesystem adapters, `llms#task-router` rank 1 on both. **Check
   `git diff` on `packages/mcp/tests/fixtures/guidance-evaluation.json` across the rebase+regen** — if
   a citation moved because a repaired page changed and the fixture was edited to match, that is
   fitting the test to the output and is a blocking finding.
6. **The two docs-count files survive.** `docs/site/ai/agent-tooling.md` and
   `docs/site/reference/mcp/index.md` must remain in the branch diff (required by `registry_test`'s
   docs-drift proof). Confirm `registry_test` passes.
7. **Scope and hygiene.** `git diff origin/main...HEAD --name-only`: no lockfile change, no
   `docs/site` edits beyond those two files, nothing weakening a gate. Confirm the guard and the
   docs gates from #1412 are untouched.
8. **Truthful closure semantics — read this carefully.** #1404 merges as the **S1–S3 foundation
   only**. It must carry `Refs #1102`, **not** a closing keyword: acceptance row 6 (activation) is
   unimplemented S4 scope, and row 3 (concept mismatch) is partial — the issue's own paraphrase
   `"avoid hitting my service every render"` still returns `services-sdk/services#services-contracts`
   at rank 1. Verify both statements yourself against this head, then verify the PR body neither
   closes #1102 nor ticks those rows. A PR body that closes #1102, or a DoD claiming more than S1–S3,
   is a blocking finding.
9. **Slice gates.** Re-run the focused evaluation/retrieval/source-policy group, full
   `packages/mcp/tests/`, scoped check/lint/fmt, `scan-code-quality --root packages/mcp/src`, and MCP
   `publish:dry-run`. Report raw exits. State plainly anything you could not finish.

## Standard

Earlier IMPL-EVALs in this run reached PASS only by reproducing what the slice claimed — rebuilding a
4.6 MB corpus to byte-identity, breaking a repaired assertion in two dimensions, reproducing a
RED→GREEN toolchain proof in scratch. Match that.

Report per claim: claim → command → observed output → verdict. Then the overall verdict — exactly
`PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT` — and the minimal repair if not PASS, phrased so
the original writer can act on it.
