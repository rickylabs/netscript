# #1935 — merge packet handed (head `f192ccee3`)

CI run `33642368502`: **success**. `classify changes` · `close-gate` · `quality` · `check-test` all
green. 8 required checks pass, 0 fail. `review-threads PASS threads=0 unanswered=0`.
`MERGEABLE / CLEAN`. Whitespace clean base-relative. Acceptance: **5/5** mirrored onto #1934.

Packet: <https://github.com/rickylabs/netscript/pull/1935#issuecomment-5511384518>

## Two CI failures on the way, both real, both repaired

1. **`quality` step 18 `Publish asset freshness`.** Not the README gate.
   `packages/mcp/src/publish-assets.generated.ts` embeds `packages/mcp/README.md` verbatim as
   `MCP_PACKAGE_README`, so closing the unterminated fence made it stale. Reproduced locally,
   regenerated with `deno task gen:publish-assets` — one line. Sibling derived artifacts checked and
   unaffected: `check:agent-docs-prose` `fresh: true` with no stale paths (it walks `docs/site`, not
   package READMEs), `check:assets-barrel` exit 0 with no diff.

   **This makes acceptance box 5 literally false** ("No `packages/`/`plugins/` source outside
   `README.md` is modified"). Disclosed in the evidence entry and again in the packet rather than
   ticked quietly — the box's intent holds, its wording does not, and that is the coordinator's
   call.

2. **`close-gate` twice.** The first was expected (`status:impl`, no evidence). The second was a
   **race of my own making**: close-gate started 14:29:22Z, my label flip landed 14:30:33Z, so it
   read the pre-flip state. Fixed with `gh run rerun --job` on close-gate alone — the documented
   path, which observes live labels without moving the evaluated head. Worth remembering: flip the
   label *before* the push that triggers the run, or expect to rerun.

## The stacked-base trap

Recorded in `1935-retarget-and-ci-trap.md`. Short version: opening with `--base
docs/readme-fence-gate` meant `ci` never ran while GitHub reported `MERGEABLE / CLEAN`. Retargeting
emits `edited`, which is not a trigger type; a new head is required.

## Evaluator corrections

See `1935-impl-eval-25ecb5ee7-PASS.md`. All three findings were corrections to my own claims. The
one worth carrying: my `deno fmt` probe copied `origin/main` files to `/tmp` with flattened names,
so `deno fmt` used its defaults instead of the repo config and reported all 5 READMEs unclean. Only
3 are. **Never check formatting on a file outside the repo that configures the formatter.**

## Next leaf, already scoped by the evaluator

A faithful `@app/router.ts` support stub in `materializeSharedSupports` clears the last repairable
error and its downstream `TS18046` (7 → 5, failing READMEs 5 → 4) with no README change. Deferred
here because a shared fixture every package's fences compile against carries drift risk against the
real scaffold generator and deserves its own evaluated slice.
