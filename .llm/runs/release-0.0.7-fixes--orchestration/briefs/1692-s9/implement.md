use harness

# PR #1692 (#1350) — **slice S9**: regenerate the agent-docs generated cascade

Same lane, same worktree, same thread. You are the generator; you do not self-review.

## The failure — reproduced, root cause known

CI run `32631459037`, quality job `97174828651` failed **only** at `check:agent-docs-prose`:

```text
Agent docs prose is stale: prose.json.gz, provenance.json
```

Reproduced by the topic at the exact leaf head `587ade9f30e619410a4192daadab137b0548eb88`, exit 1.

**Cause:** S7 and S8 edited `docs/site/services-sdk/sdk.md` and
`docs/site/services-sdk/how-to/discover-services.md`. The agent-docs prose bundle is generated **from**
`docs/site`, so those legitimate docs edits made the generated bundle stale. This is a pure generated
cascade — nothing about the source is wrong.

## The cascade — run it in this order

Verified by the topic from the tool sources, so you do not have to rediscover it:

1. `deno task gen:agent-docs-prose` → writes `.llm/assets/agent-docs/prose.json.gz` and
   `.llm/assets/agent-docs/provenance.json`. (It first runs `deno task --cwd docs/site build`.)
2. `deno task gen:assets-barrel` → `generate-cli-assets-barrel.ts` **reads** both of those files
   (`:382`, `:389`) and writes `packages/cli/src/kernel/assets/agent-docs.generated.ts` among the seven
   barrel outputs.
3. `deno task gen:publish-assets` → the canonical publish-asset generator.

Run all three. Step 2 depends on step 1's output; running them out of order produces a stale barrel.

## Identity

- Worktree: `/home/codex/repos/netscript-007-leaf-typed-error`
- Branch: `fix/sdk-typed-error-channel`. Push explicitly:
  `git push origin HEAD:refs/heads/fix/sdk-typed-error-channel`
- Expected HEAD before you start: `587ade9f30e619410a4192daadab137b0548eb88`
- PR **#1692** (draft). Issue #1350. Follow-ups #1690, #1693.

## Scope

**Authorized:** whatever those three canonical generators actually write, plus existing run artifacts.
The coordinator has explicitly widened this slice to include the derived `packages/**` generated assets
— that is the point of the slice.

**Forbidden:**
- **Do not hand-edit any generated output.** If a generated file looks wrong, stop and report; do not
  correct it by hand. A hand-edit here is undetectable later and defeats the freshness check.
- **Do not change product or docs source.** No `docs/site/**` edit, no non-generated `packages/**`
  source, no test. If closing the gate seems to require a source edit, that is a rescope: stop and
  report.
- No `deno.lock`, metadata vocabulary, `#1348`, `#1466`, labels, checkboxes, readiness, or merge.

## Measure, do not assume

**Report the actual changed paths** from `git status --porcelain` after the generators run. Do not
predict them and do not assume the set matches the seven barrel outputs — several may be unchanged.

**Prove determinism:** run the full cascade twice from a clean tree and show the outputs are
byte-identical (`sha256sum` each changed path both times). If any output differs between runs, stop and
report — a non-deterministic generator is a finding, not something to commit.

## Gates at your exact head

| Gate | Required |
| --- | --- |
| `deno task check:agent-docs-prose` | **PASS exit 0** — this is the failing gate |
| `deno task check:assets-barrel` | **PASS exit 0** |
| `deno task check:publish-assets` | **PASS exit 0** |
| `deno task check:mcp-export-corpus` | **PASS exit 0** — you are touching `packages/**`, so re-check it; report its sha256 |
| `deno task docs:exports-drift` | PASS exit 0 |
| contracts + sdk suites | 78 / 0 |

If the export corpus moves, say so with the decoded delta rather than regenerating it silently — the
corpus was settled in S6 at sha256 `a8f0779228987ed7…` and a change there needs to be explained.

## Commit

Conventional commit, no `!` — this is a deterministic regeneration, not a new breaking change. Something
like `chore(assets): regenerate agent-docs prose and derived assets`. State in the body that the
staleness was caused by the S7/S8 docs edits and that every changed file is generator output.

Update `worklog.md` / `context-pack.md` / `drift.md` with the S9 receipts, including the measured path
list and both determinism hashes.

## Finish

Commit, push explicitly, post the S9 phase comment on **#1692** with structured receipts, and **stop**.
Report your exact head sha and the measured changed-path list. Keep the PR draft. No runtime lease.
