# PLAN-EVAL — fix-1014-plugin-schema-dependency-mode--dependency-schema

Evaluator: Opus 5 supervisor (owner-waived open-model lane, 2026-08-01)

Generator: Codex · GPT-5.6 Sol · low. Generator and evaluator are different sessions and different
model families, so the harness independence invariant is satisfied without the `formal_evaluation`
route. `supervisor.md` still names Qwen 3.7 Max for `formal_evaluation`; that lane is retired for the
0.0.3 fix train and must not be dispatched.

Artifacts reviewed: `plan.md`, `research.md`, `context-pack.md`, `drift.md`, `supervisor.md`,
`worklog.md` at commit `6f3acb22d`.

## Plan-Gate checklist

| # | Check | Verdict | Evidence |
| - | --- | --- | --- |
| 1 | Cause re-derived against the baseline, not inherited from the issue | PASS | `research.md` re-baseline re-derives against `main@3ab6472` and records a functional zero-copy repro (`{"copies":0,"targetExists":false}`), not a static read. |
| 2 | Cause is correct | PASS | Independently confirmed: `copyPluginSchemasToRootDb` returns `[]` at the `fs.exists(sourceRoot)` guard (`db-integration.ts:190`), and the dependency-mode path (`install-plugin.ts:157` via `render-plugin.ts`) never writes `plugins/<name>/database`. The kernel `PluginScaffolder` (`scaffolder.ts:155`) is the only writer and is not on that path. |
| 3 | Plan corrects the brief where the brief was wrong | PASS | D3 **inverts** the source ladder I specified. My brief said "copied source if present → package-resolved"; the plan makes package fragments win. The inversion is correct and justified — my ordering would let a generic placeholder shadow the real published fragment, the exact hazard I listed under "Watch for" and then contradicted in the same document. |
| 4 | Declaration signal is justified, not assumed | PASS | I proposed `hasDatabaseMigrations` and asked for justification. `research.md` finding 5 verifies it against **live JSR 0.0.2 metadata** for all six plugins (auth/sagas/triggers/workers true + fragment published; ai/streams false + none). Stronger evidence than my static repo read. |
| 5 | Acceptance box 1 — resolve from installed package/manifest | PASS | Scope + D1/D2: reuse `versionMetadata.files` and the injectable `JsrPackageFileFetcher`. |
| 6 | Acceptance box 2 — fragments copied into root schema | PASS | Scope preserves the `database/<engine>/schema/plugins/<name>/` target and the bare-`schema.prisma` → `<pluginName>.prisma` filename rule; risk register carries a test for both. |
| 7 | Acceptance box 3 — install fails on declared-but-unresolved schema | PASS | D5 + the three-condition gate (DB required ∧ declared ∧ zero resolved) → typed `ScaffoldValidationError` with plugin name and searched paths. `--no-db` and non-DB plugins correctly excluded. |
| 8 | **Acceptance box 4 — clean public-install test** | **FAIL** | See below. The chosen gate cannot exercise dependency mode. |
| 9 | Layering | PASS | D1/D2 put network IO at the `public/infra/jsr` edge and leave target-layout policy in the kernel adapter. Better than my brief, which vaguely parked it all in `db-integration.ts`. |
| 10 | Backward compatibility | PASS | Non-scope forbids a new `scaffold.plugin.json` field; already-published 0.0.2 manifests keep installing. |
| 11 | Dry-run safety | PASS | Hidden scope + risk register: early return before resolve/fetch/write, with a no-fetch assertion. |
| 12 | Local copied-source path preserved | PASS (thin) | `resolveLocalPluginDescriptor` yields `files = {}`, so local descriptors fall through to copied source. Mitigation is named but shallow ("retain local tests"); acceptable because the fallback is structural, not incidental. |
| 13 | Validation plan is scoped and ordered | PASS | Units → scoped check/lint/fmt → quality gate → one-pass E2E. Correctly omits `--unstable-kv` from the wrapper. |

## The failing row

**Box 4 is targeted at a gate that structurally cannot prove it — and that is my error, not the
slice's.** My brief asserted "`true-userland-install-suite.ts` is the userland install gate. Add an
assertion that the installed plugin's fragment is present." The plan adopted that verbatim, including
the suite id `scaffold.userland-install`.

`packages/cli/e2e/src/application/gates/scaffold/plugin-install-gates.ts:55-62`:

```ts
if (context.request.suiteId === SCAFFOLD.USERLAND_INSTALL) {
  args.push('--ci', '--local-path', join(context.project.repoRoot, 'plugins', localPluginDir(kind)));
  return cli(context, ...args);
}
```

The userland suite **hard-forces `--local-path`**. A local-path descriptor carries
`versionMetadata.files = {}` (`resolveLocalPluginDescriptor`), so under this very plan's D3 ladder it
takes the **copied-source fallback** and never touches package resolution. An assertion added there
would go green while proving nothing about dependency mode — a passing test over the untested path.
That is the precise false-evidence failure this ladder exists to catch, so it cannot be deferred to
implementation.

Correction (a correct lane already exists): plugin installs also run under
`createScaffoldGates` → `createPluginInstallGates` in the `scaffold.runtime` suite, where
`packageSource === PACKAGE_SOURCE.JSR` takes the plain `cli(context, ...args)` branch — a genuine
JSR/dependency-mode install (`deno task e2e:cli:prod`, `--source jsr`). Box 4 should be evidenced
there. If that lane is too expensive or cannot run in this environment, the acceptable substitute is
a semantic install-flow integration test that drives `installPlugin` with a JSR-shaped descriptor and
an **injected** `JsrPackageFileFetcher`, asserting the fragment lands at the root schema path — plus
an explicit, honest statement that the e2e userland lane is local-path only. What is not acceptable is
asserting in `scaffold.userland-install` and reporting box 4 as met.

Keep the separate, already-correct finding that the suite's existing
`plugins/workers/database/schema.prisma` expectation is stale (`drift.md`, `research.md` finding 7);
just do not let repairing it stand in for box 4.

## Verdict

**FAIL_PLAN**

(Plan-Gate vocabulary per `.llm/harness/evaluator/verdict-definitions.md`. Equivalent plain verdict:
`FAIL`.)

Rows 1-7 and 9-13 pass, several of them with evidence stronger than the brief that produced them.
The plan fails on row 8 only. Replan is narrow: re-target acceptance box 4 to a dependency-mode lane
per the correction above and re-submit. Nothing in D1-D5 needs to change.
