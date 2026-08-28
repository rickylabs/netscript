# Allowlist amendment — add exactly one harness artifact: `supervisor.md`

You were right, and the omission was the topic's, not yours. Your brief's artifact allowlist listed five
files; the harness requires `supervisor.md` in every run dir. You recorded it in `drift.md:64-68` and
`context-pack.md:126-127` rather than creating it outside your allowlist or ignoring it. That was the
correct call, and the coordinator has ruled **no waiver**.

**The allowlist is amended by exactly one path:**

```text
.llm/runs/fix-prisma-mysql-honest-example--0.0.7/supervisor.md
```

This is a **control-plane correction**, not an eighth product path and not a product rescope. The seven
approved product paths are untouched and remain untouched — this turn is still **plan-only, no product
mutation**.

## What `supervisor.md` must truthfully pin

Write it from these facts. Do not invent, and do not soften anything below.

**Topic ownership** — NetScript 0.0.7 **fixes** topic supervisor; native Claude **Opus 5**, effort
**high**, Remote Control attached, session `ea346a9a-21b5-4d4b-ba74-0071f7179998`, worktree
`/home/codex/repos/netscript-007-fixes`, branch `orchestrator/release-0.0.7-fixes`. The leaf remains
**fixes-owned** even though the originating read-only finding came from the features lane; no part
transfers to docs or features.

**Leaf identity** — issue **#1112**, draft PR **#1711**, branch `fix/prisma-mysql-honest-example`,
worktree `/home/codex/repos/netscript-007-leaf-prisma-mysql`, immutable base
`main@cf648f1ff973d74c213bb125a6f5f5b9328e693b`.

**Author identity and route** — Codex thread `01a047f1-56bf-7060-b9c4-dbc5dc4ad2a8`, provider `openai`,
model `gpt-5.6-sol`, effort **high**, launched via `agentic:launch-codex-slice`, one sender for this
worktree, never duplicated.

**Seven approved product paths** — list them exactly; state that an eighth is a rescope requiring a
coordinator ruling.

**State** — RESEARCH + PLAN only. No product mutation has occurred or is authorized. Stop line is
**before PLAN-EVAL**; no implementation, no runtime/Aspire/Docker/browser/`e2e:cli`, no expensive-gate
lease.

**TLS ruling** — the non-breaking path: `tls.mode: 'verify_identity'` is **deprecated in the existing
public type and docs**, not implemented. `ssl.verifyIdentity` is **not** set, runtime TLS semantics are
**not** changed, no new mode is added. Legacy behaviour is pinned by characterization tests: without
non-empty `caCerts`, `ssl` is left unset (plaintext, no TLS requested); with them, only joined `ssl.ca`
is forwarded and mysql2 hostname identity verification is not enabled. Any behaviour change or removal
is deferred to a separately scoped breaking change.

**Seam** — source-only translator: `toMysql2PoolOptions` exported from `src/adapter.ts` for direct
source tests only. Not re-exported from `src/mod.ts`, not from the package root export map, and no
runtime injection port. `connection_errors_test.ts` is extended, never duplicated.

**Gate history — record both Tier-A passes honestly, including the finding:**

| Head | Verdict |
| --- | --- |
| `7a3639969ae8319d501244b6658ade303ac3392f` | Tier-A **PASS**, with one finding returned: plan `D12` then proposed setting mysql2 `ssl.verifyIdentity: true`, a breaking runtime change, and `research.md:130` claimed it was "coordinator-authorized" when no such grant existed |
| `34a6e3d9897dd7d9880686c3c2734b24a5591af6` | Tier-A **PASS** on the repaired plan — false authorization claim removed, all 13 flagged locations amended to deprecation/characterization |

Do not present the first pass as clean. The finding and its repair are the useful part of the record.

Also note the earlier transient `deno.lock` probe already recorded in `drift.md` — reverted
byte-identical, never committed.

## Resolve the recorded omission

Update `drift.md` (and `context-pack.md` where it says "not overridden") so the entry now reads as
**resolved by a bounded allowlist amendment**, with the ruling noted. Do **not** delete the original
drift entry — the omission happened and the record should show it happening and being closed. Touch
other run artifacts **only** where needed for that resolution; do not rewrite settled product scope.

## Finish

Commit and push by explicit refspec. Confirm `local == remote == PR #1711 head` and a clean worktree.
Keep the PR draft and its body unchanged apart from anything strictly required by this correction. No
product mutation, no `deno.lock`, no runtime, no other lane. Report your exact head sha and stop.
