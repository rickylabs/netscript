# IMPL-EVAL — fix-1017-plugin-install-no-samples--codex

Evaluator: Opus 5 supervisor (owner-waived open-model lane, 2026-08-01)

- Commit under review: `fe5c523ec` — `fix(cli): honor no-samples for plugin installs`
- Branch: `fix/1017-plugin-install-no-samples`, pushed; remote head `fe5c523ec` matches local exactly
  (verified via `gh api repos/rickylabs/netscript/branches/...`, not via the push exit code).
- PR: #1028

## Verdict

`PASS with reservation` — the fix is real, minimal and gated. Held in **draft for human review**;
see Reservation 1.

## What the commit actually does (read, not reported)

| Layer | Change | Verified |
| --- | --- | --- |
| CLI install | `runPluginOwnedScaffold` passes `plan.includeSamples` into dispatch | `install-plugin.ts` +1 line |
| CLI dispatch | `DispatchPluginScaffoldOptions.includeSamples`, serialized into `--context-json` `options` | `dispatch-plugin-verb.ts` +3 lines |
| Adapter contract | New exported `InstallStarterSamplesPolicy<T>` — discriminated `omit` \| `alternate{scaffolder,input}`; optional `samples?` on `InstallStarterResource` | `contract.ts` +20/-1 |
| Adapter install | `collectInstallArtifacts(plugin, includeSamples = true)` honours the policy | `install.ts` +18/-5 |
| Connectors | workers/sagas/triggers/streams mark sample starters `omit` and give barrels an `alternate` empty-barrel scaffolder emitting `export {};` | 4 × `plugin.ts` + 4 × `barrel.ts` |

Default preserved: `includeSamples` defaults `true` and an undefined `samples` policy emits the
original starter, so no existing plugin changes behaviour. Runtime glue is left unmarked and still
emits — correct, and streams rightly gained no glue resource (plan-eval Finding 2 honoured).

## Independently reproduced gates

Not taken from the worklog — re-run by the evaluator in the worktree:

| Gate | Command | Result |
| --- | --- | --- |
| Plugin check | `run-deno-check.ts --root packages/plugin --ext ts` | `filesSelected=153, failedBatches=0, totalOccurrences=0`, exit 0 |
| Adapter tests | `deno test --allow-all packages/plugin/src/adapter` | `11 passed, 0 failed` |
| CLI plugin tests | `deno test --allow-all packages/cli/src/public/features/plugins` | `22 passed (54 steps), 0 failed` |
| Black-box no-samples | `deno task e2e:cli run scaffold.userland-install --cleanup --format pretty` | `Summary: passed=9 failed=0` |

The wrapper was run **without** `--unstable-kv` (it emits that flag itself); the brief was wrong on
that point and the slice corrected it.

## Acceptance criteria (the ISSUE's boxes)

- [x] **The parsed negative flag is threaded into every official plugin scaffolder.** Transport is
      universal — every official install now serialises `includeSamples` into the child scaffolder's
      context. Evidenced end to end by the four install gates above, each invoking
      `plugin install <kind> ... --no-samples` and exiting 0. **See Reservation 1** for the sense in
      which "every" is only partly evidenced.
- [x] **CLI black-box tests assert each of the paths above is absent after installing with
      `--no-samples`.** The `userland-install.assertions` gate lists the exact six issue paths as
      forbidden and additionally `deno check`s the surviving structural `.ts` output. Reproduced by
      the evaluator: `passed=9 failed=0`. All four kinds are installed in one project, including
      `saga --saga-store-backend kv` (plan-eval Finding 3 honoured).

## Reservations

### 1 (blocking ready-for-merge) — `ai` still ignores the flag

`ai` and `auth` are also official installable kinds
(`plugin-package-resolver.ts` `BARE_PLUGIN_PACKAGE_ALIASES`), and neither was classified.

- `auth` is fine: its only starter is a structural barrel, so there is nothing to suppress.
- `ai` is **not** fine: `plugins/ai/src/adapter/plugin.ts:35` declares models, barrel, tool, agent,
  mcp-registry, stream proxy and chat route with no `samples` policy, so
  `netscript plugin install ai --no-samples` still writes the starter tool and agent.

Box 1 is therefore satisfied as *threading* but not as *observable behaviour for every official
plugin*. Classifying the seven `ai` starters is a product judgement (which are structural? does the
`ai` barrel need an `alternate` empty form?) that the brief explicitly scoped out, and guessing it
ships a workspace that may not type-check. Filed as **#1039** (milestone 0.0.4) rather than widened
here.

### 2 (non-blocking) — merge-readiness suite did not fully pass on this host

`deno task e2e:cli run scaffold.runtime` ended `passed=14 failed=1`. The evaluator read the raw
stderr rather than accepting the "environmental" label: the failing gate is `database.init`, and the
cause is `Timed out waiting 300s for AppHost to start` preceded by
`NativeCertificateToolRunner: The certutil command is unavailable`. Every scaffold and plugin-install
gate passed before it. This is host toolchain/Aspire startup, unrelated to sample emission, and of
the same class as the separately-tracked Aspire/DB lifecycle work. Not re-run, per the brief's
run-it-once rule.

### 3 (non-blocking) — userland suite repurposed rather than added

Plan D5 said "add a dedicated no-samples suite"; the slice instead flipped the existing
`scaffold.userland-install` suite from `samples: true` to `samples: false` and widened it from
workers to all four kinds. Samples-enabled coverage is **not** lost — `scaffold.runtime` installs all
six kinds with `--samples` (verified in its raw log) — so this is acceptable. But the flip also
dropped four assertions that the installed plugin package is materialised in userland
(`plugins/workers/mod.ts`, `scaffold.plugin.json`, `services/src/main.ts`, `database/schema.prisma`)
in favour of generated-workspace paths. The suite's "has artifacts" half is thinner than it was. A
reviewer may want those restored.

## Doctrine / surface

`InstallStarterSamplesPolicy` is new **published** surface on `@netscript/plugin/adapter`
(exported through `mod.ts`). It is additive and optional, documented with JSDoc and an explicit named
type; the slice's `deno doc --lint` and `deno publish --dry-run` both passed. A published-surface
addition is itself a reason for a human to look before merge.
