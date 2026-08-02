# Worklog: issue #1058 schema collision safety

## Design

### Public surface

- No new CLI command or exported package entrypoint.
- `configureNetscriptBetterAuthOptions` keeps its signature and gains namespaced entity defaults.
- Plugin install keeps its existing result contract; an entirely redundant fragment returns
  `written: false`.
- `formatFailedReportSteps` keeps its existing entrypoint and gains GitHub-oriented decisive output.

### Domain vocabulary

- **Prisma declaration** — top-level `model`, `enum`, `type`, or `view` with a name, normalized
  body, source path, and removable source span.
- **Different-body collision** — same declaration kind/name with a different normalized body.
- **Idempotent redeclaration** — same declaration kind/name and normalized body.
- **Decisive error line** — the gate error or non-download tail line carrying a Prisma/error code or
  concrete failure statement.

### Ports

- Existing `FileSystemPort` supplies schema-tree reads/walks.
- Existing `ScaffolderPort` remains the only schema write boundary.
- No new port or dependency is introduced.

### Constants

- Auth schema identifiers: `AuthUser`, `AuthSession`, `AuthAccount`, `AuthVerification`; matching
  Prisma client accessors: `authUser`, `authSession`, `authAccount`, `authVerification`.
- Prisma declaration kinds: `model`, `enum`, `type`, `view`.
- Download-noise prefixes are local to the E2E diagnostic formatter.

### Commit slices

See `plan.md` § Ordered implementation slices. The owner requires all gates green before the first
push, overriding the harness's usual per-slice push cadence; commits remain locally sliced and the
supervisor performs review/sign-off after handoff.

### Deferred scope

- Published-canary production validation remains with the supervisor after merge.
- Local-path fragment materialization remains tracked by #1043/#1014.

### Contributor path

Schema collision policy is implemented beside the plugin DB integration adapter and tested through
`copyPluginSchemasToRootDb`. Auth schema identifiers live in `plugins/auth/database/auth.prisma`,
with matching better-auth defaults in `packages/auth-better-auth/src/better-auth.ts`. Production E2E
report presentation stays in `.llm/tools/e2e/print-failed-report-steps.ts`.

## Progress log

| Date       | Slice     | Step                  | Notes                                                                                                                        |
| ---------- | --------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-02 | bootstrap | baseline              | Clean branch at `f72afba90`; requested slice run directory was absent and was created here.                                  |
| 2026-08-02 | bootstrap | waiver                | Owner-directed Plan-Gate evaluator waiver recorded; no evaluator dispatched and no `plan-eval.md` created.                   |
| 2026-08-02 | research  | reproduction          | Published canary reproduced exactly two `model User` declarations in distinct files.                                         |
| 2026-08-02 | research  | dependency proof      | Lock pins better-auth 1.6.20; `deno doc` confirms supported per-entity `modelName`.                                          |
| 2026-08-02 | slice 1   | RED                   | Both new merge tests failed against the unmodified writer for the expected reasons.                                          |
| 2026-08-02 | slice 2   | supervisor correction | Changed better-auth defaults from schema identifiers to camelCase Prisma client accessors; caller override coverage remains. |
| 2026-08-02 | slice 3   | GREEN                 | Collision tests and the full requested CLI install test file passed; both #1043 cases remained unmodified.                   |
| 2026-08-02 | slice 4   | real-run fixture      | Downloaded run 30743141553 and rendered `database.init`/P1012 before the filtered tail.                                      |
| 2026-08-02 | slice 5   | local reproduction    | Branch CLI + workspace auth local path produced one `User`; known #1043 local-path omission remains unchanged.               |
| 2026-08-02 | slice 5   | doctrine reconcile    | Consolidated guard/writer so the CLI plugin adapter folder remains at the 12-child cap.                                      |
| 2026-08-02 | slice 5   | final gates           | Full current-tree check/lint/fmt, quality, JSR, focused tests, and diff hygiene passed.                                       |

## Decisions

| Decision                                              | Reason                                                                                                          | Source                                    |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Apply Archetypes 6, 5, and 2                          | The slice changes CLI schema integration, a first-party plugin schema, and better-auth integration composition. | harness archetype profiles                |
| Keep accepted auth layout debt unchanged              | No folder/public-surface restructure is needed for #1058.                                                       | `AUTH-ARCHETYPE-LAYOUT` debt entry        |
| Treat the refuted duplicate-fetch theory as non-scope | Reproduction shows one fragment and one base model, not duplicate copies.                                       | `evidence/reproduction-and-dependency.md` |

## Gate results

| Gate                                         | Result | Evidence                                                                    |
| -------------------------------------------- | ------ | --------------------------------------------------------------------------- |
| Published-canary reproduction before changes | PASS   | `evidence/reproduction-and-dependency.md`                                   |
| better-auth `modelName` capability stop-line | PASS   | `evidence/reproduction-and-dependency.md`                                   |
| Part B regression tests RED                  | PASS   | `evidence/schema-collision-red-green.md`                                    |
| Focused GREEN tests                          | PASS   | 21 tests / 21 steps plus 4 formatter tests passed                           |
| Production report formatter tests            | PASS   | 4 passed; `evidence/production-report-formatting.md`                        |
| Static/fitness/JSR gates                     | PASS   | `evidence/validation.md`                                                     |
| Manual local-CLI model census                | PASS   | `evidence/local-cli-reproduction.md`                                        |

## Handoff notes

- The supervisor should review model-name caller precedence, declaration-span removal, and the exact
  collision error context first.
- Independent PLAN-EVAL/IMPL-EVAL remain supervisor-owned under the explicit waiver.
