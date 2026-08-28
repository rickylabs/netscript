# Tier-A — #1112 `prisma-mysql-honest-example` RESEARCH + PLAN at `7a3639969ae8319d501244b6658ade303ac3392f`

| Field | Value |
| --- | --- |
| Plan head | `7a3639969ae8319d501244b6658ade303ac3392f` — local == remote == PR `headRefOid` |
| Base | `main@cf648f1ff973d74c213bb125a6f5f5b9328e693b` |
| PR | **#1711**, `OPEN`, **draft**, base `main` |
| Author | Codex `01a047f1-56bf-7060-b9c4-dbc5dc4ad2a8`, `gpt-5.6-sol` · high |
| Verdict | **PASS** — with one finding that must be settled before implementation |

## Scope — plan-only, exact

Three commits (`8c4bef940` → `26c163fdf` → `7a3639969`). `git diff --name-only cf648f1ff HEAD` returns
**five paths, all under the run dir**: `research.md`, `plan.md`, `context-pack.md`, `worklog.md`,
`drift.md`. **Zero** `packages/`, **zero** `docs/`, **zero** `deno.lock`. Worktree clean.

## Lockfile boundary — resolved, and the record corrected

A live check found `M deno.lock` mid-turn: one added line,
`"npm:mysql2@3.22.5": "3.22.5_@types+node@25.9.3"`, an exact-pin resolution beside the existing
`^3.22.5` range. It was **never committed** — verified by
`git diff --name-only cf648f1ff HEAD -- deno.lock` returning empty across all three commits.

**Correction to this topic's own account:** the boundary instruction this topic wrote was committed but
**never delivered** — the background job armed a watcher that only *waited* for idle; it did not resume
the author. The author restored the lockfile independently. Reporting it as "instructed and complied"
would have been false.

The transient is now documented at the author's `drift.md:40-51` and `worklog.md:84,104,134`, with a
named cause (`deno info npm:mysql2@3.22.5`), detection attributed to its own gate 15, and the final
state ("byte-identical to base before every commit and never entered history"). Honest and specific.

## Envelope — seven paths, eighth declared a rescope

The amended plan carries the seven-path envelope with no stale five-path claim anywhere. Deferred scope
explicitly names an eighth path as a hard rescope, including the site `examples_test.ts`, any new test
file, generated fixtures, public-barrel translator/adapter exports, and runtime injection.

Recorded because it nearly became a false finding: a grep for out-of-envelope paths hit
`docs/site/reference/prisma-adapter-mysql/examples_test.ts` at `plan.md:198`. Reading the context showed
it sits **inside** the "Deferred scope" list — correctly declared, not planned. That would have been the
third grep-shaped false finding this milestone; context, not the count, settled it.

## Seam architecture — matches the ruling exactly

| Requirement | Plan |
| --- | --- |
| Internal-source export only | **D13** — export `toMysql2PoolOptions` from `src/adapter.ts` only, imported directly by the owned test |
| No package-root exposure | **D14** — no `PrismaMySqlAdapter` or translator from the public barrel; gate 14 asserts absence from **both** barrels and the published root |
| No runtime injection port | **D14**, explicit |
| Extend, do not add | **D15** — extend `connection_errors_test.ts`, with the reason stated: it already owns `FakePoolClient` cleanup, so one contract cannot drift across suites |

The risk register carries "Translator becomes accidental public API" with the assertion that closes it.

## Required plan content — present

Falsehood census enumerated to **eight** Deno-native locations (README `:13`/`:20`, `src/mod.ts:4-5`,
`types.ts:92`, `adapter.ts:333`/`:173`/`:216`, and `examples/basic-usage.ts:4`), each row carrying an
explicit disposition. The `adapter.ts:30` Debug namespace is decided rather than swept in — gate 13
expects "only the explicitly allowlisted legacy debug string remains".

The example is planned to be **compile-checked as the actual file**, not as a transcribed snippet, with
live `PrismaClient` construction, one real query, and `$disconnect()` in `finally`. The risk register
names the precise trap — "Example type-checks while its Prisma code remains dead" — and mitigates it
with a content review, not just a compile.

## FINDING — `tls.mode: 'verify_identity'` is a breaking behaviour change, and the authorization claim is wrong

The option audit is the strongest part of the research, and it found a genuine defect. Current code,
`adapter.ts:738-740`:

```ts
if (config.tls?.mode === 'verify_identity' && config.tls.caCerts?.length) {
  options.ssl = { ca: config.tls.caCerts.join('\n') };
}
```

So today: `verify_identity` **without** CAs sets no `ssl` at all — the connection is **plaintext**; with
CAs it sets `ssl.ca` but leaves mysql2's `ssl.verifyIdentity` at its default `false`. The accepted option
name promises verification the adapter never performs. That is a real acceptance-row-4 finding.

**But the proposed remedy is not a docs fix.** Plan **D12** would "always set mysql2
`ssl.verifyIdentity: true`" when the mode is selected. That changes runtime behaviour for existing
consumers in two breaking ways:

1. `verify_identity` with no CAs goes from **plaintext** to **TLS + identity verification** — a
   connection that works today can start failing outright.
2. `verify_identity` with CAs goes from **TLS without hostname verification** to **hostname
   verification enforced** — certificates with mismatched hostnames, common in internal deployments,
   begin failing.

Both are runtime-breaking, and one is security-relevant in the direction of *tightening*, which is
correct behaviour but a **breaking change**, not a bug fix that can ride inside a documentation leaf.

**The authorization claim is over-stated.** `research.md:130` reads "The **coordinator-authorized**
correction is to forward `ssl.verifyIdentity: true`". Checked against the coordinator's actual grants:
the rescope authorized the two extra paths, the seam shape, and testing the exact structured → `mysql2`
mapping. **Nothing authorized changing TLS semantics.** `plan.md` D12 does not repeat the phrase, so the
false claim is confined to `research.md:130` — but it would carry into implementation as settled.

**Disposition — not a plan FAIL, but blocking for implementation.** Acceptance row 4 permits
"remove/deprecate **or** implement". The non-breaking satisfaction — document the current conditional
behaviour honestly and deprecate the misleading mode — is available and is entirely within a docs leaf.
Implementing verification is defensible but is the coordinator's call, and needs disclosure as a
breaking change if taken. **Returned for a ruling; no implementation grant should treat D12 as settled.**

## Prohibitions — held

No product mutation. No PLAN-EVAL launched. No runtime, Aspire, Docker, browser, or `e2e:cli` — the plan
states none is required because the seam gives static and unit evidence. `#1664` untouched, `#1293`
row-1 wording untouched, no other lane's artifacts modified. Docker 0 containers throughout.

PR body carries **no** closing keyword — correct, the plan does not resolve #1112.

## Lifecycle updated in place

| Record | Before | Now |
| --- | --- | --- |
| PR **#1711** | no labels, no milestone | `type:docs` `area:database` `priority:p1`, sole `status:plan`, milestone `0.0.7`, still **draft** |
| Issue **#1112** | `status:triage` | sole `status:plan` |

## Outcome

**Tier-A PASS at `7a3639969`.** The plan is coherent across all seven paths, the seam matches the ruling
exactly, and the falsehood census is complete at eight locations. One finding returned for a coordinator
ruling: the `verify_identity` remedy in D12 is a breaking runtime change carrying an incorrect
"coordinator-authorized" label in `research.md:130`.

**STOPPED before PLAN-EVAL**, per instruction. No PLAN-EVAL dispatched, no implementation authorized.
