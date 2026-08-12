# IMPL-EVAL Verdict — Slice A / PR #1539 / issues #1438 + #1430

**VERDICT: FAIL (FAIL_FIX)**

Evaluator: Claude · Fable 5 · medium. Worktree `/home/codex/repos/ns006-f-a-impleval`
(detached `c0b98d93d`). Diffed against **merge-base `01aa12b67`**, not `origin/main`.
No publication, tag, canary, or push was performed. Generator worktree untouched.

## Headline answer — can non-version-bump content be admitted for canary-pair inheritance?

**YES.** I reproduced it. Non-version content injected into the agent-docs prose bundle
(`.llm/assets/agent-docs/prose.json.gz`) is admitted through the new D-6 fallback and reaches
the published CLI barrel, while both writer `--check` reproductions report success. The guard
does **not** enforce its stated invariant ("any other source or manifest drift fails closed")
for the prose bundle. This inverts the failure direction from safe to unsafe for that subset,
which is the exact defect class this lane exists to prevent.

The failure is scoped, not total: the byte-exact version-replacement rule, the writer-derived
path set, and the *source-derived* generated outputs (barrels/metadata/corpus) are sound. The
hole is specifically the two agent-docs outputs whose reproduction is **self-referential**.

---

## Blocking finding B-1 — prose-bundle reproduction is a self-consistency tautology

`verifyGreenCanaryPair` drops the parent→HEAD comparison for every path that
`isPreparedReleaseGeneratedOutput` matches (github-release.ts ~L190-197): it does **not** compare
`before`/`after`, it pushes the path to `inexactGeneratedPaths` and returns `true`, then relies
solely on `assertPreparedReleaseGeneratedOutputsFresh(root)` which runs the three writers in
`--check` mode against **HEAD only**.

For the source-derived outputs (barrels, package-metadata, export-surface corpus) that is
acceptable: the writer re-derives them from committed source (`skills/manifest.json`,
`consumer-tools.json`, package `deno.json`, the `deno doc` surface). If that source drifted, the
source file is a changed path **not** in the writer set, so `isVersionOnlyReleaseDiff` rejects the
whole diff first. I verified the barrel `--check` genuinely fails on tamper (below).

`prose.json.gz` is different. Its writer (`rebaseAgentDocsProse` in generate-publish-assets.ts) is
**not** a rebuild from the raw docs — it reads the committed blob, version-rewrites it, and
recompresses. On a same-version stable tree `oldVersion === version`
(`provenance.version` = `0.0.5` = `packages/cli/deno.json` version), so
`rewriteNetScriptVersion` is a no-op, `nextUncompressed === uncompressed`, and `--check` compares
the blob to itself. `provenance.json` is likewise recomputed from that same blob, and
`agent-docs.generated.ts` (barrel) is regenerated **from** the blob. The entire agent-docs chain
is anchored to an un-validated blob and can carry arbitrary non-version content as long as the
three files are mutually consistent — all three are in `PREPARED_RELEASE_GENERATED_OUTPUTS`, so
all three pass `isVersionOnlyReleaseDiff` and all three admit as "inexact generated".

### Reproduced attack (real quoted output)

Injected `MALICIOUS-NON-VERSION-CONTENT-INJECTED-BY-EVALUATOR` (no version string) into the first
file of the prose payload, re-serialized with the writer's exact
`JSON.stringify({schemaVersion:1, files})` shape, recompressed, and updated `provenance.json`
sha256/byte-counts with **version unchanged (0.0.5)**:

```
injected marker into context/01-how-the-web-became-the-default.mdx new sha256 da6a7bef...
=== gen:publish-assets --check on the INJECTED tree ===
gen-check-exit=0          # PASS — non-version tamper NOT detected
```

Regenerating the barrel to embed the injected prose (what a coordinated committer/attacker does),
then re-checking:

```
git status --porcelain
 M .llm/assets/agent-docs/prose.json.gz
 M .llm/assets/agent-docs/provenance.json
 M packages/cli/src/kernel/assets/agent-docs.generated.ts
=== generate-cli-assets-barrel.ts --check AFTER sync ===
barrel-check-exit=0       # PASS
```

Decoded the published barrel to confirm the payload actually ships the injection:

```
MALICIOUS marker present in decoded published barrel payload: True
```

Net effect: a stable commit that is HEAD^ (canary, green pair) **plus injected prose content**
(version identical) satisfies `isVersionOnlyReleaseDiff`, admits all three agent-docs files as
inexact-generated, passes `assertFresh`, and inherits the parent's canary pair — publishing prose
content no canary ever verified. Note also that when only generated outputs change with the
version unchanged, `previousVersion === nextVersion` makes `isExactVersionReplacement` return
`false` for every path, so every changed generated output funnels straight into the
inexact-generated branch.

**Why this is blocking, not cosmetic.** The honest `release:cut` tooling only version-rewrites the
prose, so this does not fire on normal use — but this guard exists specifically to be the
adversarial backstop against "publishing content that was never canary-verified" (brief's named
worst case). Before this PR the same scenario failed closed: `discoverVersionFiles` did not include
the generated outputs, so any prose change made the diff non-version-only and blocked inheritance
(the "annoying but safe" 0.0.5 behavior). This PR removes that safety for the prose bundle and
replaces it with a check that cannot detect the drift.

### Bounded fix direction (for the generator — I did not implement it)

For inexact-generated paths, prove HEAD ≡ version-bump(parent) instead of HEAD self-consistency:
compare each admitted generated output at `parent` version-rewritten to the value at `current`
(the same before/after already fetched for the exact rule), or rebuild the prose bundle from raw
docs so its reproduction is anchored to committed source like the other outputs. Either makes
injected prose fail closed, because injected content is absent from the parent/canary content.

## Non-blocking finding B-2 — `check:mcp-export-corpus` is environment-sensitive; the whole D-6 path may be non-functional in CI

On the clean committed tree, `deno task check:mcp-export-corpus` **fails** here:

```
error: MCP export-surface corpus is stale; run deno task gen:mcp-export-corpus
exit=1
```

Regenerating changes only the gzip/base64 blob + hash (4 lines), i.e. the `deno doc` byte output
differs in this environment (deno 2.9.5). This is the **safe** (fail-closed) direction and is a
pre-existing property of the corpus generator, not new code from this slice. But it means the
entire D-6 fallback (`assertPreparedReleaseGeneratedOutputsFresh`) would **always reject** whenever
the release-CI `deno doc` output does not reproduce the committing environment byte-for-byte —
defeating #1438's stated purpose (letting a coordinated cut inherit the canary pair) without any
safety loss. I could **not** verify whether the real release CI reproduces the committed corpus
deterministically. If it does not, the feature is inert (still safe). This is worth confirming
before relying on inheritance to skip a canary cycle.

## Acceptance items (PR body)

| Item | Verdict | Evidence |
| --- | --- | --- |
| Realistic full coordinated-bump set accepted | satisfied | focused test `...accepts a realistic coordinated release cut...` passes; 21/21 focused green |
| Genuine `packages/**/*.ts` source drift rejected | satisfied | code: `isVersionOnlyReleaseDiff` requires every path in writer set; test `canary pair gate fails closed for source drift` passes |
| Allowed set derived from prepare-release writer; test fails on divergence | satisfied | `discoverPreparedReleaseFiles` re-exported from `prepare-release.ts` and consumed by the verifier; focused derivation test asserts writer outputs present |
| Exact replacement first per-file check; exceptions require clean worktree + non-mutating reproduction | **partially satisfied / defective** | exact-first ordering confirmed and `--check` is genuinely non-mutating and fails on tamper (barrel proof); BUT the prose reproduction cannot detect non-version content (B-1) |
| `--prev-tag` resolves release date w/ commit-date fallback, used for closed-issues window | satisfied | `resolvePreviousTag` + `collectReleaseNotes`; focused tests `--prev-tag resolves a dated window...` and `...release date with commit-date fallback` pass |
| Known previous tag with empty `since` fails loudly before issue collection | satisfied | `collectReleaseNotes` throws `since timestamp is empty`; test `known previous tag with empty since fails loudly...` passes (queriedClosedIssues stays false) |
| Focused/suite/repo/scoped/clean/lock gates green | satisfied | see Gates below |
| Separate Fable 5 IMPL-EVAL PASS | **this verdict = FAIL** | B-1 |

## `--check` is real (independently verified, per brief)

The brand-new assets-barrel `--check` flag genuinely does not mutate and genuinely fails on
mismatch:

```
# clean tree: --check exit 0, git status still empty (no mutation)
# tampered barrel (appended a line): --check ->
error: .../packages/fresh-ui/registry.generated.ts is stale; run deno task gen:assets-barrel
exit=1
# post-check diff vs backup: only the tamper line present => check did NOT regenerate/write
```

So the check mechanism is not fake — it fails closed on tampered *source-derived* barrels. The B-1
hole is specifically the self-derived prose bundle, not the `--check` plumbing.

## Gates executed (mine, this worktree)

```
deno test .../github-release_test.ts        -> ok | 21 passed | 0 failed
deno test --allow-all .llm/tools/release/    -> ok | 101 passed | 0 failed
deno task test (full repo)                   -> ok | 3188 passed (617 steps) | 0 failed | 17 ignored (3m3s)
run-deno-check.ts --root packages --root plugins  -> 2876 files, 0 errors  (via deno task check path)
run-deno-check.ts --root .llm/tools/release  -> 40 files, 0 errors
run-deno-check.ts --root generate-cli-assets-barrel.ts -> 1 file, 0 errors
deno task lint (packages/plugins)            -> 0 findings
run-deno-lint.ts (.llm/tools/release + barrel + publish-assets) -> 42 files, 0 findings
deno task fmt:check (packages/plugins)       -> 0 findings
run-deno-fmt.ts (.llm/tools/release + barrel + publish-assets)  -> 42 files, 0 findings
git status --porcelain                       -> empty after all probes (restored)
git diff 01aa12b67...HEAD -- deno.lock       -> empty (lock unchanged)
```

Note: `deno task check`/`lint`/`fmt:check` root aliases only cover `packages/**` + `plugins/**`;
the changed files live in `.llm/tools/`, so I ran the scoped wrappers over the tool files directly
(all clean).

## What I could NOT verify

- Whether the real release CI reproduces the committed `export-surface-corpus.generated.ts`
  byte-for-byte (B-2). If not, D-6 inheritance never succeeds in CI (safe, but the feature is
  inert). Verdict does not depend on this.
- Live GitHub API behavior of `resolvePreviousTag`/`collectReleaseNotes` — verified via injected
  transports and unit tests only (no network calls made, by constraint).

## Verdict rationale

`FAIL_FIX`: one blocking, reproduced defect (B-1) in the exact guard the brief flagged as highest
risk — the D-6 fallback admits non-version content into an inherited-canary stable publish via the
agent-docs prose bundle. The fix is bounded (compare admitted generated outputs parent→HEAD, or
rebuild prose from source). #1430 is correct and complete. Everything else in #1438 (exact-first
ordering, writer-derived path set, source-derived reproduction, non-mutating `--check`) is sound.
