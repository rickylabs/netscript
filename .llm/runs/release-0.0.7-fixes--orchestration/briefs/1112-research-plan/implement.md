use harness

# Fixes leaf — `prisma-mysql-honest-example` (#1112) — **RESEARCH + PLAN ONLY**

You are the sole author for this leaf, launched by topic orchestrator `topic-fixes-0.0.7`. One branch →
one worktree → one active agent. You are the generator; you do not self-review or self-certify.

**This turn produces no product change.** Research and a plan, nothing else. Implementation is a
separate later grant.

## SKILL

`netscript-harness` (9-phase loop, run artifacts, drift), `netscript-doctrine` (**Archetype 2 —
integration**; public surface, anti-patterns), `netscript-tools` (structured wrappers are the only
verdict source), `netscript-deno-toolchain` (`deno doc` before broad reads), `jsr-audit`,
`netscript-pr`, `rtk`.

## Identity

- Issue **#1112** — `docs(database): make the MySQL Prisma adapter example honest and executable`.
  `OPEN`, `type:docs`, `status:triage`, `priority:p1`, `area:database`, milestone `0.0.7`.
  **Read the live issue body first — it is the acceptance authority.**
- Worktree: `/home/codex/repos/netscript-007-leaf-prisma-mysql`
- Branch: `fix/prisma-mysql-honest-example`, **no upstream by design**. Push by explicit refspec only:
  `git push origin HEAD:refs/heads/fix/prisma-mysql-honest-example`
- Immutable base: `cf648f1ff973d74c213bb125a6f5f5b9328e693b` (exact `main`)
- Run dir to create: `.llm/runs/fix-prisma-mysql-honest-example--0.0.7/`

## Frozen product envelope — exactly five paths

Your **plan** may propose changes only within these five:

1. `docs/site/reference/prisma-adapter-mysql/index.md`
2. `packages/prisma-adapter-mysql/README.md`
3. `packages/prisma-adapter-mysql/src/adapter.ts`
4. `packages/prisma-adapter-mysql/src/mod.ts`
5. `packages/prisma-adapter-mysql/src/types.ts`

A sixth product path is a **rescope**: stop and report it, do not plan around it. Tests are a known
open question — see Task 4.

**This turn you write none of them.** You may create only: harness `research.md`, `plan.md`,
`context-pack.md`, `worklog.md`, `drift.md` under your run dir, and a **draft PR** if normal harness
planning requires one.

## Verified anchors — established by the topic at this exact base

These were checked at `cf648f1ff`, not copied from the upstream audit. Verify anything you intend to
rely on, but you should not need to rediscover these.

**Falsehood 1 — the site claims a shipped feature is unsupported.**
`docs/site/reference/prisma-adapter-mysql/index.md:23` reads: *"Connection error hooks (such as
`onConnectionError`) are not supported by the shipped adapter and are blocked on #1293."*
That is **false**: `src/types.ts:44` publishes `onConnectionError?: (err: Error) => void`, and
`:36-43` documents a substantial contract for it (which driver errors it observes, error codes
1040/1203 and 1045/1044/1049, containment of callback failure). #1662 shipped it.

**Falsehood 2 — the Deno-native driver claim is systemic, not one line.** The upstream audit described
this as living in "the package's own module docs". It is broader:

| Location | Text |
| --- | --- |
| `src/mod.ts:4-5` | module JSDoc: "uses Deno's native mysql driver instead of the npm mariadb package" — **this is published via `deno doc`** |
| `README.md:13` | "one `PrismaMySql` factory wraps the Deno-native MySQL client" |
| `README.md:20` | "**Deno-native driver** — wraps the Deno MySQL client instead of the npm `mariadb` package" |
| `src/types.ts:92` | "deno_mysql Client interface" |
| `src/adapter.ts:333` | "This adapter wraps the deno_mysql client" |
| `src/adapter.ts:173`, `:216` | internal comments referring to `deno_mysql` |
| `src/adapter.ts:30` | `Debug('prisma:driver-adapter:deno-mysql')` — **a runtime string, not prose** |

**Reality:** `src/adapter.ts:23` type-imports `Pool`, `PoolConnection`, `PoolOptions` from
`mysql2/promise`, and `:634` does `await import('mysql2/promise')`.

**The published example may not compile.** `src/mod.ts` `@example` constructs
`new PrismaMySql({ hostname, port, username, password, db, poolSize })`. Whether every one of those
option names exists on the real config type, and whether `PrismaMySql` is a class or a factory, is
**yours to verify** — it is the core of acceptance row 2.

## Task 1 — RESEARCH: enumerate every false or stale line with an explicit disposition

This lane has been burned twice by fixing one sentence and leaving the surrounding story false. Produce
a table covering **every** occurrence across the five paths, each with a disposition (correct / delete /
leave). Do not stop at the seven rows above — derive the set yourself and say how you derived it.

Two judgement calls to make explicitly rather than sweep in:

- **`adapter.ts:30`'s Debug namespace is observable behaviour, not prose.** Changing
  `prisma:driver-adapter:deno-mysql` alters what `DEBUG=` filters match for existing users. Decide and
  justify: correct it, or leave it and note why. Do not change it silently as part of a prose sweep.
- **Internal comments (`adapter.ts:173`, `:216`) are not published surface.** Say whether they are in
  scope for an "honest docs" leaf or deliberately out.

## Task 2 — RESEARCH: audit the advertised option surface

Acceptance row 4 requires that *every advertised option has observable behaviour*, and that anything
accepted-but-unused is removed, deprecated, or implemented. Enumerate the options on the public config
and options types, and for each: is it read by `adapter.ts`, and does it reach `mysql2`? Name the line.
An option that is accepted and dropped is a finding — report it, and note that *implementing* one may
exceed a docs leaf's envelope.

## Task 3 — PLAN: one coherent leaf

Site example plus package/module prose, planned together so the two cannot drift apart again. The plan
must state a **hard path ceiling** and declare a sixth path a rescope. Cover:

- the corrected `onConnectionError` contract on the site page, written from `types.ts:36-43`
- the honest driver story: `mysql2/promise`, dynamically imported, and what that implies for
  Node/npm compatibility and deployment
- a complete, **import-correct, compilable** example: configuration → Prisma client → one query →
  deterministic cleanup
- connection-string/options forms, pooling ownership, timeout behaviour, runtime constraints

## Task 4 — PLAN: the gate set, and be honest about tests

Plan for: snippet/doctest validation, `docs-source-format` and `docs:accuracy`, package `check` and
`test`, **full export-map `deno doc --lint`**, `publish --dry-run`, and a JSR audit.

Acceptance row 5 asks for focused adapter tests "without requiring a live MySQL instance where a seam
can be injected". **Determine whether such a seam exists** in `adapter.ts` today. If it does, name it.
If it does not, say so plainly and record that adding one would be a product change beyond the five-path
envelope — a rescope for the coordinator, not something to assume into the plan.

Record which gates are **new** for this leaf versus already green at base, and measure the base state of
anything you intend to claim as a fix.

## Prohibitions

- **No product mutation this turn.** Not one line in the five paths.
- No runtime, Aspire, Docker, browser, or `e2e:cli`. No expensive-gate lease.
- Do not launch PLAN-EVAL — the topic dispatches evaluators.
- Do not alter **#1664**. Do not touch **#1293**'s owner-only row-1 wording.
- Do not edit `.llm/runs/release-0.0.7-features--orchestration/` or any other lane's artifacts. The
  upstream audit is **input**, not yours to amend.
- No label, checkbox, readiness, or merge action beyond a draft PR's own creation.

## Finish

Commit your harness artifacts, push by explicit refspec, open or update the draft PR if planning
requires one, and **stop**. Report your exact head sha, the draft PR number if you opened one, your
enumerated falsehood table, the option-surface findings, and any rescope you found. Fresh independent
Tier-A follows; PLAN-EVAL does not run this turn.
