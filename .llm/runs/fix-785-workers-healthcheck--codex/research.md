# Research — issue #785 workers health-check execution

## Baseline

- Branch `fix/785-workers-healthcheck` is clean at `bab5425b`, identical to remote `feat/beta10-integration` at run start.
- Issue #785 reports two native-WSL reproductions: 42 passed / 1 failed, with only `behavior.workers-executions` red and terminal error `Not Found`.
- Delivery is healthy: the trigger gate passes and a durable execution row is created. Failure therefore occurs after queue delivery, inside handler execution.

## Surface and doctrine

- Primary surface: `plugins/workers`, Archetype 5 (Plugin Package), runtime subtype, with the service overlay.
- Secondary surface if generation changes: `packages/cli`, Archetype 6 (CLI/Tooling).
- Doctrine verdict: `plugins/workers` is currently **Refactor**; `@netscript/cli` is **Restructure**. This slice must not deepen those existing findings.
- Relevant axioms: A1, A7, A8, A13, A14. Relevant anti-patterns: AP-3, AP-9, AP-10, AP-19, AP-25.
- Existing debt was searched; no issue-785-specific accepted debt permits a broken runtime entrypoint.

## Contract and current behavior

- The worker runtime contract supports local job definitions with a relative `entrypoint` and a configured `jobsDir`.
- The generated runtime registry normally emits local file entrypoints relative to `jobsDir` (for example `./health-check.ts`).
- The Flow-B E2E fixture registers `health-check` as local with entrypoint `./workers/jobs/health-check.ts` while the worker is configured with jobsDir `./workers/jobs`.
- `resolveDenoEntrypoint` currently concatenates jobsDir and every `./` local entrypoint, so a project-root-relative entrypoint can become `<project>/workers/jobs/workers/jobs/health-check.ts`.
- Captured `aspire logs workers` confirmed the exact processor path:
  - registry: `source=local, entrypoint=./workers/jobs/health-check.ts`
  - resolved module: `<project>/workers/jobs/workers/jobs/health-check.ts`
  - terminal processor message: `Job 'health-check' failed: Not Found`
- Root cause: `resolveDenoEntrypoint` treated every relative local entrypoint as jobs-dir-relative, even when the registry entrypoint was already project-root-qualified under that jobs directory. The duplicated path failed dynamic import before the health-check handler ran.

## JSR surface scan

- `plugins/workers/deno.json` has scoped name, description, explicit export map, publish include/exclude rules, and a documented health-check subpath.
- The planned fix does not add or change a public export, package dependency, permission, or slow-type-bearing declaration.
- Full publish dry-run is not a slice acceptance requirement because published shape is unchanged; scoped doc/check/quality gates remain required.

## Open questions

- Resolved: the failure is entrypoint resolution, not the handler's HTTP callback or registry lookup.
- Safe to defer: broader normalization of task/polyglot entrypoints; they do not use this local Deno job resolver.
