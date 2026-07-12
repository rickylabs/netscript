# Brief — beta.10 non-dashboard stream

**Lane:** Claude · Anthropic · `opus-4.8` · **high**. Runs under `netscript-harness` +
`netscript-pr` + `netscript-tools`. Reports to the beta.10 orchestrator
(`.llm/runs/beta10--orchestrator/supervisor.md`).

**Boundary:** you own everything in milestone 12 that is **not** a dashboard/DDX issue. Do not touch
`plugins/dashboard`, the DDX issues (#410–#432, #551–#557), #507, #509, or the Claude Design project
— those belong to the parallel design stream. Framework source changes are **WSL Codex** slices, not
supervisor-authored: delegate them per doctrine and review, don't write them yourself.

## P0 — PR #715 (`feat/netscript-mcp-skills`, umbrella, closes #725–#733)

### (a) Fix the failing `quality` check — it is a CI/tooling bug, not a lint finding

Already diagnosed; **do not re-derive**. The `quality` job runs `deno task lint` →
`.llm/tools/run-deno-lint.ts`, which emitted:

```json
{"source":{"mode":"command","cwd":"/home/runner/work/netscript/netscript","exitCode":1},
 "selection":{"filesSelected":1685,"batches":9},
 "summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueRules":0,"uniquePaths":0},
 "groups":[]}
```

1685 files, 9 batches, **zero occurrences, exit 1, no diagnostics**. The wrapper is propagating a
non-zero exit from an underlying `deno lint` batch while swallowing that batch's stderr — so the real
error never reaches the log. That is the "empty CI output" the owner saw.

Fix the wrapper so a batch that fails **without** lint occurrences surfaces its stderr, exit code,
and the batch/file set that produced it. A non-zero exit with an empty `groups[]` must never be
silent. Add a regression test. Then confirm whether the underlying batch failure is real (a parse
error, a permission error, a file `deno lint` cannot handle) and fix that too — the wrapper fix only
makes it visible.

Failing job for reference: run `29202385340`, job `86675839110`. Every other check on #715 is green
(check-test, scaffold-static, scaffold-runtime, close-gate, surface-diff, code-quality, deps-report).

### (b) README rewrite

`packages/cli/README.md` (and the new `packages/mcp` README) must match the quality bar of the
existing best-in-class package READMEs. Read two or three of the strongest ones first and match their
structure, depth, and voice — do not invent a new shape. This is documentation authoring, which the
CLAUDE.md documentation exception permits on a Claude lane, under the harness skills, with
validation in a **separate opposite-family session**. The generator never self-certifies.

### (c) Merge readiness

#715 already carries `Closes #725 … Closes #733`. Before sign-off: full CLI E2E
(`deno task e2e:cli run scaffold.runtime --cleanup --format pretty`) — expensive, run it at the
evaluator/merge-readiness pass, not every loop.

## P1 — remaining non-dashboard milestone-12 issues

| Issue | Title |
| --- | --- |
| #763 | prod: `@netscript/cli@0.0.1-beta.9` `scaffold.plugin.ai.lifecycle` fails in published mode (`type:fix`, p1) |
| #762 | quality: repo-wide `@ts-ignore`/`@ts-expect-error`/`as never` sweep (~40) → flip repo-drift CI to blocking (p2) |
| #695 | docs(tutorials): checkpoint-execution validation pass (p2) |

\#763 is a **published-mode** failure — reproduce against the published package, not local source.
\#762 pairs naturally with (a): both are CI-gate hygiene.

## Rules that are not negotiable

- Closing keyword (`Closes #N`) in the PR **body** for any issue the PR fully resolves. Bare `#N` and
  `Refs #N` do not auto-close.
- Namespaced labels (`type:`/`area:`/`priority:`/`wave:`/`epic:`/`gate:`/`status:`, exactly one
  `status:`) + a milestone on every issue and PR.
- Generator session ≠ evaluator session. No lane self-certifies.
- Do not delete lock files or caches; do not run `deno cache --reload` without approval.
- Prefix read-heavy `git`/`gh`/`grep` with `rtk`; wrap `deno task` validation in `rtk proxy`.
