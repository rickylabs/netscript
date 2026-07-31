# Drift — fix-aspire-ephemeral-host-ports--952

## D-1 — Evaluator passes are self-recorded, not independently sessioned

`run-loop.md` §4 and §7 require PLAN-EVAL and IMPL-EVAL to run in sessions separate from the
implementation session. The task brief assigns one issue to one agent with a single hand-back, and
no second session is available. Both verdicts are therefore **self-recorded** by the implementing
supervisor. Disclosed in `supervisor.md` § overrides and stated in the PR body so a reviewer does not
mistake `plan-eval.md` for an independent verdict.

## D-2 — The issue's suggested mechanism (`targetPort`) does not fix the reported bug

Issue #952 proposes "treat a configured service port as the target port … and leave the Aspire host
port ephemeral". For **container** resources a target port is namespaced and pinning it is free; for
**executable** resources — which every NetScript service, plugin and app is (`builder.addExecutable`)
— the target port is the port the `deno` process itself binds on the host machine. Pinning it moves
the collision from Aspire's proxy to the process's own `listen()` and additionally blocks replicas.

The plan follows the issue's stated *expected behaviour* and its `HostPort` naming suggestion, and
rejects the `targetPort` mechanism in favour of emitting no port at all
(`.withHttpEndpoint({ env: 'PORT' })`), which is Aspire's own documented shape for non-.NET
resources. Recorded in `research.md` §4 C-2 and stated in the PR.

## D-3 — "`targetPort` appears nowhere in `packages/aspire/src`" is true but points at the wrong file

Literally true, but the generated apphost is produced by
`packages/cli/src/kernel/templates/aspire/helpers/register/`, and
`generate-register-infrastructure.ts` **already emits `targetPort`** for the DenoKV container and the
Garnet executable. The idiom was present; it had simply never been applied to the executable
resources — and, per D-2, applying it there would have been the wrong move anyway.

## D-4 — Scope is wider than the issue title in one direction, narrower in another

- **Wider:** the issue reports service ports; the app resource (`8010`) carries the identical defect
  and is in the pristine scaffold, so leaving it pinned would leave the issue's own reproduction
  failing. Apps are included.
- **Narrower:** plugin API resources (`8091–8094`) carry the identical defect but are live-probed by
  `e2e/src/application/gates/scaffold/runtime-gates.ts` and referenced by ~20 tutorial passages.
  Un-pinning them is blocked on the E2E gates resolving endpoints from the Aspire resource service.
  Deferred with a named blocker and a follow-up issue.

## D-5 — `scaffold.runtime` could not be run in this worktree

`gates/release-gates.md` makes `scaffold.runtime` required before the next release cut for any run
that changes scaffold output — which this run does. The gate needs Docker and the dotnet Aspire host,
neither available here. **Declared not run**, in the PR body, rather than silently skipped. The
release cut that picks this change up must run it.
