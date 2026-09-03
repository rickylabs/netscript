use harness

## SKILL

Load `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/netscript-tools/SKILL.md`, and `.agents/skills/aspire/SKILL.md` before editing. Lane: `normal_implementation` (Codex · openai · gpt-5.6-sol · medium). Run dir: `.llm/runs/fix-aspire-event-observation--impl/`.

# Slice: merge origin/main (e341c6f71) into `fix/aspire-event-observation` — resolve #1760 overlap

Worktree: `/home/agent/projects/netscript/worktrees/007-leaf-1906`, branch `fix/aspire-event-observation`, HEAD `41819414c`. PR #1909 (`status:augment-review`, OpenHands IMPL-EVAL PASS at `c3805e1d2`).

## Goal
`git merge origin/main` conflicts in two files:
1. `packages/cli/e2e/src/application/gates/scaffold/runtime/listener-unreachable-fixture.ts` — this branch replaced polling with stream-based observation (`TransitionReports`, `resourceHealthIs`, `observe*` via the Aspire `describe --follow` stream, `resource-state-stream.ts`). Main (#1760 S10, `58280d6ee`) rewrote the *polling* `observeTestOnlyUnhealthy` in place and added `evidence/{doctor,describe-follow,resource-command,cleanup}.ts` structured receipts.
2. `.llm/runs/research-aspire-13.5-adoption--0.0.7/aspire-surface-manifest.tsv` — generated; never hand-merge.

## Rules
- **This branch's observation model wins**: keep stream-based transition observation (that is the fix for #1906). Preserve #1760's structured-receipt additions and anything it added that does not depend on the polling loop. Do not reintroduce a polling `describe` loop.
- Do NOT rebase. Produce one merge commit (`git merge origin/main`), then follow-up commits only if a gate needs them.
- Manifest: after resolving, run `deno run --allow-read --allow-run=git --allow-write=.llm/runs/research-aspire-13.5-adoption--0.0.7 .llm/runs/research-aspire-13.5-adoption--0.0.7/tools/aspire-surface-manifest.ts` and take the generated result.
- No edits outside the two conflicted files, `resource-state-stream.ts`, and its test, unless a compile error in the merged e2e workspace forces a minimal one — record any such edit in `worklog.md` + `drift.md`.
- No `deno.lock` changes. No runtime (Aspire/Docker) execution — hosted CI proves the runtime tier.

## Gates (all must pass before you push)
- `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli/e2e --ext ts,tsx`
- `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/e2e/tests/application/gates/resource-state-stream_test.ts`
- `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/cli/e2e --ext ts,tsx`
- `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli/e2e --ext ts,tsx`
- `deno task check:aspire-version-parity` (`"ok":true`), `deno task check:mcp-export-corpus`, `deno task check:publish-assets`, `deno task check:assets-barrel`, `deno task check:agent-docs-prose`

## Done
Push `origin fix/aspire-event-observation`; append a worklog entry with the merge sha, which #1760 pieces were kept, and the gate receipts. Do not change PR labels or body.
