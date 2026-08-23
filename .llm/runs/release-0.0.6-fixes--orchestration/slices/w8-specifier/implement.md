use harness

# Slice W8 — JSR specifier scanner absorbs sentence punctuation (#1631)

| Field | Value |
| --- | --- |
| Worktree | `/home/codex/repos/ns006-w8` |
| Branch | `fix/1631-specifier-token-boundary` |
| Base | `origin/main@33418a6c8` |
| Route | Codex · OpenAI · GPT-5.6 Sol · **low** |
| Priority | **P0 — blocks the 0.0.6 canary and therefore the stable cut** |
| PLAN-EVAL | N/A — small deterministic fix, seam identified below |
| IMPL-EVAL | Normal automatic evaluator on draft → ready. **Do not flip; I flip it.** |

## SKILL

- `netscript-harness` · `netscript-release` (**authority on the readiness gates and the cut sequence**)
- `netscript-deno-toolchain` (use the toolchain, not hand-rolled parsing) · `netscript-tools` ·
  `netscript-pr` · `rtk`

## The defect

Canary run `31658880683` from exact main `33418a6c8` failed `publish:readiness` →
`versionless-specifiers`:

```
packages/mcp/src/publish-assets.generated.ts:31 jsr:@netscript/cli@0.0.6-canary.8.
pins 0.0.6-canary.8. instead of 0.0.6-canary.8
```

The diagnostic refutes itself: the "pinned" value is the correct version **plus a trailing period**.
Nothing is mis-pinned — the scanner absorbed sentence punctuation.

**Nothing was published.** No tag, no branch, no members. The gate runs before minting.

## The seam

`.llm/tools/validation/check-netscript-jsr-specifiers.ts:39` matches only the **prefix**:

```ts
const NETSCRIPT_JSR_PREFIX = /jsr:@netscript\/([a-z0-9][a-z0-9-]*)/g;
```

and then scans forward for the version with no terminating boundary. A specifier that ends a sentence
in embedded prose therefore yields a version token carrying the period.

Two anchored precedents already exist in-repo — **reuse one, do not write a third pattern**:

- `.llm/tools/release/publish-readiness.ts:79` — full semver-aware specifier regex including an
  optional prerelease.
- `.llm/tools/deps/bump-version.ts::rewriteNetScriptVersion` — boundary lookahead
  `(?=[^0-9A-Za-z.+-]|$)`, which is exactly what stops a trailing `.` (and what stopped
  `@ag-ui/core 0.0.52` being corrupted in #1628).

Prefer extracting/reusing the canonical parser so all three call sites share one definition. A third
hand-rolled regex will drift from the other two — that drift is the bug you are fixing.

## Why it surfaced now — do not "fix" the generated asset

#1628 replaced a version-substitution shim with a real documentation render, so
`publish-assets.generated.ts` now embeds genuine markdown prose. The prose is **correct**. Do not
edit the generated file, do not change the corpus, and do not exclude that path from scanning — the
scanner is what is wrong.

## Discriminating tests — required, each RED against current code

1. A prerelease specifier followed by **sentence punctuation** in prose
   (`…install jsr:@netscript/cli@0.0.6-canary.8.`) parses to exactly `0.0.6-canary.8` and does not
   fail the gate. Cover a trailing `.` and at least one other terminator (`,` `)` newline).
2. A genuinely **versionless** `jsr:@netscript/*` specifier still **fails**.
3. A **wrongly pinned** specifier still **fails** — both a stale exact version and a range pin
   (`^`, `~`, `>=`).

State in `evidence.md` which assertion fails on the pre-fix code for each. Tests 2 and 3 are the
strictness guard: without them you cannot distinguish a fix from a loosened check, and loosening this
gate would let a versionless specifier reach a published package.

## Gates

```
rtk proxy deno task check · test · lint · fmt:check
deno task publish:readiness          # must reach a PASS verdict on versionless-specifiers
```

Run `publish:readiness` on this tree — it is the gate that failed, so it is the gate that must pass.
One dispatch per turn, then hand back; do not poll a running command.

## Hazards

- Never wrap an attached session in a shell `timeout`.
- `deno fmt` rewraps; re-read after formatting.
- Explicit-path `git add`; assert `git diff --stat -- deno.lock packages/fresh-ui/deno.lock` empty.
- **No publication, no `release:cut`, no `release:canary`, no tag.** I own the release train.
- Write evidence to `.llm/runs/fix-1631-specifier-token-boundary--w8/evidence.md`. Do **not** create a
  repository-root `slices/` directory.

## Deliverables

1. The fix on `fix/1631-specifier-token-boundary`.
2. `.llm/runs/fix-1631-specifier-token-boundary--w8/evidence.md` — untruncated gate output and the
   pre-fix RED for each of the three tests.
3. A **draft PR against `main`**: `Closes #1631` in the **body**; labels `type:fix`, `area:release`,
   `area:tooling`, `priority:p0`, exactly one `status:`; milestone `0.0.6`. #1631 has acceptance
   checkboxes — match each evidence entry's text **verbatim** or use `box-index`.
4. Report the PR number and stop. Do not merge, do not flip to ready, do not touch labels.
