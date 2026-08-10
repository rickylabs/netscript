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
