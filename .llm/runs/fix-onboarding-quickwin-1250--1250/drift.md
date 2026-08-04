# Drift Log: restore Zod-4 OpenAPI query coercion (#1250)

## 2026-08-04 — Milestone composed PLAN-EVAL

- **What:** No local formal PLAN-EVAL is spawned for this delegated milestone PR.
- **Source:** Owner instruction; `milestone-run.md`; orchestrator ruling D6.
- **Expected:** Generic run-loop uses a separate formal PLAN-EVAL before implementation.
- **Actual:** The plan is locked locally and evaluation composes draft→ready augment, OpenHands,
  and the orchestrator pre-merge gate.
- **Severity:** minor / authorized
- **Action:** accept
- **Evidence:** `supervisor.md`, `plan.md` D6, `plan-eval.md`.

## 2026-08-04 — Inherited lockfile modification

- **What:** The supplied worktree began with a one-line `deno.lock` addition not made by this run.
- **Source:** Bootstrap `git status` and `git diff -- deno.lock`.
- **Expected:** Clean worktree other than run-owned files.
- **Actual:** `jsr:@netscript/queue@0.0.4` is added to an existing lock package dependency list.
- **Severity:** minor
- **Action:** preserve and exclude from every commit
- **Evidence:** raw worktree diff before source changes.

## 2026-08-04 — Introspection tools describe but do not execute operations

- **What:** Issue acceptance says the same request shape works through #1204 introspection tools.
- **Source:** Live issue #1250; MCP tool registry and application flows on current main.
- **Expected:** A tool capable of issuing the documented request could prove execution directly.
- **Actual:** `list_api_services`, `list_service_operations`, and `get_operation_schema` discover and
  project OpenAPI; none calls a service operation. The HTTP handler is the executable boundary.
- **Severity:** minor / specification clarification
- **Action:** accept; prove HTTP request execution and retain existing introspection schema tests
- **Evidence:** `packages/mcp/src/application/flows/`, MCP tool catalog.
