**Verdict: FAIL_PLAN** (PLAN-EVAL round 2, S5a, feature tier)

All six round-1 blockers are resolved in the plan. One new blocker comes from the redesigned export target, and one stale risk line contradicts it. Both need only a few lines in the plan.

## Round-1 blockers, now resolved

- **Values-only PR and the pinned snapshot.** The plugin now exports a standalone theme file to the user's own repository (`themes/<preset>.json`). It no longer edits NetScript's pinned `packages/fresh-ui/tokens/figma/` files or their provenance hashes. A first download seeds the baseline, a missing baseline fails clearly, and the values-only check covers every changed file.
- **Persistent app sources.** Sources go into `tokens/source/` and `sourceRoot` is set, so later `tokens build` runs keep the Figma values. An existing custom `sourceRoot` blocks the install before any write, an existing override is kept, and the URL's lock entry owns the files.
- **URL kinds.** A URL with a non-empty `preset` query is a share link. Any other http(s) URL is fetched once as preset JSON or as a theme/base registry item. A full negative test list is named, tests use a loopback test server, and failures must leave the filesystem unchanged. This matches `decodeUiPreset` and the existing remote-item path in `registry-client.ts`.
- **Plugin coverage.** Explicit `figma:check`, `figma:test`, `figma:lint`, `figma:fmt:check` and `figma:build` tasks exist and run unconditionally in the required CI quality job. This addresses `tools/` being outside the workspace and the root lint/fmt settings.
- **Slices.** S0–S6 are ordered, each is under 30 files, and each names its files and proving gate. Each named risk has a slice.
- **Archetype and gate mapping.** CLI is archetype 6, Fresh UI is archetype 4, and the plugin is an integration/tooling surface with a docs overlay. The F-1…F-19 and F-CLI-* gates and the runtime/consumer gates are mapped. The init helper split brings the edited command file under F-CLI-1's 150-line cap without adding debt.

## Remaining blockers

**1. What the CI name check runs on is undecided.** This fails the open-decision sweep. The brief says: "Name check in CI … A PR that adds an unknown name fails with a clear message." Export PRs now land in the user's theme repository, so NetScript's CI never sees them. The plan doesn't say what files S4's `check:figma-names` reads. If it only reads the pinned snapshot, the check can never fail in practice and IMPL-EVAL would reject it, so S4 would be redone.

Required amendment, inserted into the "Resolved open decisions" section of `plan.md`:
- `check:figma-names` checks the pinned snapshot plus every portable theme item given to it (default: committed fixture items).
- It fails on any WEB name that isn't in the role manifest after name migrations, with a message naming the collection, variable and CSS variable.
- The plugin README documents a ready-to-copy CI step so the theme repository runs that same check on export PRs.
- The plugin's pre-push refusal and the CLI's install-time rejection use the same checker.
- S4's proof is a negative control: a modified theme item with one unknown name fails this check.

**2. A stale risk line contradicts decision 7.** The values-only risk bullet still says the proof "concerns canonical Figma snapshots, not compiled artifacts" and uses a "fixture snapshot structural comparison before GitHub push". Replace it with the per-file rule from the resolved section: exactly one theme item changes, and only its DTCG `$value` leaves and the oklch extension differ.

## Process note

Under the feature-tier rules, a fixable plan on cycle 2 is edited in place by the evaluator. I can't do that because this session is read-only. If the supervisor applies the two amendments above as written, I'd treat that as the evaluator's edit and the plan can PASS without another round. If not, two FAIL_PLAN verdicts mean it escalates to the owner.

## Things for IMPL-EVAL to check (not plan blockers)

- `deno.json` lint excludes `tools/`. The `figma:lint` and `figma:fmt:check` tasks must show a non-zero file count, so they're proven to actually reach the plugin.
- The registry item schema accepts any `meta` content (`additionalProperties`). The CLI must strictly validate `meta.netscript.figma` itself before installing anything.
- Installing a second URL theme over a first, when the existing `sourceRoot` is owned by the earlier lock entry, should replace it rather than be refused as "custom".

OPENHANDS_VERDICT: FAIL_PLAN
