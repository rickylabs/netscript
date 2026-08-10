# E-1 · Owner decision · 2026-08-10 · the configured-module contract is broken for every first-party plugin

## Why this is an escalation

Two things converge:

1. **The two-cycle PLAN-EVAL loop is exhausted.** `plan-eval.md` = `FAIL_PLAN`,
   `plan-eval-cycle2.md` = `FAIL_PLAN`. `evaluator/plan-protocol.md` requires owner escalation
   before implementation.
2. **Cycle 2 overturned a load-bearing plan decision, and proving it revealed a defect wider than
   #1443.** That is a material rescope question, which the run brief reserves for the owner.

## The finding, proven not argued

`netscript.config.ts` `plugins: [...]` is read by two different loaders:

| Loader | Behavior |
| --- | --- |
| `loadRegisteredPluginMetadata` (`plugin-registry.ts:163-184`) | reads a sibling `scaffold.plugin.json`; never imports the module |
| `loadRegisteredPlugins` (`:142-160` → `:123-137` → `:363-377`) | **imports** the module and throws unless it exports exactly one `PluginManifest`. No metadata fallback. |

`generate runtime-schemas` uses the second (`public-command-dependencies.ts:329-340`).

Empirical proof in a clean published-0.0.5 consumer — a module exporting a plain object, **with a
sibling `scaffold.plugin.json` present**:

```text
plugins: ['./probe/mod.ts']
Error: Plugin spec "./probe/mod.ts" does not export a plugin manifest.
```

Plan v2's D4a assumed the metadata path and was **wrong**; PLAN-EVAL cycle 2 was right. v3's D4a is
corrected: `ai/mod.ts` must export a real `PluginManifest`.

## What that implies beyond #1443

`plugin install worker` writes `./workers/mod.ts` into `netscript.config.ts`, and that file is a
plain barrel:

```ts
export { healthCheckJob } from './jobs/health-check.ts';
export { validatePayloadTask } from './tasks/validate-payload.ts';
```

No manifest export. So **`generate runtime-schemas` cannot succeed on any project with a first-party
plugin installed** — not only the AI one. In the reproduction project it fails on workers too (with
a different error first: `Import "zod" not a dependency` from `workers/jobs/health-check.ts`, i.e. a
second missing-import-map defect of exactly the class #1443 reports for AI).

#1443 is written as an AI-plugin bug. It is actually the AI-shaped instance of a shared
scaffold-contract bug.

## The decision I need

**Does PR #1444 fix the contract for all first-party plugins, or only for AI?**

| Option | Scope | Cost | Risk |
| --- | --- | --- | --- |
| **A — shared contract (recommended)** | Every first-party plugin emits a manifest-exporting `<name>/mod.ts` and a complete import surface; the host invariants (D2, D4b, D7) already apply to all plugins | Larger: touches `plugins/{workers,sagas,triggers,streams,auth}` emitters; more E2E surface | Higher blast radius, but it is the honest fix and the canonical E2E already installs all five plugins, so it gets proven |
| **B — AI only** | Fix AI; file a follow-up for the rest | Smaller, faster to canary | Ships a CLI where `generate runtime-schemas` still fails for workers/sagas/triggers/streams. The doctor and E2E gates this PR adds would then have to be deliberately narrowed to avoid going red on the other plugins — which is the "narrow fixture-only special case" the brief forbids |

**My recommendation: A.** Option B forces the new doctor check and the new E2E gates to be scoped
around known-broken plugins, which is precisely the false-green pattern #1443 exists to kill. The
incremental work is mostly emitter-shaped and repetitive, and the canonical `scaffold.runtime` suite
already installs all five plugins, so A is provable in the run we already have to do.

If A: I extend the plan to v3-wide, re-run PLAN-EVAL (the loop resets on an owner-authorized
rescope), and proceed. If B: I need explicit authorization to scope the new doctor/E2E assertions to
the AI plugin only, and I will file the follow-up issue naming the other four plugins before merge.

## Also blocked, separately (not a decision, just visibility)

Mobile visibility for Codex sessions — see `drift.md` D-4/D-5. `remote-control` is unmanaged, and
`agentic:runtime repair codex-remote --dry-run` refuses because a **foreign** active session
(`w6-kimi-codex-supervisor`, `/home/codex/repos/w6-kimi-supervisor-remote`) shares the app-server.
Per `AGENTS.md` resource hygiene this run leaves it alone. Sessions are daemon-attached,
route-validated, and steerable, but Desktop-visible only. No slice will claim mobile proof.
