[PHASE: IMPL-EVAL] [VERDICT: PASS]

# Independent stable-cut review: release/cut-0.0.7 (PR #1984)

Head (immutable, full): `b8fb15bc136feb98ef81c21d010f43b1ee282798` ("chore(release): cut 0.0.7"),
parent `a2d5b8b75083769b946c03ab772e08f2634e2b35`. Evaluator worktree
`/home/agent/projects/netscript/worktrees/007-eval-readme-cold`, detached at the exact release
head; all four prior #1983 verdicts preserved untracked and untouched.

Evaluator: same independent session `0039d1ad-72eb-4047-964c-8b326ff65902` (not author/coordinator),
Claude Code + OpenRouter, model `z-ai/glm-5.3-flash`, 2026-09-03. No product/source edits, commits,
pushes, PR mutations, container operations, or publication performed. CI verification and stable
publication remain coordinator-owned; nothing here waits on or claims CI.

## Check 1 — delta purity: only version surfaces and native generated assets

`git diff --name-status a2d5b8b75..b8fb15bc1`: 64 files, all `M`, 0 additions/deletions, 320
insertions / 320 deletions — perfectly balanced, consistent with 1:1 token swaps.

Per-file sweep for changed lines lacking a `0.0.6`/`0.0.7` token: **59 of 64 files are pure
version swaps** (root + package + plugin `deno.json`, both `deno.lock` files, 6
`scaffold.plugin.json`, 9 `package-metadata.generated.ts`, 2 `.agents/generated/consumer-skills`
surfaces — all confirmed `0.0.6` → `0.0.7` only, e.g. consumer skills
`jsr:@netscript/cli@0.0.6` → `0.0.7`, fresh-ui lock member refs bumped wholesale).

The **5 files with non-version lines are all native generated assets**, and every non-version line
is asset-internal, not code: `provenance.json` (sourceCommit `d3df14bae`→`a2d5b8b75`,
extraction timestamp, compressedBytes, payload sha256), `agent-docs.generated.ts` /
`agent-tools.generated.ts` / `mcp/src/publish-assets.generated.ts` / `mcp
export-surface-corpus.generated.ts` (content sha256 constants, recompressed base64 payload,
compressedBytes, sourceCommit). No source `.ts` logic, no docs, no workflow, no dependency-graph
addition/removal anywhere in the delta. Leftover check: zero `"0.0.6"` remains in any changed
`deno.json`/`scaffold.plugin.json`; root and `packages/cli` versions are `"0.0.7"`.

## Check 2 — provenance integrity (independently recomputed)

My first byte-level `sha256sum` of `prose.json.gz` (`d76cfff2…`) did **not** match the recorded
`b0b8a897…` — investigated before concluding: `generate-publish-assets.ts:261` defines the
recorded sha256 over the **uncompressed** payload, and Deno's `CompressionStream('gzip')` embeds
an mtime, so gz bytes are intentionally non-reproducible while content is semantic. Independent
recomputation: gunzip committed asset → **4,915,623 bytes = provenance `uncompressedBytes`;
sha256 = `b0b8a897c801c992ff1e60d0b67b675a1a6687858093312892605f4856bfba71` = recorded**;
182 docs files, schemaVersion 1, and `0.0.6` no longer appears anywhere in the payload (the
version rewrite is complete). Provenance `sourceCommit` is the release parent — the assets
derive from exactly the source this cut publishes.

## Check 3 — native semantic generated-output verifier accepts the canary inheritance

`deno task gen:publish-assets --check` → **exit 0, zero stale paths**. In check mode the native
verifier decompresses the committed asset, re-applies the `oldVersion→current` rewrite
(idempotent at the cut), compares content semantically, and re-derives provenance — so it accepts
the green canary's committed assets as current for 0.0.7. Release tooling tests:
`prepare-release_test.ts` → **5 passed / 0 failed** via the structured wrapper.

## Check 4 — read-only publish dry-run (flag never omitted)

`GH_CONFIG_DIR=/home/agent/.config/netscript-release-gh deno task release:publish -- v0.0.7
--notes-file …/release-0.0.7-intro.md --prev-tag v0.0.6 --dry-run` → **exit 0**. Header evidence:
`green canary pair: a2d5b8b75083769b946c03ab772e08f2634e2b35 (release/canary-pair)` (the tool
itself binds the cut to the accepted green pair), `previous release: v0.0.6`,
`closed issues since previous release: 100`, and
`DRY RUN — would create v0.0.7 (prerelease=false, latest=true, draft=false)` with the intro prose
rendered — correct stable semantics. No token material printed.

## Caveats (recorded, not blockers)

1. **Note-only, known:** native closed-issue collection stops at 100 — the dry run itself reports
   exactly `100`, confirming the truncation. Coordinator reconciles the public note with all
   paginated issues using the existing formatter. Not product content drift; no new canary
   warranted.
2. Gz byte-level nondeterminism (gzip mtime) is expected; the native verifier is semantic by
   design and passes.
3. Stable publication and pinned stable E2E remain mandatory, coordinator-owned, and were not run
   here; CI on the PR is verified independently by the coordinator before merging.

## Blockers

None found.
