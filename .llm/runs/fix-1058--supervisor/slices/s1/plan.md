# Plan: issue #1058 schema collision safety

## Run metadata

| Field               | Value                                                 |
| ------------------- | ----------------------------------------------------- |
| Supervisor run      | `fix-1058--supervisor`                                |
| Slice               | `s1`                                                  |
| Branch              | `fix/1058-schema-dedup`                               |
| Baseline            | `f72afba90ed558588e8e169cd40ff8e8a6d7a841`            |
| Implementation lane | Codex · GPT-5.6 Sol · high (`complex_implementation`) |
| Archetypes          | 6 (CLI/tooling), 5 (plugin), 2 (integration)          |
| Scope overlay       | docs                                                  |

## Evaluator waiver

The owner waived the open-model Plan-Gate evaluator on 2026-08-01 and assigned PLAN-EVAL and
IMPL-EVAL to the Claude supervisor. This implementation slice records its plan and proceeds without
creating `plan-eval.md` or dispatching an evaluator.

## Goal

Remove the auth plugin's collision with consumer Prisma identifiers, make plugin schema merges
reject or deduplicate all remaining declaration collisions, and surface the decisive production E2E
failure in GitHub annotations and step summaries.

## Current doctrine verdict

- `@netscript/cli`: Archetype 6, **Restructure**; this slice stays inside the existing
  `kernel/adapters/plugin` boundary and does not widen the public CLI surface.
- `plugins/auth`: Archetype 5; keep the plugin thin and preserve its database contribution path.
- `@netscript/auth-better-auth`: Archetype 2 with accepted `AUTH-ARCHETYPE-LAYOUT` debt. This slice
  changes composition defaults only and does not deepen the recorded folder-layout debt.

## Locked decisions

1. Rename only Prisma client identifiers to `AuthUser`, `AuthSession`, `AuthAccount`, and
   `AuthVerification`; retain all four physical `@@map("auth_*")` table mappings.
2. Configure better-auth through its supported per-entity `modelName` options using the camelCase
   Prisma client accessors `authUser`, `authSession`, `authAccount`, and `authVerification` (not the
   PascalCase schema identifiers). NetScript defaults precede the existing `betterAuthOptions` and
   explicit option spreads so callers retain precedence. The Prisma adapter remains NetScript-owned
   and last.
3. Keep `fetchJsrPackageSchemaFragments` and the dependency-mode `source.kind === 'jsr'` ladder
   untouched. Collision safety belongs at the root-schema write boundary.
4. Add a deliberately small declaration scanner for Prisma `model`, `enum`, `type`, and `view`
   blocks. It records declaration name, normalized body, and source path; it is not a general Prisma
   parser and introduces no dependency.
5. Before each fragment write, scan the base schema and existing plugin fragments. A different-body
   collision throws `ScaffoldValidationError` with plugin, fragment, declaration, and existing file.
   An identical declaration is removed from the incoming write; an entirely redundant fragment
   returns an idempotent `written: false` result and creates no duplicate file.
6. Preserve raw E2E report tails in the uploaded report artifact, while printing decisive lines
   first and filtering registry/download noise from the human-facing tail. The workflow invokes the
   formatter's GitHub mode to emit both `::error::` and `$GITHUB_STEP_SUMMARY` output.
7. Keep `--service-name users` and every existing gate/assertion unchanged. The two #1043 install
   tests remain byte-for-byte untouched.

## Open-decision sweep

| Decision                                              | Status        | Resolution                                                                                                                         |
| ----------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| better-auth supports entity model mapping             | resolved      | Pinned types expose `BetterAuthDBOptions.modelName`; the adapter indexes `db[model]`, requiring camelCase Prisma client accessors. |
| Normalize declaration bodies                          | resolved      | Normalize line endings, indentation/trailing whitespace, and blank lines while preserving tokens.                                  |
| Mixed fragment with identical and unique declarations | resolved      | Remove only identical declarations and write the remaining fragment once.                                                          |
| Published-canary acceptance                           | safe to defer | Requires a post-merge canary; the PR references rather than closes #1058.                                                          |

## Ordered implementation slices

| # | Slice and proof                                                                           | Files                                                  | Gate                                                 |
| - | ----------------------------------------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------- |
| 1 | Lock the diagnosis and prove both schema-collision regressions RED before implementation. | run evidence, `db-integration_test.ts`                 | focused filtered tests fail for the expected reasons |
| 2 | Namespace auth Prisma identifiers and preserve better-auth caller precedence.             | auth schema, `better-auth.ts`, tests, three docs pages | auth package/plugin tests + focused check            |
| 3 | Reject different declarations and deduplicate identical ones without changing #1043.      | `db-integration.ts`, local scanner, tests              | requested CLI test pair green; #1043 tests unchanged |
| 4 | Put decisive production failure text in logs, annotation, and summary.                    | report formatter/test, prod workflow                   | formatter tests + real report fixture rendering      |
| 5 | Prove branch-wide readiness and reproduce against the local CLI.                          | run evidence/worklog                                   | requested standard gates and manual model census     |

## Risk register

| Risk                                                   | Mitigation                                                                                            |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Renamed Prisma models break better-auth accessors      | Pin/type evidence plus tests asserting defaults and caller overrides.                                 |
| Scanner mistakes braces inside strings/comments        | Match declaration headers and balance braces while respecting Prisma strings and comments.            |
| Dedup silently drops unique schema content             | Remove only declaration spans proven identical; retain and write all remaining content.               |
| Existing dependency-mode fragment resolution regresses | Do not edit resolution ladder or the two named #1043 tests; run the full requested install test file. |
| Diagnostic extraction hides evidence                   | Raw JSON/NDJSON artifacts remain unchanged; only console presentation filters download noise.         |
| Lockfile churn                                         | No dependency changes; inspect `deno.lock` before commit and reject incidental churn.                 |

## Deferred and forbidden scope

- No canary/release workflow, JSR publish, tag, or merge.
- No fix for the known local-path fragment boundary #1043/#1014.
- No auth table migration because physical table names are unchanged.
- No CLI E2E argument/assertion changes and no change to `--service-name users`.
- No closure of #1058 until the supervisor proves the published-canary production gate.

## Validation plan

Run the two new merge tests RED first, then the requested focused tests and diagnostics tests GREEN.
Use the repo scoped check/lint/fmt wrappers (the check wrapper without `--unstable-kv`),
`quality:gate`, relevant JSR audits, and the manual local-CLI model census. Push only after all
owner-listed gates are green, then open the draft PR with `Refs #1058`, exactly one `status:` label,
and milestone `0.0.3`.
