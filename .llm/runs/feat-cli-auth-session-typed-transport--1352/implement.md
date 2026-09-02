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

## Implemented Result

The implementation follows the PLAN-EVAL-approved narrow reading of row 2:

1. `AuthSessionClientContext` makes the caller-owned `auth.getAccessToken` capability explicit and
   typed; `AuthSessionRequestOptions` carries it through `AuthSessionHttpPort`.
2. `AuthPluginCommandDependencies.resolveSessionContext` is an optional application-composition
   seam. Each direct `session list` or `session revoke` action resolves it once and passes the result
   to the port. No environment or credential store is read by this path.
3. `FetchAuthSessionHttp` preserves caller-supplied exact URL behavior and calls the public
   `createBearerSdkClientContribution(...).prepare(...)` protocol with the real URL origin,
   pathname/query, and secure flag. It applies only the returned header patch.
4. The contribution is optional, direct-only, and imported exclusively from
   `@netscript/plugin-auth-core/sdk`. No `packages/sdk/src/internal/**`, service, or server auth
   surface is used.

This does not claim that the exact-URL requests became discovery-driven SDK transport calls. The
public SDK cannot express those URLs. It does satisfy the row's caller-context, typed credential
contribution, and no-server-import requirements without widening that public surface.

## Verification Summary

- Adapter tests cover exact list/revoke URL and method preservation, header arrival, absent-context
  omission, cleartext rejection before fetch, random-credential non-disclosure, and source imports.
- Command parser tests cover the same typed context reaching both direct operations and exactly one
  resolver call per operation.
- Focused tests: 14 passed; full package-owned CLI suite: 1233 passed.
- CLI check, doc lint A/B, publish dry-run, JSDoc examples, quality, architecture, source-boundary,
  and lock gates passed.
- The exact CLI lint/fmt wrappers exit 2 because the unchanged root config excludes
  `packages/cli/` and the wrappers fall into an isolated E2E fixture. Both report zero findings;
  direct repo-style checks over all five changed TypeScript files pass. See `drift.md`.
