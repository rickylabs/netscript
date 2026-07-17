# Plan: S9 agent tooling docs, audit, and stdio smoke

## Run Metadata

| Field          | Value                                   |
| -------------- | --------------------------------------- |
| Run ID         | `mcp-skills--orchestrator/s9`           |
| Branch         | `feat/netscript-mcp-skills-s9-polish`   |
| Phase          | `plan`                                  |
| Target         | `packages/mcp`, CLI docs/E2E, docs site |
| Archetype      | `6 — CLI / Tooling`                     |
| Scope overlays | `docs`                                  |

## Archetype and doctrine verdict

Archetype 6 applies because the delivered surface is a CLI-hosted stdio tool server. This slice does
not reshape the already-landed architecture; it documents and exercises its public edge. Doctrine
A2, A7, A10, A13, and A14 govern the simple published boundary, upstream composition, composition
root, structured failure, and evidence. Current repository debt is not claimed fixed.

## Goal and scope

Publish accurate public guidance for the CLI × skills × MCP combination, complete both package
READMEs, prove the real stdio protocol path with a cheap minimal fixture, and record JSR and final
tree validation evidence.

Non-scope: new tools, protocol behavior, dependencies, full scaffolding, deployment, release cuts,
PR creation, or merge. The only behavior edit allowed is a minimal correction exposed by the smoke.

## Locked Decisions

| ID | Decision                                                                      | Rationale                                                                      |
| -- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| D1 | Add `docs/site/capabilities/agent-tooling.md`.                                | This is a user-facing capability spanning commands and runtime tooling.        |
| D2 | Derive the catalog and claims from current source.                            | Prevents carried-design drift.                                                 |
| D3 | Put the smoke under `packages/cli/e2e/tests/agent/` and run it directly.      | It uses the real public CLI binary but does not need scaffold suite machinery. |
| D4 | Spawn `deno run -A packages/cli/bin/netscript.ts agent mcp`.                  | Proves the actual CLI composition and stdio edge before publication.           |
| D5 | Use newline-delimited JSON-RPC with bounded timeouts and a fixture docs root. | Deterministic, cheap, semantic assertions.                                     |
| D6 | Keep docs public and run the exact prohibited-term grep.                      | Enforces the slice's public-docs law.                                          |

## Open-Decision Sweep

| Decision                                 | Status           | Notes                                                                                      |
| ---------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------ |
| Add a named E2E suite/task               | safe to defer    | Standalone `deno test` is explicitly accepted and avoids inflating scaffold orchestration. |
| Fix non-trivial JSR findings             | safe to defer    | Record as debt; do not expand the public API in a polish slice.                            |
| Endpoint unavailable result exact status | must resolve now | Test the implemented schema and assert structured non-crash semantics, not brittle prose.  |

The must-resolve item is resolved by D5 and the test contract above.

## Commit Slices

1. **Public documentation proves the installed surface.** Files: docs capability page, MCP README,
   CLI README, run artifacts. Gate: public-docs grep plus source alignment review.
2. **Real stdio smoke proves the 13-tool edge and structured failures.** Files: focused E2E test and
   run artifacts. Gate: standalone `deno test` invocation.
3. **Final audit evidence proves publish and package quality.** Files: trivial in-scope fixes if
   required and run artifacts. Gates: scoped check/lint/fmt, tests, arch check, doc lint, JSR audit,
   workspace publish dry-run.

## Risk Register

| Risk                                                   | Mitigation                                                                              |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| CLI child hangs                                        | Per-response timeout; close stdin and terminate child in `finally`.                     |
| Telemetry fallback varies by environment               | Pass an explicit unreachable endpoint.                                                  |
| Docs claim internal design rather than public behavior | Verify every claim against source and use public vocabulary only.                       |
| Workspace publish gate is expensive/noisy              | Run once on the final tree and preserve raw exit/result evidence.                       |
| Validation mutates `deno.lock`                         | Inspect the lock diff against baseline and do not accept churn without a reviewed need. |

## Gates

- Scoped wrapper check/lint/fmt for `packages/mcp` and touched CLI TypeScript.
- All MCP and agent tests plus the standalone stdio smoke.
- `deno task arch:check`, docs link/source alignment, exact public-docs grep.
- `deno task doc:lint --root packages/mcp --pretty`.
- JSR fitness audit for `packages/mcp` and workspace `deno task publish:dry-run`.
- F-CLI gates not covered by scripts remain manual/PENDING_SCRIPT; no structural CLI change is
  planned.

## Debt and deferred scope

No debt is expected. Any non-trivial JSR or architecture finding will be recorded rather than fixed
without rescoping. Full runtime scaffolding and published-package production E2E remain deferred.
