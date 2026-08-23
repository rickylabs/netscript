use harness

# Slice W6 — release:cut does not regenerate the version-coupled agent-docs corpus

| Field | Value |
| --- | --- |
| Worktree | `/home/codex/repos/ns006-w6` |
| Branch | `fix/cut-regenerates-agent-docs-prose` |
| Base | `origin/main@bf4b877f17` |
| Route | Codex · OpenAI · GPT-5.6 Sol · **medium** |
| Priority | **P0 — blocks the 0.0.6 stable cut. Release PR #1627 is red on this.** |
| PLAN-EVAL | N/A — the seam and the required property are specified below |
| IMPL-EVAL | Normal **automatic** evaluator on draft → ready. Do not flip; the orchestrator flips. |

## SKILL

- `netscript-harness` · `netscript-release` (**authority on the cut sequence and what it regenerates**)
- `netscript-tools` (generated-artifact gates and evidence) · `netscript-pr` · `rtk`

## The defect

Release PR #1627 (`chore(release): cut 0.0.6`, head `9400e613e`, base `bf4b877f17`) fails `quality`
at the agent-docs corpus freshness gate:

```
{"fresh":false,"stalePaths":["prose.json.gz","provenance.json"]}
build-agent-docs-bundle.ts:358 -> Error: Agent docs prose is stale
```

**This is not a false positive.** #1626 made that gate content-based and correct. The corpus really is
stale after a cut, because **the corpus content is version-coupled**: 20 files in the committed
corpus embed the literal string `0.0.5` — `llms.txt`, `llms-full.txt`, and rendered pages carrying
install snippets and `jsr:@netscript/*` specifiers. After `release:cut` bumps the workspace to
`0.0.6`, a docs rebuild renders `0.0.6` in those files, so the freshly-built corpus no longer matches
the committed one.

Note the check deliberately cannot false-positive on version metadata:
`build-agent-docs-bundle.ts:350-352` reuses `previous.version`, `previous.sourceCommit`, and
`previous.extractionTimestamp` in `--check` mode. The mismatch is genuine **content**.

## The seam

`.llm/tools/release/prepare-release.ts`:

- **Lines 74-97** run exactly three post-bump regeneration gates: `gen:publish-assets`,
  `gen:mcp-export-corpus`, `gen:assets-barrel`. **`gen:agent-docs-prose` is not among them.**
- **Line 37** — `PREPARED_RELEASE_GENERATED_OUTPUTS` is `PUBLISH_ASSET_OUTPUTS` +
  `EXPORT_SURFACE_CORPUS_OUTPUT`. The agent-docs outputs
  (`.llm/assets/agent-docs/prose.json.gz`, `.llm/assets/agent-docs/provenance.json`) are **absent**,
  so even a regenerated corpus would never be staged into the cut commit.

Both halves must be fixed, or the cut either leaves a stale asset or regenerates one it does not
commit.

## Required property

**A `release:cut` for version X must produce a commit whose agent-docs corpus is fresh for X.** After
the cut, `deno task check:agent-docs-prose` must pass against the cut commit without any further
regeneration.

Constraints that are not negotiable:

- **The cut diff must remain coordinated version-only.** The stable publisher inherits the
  `release/canary-pair` evidence only for a version-only commit; any other drift fails closed. The
  regenerated corpus is a version-coupled generated asset in the same class as the publish assets and
  the MCP export corpus, so it belongs to that set — verify the resulting diff still contains nothing
  outside manifests, lockfiles, and generated assets.
- `gen:agent-docs-prose` builds the docs site first (`deno task --cwd docs/site build`). That is
  expected and must not be shortcut by hand-editing the asset. If ordering matters relative to the
  other generators, say so and justify your placement.
- Do not weaken, skip, or make optional the freshness gate. The gate is correct; the cut is what is
  incomplete.

## Discriminating tests — required

Tests that **fail against the current code**:

1. The prepared-release gate sequence includes `gen:agent-docs-prose`. `prepare-release_test.ts`
   already asserts the exact gate list at lines 43-45 and 74-76 — extend it so the missing gate is a
   test failure, not a silent omission.
2. `PREPARED_RELEASE_GENERATED_OUTPUTS` includes both agent-docs outputs, so `collectPreparedReleaseFiles`
   stages them.
3. An end-to-end-ish assertion that a bump + regeneration leaves the freshness check green. If a true
   E2E is impractical, prove it by executing the real cut path in a disposable copy and showing
   `check:agent-docs-prose` green on the result — and say plainly which you did.

State in `evidence.md` which assertion fails on the pre-fix code.

## Gates

```
rtk proxy deno task check · test · lint · fmt:check
deno task check:agent-docs-prose        # must be green, twice in a row
```

Then the decisive proof: **run `deno task release:cut -- 0.0.7 --dry-run` in a disposable copy**
(not this worktree — the dry run leaves the tree version-bumped) and show that the regenerated corpus
is fresh for the bumped version. Use `0.0.7` deliberately: `0.0.6` is the live release target and
must not be minted or pushed by you.

## Hazards

- Never wrap an attached session in a shell `timeout` — it kills the turn ~25s later.
- `deno fmt` rewraps; re-read after formatting.
- Explicit-path `git add`; assert `git diff --stat -- deno.lock packages/fresh-ui/deno.lock` empty.
- **No publication, no real `release:cut`, no tag, no branch named `release/cut-0.0.6`.** I own the
  release train and a cut is pending on this fix.
- Write evidence to `.llm/runs/fix-cut-regenerates-agent-docs-prose--w6/evidence.md`. Do **not**
  create a repository-root `slices/` directory.

## Deliverables

1. The fix on `fix/cut-regenerates-agent-docs-prose`.
2. `.llm/runs/fix-cut-regenerates-agent-docs-prose--w6/evidence.md` — untruncated gate output, the
   pre-fix red for each discriminating test, and the dry-run cut proof.
3. A **draft PR against `main`**: labels `type:fix`, `area:release`, `area:tooling`, `priority:p0`,
   exactly one `status:`; milestone `0.0.6`. Check for acceptance checkboxes before adding any
   structured evidence block; match box text **verbatim** or use `box-index`.
4. Report the PR number and stop. Do not merge, do not flip to ready, do not touch labels.
