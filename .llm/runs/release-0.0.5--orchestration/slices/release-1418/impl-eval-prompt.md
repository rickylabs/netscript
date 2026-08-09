# IMPL-EVAL — PR #1419 / issue #1418 (publish-assets provenance ordering race)

**Role:** independent evaluator, read-only. You did not write this and must not defend it.
**Route:** Claude · Anthropic · Fable 5 · medium (native opposite-family; Codex-authored).
**Protocol:** `.llm/harness/evaluator/protocol.md` + `verdict-definitions.md`. Toolchain conventions:
`.agents/skills/netscript-deno-toolchain` and `.agents/skills/netscript-tools`.
**Subject head (immutable):** `77a41c3ba09bc133dd1c0af87656275ece282bf6` — verified identical local and remote.
**Worktree:** `/home/codex/repos/ns005-impleval-1419` (already at that head; confirm with `git rev-parse HEAD`).

## Boundaries

- Read-only. No edits, commits, pushes, git write commands.
- **Never enter** `/home/codex/repos/ns005-w3b1` or other lane worktrees.
- No Aspire, containers, or `e2e:cli`.
- Deliver the verdict in your final message; do not end by saying you will wait for anything.

## Why this exists

The `0.0.5-canary.18` cut failed at "Cut ephemeral canary branch and tag" (run `31311848987`) with:

```
error: Version residue remains for 0.0.4:
- packages/mcp/src/publish-assets.generated.ts
```

Cause: `.llm/tools/generate-publish-assets.ts` ran `refreshAgentDocsProvenance()` and
`generateMcpAssets()` as siblings in one `Promise.all`, so after a version bump the MCP generator
could read the pre-bump provenance and embed `MCP_PACKAGE_VERSION = '0.0.4'`. The residue guard
caught it correctly — nothing shipped, and no canary number was consumed.

The pre-existing test called `refreshAgentDocsProvenance()` in isolation, so the ordering
relationship was structurally untestable. That is the real defect: a correct function composed
incorrectly.

## Claims to falsify (execute; do not infer)

1. **The regression genuinely fails on the pre-fix ordering.** This is the decisive check and the
   whole point of the slice. The lane reports a mutation proof: `RAW_EXIT_CODE=1`,
   `FAILED | 2 passed | 1 failed` pre-fix, then `RAW_EXIT_CODE=0`, `ok | 3 passed | 0 failed` after.
   **Reproduce it yourself**: in a scratch copy outside the repo, revert `generatePublishAssets` to
   put `refreshProvenance` back inside the parallel `Promise.all`, run the test file, and confirm it
   fails **and that the failure is the new orchestration test**, not some incidental breakage. Then
   confirm the unmutated head passes. A regression only ever observed passing proves nothing.
2. **The fix is the approved minimal shape.** `await steps.refreshProvenance()` precedes the
   remaining generators; the other five stay parallel. Confirm the fix is ordering, not blanket
   serialization — serializing everything would be a performance regression, not the approved change.
3. **The test asserts an observable consequence, not call order via spies.** It seeds a stale
   `provenance.json` at `0.0.4` while `deno.json` says `0.0.5-canary.18` — the exact state a release
   bump creates — and should assert what MCP generation actually emitted. Judge whether it would
   survive a refactor that preserves behaviour, and whether it is asserting the right thing.
4. **The residue guard is untouched.** `prepare-release.ts` and its residue logic must be unchanged.
   Any narrowing, exclusion, or allowlist there is a blocking finding — the guard is the only reason
   this did not ship.
5. **Scope.** `git diff origin/main...HEAD --name-only` must be the generator, its test, and run
   artifacts only. No `docs/site`, no lockfile, no `packages/**` source, nothing overlapping #1417
   (`publish-workspace` manifest mutation — an unrelated adjacent defect).
6. **Gates.** Re-run the asset/release tests, `check:publish-assets`, `check:assets-barrel`, scoped
   check/lint/fmt, and a publish dry-run. Report raw exits. The lane reports 95 passed and scoped
   check/lint/fmt clean.
7. **Would the cut now succeed?** Judge whether this change is sufficient for `prepareRelease` to
   pass the residue check on a real bump — i.e. is the ordering race the *only* path by which a stale
   version reaches `publish-assets.generated.ts`? If another consumer of provenance still races, say
   so; that would mean the canary fails again for the same reason.

## Timebox

Rule as soon as claims 1, 2 and 4 are answered. State anything unexamined explicitly as "not
examined" with a one-line reason — an honest gap is expected; an inferred judgement is not.

Report per claim: claim → command → observed output → verdict. Then the overall verdict, exactly
`PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT`, plus the minimal repair if not PASS. Concrete
blockers only; non-blocking observations in a separate labelled list beneath the verdict.
