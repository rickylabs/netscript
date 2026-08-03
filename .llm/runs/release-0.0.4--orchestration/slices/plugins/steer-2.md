# SLICE 1 REVIEW — accepted with two required fixes. Commit, then continue.

I reviewed your working tree myself and ran the gates rather than reading your report. Your turn
ended with the work **uncommitted** — nothing is on the branch yet. That is the first thing to fix.

## What I verified myself (you do not need to re-run these)

- `plugin-reference-reconciler_test.ts` — 2 passed.
- `packages/plugin-streams-core/tests/application/` — 5 passed, including
  `DurableStreamProducer fails synchronously when streams URL is unavailable`.
- `deno task quality:scan` → `{"ok":true,"findings":[]}`; the 7 allowances are all pre-existing, none
  in your new code.
- `deno task arch:check` → `FAIL=0` across every package; warnings are pre-existing.
- `run-deno-check.ts` on `packages/plugin-streams-core` + `packages/cli/src/kernel/adapters/plugin` →
  37 files, `totalOccurrences: 0`.
- `deno test packages/cli/src/kernel/adapters/{plugin,service}/` → 38 passed.
- Diff scan for `deno-lint-ignore` / `as unknown as` / `@ts-ignore` → **none introduced.** Good.

**Main-red proof — I obtained it myself.** I temporarily short-circuited `reconcilePluginReferences`
and ran the permutation test. It fails exactly on the defect, and I restored the file afterwards:

```
public install plugin flow ... reconciles dependency-derived plugin references independently of install order => FAILED
error: AssertionError: Values are not equal.
    [Diff] Actual / Expected
    [
+     "streams",
      "workers-api",
    ]
```

That is #1067 reproduced and then closed. The design is right: deriving from the existing
`officialSource.dependencies` rather than hand-adding manifest edges, sorting both references and
records so the output is byte-stable, and reconciling at both the install and
`regenerateAspireHelpers` boundaries. The renamed-instance test (`jobs` → `workers-api`,
`durable-state` → `streams`) is a good catch I did not ask for.

## Required fix 1 — you broke a documented public API and left the docs lying (blocking)

You removed `assertResolvable` from `ServiceStreamProducerOptions`. I agree with the removal: once
`DurableStreamProducer` validates configuration in its constructor, `assertResolvable: false` could
no longer defer anything, so keeping it would ship a flag that lies. No code anywhere calls it.

But **two docs still document it as a supported option**:

- `docs/site/durable-workflows/streams.md` lines ~220, 241, 254, 258
- `docs/site/reference/streams/index.md` lines 143, 146

Both now describe an option that does not exist, including *"Set `assertResolvable: false`"* as
advice. #1067's fourth acceptance box is literally *"Docs state the dependency explicitly if any
manual step genuinely remains"* — shipping docs that describe a removed escape hatch fails it.

Update both to describe the current contract: construction throws when the `streams` reference is
absent, and the remedy is installing streams plus `netscript service generate`.

## Required fix 2 — declare the breaking change

Your jsr-audit surface scan said *"no new export; constructor failure semantics become strict."* That
undersells it: you **removed an exported interface member**, which is a breaking change to
`@netscript/plugin-streams-core`'s public surface. It is acceptable for 0.0.4 and it is the right
call — but it must be declared, not discovered by a consumer.

Add a drift entry naming the removed member and the rationale. I will carry it into the PR body.

## Not a finding, recorded so you do not "fix" it

Your permutation test uses `localPath` installs. Dependency-mode is the primary consumer path, but
`persistPluginMetadata` spreads the full manifest (so `dependencies` survives), `dependencies` is in
the strict zod schema, and the reconciler reads the persisted project-side manifest identically in
both modes. I checked all three. Coverage is adequate; the `scaffold.plugins` E2E will exercise the
other mode. Do not add a second permutation test for this.

## Now do this, in order

1. `git pull` (your branch is behind by `c1dee1697`), apply the two fixes above.
2. Commit Slice 1 with a real message and **push**. Nothing you have done is on the branch yet.
3. Continue to Slice 2 (#1022 live AppHost truth) and Slice 3 (residual #1014/#1015/#1017), per the
   plan I approved. Push after each.
4. Do not run `deno task quality:scan` / `arch:check` / the streams tests again for Slice 1 — I have
   those results. Spend the budget on Slices 2 and 3.

Report the commit hashes. The PR is mine; do not touch it.
