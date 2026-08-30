# Context Pack

Run `docs-mcp-exports-table--1799` fixes issue #1799 on branch `docs/mcp-exports-table`, based on
`origin/main` `5197e70b7`. The implementation is one docs/checker/generated-assets slice. Real
`deno doc --json` evidence requires `symbolCoverage.mode: 'entrypoints-only'`. PLAN-EVAL is N/A;
separate-session IMPL-EVAL remains required after all gates and the pushed implementation head.

Implementation now consists of the requested reference table, an `entrypoints-only` MCP mapping,
and the three regenerated corpus layers. A pre-commit `check:assets-barrel` attempt exited 1 because
the regenerated tracked barrel was not yet in `HEAD`; rerun every required gate after pushing the
implementation commit.

Implementation commit `127e8ea32` is pushed and every required gate passed there. The post-gate
tree was clean, `deno.lock` matched `origin/main`, and provenance source `7586a44a6` was an ancestor.
After the evidence-only artifact commit, rerun all gates at the final head and hand off PR #1800 for
separate-session IMPL-EVAL while leaving `status:impl` unchanged.
