# Drift log — Sub-wave 5a: `@netscript/service`

## D-1 — Fork point is 09f4845, not dfab7a4 (2026-06-10)

Mandate said "fork off umbrella head dfab7a4", but the actual umbrella tip is
`09f4845` (docs/handover commit atop dfab7a4; verified
`git merge-base --is-ancestor dfab7a4 09f4845`). Forked from 09f4845 so the 5a branch
includes the curated handover + re-baseline docs. No code delta between the two.

## D-2 — Dry-run `excluded-module` ×6 is a root-config artifact, not package debt (2026-06-10)

Umbrella baseline recorded service dry-run as "FAIL ×8" (slow types). Local
measure-first additionally shows 6 `excluded-module` errors. Root cause: root
`deno.json` `"exclude"` lists `packages/service/` (Wave-4-tail scoping of root gates),
and `deno publish` honors it, treating the package's own modules as excluded.
Control: `packages/kv` (same import style, not excluded) passes dry-run exit 0.
Consequence: plan slice 15 lifts `packages/service/` from the root exclude as the 5a
closing gate. Same artifact will affect 5b/5c/5d packages still listed in the exclude
(`packages/sdk/`, `packages/fresh-ui/`, `packages/fresh/`) — umbrella should note this.

## D-3 — `StandardHandlerPlugin` imported from un-mapped subpath (2026-06-10)

`primitives/handlers.ts` imports from `@orpc/server/standard`, which resolves through
the `@orpc/server@^1.13.5` map entry but the type then leaks into the public surface
(2 of the 14 private-type-refs). Resolved by design (plan D-3/D-6): structural
`ServiceHandlerPlugin`, upstream import removed. Recorded here because the baseline
counted it only as a ptr, not as an interop-typing gap.
