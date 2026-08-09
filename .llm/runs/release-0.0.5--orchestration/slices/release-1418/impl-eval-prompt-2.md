# IMPL-EVAL — PR #1419 / issue #1418, amended head (fresh evaluation)

**Role:** independent evaluator, read-only. You did not write this and must not defend it.
**Route:** Claude · Anthropic · Fable 5 · medium (native opposite-family; Codex-authored).
**Protocol:** `.llm/harness/evaluator/protocol.md` + `verdict-definitions.md`. Toolchain conventions:
`.agents/skills/netscript-deno-toolchain`, `.agents/skills/netscript-tools`.
**Subject head (immutable):** `e823a9b181215cb42c8f3a304ef5f44ed3b69c61` — local and remote verified identical.
**Worktree:** `/home/codex/repos/ns005-impleval-1419b` (already at that head; confirm with `git rev-parse HEAD`).

This is a **fresh evaluation**, not a continuation. An earlier evaluation of an earlier head returned
`FAIL_RESCOPE`; that verdict is void and must not be carried forward or credited. Judge this head on
its own executed evidence.

## Boundaries

- Read-only. No edits, commits, pushes, git write commands.
- **Never enter** `/home/codex/repos/ns005-w3b1` or other lane worktrees.
- No Aspire, containers, or `e2e:cli`.
- Deliver the verdict in your final message; do not end by saying you will wait for anything.

## History you need

`0.0.5-canary.18` failed at "Cut ephemeral canary branch and tag" (run `31311848987`):

```
error: Version residue remains for 0.0.4:
- packages/mcp/src/publish-assets.generated.ts
```

Two distinct defects were found:

1. **An ordering race** — `refreshAgentDocsProvenance()` and `generateMcpAssets()` were siblings in
   one `Promise.all`, so the MCP generator could read pre-bump provenance. Real, latent, fixed in the
   first commit with a regression.
2. **The actual blocker** — the embedded docs corpus (`.llm/assets/agent-docs/prose.json.gz`) carries
   `@netscript/*` pins at the previous release. `gen:agent-docs-prose` runs in neither
   `prepareRelease` nor `release-canary.yml`, so every cut deterministically re-embeds stale pins.
   The earlier evaluation proved the residue matcher never matches `MCP_PACKAGE_VERSION` or
   `frameworkVersion`, only `"jsr:@netscript/plugin@0.0.4"`-shaped strings.

The amended head adds a shared-corpus rebase to address (2).

## Claims to falsify (execute; do not infer)

1. **Does the cut now actually pass? — decisive.** Reproduce the earlier proof end to end in a
   scratch copy outside the repo: run the real `coordinateVersionBump(root, '<a canary version>',
   'canary')`, then `deno task gen:publish-assets`, then the real
   `findVersionResidue(root, '<old version>')`. **Residue must be empty.** The earlier evaluation ran
   exactly this and got a non-empty residue list; that is the bar. If residue is non-empty, this
   fails again and the canary cannot cut.
2. **CLI/MCP corpus agreement.** Both consumers must derive from the same rebased corpus and agree.
   Verify byte-consistency between the CLI and MCP embedded payloads rather than trusting the claim.
3. **The rewrite is exact, not blanket.** The code must call
   `rewriteNetScriptVersion(source, oldVersion, newVersion)` from `.llm/tools/deps/bump-version.ts`
   — the same function `findVersionResidue` probes with (`bump-version.ts:84`), so rebase and guard
   share semantics by construction. Confirm no second/looser matcher exists (an earlier draft added
   `rewriteNetScriptSpecifierVersions(text, newVersion)` matching any semver; it must be gone).
   Confirm `oldVersion` comes from corpus provenance, not inference.
4. **Historical pins survive — prove it yourself.** There is a negative assertion seeding
   `jsr:@netscript/cli@0.0.2` alongside current-release pins. Do not just read it: **mutate the
   implementation** to a blanket rewrite in scratch and confirm that assertion fails. A negative test
   that has only ever been seen passing cannot distinguish exact from blanket — both pass.
5. **Provenance integrity after rebase.** The corpus provenance must be fully refreshed against the
   rebased payload — version, sha256, and compressed/uncompressed byte counts as applicable. A
   rebased payload carrying a stale hash or byte count makes provenance describe an artifact that no
   longer exists; that is worse than the original defect and is blocking.
6. **The ordering fix and its regression are intact** from the first commit, and still fail under
   mutation.
7. **Residue guard untouched.** `.llm/tools/release/` must be byte-identical to `origin/main`. Any
   narrowing, exclusion or allowlist is blocking.
8. **Scope and release-tracked outputs.** Diff must stay within the generator, its test, and any
   release-output wiring. If the cut commits generated outputs, `prose.json.gz` should be
   release-tracked so the rebased corpus is part of the cut rather than uncommitted drift — report
   what you find. No `docs/site`, no lockfile, no overlap with #1417.
9. **Gates.** Asset/release tests, `check:publish-assets`, scoped check/lint/fmt. Report raw exits;
   state anything you could not run.

## Timebox

Rule as soon as claims 1, 3, 4 and 7 are answered. Anything unexamined must be stated as "not
examined" with a one-line reason — an honest gap is expected; an inferred judgement is not.

Report per claim: claim → command → observed output → verdict. Then the overall verdict, exactly
`PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT`, plus the minimal repair if not PASS. Concrete
blockers only; non-blocking observations separately labelled beneath the verdict.
