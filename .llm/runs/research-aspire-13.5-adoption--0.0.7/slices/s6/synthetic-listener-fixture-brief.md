use harness

## SKILL

Read `AGENTS.md`, `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/aspire/SKILL.md`,
`.agents/skills/netscript-tools/SKILL.md`, `.agents/skills/netscript-pr/SKILL.md`. You are the
Codex · GPT-5.6 Sol · medium implementation thread for a bounded E2E-harness-only feature on
branch `feat/aspire-13-5-s6-health-checks` (worktree
`/home/agent/projects/netscript/worktrees/007-aspire-s6-v2`, current head is the branch tip —
fetch and build on it, do not rebase past it). **Scope is entirely under `packages/cli/e2e/` —
no edits to `packages/cli/src/kernel/templates/` or any other framework/product source.** No
runtime attempted by you (no `aspire start`); the supervisor runs the lease-backed verification
after your static implementation and gates are green.

## Why (full context, do not re-derive)

`runtime.health.listener-unreachable` (`listener-unreachable-fixture.ts`) exists to prove Aspire's
health-check machinery correctly detects and recovers from a backing service becoming
unreachable. Three prior attempts to simulate "unreachable" all failed for reasons worth knowing:

1. `aspire resource <name> stop` — on 13.5.3 this also suspends Aspire's own health-check
   evaluation for that resource, so `healthReports` freezes at its last value and never
   transitions to `Unhealthy`.
2. `docker pause`/`unpause` on the resource's own container — a paused container's listening
   socket still completes new inbound TCP handshakes at the kernel level (the frozen process just
   never calls `accept()`), so `createListenerReadinessCheck` (see below) falsely reports Healthy
   throughout.
3. `docker stop`/`start` on the resource's own container — risks Aspire's DCP treating this as an
   externally-caused resource state change (possibly replacing/re-tracking the resource), which
   is not certifiable as portable, deterministic test behavior across CI/native/relayed hosts.

Root cause read directly from the shipped health-check factories
(`packages/cli/src/kernel/assets/aspire/helpers/_aspire-compat.ts.template`):
- `createListenerReadinessCheck({kind, host, port})` does a **bare `net.createConnection`** and
  resolves `Healthy` on the socket's `'connect'` event alone — no protocol round-trip. Any
  transparent proxy/relay in front of the real port (or a paused-but-still-accepting socket)
  defeats this check.
- `createRespPingCheck({host, port})` writes `PING\r\n` and requires a `+PONG` reply before
  declaring Healthy — a real protocol round-trip, not defeated by a naive accept-only proxy.

## The approach (approved architecture — do not deviate)

Stop depending on any real backing container or Docker/Aspire resource lifecycle at all. Instead,
attach **additional, test-only health-check keys** to the *live* `postgres` and `garnet`
resources, backed by TCP/RESP listeners the E2E harness itself opens, owns, and can close/reopen
on demand — using the exact shipped `createListenerReadinessCheck`/`createRespPingCheck`
factories, so the test proves the real, shipped health-check code path end-to-end while remaining
fully deterministic and topology-independent (no Docker, no container, no relay dependency).

### Precedent to follow exactly

`packages/cli/e2e/src/application/gates/scaffold/runtime/prepare-readiness-fixture.ts` already
does the analogous thing for **apps**: it imports `generateRegisterApps` (a real generator
function) as a library, calls it with a synthetic app entry to produce a code block, and
string-splices that block into the *already-generated* `aspire/.helpers/register-apps.mts` at a
marker (`return apps;`), guarding against double-registration. Read this file in full before
starting; your new code follows the same shape but targets
`aspire/.helpers/register-infrastructure.mts` and the `generateRegisterInfrastructure` generator
(`packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-infrastructure.ts`
— **read it as a library caller only, do not edit it**) to attach **extra `.WithHealthCheck(...)`
calls onto the existing `postgres`/`garnet` builder variables**, not new standalone resources.

### Lifecycle constraint you must solve

`prepare-readiness-fixture.ts`-style gates run as short-lived one-shot subprocesses *before*
`aspire start` — they cannot themselves hold open a long-lived TCP listener across the AppHost's
whole runtime phase. Reuse the SAME synthetic-app-injection technique
(`prepare-readiness-fixture.ts`'s own pattern) to inject one additional, Aspire-managed long-lived
task resource — call it e.g. `listener-fault-controller` — analogous to the existing
`readiness-dead-port` app (a `deno run main.ts` task with `await new Promise(() => {})` keeping it
alive) — except this controller must:
- bind two fixed, e2e-reserved TCP ports (pick two unused ones near the existing `18997`, e.g.
  `18998` for the postgres-test-key listener, `18999` for the garnet-test-key fake-RESP listener)
- the port-`18998` listener: accept connections and hold them open (this is the "healthy" state
  for a bare-connect check) while a control mechanism can command it closed/reopened
- the port-`18999` listener: on connect, if "open", reply `+PONG\r\n` to any received line
  (satisfies `createRespPingCheck`); when "closed", refuse new connections (matching the
  `ECONNREFUSED`/`ETIMEDOUT` regex the fixture already checks for)
- expose a minimal control surface the E2E fixture can drive from *outside* this controller
  process without any Docker/process-signal dependency — the simplest robust choice is a small
  control TCP port (or a polled control file under `.netscript/e2e/`) that the controller reads
  each tick and opens/closes the two listeners accordingly; document exactly which you chose and
  why in the worklog.

Inject `.WithHealthCheck('test_only_postgres_listener', createListenerReadinessCheck({kind: 'tcp',
host: 'localhost', port: 18998}))` onto the generated `postgres` resource builder variable, and
`.WithHealthCheck('test_only_garnet_resp', createRespPingCheck({host: 'localhost', port: 18999}))`
onto the generated `garnet`/cache resource builder variable, in `register-infrastructure.mts`,
via the same marker/string-splice technique (find the resource variable's existing
`.WithHealthCheck(...)` chain and append one more call before the terminating statement — name
the exact marker text you use).

## `listener-unreachable-fixture.ts` rewrite

Replace the current `docker pause`/`aspire resource stop` mechanism entirely. New flow per
expectation (you decide the exact `ListenerReadinessExpectation`-shaped wiring for the two new
test-only keys — extend `listener-readiness-gates.ts` minimally if needed to declare them):

1. **Fail closed on ownership**: before touching anything, confirm the target health-check key is
   one of the two test-only keys you registered (`test_only_postgres_listener` /
   `test_only_garnet_resp`) — never let this code path touch `postgres_listener`/the real RESP
   check by construction (i.e., don't parameterize this over arbitrary resource/key pairs the way
   the old code did; hardcode the two test-only keys explicitly).
2. Poll and require both test-only keys **and** the real backing keys (`postgres_listener`, the
   real garnet/RESP check) Healthy — this is the "everything wired correctly" baseline.
3. For each test-only key: command the controller to close that key's listener; poll for that
   exact key to report `Unhealthy` with the expected description; `aspire wait <resource>
   --status healthy --timeout 10` and require exit code `18`; command the controller to reopen;
   poll for that key's recovery to `Healthy`.
4. **Throughout, re-verify the real backing keys stayed Healthy** — capture and assert this in the
   receipt so a reviewer can see the real database/cache was never touched.
5. `finally`: always attempt to reopen every listener you closed, regardless of success/failure
   above, before returning/throwing.
6. Keep the existing receipt file shape reasonably close (resource/key/unhealthy/waitExitCode/
   recovered) plus the new real-key-continuity evidence; update `listener-unreachable-fixture.ts`'s
   doc comment to state the new architecture and why (cite this brief, D-101).

## Gates (static only, no runtime)

Focused unit tests for the controller's open/close state machine (fake the TCP layer or use real
ephemeral loopback sockets in a Deno test — your choice, state which), for the generator-splice
logic (RED first: assert the marker exists and the splice is idempotent/guarded against double
registration, mirroring `prepare-readiness-fixture.ts`'s own guard), scoped
`run-deno-check.ts`/lint/fmt on every touched/added path, `quality:scan`, `arch:check`. Preserve
`resourceMatches` (already exported, ID-suffix-tolerant) as the resource lookup used by
`readListenerHealthReport`.

## Commit, push, report

Commit by logical slice. Push explicitly to
`refs/heads/feat/aspire-13-5-s6-health-checks` (the supervisor pins the force-push against its
current remote head). PR #1743 comment `## [PHASE: IMPL] S6 — scratch-only synthetic listener
fixture (D-101)` citing this brief and the exact controller mechanism you chose. If any part of
this design proves infeasible as specified, stop and report the exact blocker with your reasoning
rather than silently substituting a different mechanism. Final line: new head SHA.
