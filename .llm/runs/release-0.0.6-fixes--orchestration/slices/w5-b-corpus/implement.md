use harness

# Slice W5-B — agent-docs corpus freshness gate is non-deterministic (release blocker)

| Field | Value |
| --- | --- |
| Worktree | `/home/codex/repos/ns006-w5b` |
| Branch | `fix/agent-docs-corpus-determinism` |
| Base | `origin/main@9a7cadcaa` |
| Route | Codex · OpenAI · GPT-5.6 Sol · **medium** |
| Priority | **P0 — blocks the 0.0.6 stable cut. Release PR #1624 is red on this.** |
| IMPL-EVAL | Normal automatic evaluator on draft → ready |

## SKILL

- `netscript-harness` · `netscript-tools` (**authority on generated-artifact gates and validation evidence**)
- `netscript-release` (the coordinated version-only cut contract) · `netscript-pr` · `rtk`

## The defect

Release PR #1624's `quality` job fails at **Agent docs corpus freshness**
(`check:agent-docs-prose`). The evidence is decisive:

- Same **178-file** input.
- Committed asset sha `af73132a…`; regenerated sha `ebba6b95…`.
- Compressed size **1352846 → 1352808**.

**Different output sizes from identical input means the compressor varied, not the content.**

`.llm/tools/docs/build-agent-docs-bundle.ts`:

```ts
:55  async function gzip(bytes: Uint8Array): Promise<Uint8Array> {
:58    const stream = new Blob([copied.buffer]).stream().pipeThrough(new CompressionStream('gzip'));
:87  const compressed = await gzip(encoded);
:96  sha256: hex(await crypto.subtle.digest('SHA-256', new Uint8Array(compressed).buffer)),
:100 await Deno.writeFile(join(outputRoot, 'prose.json.gz'), compressed);
```

`CompressionStream('gzip')` is **not byte-stable** — chunking and zlib parameters may differ across
runtime versions and environments. The freshness contract then hashes the **compressed** bytes and
`check:agent-docs-prose` runs `git diff --exit-code` on the `.gz`, so any encoder variation turns
the gate red even when the corpus content is byte-identical. Note the function's own comment claims
a deterministic asset; it is not.

## Required property

The freshness contract must be **content-identity based, not compressed-byte based**.

- Deriving freshness from a hash of the **uncompressed, canonically-serialized** corpus is the
  natural fix; the compressed artifact is a transport detail and must not define identity.
- If you keep hashing compressed bytes, you must make compression genuinely deterministic and prove
  it — but prefer the content-hash route, which removes the whole class.
- The gate must still catch a **real** staleness: if any input file changes, the check must fail.
  A fix that makes the gate always pass is strictly worse than the flap.

**Release-contract constraint, non-negotiable.** `release:cut` regenerates this asset as part of the
coordinated bump. The stable publisher inherits the canary-pair evidence only for a **coordinated
version-only** commit; any other drift fails closed. A non-deterministic `.gz` can therefore inject
spurious non-version bytes into the cut commit and break that inheritance. Your fix must keep the
regenerated asset stable across runs for unchanged content, so a cut diff stays version-only.

## Discriminating tests — required

Tests that **fail against the current code**:

1. Regenerating twice from identical input produces an identical freshness verdict (and, if you keep
   the compressed artifact in the identity, identical bytes).
2. Changing one input file **fails** the freshness check — prove the gate still detects real
   staleness.
3. If you move identity to the uncompressed hash: a byte-different-but-content-identical `.gz` does
   **not** fail the check, while content drift does.

State plainly in `evidence.md` which assertion fails on the pre-fix code, and show the actual
double-regeneration output.

## Gates

```
rtk proxy deno task check
rtk proxy deno task test
rtk proxy deno task lint
rtk proxy deno task fmt:check
deno task check:agent-docs-prose      # currently red; must be green and STABLE across two runs
```

Run `check:agent-docs-prose` **twice in a row** and show both green — a single green run cannot
distinguish a fix from a lucky encoder.

## Hazards

- Never wrap an attached session in a shell `timeout` — it kills the turn ~25s later.
- `deno fmt` rewraps; re-read after formatting.
- Explicit-path `git add`; assert `git diff --stat -- deno.lock packages/fresh-ui/deno.lock` empty.
- Regenerating the corpus requires the docs site build (`gen:agent-docs-prose` builds `docs/site`
  first). That is expected; do not shortcut it by hand-editing the asset.
- **No publication, no `release:cut`, no tag.** I own the release train.
- Land on `main` as a leaf PR; do not touch `release/cut-0.0.6` or PR #1624.

## Deliverables

1. The fix on `fix/agent-docs-corpus-determinism`.
2. `slices/w5-b-corpus/evidence.md` — untruncated gate output, the double-regeneration proof, the
   real-staleness-still-detected proof, and the pre-fix red.
3. A **draft PR against `main`**: labels `type:fix`, `area:tooling`, `area:docs`, `priority:p0`,
   exactly one `status:`; milestone `0.0.6`. Same acceptance-evidence caution as always: check for
   checkboxes before adding a structured block; match text **verbatim** or use `box-index`.
4. Report the PR number and stop. Do not merge.
