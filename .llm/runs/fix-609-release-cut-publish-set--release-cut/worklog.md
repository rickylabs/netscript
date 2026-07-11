# Worklog

## Design

### Public surface

- Release-tool exports for publish-set comparison, markdown scanning, and formatted preflight evidence.
- `release:cut` runs both audits before expensive gates and any Git mutation.

### Domain vocabulary

- `PublishableMember`, intended/effective publish set, intentional exclusion, missing/extra delta.
- Markdown pin finding, blocking violation, deferred site finding, target cut version.

### Ports

- Filesystem only (`Deno.readDir`, `Deno.readTextFile`, `@std/fs` walk); no registry/network port.

### Constants

- `@netscript/` JSR scope.
- publish parent roots `packages`, `plugins`.
- deferred markdown prefix `docs/site/`.
- historical/scratch/cache skip patterns.

### Commit slices

1. Bootstrap/plan: harness artifacts and draft PR.
2. Publish audit: explicit delta contract, output, fixtures/tests.
3. Markdown policy: scanner, cut hook, fixtures/tests.
4. Evaluation fixes and close-out evidence.

### Deferred scope

No prose rewrite and no `docs/site/**` enforcement in beta.6.

### Contributor path

Start in the release preflight module and its adjacent test. Add an intentional omission only through the named exclusion table with a concrete reason, then update its audit test.

## Evidence

Pending PLAN-EVAL.
