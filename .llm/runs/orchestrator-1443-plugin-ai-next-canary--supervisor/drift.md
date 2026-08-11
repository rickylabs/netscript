# Drift — #1443 plugin-ai next-canary orchestrator

Append-only. Severity: `minor` | `significant` | `architectural`.

## D-1 · significant · 2026-08-10 · issue reproduction command does not run as written

`research.md` R-0. The reproduction commands in #1443 fail before any NetScript logic on a clean
Linux host: `@netscript/config` imports `npm:zod@^4.4.3` and Deno refuses to resolve it when the CLI
is launched from a directory without a `deno.json`. Adding `--node-modules-dir=auto` clears it and
the reported defects then reproduce exactly. Recorded so the preserved evidence script is
re-runnable; **not** folded into #1443's scope.

## D-2 · architectural · 2026-08-10 · the manifest protocol cannot express "no service"

`plan.md` §"Root cause". `provider.defaultServiceEntrypoint` and
`officialSource.{serviceEntrypoint,serviceConfigKey,servicePort}` are required by a `.strict()` Zod
schema in `packages/plugin/src/protocol/manifest.ts`. `plugins/ai` was therefore *forced* to declare
a service it does not implement — the issue's "invalid service topology" is a protocol gap
surfacing, not a plugin authoring mistake. The fix widens the protocol (slice 1) rather than
patching the plugin alone.

## D-4 · significant · 2026-08-10 · PLAN-EVAL launched daemon-attached but NOT mobile-visible

The PLAN-EVAL session (thread `019fec5f-4805-7bc1-8e58-bcb6e048646f`, `gpt-5.6-sol`, effort `high`,
cwd `/home/codex/repos/ns-1443-plugin-ai-orchestrator`, sandbox `dangerFullAccess`) launched
correctly through `.llm/tools/agentic/codex/launch-codex-slice.ts` and is steerable via
`codex-resume.ts`. But the launcher's own `remoteControl/status/changed` event reported
`"status":"disabled"`, and `codex remote-control start --json` fails with the known
`app server is running but is not managed by codex app-server daemon` error
(`codex-wsl-remote` § Known Incidents).

**Therefore this thread is Desktop-visible and steerable, but not phone-visible.** Recorded rather
than claimed: the harness forbids asserting mobile visibility without proof. The documented repair
(anchored-PID kill of the user's app-server + socket removal + `remote-control start`) interrupts
running work, so it is deferred until the PLAN-EVAL turn completes; implementation sessions are
launched only after remote-control reports `"status":"connected"` and
`"remoteControlEnabled":true`.

## D-3 · significant · 2026-08-10 · the generated `ai/` namespace is unreachable, not just uncompilable

Nothing under `apps/`, `aspire/`, `services/`, or `.netscript/` in a freshly scaffolded project
references `ai/routes/**` (verified by grep in the reproduction project). The only pointer at the AI
surface was the broken `/services` appsettings entry. So `ai/routes/chat.tsx` is dead code today,
and the AppHost has been starting an executable that cannot resolve — silently, because no
`RUNTIME_WAIT_*` resource covers `ai`. #1443's acceptance requires the topology to be valid and the
files to compile; mounting the island in the Fresh app is recorded as deferred scope plus an
`arch-debt.md` entry, not smuggled into this PR.

## D-5 · significant · 2026-08-10 · mobile visibility is blocked by a foreign active session, not by this run

Follow-up to D-4. `deno task agentic:runtime repair codex-remote --dry-run` returns
`status: blocked` / `active_session: Codex remote repair refused because active sessions or child
commands were observed`. The observed session is **foreign**: a tmux supervisor
`w6-kimi-codex-supervisor` running `codex resume 019fd5f0-…` in `/home/codex/repos/w6-kimi-supervisor-remote`,
owned by another run. The documented remote-control repair kills the shared user app-server (pid
2270), which would disrupt it.

Per `AGENTS.md` § Resource hygiene ("review every foreign/unknown-owner entry and leave it alone")
and the runtime controller's own refusal, **this run does not perform the repair.** Safe diagnostics
are exhausted.

**Effect, stated honestly:** every Codex session in this run is daemon-attached, route-validated
(`provider`/`model`/`effort` observed at `thread/start`), and steerable via `codex-resume.ts`, but
is **Desktop-visible only — not phone-visible**. The harness forbids claiming mobile visibility
without proof, so no slice will claim it. The run proceeds on the same lane
(`lane-policy.md` §"Blocked-lane handling": record the missing mechanism, do not silently
substitute). Surfaced to the owner; restoring phone visibility needs either the foreign session to
end or an owner decision to interrupt it.

## D-6 · architectural · 2026-08-10 · owner-authorized rescope to the shared configured-module contract

Escalation `escalations/E-1-configured-module-contract.md` asked whether PR #1444 fixes the
configured-module contract for every first-party plugin or for AI alone.

**Owner decision (2026-08-10): fix the shared contract as part of this PR, and find the related
issues — otherwise file one for tracking.** Search over open+closed issues found no existing
coverage (`#1370` is adjacent — pre-randomization ports for sagas/triggers/streams — but a different
defect), so **#1445** was filed and is now closed by this PR alongside #1443.

Scope moves from "the AI plugin" to "every first-party plugin whose install writes a `<name>/mod.ts`
specifier into `netscript.config.ts`": `ai`, `workers`, `sagas`, `triggers`, `streams`, `auth`.

Also recorded: the owner elected to **proceed Desktop-only** on the blocked mobile-visibility lane
(D-4/D-5) rather than interrupt the foreign `w6-kimi-codex-supervisor` session. No slice claims
mobile proof.

Per `run-loop.md` §"Rescoping" and `plan-protocol.md`, an owner-authorized rescope resets the
PLAN-EVAL loop; plan v4 is re-evaluated before implementation.

## D-7 · minor · 2026-08-10 · sender-ownership handoff from evaluator to implementer

`launch-codex-slice.ts` binds one sender per worktree
(`~/.config/netscript-agentic/runtime/senders/<hash>.json`). This worktree's lease is held by the
**PLAN-EVAL** thread `019fec5f-4805-7bc1-8e58-bcb6e048646f`, and `decideSenderOwnership` returns
`blocked` while `sessionActive` is true — which stays true after the turn ends, by design ("a
returned thread remains the worktree owner so the next operator is directed to resume").

Resuming that thread for implementation would make the evaluator its own generator, violating the
one hard harness invariant. Launching a second sender here would fork a rival writer.

**Handoff procedure used** — the adapter's own `release(worktree, leaseToken)` API, the same call
`launch-codex-slice.ts:393` makes for a stale lease, with the real token read from the record:

1. Confirm the evaluator turn is idle (`codex-watch --mode turn`), not merely quiet.
2. Release this worktree's lease with its recorded `leaseToken`.
3. Launch the implementation session as a fresh sender; it becomes the worktree owner.

Only one writer is ever active: the evaluator writes no source, and its session is complete before
the release. Every subsequent evaluator pass (including the mandatory IMPL-EVAL) runs in its **own
worktree** rather than contending for this lease — the pattern the repo's sender registry already
shows (`ns1331-qwen-evaluator`, `b10-715-eval`).

## D-8 · significant · 2026-08-10 · owner override — closed model on an OpenRouter relay lane

**Owner instruction (2026-08-10):** if plan v6 fails the final plan-gate, escalate the *scope*
question to a fresh **OpenRouter Grok 4.5 · high** session to adjudicate whether PR #1444 is too big
or needs a rescope.

This is an **override of `lane-policy.md` invariant 6**, which restricts OpenRouter relay evaluator
lanes to **open** models (`minimax/minimax-m3`, `deepseek/deepseek-v4-flash-0731`) on the stated
grounds that closed models burn paid OpenRouter credit. Grok 4.5 is closed. It is also invariant 4's
"no implicit paid escalation" — made explicit here by owner authorization, which is exactly the
mechanism invariant 4 requires.

Recorded rather than silently taken. The model id `x-ai/grok-4.5` is already centralized as `grok`
in `.llm/tools/agentic/config/models.ts:54`, so no volatile value is hardcoded by this run.

**Scope of the override:** one adjudication turn, one question — `SINGLE_PR` / `SPLIT` / `RESCOPE`
(brief: `escalations/E-2-scope-adjudication-brief.md`). It is **not** a plan-gate pass, does not
re-litigate architecture, and does not become the IMPL-EVAL route — that remains native
opposite-family Fable 5 medium for Codex-authored work.

## D-9 · architectural · 2026-08-10 · loading configured modules executes them

The E2E's new `generated.runtime-schemas` gate failed on `Import "zod" not a dependency` from the
generated `workers/jobs/health-check.ts`. My research (A-3) read that as a missing per-kind
import-map entry. The implementer's diagnosis is better: `loadRegisteredPlugins` imports project
modules **in the CLI's own resolution context**, so the project's `deno.json` import map never
applies. The fix loads them in a child process with the project's config (reusing S8's shared
resolver).

That fix is **not yet green**, and the failure is informative: S10's table-driven test
`first-party configured modules preserve app exports and resolve one package manifest` now fails with

```
[DurableStreamProducer] Missing plugin reference "streams" ... Durable streams URL not found.
Expected DURABLE_STREAMS_URL or services__streams__http__0 ...
```

**Importing a plugin barrel executes it**, and some barrels have import-time side effects requiring
runtime environment. So the configured-module contract has a dimension neither the plan nor five
plan-gate cycles surfaced: a module that must be *loadable* by the CLI cannot carry import-time
runtime dependencies.

Open question for the next session — the resolution is a design decision, not a patch:

1. Make the emitted barrels side-effect-free at import (export the manifest and re-export lazily),
   so loading never touches runtime env; or
2. have the loader read the manifest without executing the app-owned surface; or
3. give the child process the env the barrels expect (weakest — makes `generate runtime-schemas`
   depend on a running stack).

(1) looks right and matches the plugin-thinness law, but it changes what S10 emitted for five
plugins and needs its own slice. **Do not commit the current working tree: it is red.**

## D-10 · architectural · 2026-08-11 · owner decision — control-plane / runtime split

Resolves D-9. **Owner chose option 1, refined:** an explicit control-plane vs runtime split.

**Standing constraint, stated by the owner:** runtime-versioned workers/tasks and triggers are an
**intentional differentiating capability**. Operators must ultimately be able to add, update and
roll back versioned tasks and triggers on a running deployed stack, including polyglot or legacy
wrappers. That runtime surface must **not** be deleted, neutered, or folded into static
configuration to make schema generation green. D-9's option 3 (injecting runtime env) and any
static-config collapse are both rejected.

**Shape:**

- **Keep the child-process loader** — project modules must resolve through the *consumer's* Deno
  config and import map, which was the correct half of the previous diagnosis.
- The **configured module** becomes a dedicated manifest-only, import-safe module
  (`<name>/plugin.ts`), registered in `netscript.config.ts`. It must load under an **empty**
  runtime/Aspire environment and export **exactly one** package-owned `PluginManifest`, constructing
  no producers, clients, or adapters.
- `<name>/mod.ts` and `<name>/runtime.ts` are **preserved unchanged** as the application/runtime
  surfaces. This is a split, not a migration: nothing a consumer imports today moves or disappears.

**Prohibited:** static TypeScript parsing; reintroducing JSON metadata as a competing runtime source
of truth; injecting fake runtime environment variables to make a load succeed.

**Required proof** — one shared all-first-party contract test: the configured module loads with empty
env; exactly one manifest resolves; no runtime initialization or environment lookup occurs; and the
existing runtime/application exports remain reachable through their separate barrel.

**Scope boundary.** A separate full RFC orchestrator is being launched to map legacy
`netscript-start` runtime tasks/triggers and cockpit against the current `runtime-config`, workers,
triggers, schema generation, deployment, sandboxing, versioning, DB synchronization, security and
management surfaces. **#1444 preserves the boundary and fixes its immediate contract; it does not
absorb that redesign.** Anything discovered here that belongs to it is recorded, not built.

## D-11 · minor · 2026-08-11 · two limitations disclosed rather than fixed

Surfaced by IMPL-EVAL and recorded rather than silently carried:

- **C8 — the configured-module loader child executes consumer-controlled code.** Resolving a
  manifest imports the project's own module in a subprocess, with network permission, at
  control-plane time. That is inherent to resolving a manifest the consumer authored in TypeScript,
  and the subprocess plus bounded timeout is the containment. Disclosed in the PR body so it is a
  known property rather than a surprise.
- **C5 — `plugin-registry.ts:140` falls back silently when `deno.json` is absent**, so a
  `deno.jsonc`-only project takes the in-process path without saying so. Not triggered by any
  first-party scaffold, which always emits `deno.json`. Left as a limitation; a doctor hint is the
  natural follow-up.

## D-12 · significant · 2026-08-11 · owner directive — #1447 is a separate lane, and this lane cuts the canary

Owner directive 2026-08-11:

- **#1447** (`fix(cli/aspire): generated service resources drop Services[].Env`) must ship in the
  same canary but **must not** be folded into PR #1444, and #1444's gated head must not move for it.
  It runs as a fresh harness slice on branch `fix/1447-service-env`, worktree
  `/home/codex/repos/ns-1447-aspire-env`, with its own draft PR against current `main`.
- Its IMPL-EVAL is the **opposite-family Codex lane**.
- **This supersedes the launch brief's "do not cut a competing canary."** The owner now directs this
  lane to hand both merge SHAs to the release lane and cut the next canary containing both fixes.
