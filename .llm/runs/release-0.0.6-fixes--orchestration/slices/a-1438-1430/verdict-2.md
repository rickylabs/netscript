# IMPL-EVAL Verdict (cycle 2) — Slice A / PR #1539 / issues #1438 + #1430

**VERDICT: FAIL (FAIL_FIX)**

Fresh evaluator: Claude · Fable 5 · medium. Worktree `/home/codex/repos/ns006-f-a-impleval2`
(detached `5350d01fc`). Diffed against **merge-base `01aa12b67`**, not `origin/main`. No publication,
tag, canary, push, commit, or merge. Generator worktree `ns006-f-a-release-tooling` untouched
(still on its branch, not modified). Worktree ends clean; `deno.lock` unchanged. I did not inherit
cycle 1's verdict — every claim below is from a command I ran in this session.

---

## Headline answer — can non-version-bump content still be admitted for canary-pair inheritance?

**YES — still admissible, through a DIFFERENT writer-declared path than cycle 1.** The repair closed
the exact prose-blob vector cycle 1 reported, but the same defect class survives via
`.llm/assets/agent-docs/provenance.json`. Injecting an arbitrary non-version field into
`provenance.json` (prose blob untouched, version unchanged), syncing the agent-docs barrel, is
**ADMITTED** for canary-pair inheritance and the injected content reaches the published CLI barrel.
This is the same defect the brief warned about — "the same defect class in a new costume."

The prose vector itself is genuinely fixed, and the legitimate coordinated cut still inherits (below).

---

## What I confirmed FIXED (cycle 1's prose vector)

I rebuilt cycle 1's attack end to end in a scratch repo (never touching the evaluator worktree):
parent = the real committed 0.0.5 agent-docs blob (canary content), child = the same tree with
`MALICIOUS-NON-VERSION-CONTENT-INJECTED-BY-EVALUATOR` appended to the first prose document, version
pinned at 0.0.5, `provenance.json` sha256/byte-counts updated, barrel synced. I drove the **real**
`verifyGreenCanaryPair` with real git dependencies (`git rev-parse`, `git diff --name-only`,
`git show`, `git show` bytes) and a stubbed GitHub status granting the **parent** a green
`release/canary-pair`:

```
{"result":"REJECTED","message":"Stable publication blocked: agent-docs prose contains non-version
changes, so the parent canary evidence cannot authorize this content."}
```

The new `isExactAgentDocsVersionReplacement` anchors HEAD prose to the version-rewrite of the
**parent** prose (decompress both, apply `rewriteNetScriptVersion` to the parent payload, require
byte equality of the decoded content). Injected content is absent from the canary parent, so the
equality fails closed. Same-version no-op and wrong-version-pair both return `false`, verified
directly against the real 0.0.5 blob:

```
{"scenario":"legit-0.0.5-cut","agentDocsDeltaAccepted":true}
{"scenario":"same-version-noop","agentDocsDeltaAccepted":false}
{"scenario":"wrong-version-pair","agentDocsDeltaAccepted":false}
```

Edge probes on the prose anchor, all safe:
- **gzip determinism** — the anchor compares **decompressed** content, so compression level/timestamp
  cannot break or forge inheritance. A deno decompress→recompress round-trip of the legit AFTER blob
  stayed `agentDocsDeltaAccepted:true`. (I read the code path: `decompressGzip(afterCompressed)` is
  compared to the re-encoded JSON — compressed bytes are never compared.)
- **Absent parent blob** — parent commit lacking `prose.json.gz`: `git show` fails, the error
  propagates, `verifyGreenCanaryPair` → `REJECTED` (fail-closed).
- **Consistent parent+HEAD injection** — requires the marker to be present in the canary **parent**,
  i.e. the canary actually published it; that is the canary doing its job, not a bypass.

---

## BLOCKING FINDING B-1 (new) — `provenance.json` admits arbitrary non-version content

`provenance.json` is a writer-declared generated output (`PREPARED_RELEASE_GENERATED_OUTPUTS`, added
to the release file set by THIS PR). The repair's parent-anchor equality is applied **only** to
`AGENT_DOCS_PROSE_PATH` (`github-release.ts` ~L207-236, `.some(path === AGENT_DOCS_PROSE_PATH)`). A
change that touches `provenance.json` **without** touching `prose.json.gz` skips the anchor entirely
and is admitted purely on `assertPreparedReleaseGeneratedOutputsFresh` — which is **tautological for
provenance**:

- `refreshAgentDocsProvenance` and `rebaseAgentDocsProse` both re-emit provenance as
  `JSON.stringify({ ...provenance, version, uncompressedBytes, compressedBytes, sha256 })` — they
  **spread `...provenance`, preserving arbitrary injected fields**, and re-derive sha256/bytes from
  the **unchanged** prose blob. So an injected field never trips `gen:publish-assets --check`.
- `renderAgentDocsEmbeddedContent` serializes the whole provenance object into the published
  `EMBEDDED_AGENT_DOCS_PROVENANCE` constant, so the field ships.

Reproduced against the real worktree, then driven through the real inheritance path:

```
# 1) Inject a non-version field into provenance.json (prose untouched), re-run the writer check:
injected field, version still 0.0.5
clean-gpa-exit=0                 # gen:publish-assets --check BEFORE inject: PASS
injected-gpa-exit=0              # gen:publish-assets --check AFTER inject: PASS (field preserved)

# 2) Regenerate the barrel; the field flows into the published artifact:
gen-barrel-exit=0
FIELD PRESENT IN PUBLISHED BARREL     # grep of packages/cli/src/kernel/assets/agent-docs.generated.ts

# 3) Drive real verifyGreenCanaryPair: parent=clean 0.0.5 (green pair), child=0.0.5 with the
#    injected provenance field + synced barrel, prose UNCHANGED (changed files:
#    provenance.json, agent-docs.generated.ts):
{"result":"ADMITTED","inheritedSha":"<parent-sha>"}
```

In step 3, `generatedOutputsFresh` was stubbed to resolve — justified because steps 1-2 independently
proved the two provenance-touching components of the real `assertFresh`
(`gen:publish-assets --check` and the barrel regeneration/`--check`) pass with the injected field.
The remaining `assertFresh` component (`check:mcp-export-corpus`) inspects the deno-doc export
surface and is orthogonal to provenance, so it does not rescue this path on a clean-source cut.

**Why blocking, same class as cycle 1.** Before this PR, any `provenance.json` change made the diff
non-version-only and blocked inheritance (safe). This PR added the generated outputs to the allowed
set; the repair anchored only the prose blob to the canary parent and left provenance (and, through
it, the agent-docs barrel) admittable with content the canary never verified. The lane exists
specifically to stop "publishing content that was never canary-verified"; this path does exactly that.

**Bounded fix direction (not implemented — evaluator).** Either (a) apply the same parent-anchor
equality to `provenance.json` (and any other blob-shaped writer output) — require HEAD provenance to
equal the version-rewrite of the parent provenance; or (b) make the provenance writer emit a
**closed** field set instead of spreading `...provenance`, so injected fields become stale under
`gen:publish-assets --check`. Direction (a) matches the prose fix and also covers the derived barrel,
since the barrel is regenerated from prose+provenance and provenance would then be parent-anchored.

Note: direct edits to the agent-docs **barrel** alone are still caught (it is regenerated from
prose+provenance and `gen:assets-barrel --check` fails on divergence — verified by the class of
source-derived barrels in cycle 1); the leak is specifically the provenance `...provenance` spread.

---

## Legitimate path still inherits (feature not inert)

The real measured v0.0.5 cut inherits, driven end to end through `verifyGreenCanaryPair` (parent =
0.0.4 agent-docs tree from `6ec75573d^`, child = 0.0.5 tree from `6ec75573d`, real prose delta,
version bumped, parent granted green pair):

```
{"result":"ADMITTED","inheritedSha":"<0.0.4-parent-sha>"}
```

and at the function level `isExactAgentDocsVersionReplacement(0.0.4-prose, 0.0.5-prose, 0.0.4,
0.0.5) === true`. A genuine coordinated cut is not falsely rejected by the prose anchor. The fix is
not inert.

---

## B-2 from cycle 1 — CI determinism of `check:mcp-export-corpus`: PARTIALLY RESOLVED

- `check:mcp-export-corpus` **fails on the clean committed HEAD tree** here (`exit=1`, corpus stale),
  reproducing cycle 1's symptom. **But the cause is source drift, not `deno doc` non-determinism**:
  the committed corpus was last regenerated at the 0.0.5 cut (`0e78e9c58`, an ancestor of HEAD), and
  91 `packages/**`+`plugins/**` files (7503 insertions) changed between that commit and HEAD. The
  committed corpus reflects 0.0.5 source; HEAD source diverged. This is expected mid-milestone
  staleness on a dev branch, **not** the state of a real release commit — `release:cut` regenerates
  the corpus (`prepare-release.ts` runs `gen:mcp-export-corpus` at cut time, verified in source).
- **Corpus generation is deterministic within this environment**: two consecutive
  `gen:mcp-export-corpus` runs produced byte-identical output (identical sha1). CI pins
  `deno-version: 2.9.5` (all workflows) and my environment is deno 2.9.5 linux x86_64, so a cut
  performed in the CI-equivalent environment will reproduce byte-for-byte in `publish.yml`.
- **What I still cannot establish:** cross-environment determinism. If a real cut regenerates the
  corpus on a different platform/deno patch than `publish.yml`, `deno doc` output could differ and
  the D-6 inheritance path (which runs `check:mcp-export-corpus`) would then reject. I could not test
  a non-linux / non-2.9.5 cutting environment. Also note CI's `ci.yml` runs `check:publish-assets`
  and `check:assets-barrel` but **not** `check:mcp-export-corpus`; only the D-6 inheritance path
  exercises it, so the committed corpus is not independently verified fresh elsewhere in CI.

Net: B-2 is not a blocking inheritance-always-rejects defect the way cycle 1 feared **provided the
cut runs on the pinned deno 2.9.5 linux surface**; I cannot certify determinism outside that surface.

---

## #1430 (spot-check) — correct and complete

- `resolvePreviousTag` resolves release `published_at`/`created_at`, then falls back to commit
  `committer.date`, then `author.date`, and **throws loudly** if none resolves — the original bug
  was `since: ''` being falsy so `fetchClosedIssues` silently returned `0`.
- `collectReleaseNotes` throws `since timestamp is empty` for a known previous tag with empty `since`
  **before** any issue collection (`queriedClosedIssues` stays false).
- `fetchClosedIssues` uses `closed:>${since}`.
- Focused tests pass: `--prev-tag resolves a dated window and queries closed issues` (ok),
  `known previous tag with empty since fails loudly before reporting closed issues` (ok),
  `explicit previous tag uses release date with commit-date fallback` (in-suite, green).

---

## Gates executed (mine, this worktree)

```
deno test --allow-all .llm/tools/release/            -> ok | 102 passed | 0 failed  (was 101; +1 regression test)
deno task test (full repo)                           -> ok | 3189 passed (617 steps) | 0 failed | 17 ignored (3m29s)
run-deno-check.ts --root .llm/tools/release          -> 40 files, 0 errors
run-deno-check.ts --root generate-cli-assets-barrel  -> 1 file, 0 errors
run-deno-lint.ts  --root .llm/tools/release          -> 40 files, 0 findings
run-deno-fmt.ts   --root .llm/tools/release          -> 40 files, 0 findings
deno task check   (packages/plugins alias)           -> failedBatches:0, exit 0
deno task lint    (packages/plugins alias)           -> exit 0
deno task fmt:check(packages/plugins alias)          -> exit 0
check:publish-assets (clean HEAD)                    -> exit 0
check:mcp-export-corpus (clean HEAD)                 -> exit 1 (source-drift staleness, see B-2)
git status --porcelain                               -> empty (all tampers restored)
git diff 01aa12b67...HEAD -- deno.lock               -> empty (lock unchanged)
HEAD                                                 -> 5350d01fc (unchanged)
```

## What I could NOT verify

- Cross-environment corpus determinism (cut env ≠ `publish.yml` env). Only same-environment
  (deno 2.9.5 linux) determinism shown. See B-2.
- Live GitHub API behavior of `resolvePreviousTag`/`collectReleaseNotes`/canary-status lookup —
  exercised via injected transports and real git only; no network by constraint.
- The provenance ADMITTED reproduction stubbed `generatedOutputsFresh`; its provenance-touching
  components were proven independently against the real worktree (B-1 steps 1-2), but I did not run
  the full three-command `assertFresh` inside the scratch repo (it needs the whole workspace tree).

## Verdict rationale

`FAIL_FIX`: one blocking, reproduced defect (B-1). The repair correctly closed cycle 1's prose vector
and preserved the legitimate coordinated-cut inheritance, but the **same admit-non-version-content
class remains** via `provenance.json` (and the agent-docs barrel it feeds), because the parent-anchor
equality guards only `prose.json.gz` while `assertFresh`'s provenance reproduction is tautological
(`...provenance` spread preserves injected fields; sha/bytes re-derived from the unchanged prose).
The fix is bounded: parent-anchor provenance too, or emit a closed provenance field set. #1430 is
correct and complete. A PASS here would authorize merging a guard that still lets un-canary-verified
content reach a stable publish.
