# Tier-A substantive review — scaffold-generated-output-correctness (#1262 / #1263 / #1588)

Reviewer: `topic-fixes-0.0.7`, native Claude Opus 5 / high, session
`c7597d28-6774-44c9-aa00-b8b40b776165`, Remote Control
`https://claude.ai/code/session_014pCd2QWkCscgZpVdjcUPST`. Separate from the implementation lane
(Codex `gpt-5.6-sol`, thread `019ffcca-8be0-74c2-bb0e-c82cf5ce3c85`). This review is the supervisor
sign-off required before IMPL-EVAL; it is not a substitute for it.

Reviewed head: `0b2cf5e7c85a8194c77f1a08364b8a5879d7b393`. Immutable base `01e0960494c95ce56eb35892c211a095eb13e6ed`.

## Verdict

**PASS_TO_IMPL_EVAL**, with one non-blocking accuracy note (T-2) recorded below.

Nothing in this verdict authorizes a ready flip, merge, publication, relabeling, issue closure, or a
further expensive gate. All remain coordinator-only.

## Slice trail reviewed

| Slice | Commit | Scope |
| --- | --- | --- |
| 2 | `32cd429c0` | #1588 provider-selected engine/Prisma output |
| 3 | `275ae091c` | #1262 truthful model-aware seed |
| 4 | `589a01a55` | #1263 defined persistent-router missing-row errors |
| 5 | `cab6d1feb` | grouped acceptance verifier preparation |
| T-1 | `ebad68c80` | restored MSSQL loopback regression coverage |
| 6 | `0b2cf5e7c` | leased `scaffold.runtime` grouped acceptance |

## Independently re-executed / re-derived (not read from the implementer's report)

| Check | Result |
| --- | --- |
| Slice-2 decisive gate rerun | `exitCode 0`, 10 passed / 0 failed |
| `deno task quality:scan` | `ok: true`, **0 findings**; 7 allowances, all pre-existing, **none in a file this leaf touched** |
| `deno task arch:check` | raw exit 0, no doctrine FAIL rows |
| `deno task check:assets-barrel` | raw exit 0 — embedded assets in sync with templates |
| `git diff --check` | clean |
| Slice-6 boundary | `git diff --name-only ebad68c80..HEAD -- . ':(exclude).llm/**'` **empty** — evidence-only, as planned |
| `deno.lock` | unchanged across `01e096049..HEAD` |

No new `// deno-lint-ignore`, `// quality-allow`, `as any`, or `as unknown as` was introduced to
green a wrapper — the review-blocking class named in the brief is absent.

## Grouped runtime acceptance — verified in the artifact, not the summary

Terminal verdict reached: the structured log carries **1 `suite-end`**, `report.ok: true`, **88
`gate-end` records, 0 failed verdicts**, suite `scaffold.runtime`, 602 896 ms. The committed receipt
records `outcome: PASS`, `rawExitCode: 0`, `gitHead: ebad68c80…` (the leased pre-gate head),
`lease: scaffold-generated-output-correctness-runtime`, `attempt: 2`.

The acceptance payload is **durably committed**, not left in scratch: `receipts/scaffold-runtime.json`
embeds the child receipt at `.liveDbReceipt.value.crud` —

- `representativeId: 1` — the seeded representative row exists,
- `missingId: 2147483647`,
- `projected404Methods: ['get', 'patch', 'delete']`.

The gate that produced it genuinely asserts the acceptance rather than merely exercising the app: it
requests `/api/users?page=1&limit=100`, requires a paginated `data` array, and **fails unless a row
with `name === 'Seed User'` is present**; it then fetches `/api/openapi.json` and runs
`assertCrud404Projection`. `behavior.live-db-endpoint` is `critical: true` and passed on attempt 1.

So #1262 (truthful seed reaches the list endpoint) and #1263 (defined `NOT_FOUND` 404 across GET,
PATCH, DELETE plus preserved OpenAPI projection) are proven by executed runtime evidence.

## Resource hygiene — proven, not asserted

Attempt 1 was classified an infrastructure/transport interruption: its log has 37 `gate-end` and
**zero `suite-end`**, ending mid-`database.generate`. Its partial passes are **not** reused as
acceptance evidence. Its log is preserved as the classification record.

Post-run state, independently re-checked by this reviewer after the turn ended:

- `aspire ps` → no running AppHost.
- `docker ps -a` → empty, **including stopped containers** (the exact failure mode of attempt 1,
  which left three containers at exit 255).
- `docker network ls` → only `bridge`, `host`, `none`. `docker volume ls` → empty.
- `receipts/leak-check.json`: `outcome: PASS`, `survivors: []`, `foreignOrUnknownTouched: []`.
  Cleanup actions are recorded with ownership proof — the Aspire network by exact creator
  label/runtime suffix, and the anonymous volume as absent-at-preflight and created with this
  retry's Garnet container.

Nothing foreign or unknown-owner was touched, and no process was killed.

## T-2 — non-blocking accuracy note

**The shared runtime verdict is postgres-only; it does not exercise SQLite.** The pass ran
`--db postgres` and contains **zero** sqlite steps. The plan describes one runtime verdict "shared by
all three issues", which is true for composition but should not be read as runtime SQLite coverage.

This is not a gap in what #1588 requires. #1588's property — SQLite output emits only its own
provider helpers — is a **generator-output** property, and it is proven by the slice-2 four-engine
required/forbidden-symbol matrix, which asserts for SQLite that `normalizePostgresUrl`,
`normalizeMysqlUrl`, `normalizeMssqlUrl`, `parseConnectionParts`, and `parseSqlServerEndpoint` are
all absent. Text generation does not need a running database to be proven.

What is absent is *runtime composition* evidence for a SQLite scaffold. The repository has a
`scaffold-runtime-sqlite (aspire + sqlite + garnet)` CI job, but on this draft PR it is currently
**skipping**. The coordinator should consciously choose one before merge: accept unit proof for
#1588 (defensible), or ensure the sqlite runtime job actually executes at ready/CI time. Recording
it so the choice is deliberate rather than assumed.

## Evidence-chain observation (not a defect in this leaf)

`scaffold.runtime` has no durable-receipt route: `.llm/tools/gates/run-gate.ts` accepts only gates
listed in `catalog.ts`, which has no `scaffold.runtime`/CLI-E2E entry, and `packages/cli/e2e/cli.ts`
exposes no `--report` flag. The implementation thread correctly refused to edit the catalog, alter
the fixed command, or fabricate a receipt, and stopped instead — that refusal is recorded as correct
fail-closed behavior. The approved plan's own contract (preserve the suite's JSON/domain report) was
used instead, and the resulting receipt is complete. The repo-level gap deserves its own issue.

## Standing stops after this sign-off

1. A fresh opposite-family **IMPL-EVAL** is mandatory and is not launched by this lane.
2. Ready flip, merge, publication, relabeling, and issue closure remain coordinator-only.
3. The expensive-gate lease is consumed; no further runtime pass is authorized.
4. PR #1654 remains `OPEN`, draft, exactly one `status:impl` label, base `main`, no closing keyword.
