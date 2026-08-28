# Supervisor Identity — fix-prisma-mysql-honest-example--0.0.7

This file is the harness control-plane identity record. Its bounded addition was authorized after
the original five-artifact leaf allowlist omitted the harness-mandatory `supervisor.md`. It is not a
product path and does not widen the seven-path product envelope.

## Topic ownership

| Field            | Value                                     |
| ---------------- | ----------------------------------------- |
| Release topic    | NetScript 0.0.7 **fixes**                 |
| Topic supervisor | Native Claude **Opus 5**, effort **high** |
| Remote control   | Attached                                  |
| Topic session    | `ea346a9a-21b5-4d4b-ba74-0071f7179998`    |
| Topic worktree   | `/home/codex/repos/netscript-007-fixes`   |
| Topic branch     | `orchestrator/release-0.0.7-fixes`        |

This leaf remains fixes-owned. Its originating read-only finding came from the features lane, but no
ownership or scope transfers to the docs or features topics.

## Leaf identity

| Field          | Value                                                                |
| -------------- | -------------------------------------------------------------------- |
| Issue          | `#1112`                                                              |
| Draft PR       | `#1711`                                                              |
| Run ID         | `fix-prisma-mysql-honest-example--0.0.7`                             |
| Branch         | `fix/prisma-mysql-honest-example`                                    |
| Worktree       | `/home/codex/repos/netscript-007-leaf-prisma-mysql`                  |
| Host           | Not supplied in the coordinator ruling; no host identity is inferred |
| Immutable base | `main@cf648f1ff973d74c213bb125a6f5f5b9328e693b`                      |

## Author identity and route

| Field                     | Value                                          |
| ------------------------- | ---------------------------------------------- |
| Thread                    | `01a047f1-56bf-7060-b9c4-dbc5dc4ad2a8`         |
| Provider                  | `openai`                                       |
| Model                     | `gpt-5.6-sol`                                  |
| Effort                    | **high**                                       |
| Launch route              | `agentic:launch-codex-slice`                   |
| Worktree sender invariant | One sender for this worktree; never duplicated |

## Seven approved product paths

1. `docs/site/reference/prisma-adapter-mysql/index.md`
2. `packages/prisma-adapter-mysql/README.md`
3. `packages/prisma-adapter-mysql/src/adapter.ts`
4. `packages/prisma-adapter-mysql/src/mod.ts`
5. `packages/prisma-adapter-mysql/src/types.ts`
6. `packages/prisma-adapter-mysql/examples/basic-usage.ts`
7. `packages/prisma-adapter-mysql/tests/connection_errors_test.ts`

An eighth product path is a rescope and requires a coordinator ruling. This `supervisor.md` is a
control-plane artifact, not an eighth product path.

## State and stop line

- Phase: **RESEARCH + PLAN only**.
- No product mutation has occurred or is authorized.
- Stop line: **after PLAN-EVAL cycle-1 repair and before any cycle 2 dispatch**. Cycle 2 requires a
  separate coordinator grant; no implementation may begin from this run state.
- No runtime, Aspire, Docker, browser, `e2e:cli`, or expensive-gate lease is authorized.

## TLS ruling

Take the non-breaking path. Deprecate `tls.mode: 'verify_identity'` in the existing public type and
docs; do not implement the behavior its name implies. Do not set `ssl.verifyIdentity`, change
runtime TLS semantics, or add a new mode.

Characterization tests must pin the legacy behavior exactly:

- Without non-empty `caCerts`, `ssl` is left unset: the connection is plaintext and no TLS is
  requested.
- With non-empty `caCerts`, only joined `ssl.ca` is forwarded; mysql2 hostname identity verification
  is not enabled.

Any behavior change or removal is deferred to a separately scoped breaking change.

## Test seam boundary

`toMysql2PoolOptions` may be exported from `src/adapter.ts` for direct source tests only. It must
not be re-exported from `src/mod.ts` or the package-root export map, and no runtime injection port
may be added. Extend the existing `connection_errors_test.ts`; never duplicate its cleanup/mapping
contract in another test file.

## Tier-A gate history

| Head                                       | Verdict                                                                                                                                                                                                                                 |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `7a3639969ae8319d501244b6658ade303ac3392f` | Tier-A **PASS**, with one finding returned: plan D12 proposed setting mysql2 `ssl.verifyIdentity: true`, a breaking runtime change, and `research.md:130` called that proposal “coordinator-authorized” although no such grant existed. |
| `34a6e3d9897dd7d9880686c3c2734b24a5591af6` | Tier-A **PASS** on the repaired plan: the false authorization claim was removed and all 13 flagged locations were amended to deprecation and characterization.                                                                          |

The first pass was not clean. Its finding and the repaired second pass are both part of the durable
record. These Tier-A reviews did not replace formal PLAN-EVAL.

## Formal PLAN-EVAL history

| Head                                       | Verdict                                                                                                                                                                                                                                                    |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `069fd3e9175d28aaaf1b8c836e35d1f9bbbaa42a` | Cycle 1 **CHANGES_REQUESTED / `FAIL_PLAN`**. Blocking F1 proved the generated-client import was unresolved and exposed a real `number[]` versus Prisma `ColumnType[]` adapter mismatch; advisories required census-gate, PR-comment, and JSR-path repairs. |

Owner policy selects formal PLAN-EVAL only for genuinely critical, complex, or decision-heavy
topics; routine/mechanical leaves record `PLAN-EVAL: N/A` plus Tier-A. #1112 remains selected for
one final cycle because it coordinates published integration docs, an executable real
generated-client import, adapter lifecycle and type compatibility, public option truth, and TLS
compatibility. The generator has repaired cycle 1 but must not launch cycle 2 without the
coordinator's grant.

## Lock hygiene history

An exact-pin mysql2 probe transiently added one `deno.lock` resolution entry. As recorded in
`drift.md`, it was reverted byte-identical to the immutable base before any commit and never entered
branch history.
