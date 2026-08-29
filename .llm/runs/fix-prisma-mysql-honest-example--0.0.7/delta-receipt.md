# Delta receipt — #1711 main-integration refresh

Bounded, exact-head delta review (not an IMPL-EVAL, not a PLAN-EVAL). Question answered: is the
delta from the fully evaluated head to the refresh head purely mechanical (main integration +
authoritative regeneration + `.llm/runs/` artifacts)?

## Verdict: `MECHANICAL_PASS`

The prior full `PASS_IMPL` (IMPL-EVAL cycle 2, artifact `f5fd84254e20758d5e697156e67dabed8ad824ba`)
remains substantively valid at the refresh head.

## Head identity

| Role                      | SHA                                        |
| ------------------------- | ------------------------------------------ |
| Prior head (evaluated)    | `067193acff68254b4bd4c6e5d7824f80a9db2b26` |
| Refresh head (reviewed)   | `07e12efacf3cd23672395507cbf77ecf620cd454` |
| `main` integrated (#1696) | `21d516224fe35e92957f0998ee848bbf2024eda0` |
| Merge base                | `cf648f1ff973d74c213bb125a6f5f5b9328e693b` |

`07e12efac` is a two-parent merge commit: parents `067193acf` and `21d516224` (verified with
`git cat-file -p HEAD`). Reviewed detached in `netscript-007-eval-1711-delta`; probes ran in
`git archive HEAD | tar -x` copies under the job tmp (two separate archives so lock-sensitive probes
never shared a tree).

## Check 1 — authored paths byte-identical: PASS

```
git diff --stat 067193acf 07e12efac -- packages/prisma-adapter-mysql docs/site/reference/prisma-adapter-mysql/index.md
```

Empty output (exit 0). All seven authored paths are unchanged versus the evaluated head:
`docs/site/reference/prisma-adapter-mysql/index.md`, `packages/prisma-adapter-mysql/README.md`,
`src/adapter.ts`, `src/mod.ts`, `src/types.ts`, `examples/basic-usage.ts`,
`tests/connection_errors_test.ts`. `main` did not touch these paths either
(`git diff --name-only cf648f1ff 21d516224 -- <same paths>` is empty).

## Check 2 — generated outputs are authoritative: PASS

Regenerated in a pristine archive of the refresh head and compared to committed bytes
(`cmp <archive file> <(git show HEAD:<path>)`):

| Generator               | Exit | Committed bytes reproduce                                                                                                                                                                             |
| ----------------------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gen:assets-barrel`     | 0    | IDENTICAL: `packages/cli/.../{embedded,skills,agent-tools,agent-docs}.generated.ts`, `packages/plugin/.../embedded.generated.ts`, `fresh-ui/registry.generated.ts`, `service/.../scalar.generated.ts` |
| `gen:mcp-export-corpus` | 0    | IDENTICAL: `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts` (sha256 `88011e6e…c262`)                                                                              |
| `gen:publish-assets`    | 0    | IDENTICAL: `packages/mcp/src/publish-assets.generated.ts`                                                                                                                                             |
| `gen:agent-docs-prose`  | 0*   | IDENTICAL: `.llm/assets/agent-docs/prose.json.gz`; `provenance.json` diff empty (sha256 `386f4dd5…9561`)                                                                                              |

\* `gen:agent-docs-prose` calls `git rev-parse` for `sourceCommit`, which a bare archive cannot
answer (probe limitation, not a leaf defect). The site build ran unchanged in the archive; the
bundle step was rerun with a `git` shim returning `067193acf` — the value the committed provenance
records, i.e. the pre-commit HEAD at merge-resolution time. Output matched byte-for-byte including
`extractionTimestamp`.

`check:` tasks on the merged tree, all exit 0: `check:agent-docs-prose`
(`{"fresh":true,
"stalePaths":[]}`), `check:mcp-export-corpus`, `check:publish-assets` (archive);
`check:assets-barrel` (worktree, since it needs `git diff`; `git status --porcelain` empty after).

Conflict markers: `git grep -nE '^(<{7}|={7}|>{7})( |$)' HEAD` — zero hits outside Markdown; the
single Markdown hit is a quoted code fence inside
`.llm/runs/fix-1025-aspire-otel-discovery--otel-discovery/implement-rebase.md` (pre-existing since
PR #1036, unrelated run, not a live marker).

## Check 3 — focused #1711 gates on the merged tree: PASS

Fresh archive, `--root packages/prisma-adapter-mysql --ext ts,tsx`:

| Gate                                                             | Result                                           |
| ---------------------------------------------------------------- | ------------------------------------------------ |
| `run-deno-check.ts`                                              | 12 selected / 1 batch / 0 failed / 0 diagnostics |
| `run-deno-lint.ts`                                               | 12 selected / 12 processed / 0 findings          |
| `run-deno-fmt.ts` (check)                                        | 12 selected / 0 findings                         |
| `run-deno-test.ts` (`--allow-all packages/prisma-adapter-mysql`) | 51 passed / 0 failed / 0 ignored (3.4 s)         |

`deno.lock`: `git diff --stat` is empty for all three pairs (prior→refresh, prior→main,
main→refresh). `main` brought no lock change and the leaf added none. The archive's `deno.lock` was
still identical to HEAD after the gates ran.

## Check 4 — envelope intact: PASS

`git diff --name-only 21d516224 07e12efac` (excluding `.llm/runs/`) lists exactly the seven authored
paths plus five generated outputs (`prose.json.gz`, `provenance.json`, `agent-docs.generated.ts`,
`export-surface-corpus.generated.ts`, `publish-assets.generated.ts`). No other product, test, docs,
or tooling path is attributable to the leaf.

## Boundaries honored

No live MySQL, Aspire, Docker, browser, `e2e:cli`, release gate, or expensive-gate lease. No
product/test/docs/tooling path modified; no label, readiness, checkbox, lease, or PR state touched;
worktree clean at the refresh head after all probes.
