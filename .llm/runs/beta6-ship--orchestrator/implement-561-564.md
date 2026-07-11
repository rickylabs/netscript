use harness

# Slice brief — #561 + #564: scaffold.runtime coverage for ui:add ai (widget + render-ui)


## SKILL
netscript-harness, netscript-cli, netscript-tools, deno-fresh

## Identity (per lane-policy)
Provider openai · model GPT-5.6 Sol · effort medium. Implementation slice under Tier-A supervisor
`fb43bc3e`. Branch: `test/561-564-cli-e2e-ui-add-ai` stacked on `feat/258-fresh-ui-genui-renderer`
(the #258 renderer is not on main yet; this slice also serves as #258's gate:e2e evidence).
Commit in slices and push each with `git push origin HEAD:refs/heads/test/561-564-cli-e2e-ui-add-ai`
(explicit refspec). Do NOT open the PR — the supervisor owns PR lifecycle. When done, write a
completion summary to `.llm/runs/beta6-ship--orchestrator/worklog-561-564.md` in the worktree and
commit it.

## Objective
One PR resolving both (body: `Closes #561` and `Closes #564`). Extend the `scaffold.runtime` e2e
suite (`packages/cli/e2e`) with `ui:add` coverage for the fresh-ui `ai` collection:

**#561 (McpUiWidget):** `netscript ui:add ai` resolves and copies `McpUiWidget.tsx` plus its
`theme-seed` registryDependency into the scaffolded Fresh app; copied island + css land at the
expected registry paths; generated workspace type-checks clean.

**#564 (render-ui):** the `render-ui` registry item installs from the `ai` collection; a
generated-project assertion feeds a nested layout payload (viz + data blocks) through the renderer
and asserts safe DOM output; a second assertion verifies fallback for unknown block type and depth
overflow — no raw HTML.

## Acceptance
- `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` green with the new cases.
- Scoped wrapper check/lint/fmt over `packages/cli` green; no new `as` casts; no lock churn.
- Note: copied-file type-check against `@netscript/ai@^0.0.1-beta.5` may hit unpublished-JSR
  availability (known from #258 smoke) — use local-source mapping the way the suite handles other
  workspace deps; record any residual gap as drift, do not skip the assertion silently.
