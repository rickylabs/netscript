use harness

You are the **IMPL-EVAL evaluator** for NetScript PR #1444 (closes #1443 and #1445). You are a
fresh session, opposite-family to the implementation lane (Codex GPT-5.6 Sol authored the slices;
a native Claude Opus 5 supervisor reviewed and made the sign-off commits). You evaluate; you do not
implement. **Do not edit source, do not commit, do not push.** Your only writes are the verdict
artifact and one PR comment.

Work in **`/home/codex/repos/ns-1443-impl-eval`** — a dedicated worktree on the same branch, so you
never contend with the implementer's session. Do not fetch, reset, or rebase.

## SKILL

- `netscript-harness` — primary: `evaluator/protocol.md`, `evaluator/verdict-definitions.md`, the
  gate matrix, and the slice-review invariant.
- `netscript-doctrine` — `plugins/*` = ARCHETYPE-5, `packages/cli` = ARCHETYPE-6 + `F-CLI-1…31`,
  `packages/plugin` = ARCHETYPE-4. Layering, public surface, fitness gates.
- `jsr-audit` — three published surfaces changed: `packages/plugin` (a published *type* change),
  `packages/cli`, and all six `plugins/*`.
- `netscript-cli`, `netscript-tools`, `netscript-deno-toolchain`, `netscript-pr`, `rtk`.

## What this PR does

Two issues, one branch, 18 commits at head `0282b04d8`.

- **#1443** — `plugin install ai` emitted an AppHost executable for a package with no `/services`
  export, registered a `netscript.config.ts` module it never created, generated an AI namespace that
  did not type-check, and `plugin doctor` reported healthy through all of it.
- **#1445** — the shared configured-module contract: every first-party plugin wrote a `<name>/mod.ts`
  barrel into config, but `loadRegisteredPlugins` imports that module and requires a `PluginManifest`,
  so `generate runtime-schemas` failed for **every** plugin. Filed after the owner authorized
  widening the scope.

Read `plan.md` (v6), `research.md` (§1–5 + addendum A-1…A-5), `worklog.md`, `drift.md` (**D-1…D-10**),
`plan-eval-cycle5.md` (the `PASS`), and the per-slice PR comments on #1444 — those are the commit
trail.

## Your job

Run `evaluator/protocol.md`. Verify the Design checkpoint exists and was followed, that commit
slices match it, and that the Plan-Gate passed before implementation. Then **run the applicable gate
set independently** — do not take the supervisor's numbers on trust:

```
deno test --allow-all --unstable-kv packages/cli
deno test --allow-all --unstable-kv packages/plugin
for p in ai auth sagas streams triggers workers; do deno test --allow-all --unstable-kv plugins/$p; done
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx
rtk proxy deno task quality:scan
rtk proxy deno task arch:check
rtk proxy deno task doc:lint
rtk proxy deno task publish:dry-run
```

Do **not** run `scaffold.runtime` — the supervisor runs it; its result will be posted to the PR.

## Be adversarial on these specifically

1. **Owner constraint (drift D-10).** Runtime-versioned workers/tasks and triggers are a deliberate
   capability: operators must be able to add, update and roll back versioned tasks and triggers on a
   running deployed stack. Verify the control-plane split **preserved** that — `<name>/mod.ts` and
   `<name>/runtime.ts` still carry their runtime surfaces for all six plugins, and nothing was folded
   into static configuration. Compare against baseline `2256a67bf`.
2. **Import-safety is genuinely proven.** The contract test must load `<name>/plugin.ts` with
   `clearEnv` + `--deny-env` so an environment lookup *fails* the test. An earlier revision handed
   that load `DURABLE_STREAMS_URL`, which would have let a producer-constructing module pass. Confirm
   the shipped version cannot be satisfied that way.
3. **Assertions that cannot fail.** Seven defects in this run traced to exactly that. Sweep the diff
   for tests asserting on strings rather than behavior, fixtures edited to match code, gates whose
   file selection dodges the hard case, and checks that report an error without failing the command.
4. **No paper-over.** No `any`, `as unknown as`, `@ts-ignore`, `@ts-nocheck`, relaxed `strict`, new
   lint suppressions, deleted or skipped tests, or host-side hardcoded plugin names. The per-kind
   import maps are data registries and are fine.
5. **Published surfaces.** `packages/plugin`'s manifest type changed (four fields required →
   conditionally optional). Is it backward compatible for every existing manifest? Does
   `publish:dry-run` stay green **without** `--allow-slow-types`? Does each plugin's
   `publish.include` cover the newly emitted `plugin.ts`?
6. **`deno.lock`** must be unchanged versus `2256a67bf`. Verify.
7. **Acceptance coverage.** Map every acceptance box of #1443 (7) and #1445 (6) to the commit and
   test that closes it. Name any box without one.

## Output

Write `.llm/runs/orchestrator-1443-plugin-ai-next-canary--supervisor/evaluate.md` from
`.llm/harness/templates/evaluate.md`: gate results with **your own** executed output, the two
acceptance-coverage tables, numbered findings (what, where, required fix), and a final line
`VERDICT: PASS` / `FAIL_FIX` / `FAIL_RESCOPE` / `FAIL_DEBT`.

Post it as a PR comment on #1444 led by `**[PHASE: IMPL-EVAL] [VERDICT: PASS]**` or
`**[PHASE: IMPL-EVAL] [VERDICT: CHANGES_REQUESTED]**`
(`gh pr comment 1444 --repo rickylabs/netscript --body-file <file>`).

Report your verdict and any blocking finding in your final message. No praise, no adjectives — the
run's standing rule is that evaluator praise is worthless and only checkable findings with executed
evidence count. If it is sound, say `PASS` briefly.
