# Implementation Prompt: CLI auth-session typed credential transport

## Required Reading

1. `.llm/harness/workflow/run-loop.md`, especially Design and per-slice commit requirements.
2. `.llm/harness/archetypes/ARCHETYPE-6-cli-tooling.md`.
3. `.llm/harness/gates/archetype-gate-matrix.md`.
4. This run's `plan.md`, `research.md`, `worklog.md`, and `context-pack.md`.

## First Act: Design Checkpoint

The `## Design` section in `worklog.md` is filled before product changes. Follow its two product
slices in order; do not widen SDK transport.

## Operating Rules

- Implement only the approved narrow credential migration.
- Import the bearer factory from `@netscript/plugin-auth-core/sdk`; never use SDK internals or a
  server entry point.
- Preserve the caller's exact list URL and `<authUrl>/signout` construction; #1243 remains separate.
- Keep application-supplied context optional and explicit. No flags, environment, cookies, sessions,
  or implicit plugin attachment.
- Run each slice's named gate, commit, push through the explicit refspec, and record/comment evidence.
- Do not run Aspire, Docker, browser, or `e2e:cli`.

## Handoff Requirements

- Worklog contains real gate exits/counts, context pack is resumable, and drift is explicit.
- Final evaluator can determine exactly which words of row 2 are satisfied without chat history.
- Acceptance evidence is added only if the final seven-row audit is honestly complete.
