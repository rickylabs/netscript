# Tier-A review — derived-asset amendment (assets-barrel), PR #1652

| Field                     | Value                                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------- |
| Reviewer                  | `topic-docs-0.0.7` (native Claude Opus 5 / high) — opposite family to the Codex author |
| Reviewed head             | `d24c3fa03197cfcf0adcc91eca08847d6a26bd8c`                                             |
| Author (separate session) | WSL Codex `019ffcc9-16c2-7573-b7f6-d627172408e8`                                       |
| Scope                     | deterministic derived asset only; cycle-2 `PASS` remains the content verdict           |
| Verdict                   | **PASS**                                                                               |

## Why this amendment existed

`.llm/tools/generate-cli-assets-barrel.ts` reads `.llm/assets/agent-docs/provenance.json` (line 382)
and `prose.json.gz` (line 389) and emits `packages/cli/src/kernel/assets/agent-docs.generated.ts`.
The authorized corpus refresh at `d4a0a8340` therefore necessarily invalidated the embedded copy, so
`quality` moved from failing "Agent docs corpus freshness" to failing step 14 "Generated asset
freshness". A repo memory already records this coupling — CLI asset edits need barrel regeneration
because the embedded file is what ships — so this is known repository behaviour, not a novel defect.

## Determinism — the decisive check

Re-ran `deno task gen:assets-barrel` at the committed head: exit `0`, and the working tree remained
**completely clean**. The generator is a no-op against the committed state, which proves the
committed bytes are exactly the deterministic output rather than a hand-touched approximation.

Delta shape matched the prediction made before dispatch: **11 insertions / 6 deletions** in one
file, carrying `sourceCommit` `6f9620c0c` → `c8e3f26d8` and updated byte counts. No other barrel
target moved — not `embedded.generated.ts`, `skills.generated.ts`, `agent-tools.generated.ts`,
`packages/plugin/…/embedded.generated.ts`, `packages/fresh-ui/registry.generated.ts`, or
`packages/service/…/scalar.generated.ts`.

## Gate receipt — strengthened after a Tier-A objection

The author's first `assets-barrel` proof went exit `1` unstaged → `0` after staging. That is a weak
receipt: `check:assets-barrel` ends in `git diff --exit-code`, which compares the working tree to
the **index**, so staging alone passes while the file still differs from `HEAD` — a state CI never
sees. Tier-A required a post-commit re-run instead.

Independent post-commit receipt: `run-gate.ts --gate assets-barrel` exit **`0`** at
`gitHead d24c3fa031`. Genuinely clean against `HEAD`, and it proves what CI proves.

## Gates re-executed by the reviewer

| Command                                                   | Raw exit | Observed                                                                                                              |
| --------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------- |
| `deno task gen:assets-barrel` (determinism)               | `0`      | no-op, tree clean                                                                                                     |
| `run-gate.ts --gate assets-barrel` (post-commit)          | `0`      | `gitHead d24c3fa031`                                                                                                  |
| `deno task quality:gate`                                  | `0`      | no `quality:scan` finding in the generated file; only pre-existing `export default` JSR warnings elsewhere in the CLI |
| `run-deno-check.ts --root packages/cli/src/kernel/assets` | `0`      | clean                                                                                                                 |
| `git diff --check`                                        | `0`      | clean                                                                                                                 |
| lockfile guard vs `origin/main`                           | `0`      | both unchanged                                                                                                        |
| scoped `fmt` / `lint` on `packages/cli/**`                | —        | **N/A — not applicable**                                                                                              |

The format and lint rows are not applicable because root `deno.json` sets
`fmt.exclude: ["packages/cli/", "**/.generated/", "**/node_modules/"]` and
`lint.exclude: [… "packages/cli/" …]`. Reproduced: the wrapper selected seven files, Deno excluded
the batch, and it exited `2` refusing a false green — correct behaviour. Recorded N/A, never as
passed, skipped, or waived. **This was a reviewer prescribing error**: the brief demanded a scoped
`fmt` on a path this orchestrator had already read as excluded earlier in the same run. The author
was right to refuse both that command and the `--config packages/cli/deno.json` workaround.

## Scope and preservation

`plan.md`'s delta is a **pure addition** — an "Authorized derived-asset amendment" section plus a
`PLAN-EVAL: N/A` record stating the reason is deterministic regenerated output. It explicitly
authorizes no other `packages/**` or generator target and changes no locked decision, slice
definition, gate list, non-goal, or deferred acceptance owner. Verified: zero deletions in that
file.

Against the cycle-2 evaluated source `c7ce58a19`, `git diff` over `docs/site`, `.llm/tools/docs`,
`deno.lock`, and `docs/site/deno.lock` is **empty**. The complete change set since that source is
eight files: the two agent-docs assets, five run artifacts (including the evaluator's own
`evaluate.md`), and this one generated CLI asset — exactly the authorized surface across all three
amendments. No canonical #1551 comment, pin, label, milestone, or issue state changed.

## CI

`pr-checks PASS` at `d24c3fa03197cfcf0adcc91eca08847d6a26bd8c`, 20 checks, **0 current failures**.
The `quality` job is green; both freshness steps now pass.

## Position

Cycle-2 `PASS` remains the content verdict; this amendment is derived-asset only and no IMPL-EVAL
cycle 3 was launched. Nothing was readied, merged, published, relabelled, or started as a next leaf.
Returned to the coordinator for readiness disposition.
