# PLAN-EVAL cycle 2 — `plugin-167-harden--impl`

## Summary

Evaluated the cycle-2 revised plan (`4d601e6a`) against the plan-gate checklist and the six
cycle-1 fixes. All six cycle-1 fixes are concretely resolved: Decisions 2/3/4 are no longer hedged
(strip-before-parse at JSR fetch sites, explicit `arch:check` step in CI, e2e-determined
version-coherence with fallback in the same S4 commit), Decisions 5/6 add the publishable schema
asset and the round-trip test, and S5 acceptance is bound to the full gate set in-slice. Verdict:
**PASS_PLAN**, implementation may begin. Three non-blocking watcher notes for IMPL-EVAL are
recorded (most important: the local-path parse site at `add-plugin.ts:237` is a third
`parsePluginManifest` call site that cycle-1 didn't scope, but S2 will add `$schema` to all
committed manifests so the strip needs to land there too — or be pushed down into
`parsePluginManifest`).

## Changes

- Created `.llm/tmp/run/plugin-167-harden--impl/eval-cycle2.md` — full evaluation doc with the
  cycle-1 fix map, plan-gate walkthrough, and watcher notes.
- No source code changes. Branch unchanged at `4d601e6a`. Lock file untouched.

## Validation

Spot-checked six load-bearing claims against the tree:

1. `arch:check` not in CI — confirmed via `grep "arch:check\|plugins:check" .github/workflows/`
   (zero hits); ci.yml quality job (L58-98) confirmed to lack it. Decision 3/S3's delta is real.
2. `plugins:check` task absent today — confirmed via `grep "plugins:check" deno.json` (no hit).
   Decision 3 adds it.
3. `packages/plugin/deno.json` has no `./scaffold/version` export today — confirmed by
   inspection. Decision 4 fallback adds it; primary path doesn't need it.
4. `findVersionResidue()` in `.llm/tools/release/cut.ts:51` scans only `.json` files — confirmed.
   Decision 4 fallback's residue-scan extension to `.ts` is a concrete delta.
5. Third `parsePluginManifest` call site at `packages/cli/src/public/features/plugins/add/
   add-plugin.ts:237` — confirmed by `grep -rn "parsePluginManifest\b" packages/cli/src/public/`.
   Cycle-1 scope was "JSR fetch paths," so this is a watcher note, not a required fix.
6. `packages/plugin/tests/protocol/plugin-manifest_test.ts` exists and covers (a) accepts-all-5 +
   the strict-rejection class. Plan's Decision 6 commits to adding (b) byte-stability and the
   `$schema`-strip-passes case — named location, named assertions, discharge of the
   zod→json-schema fidelity risk.

Cycle-2 plan diff (`96c94c5b..4d601e6a`) shows 192 line edits concentrated in the
"Research summary," "Locked decisions," "Gates," "Commit slices," and a new "Cycle-1 fix map"
section — the right shape for a revision that pre-commits hedges.

## Responses to review comments or issue comments when relevant

Cycle-1 verdict (run `28325898406-1`) returned `FAIL_PLAN` with 6 required fixes. This cycle-2
evaluation addresses each and renders `PASS`. No new review comments received on this PR between
cycles.

## Remaining risks

- Watcher note #1: local-path `$schema` strip coverage (see eval doc). Implementer must choose
  between (a) push strip into `parsePluginManifest` (changes Decision 2's "parsePluginManifest
  stays unchanged" clause), (b) duplicate the strip at `add-plugin.ts:237`, or (c) document the
  gap and defer. Recommend (b) — smallest delta.
- Watcher note #2: `./schema` export shape — raw JSON vs thin `./schema/mod.ts` barrel —
  intentionally left to S1. Both publishable; verify via `deno publish --dry-run --allow-dirty` for
  `@netscript/plugin` at S1.
- Watcher note #3: Risk register is inline (Decisions 3/4/6 + "Debt / risk" section) rather than
  a separate heading. Plan-gate item met; optional nit if a future cycle wants stricter audit shape.