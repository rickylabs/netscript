use harness

# #1293 — PLAN-EVAL (fresh separate session)

You are the formal **PLAN-EVAL** evaluator for the `prisma-mysql-adapter-surface` leaf of the 0.0.7
features lane. You are a fresh session, opposite-family to the Codex author thread
`01a0048f-8d95-7682-a3ce-1c1926aba75c`, dispatched by topic orchestrator `topic-features-0.0.7`
under a grant from coordinator `codex-root-0.0.7`. You did not write this plan and must not defer to
the sessions that did.

This gate exists because the plan is **decision-heavy**, not as a formality. Three real design
decisions are open and the plan deliberately left them open for you.

## SKILL

Read `AGENTS.md`, then the task-relevant parts of:

- `.agents/skills/netscript-harness/SKILL.md` — the PLAN-EVAL protocol;
  `.llm/harness/evaluator/protocol.md` and `.llm/harness/evaluator/verdict-definitions.md`.
- `.agents/skills/netscript-doctrine/SKILL.md` — **Archetype 2 (integration)**, its axioms and
  anti-patterns. The plan cites A1/A2, A5, A10, A11, A13, A14 and AP-3, AP-4/5, AP-10, AP-11, AP-14,
  AP-19, AP-25. Check those citations rather than accepting them.
- `.agents/skills/netscript-deno-toolchain/SKILL.md` and `.agents/skills/jsr-audit/SKILL.md` — the
  publish bar, slow types, isolated declarations, and why raw `deno publish --dry-run` output is
  authoritative over helper summaries.
- `.agents/skills/netscript-tools/SKILL.md` — durable receipts, sufficiency is always recomputed.
- `.agents/skills/netscript-pr/SKILL.md` — close-gate and `acceptance-evidence` semantics.

## Identity to record first

Enable `/remote-control` immediately and record in `plan-eval.md`: session ID, non-empty bridge
session ID, Remote Control URL, PID, exact cwd, requested route, observed route. Read the observed
route from your job's `respawnFlags` (`/home/codex/.claude/jobs/<jobId>/state.json`), **not** from
process argv — a bg session that claims a spare process does not carry `--model`/`--effort` on its
command line. Report requested and observed distinctly and claim a match only if they match.

## Immutable identity — refuse on mismatch

- Worktree: `/home/codex/repos/netscript-007-features-1293`
- Branch: `feat/prisma-mysql-adapter-surface`
- Base: `284dda90a17a13a7e5e8e9834e5411b58887131b` (the live `origin/main` tip at dispatch)
- **Plan head: `23c4d671b57282ddf2e5c3b834ac8e787d1dff09`** — resolve local `HEAD` and the explicit
  remote ref independently and confirm both equal it with a clean tree
- Run dir: `.llm/runs/feat-prisma-mysql-adapter-surface--1293/`
- Subject: `research.md` and `plan.md` in that directory
- Issue: #1293, milestone `0.0.7`

A head mismatch is a hard refusal, not permission to evaluate a nearby commit.

## What is already decided — do not reopen

These are coordinator rulings. Treat them as given. Reopening one is a finding against you, not
thoroughness.

1. **Preserve and wire** `PrismaMySqlOptions.onConnectionError`. It is already published at `0.0.6`
   and already re-exported. **Removal is off the table** — it would be a breaking change to a
   shipped public option, which requires owner breaking-change authority this lane does not hold.
   Your job is the *semantics* of wiring it, never whether to keep it.
2. **Docs-owned #1112 and `docs/site/reference/prisma-adapter-mysql/` stay out of this leaf.** The
   follow-up dependency is recorded, not absorbed. #1293 exists *because* the docs lane previously
   made a framework change it was not entitled to make; the mirror-image error is equally out of
   bounds.
3. **The close contract is split-close, and it is not yours to evaluate.** #1293's acceptance box 4
   is preserved **unchanged**. The product PR carries `Part of #1293` with **no closing keyword** and
   may merge on its own product gates while #1293 stays open. That merge satisfies the #1293 → #1112
   implementation prerequisite; only after #1112 rewrites and verifies the executable example may box
   4 be checked and #1293 closed. This is a **cross-lane close contract decided by the coordinator**.
   Do not weaken it, reinterpret it, propose `Closes #1293`, or fold it into a finding. If you think
   it is wrong, say so in one sentence as an observation and move on — it is outside this gate.

## What you are evaluating — five subjects

The coordinator bound this gate to exactly these. Stay inside them.

### 1. Callback timing and error semantics

This is the heart of the gate. The plan enumerates **eight** failure boundaries (`research.md`
§ "What 'connection error' can mean here") with materially different behaviour: only pooled
query/execute and transaction queries route through `performIO()` → `onError()` → `errors.ts`;
capability probe, `executeScript`, transaction acquisition, isolation/`BEGIN`, `COMMIT`/`ROLLBACK`,
and disposal all reject raw.

Judge the proposed contract (`plan.md` § "Proposed hook contract for evaluator review") on:

- **Predicate.** Is "connection establishment, pool acquisition/capacity, transport loss, or
  checked-out connection error" a predicate an implementer can actually evaluate from the code, or
  does it require a classifier that does not exist? `src/errors.ts` has **no** `isConnectionError`
  predicate today and its `MySqlError` shape omits transport fields such as `fatal`. If a new
  classifier is needed, is its home (`errors.ts`) and shape specified well enough to implement?
- **The authentication/access/capacity ambiguity.** The plan explicitly defers errors that are both
  mapped Prisma errors *and* connection-establishment failures (1040/1203, auth/access, missing
  database). **Rule on it.** Leaving it open is what a plan gate exists to prevent.
- **Two facts you should weigh, which I verified independently.** Upstream
  `@prisma/adapter-mariadb@7.8.0` documents `onConnectionError` narrowly as "Callback attached to
  transaction connection `error` events" and invokes it at exactly one site — but that narrow
  predicate does **not** satisfy #1293's stated motivation ("the example wants to show what happens
  when the pool fails"). Precedent and intent genuinely conflict; that conflict is yours to resolve.
  Separately, our published signature is `(err: Error) => void`, **wider** than upstream's
  `(err: SqlError)`, and cannot be narrowed without a breaking change — so the predicate must be
  carried by documentation and tests, not by the type.
- **Capability-probe fatality.** `adapter.ts:700-718` catches *every* probe failure and returns
  `{ supportsRelationJoins: false }`, so a bad credential is indistinguishable from an old server and
  `connect()` appears to succeed. The plan recommends notify-and-preserve-fallback; the alternative
  is reject. Rule, and say what the chosen behaviour costs.
- **Observational containment.** D2 says callback failure must not mask the primary error. Is that
  specified precisely enough — including whether a throwing callback is swallowed, logged, or
  aggregated?
- **Duplicate notification.** A single acquisition failure has two plausible paths to the hook
  (`adapter.ts:351-406` rejects `connectionReady` *and* a background `.catch()` runs). The plan
  treats this as a test assertion; is a single notification choke point specified as a design
  constraint?
- **`executeScript` (research F-9)** is enumerated but absent from the slice plan. In scope or
  explicitly excluded — which, and is the plan clear?

### 2. Public adapter export

The plan offers Choice **A** (literal value-class export of `PrismaMySqlAdapter`, per the issue's
wording) versus **B** (keep the class internal; the already-published
`PrismaMySqlConnectedAdapter` interface is the public result type), and recommends B.

Judge whether B genuinely satisfies the issue's *need* or merely its convenience. Weigh: the class
extends private `MySqlQueryable<MysqlPoolClient>` and its constructor exposes private client types
(`adapter.ts:32-44`, `95-102`, `319-326`), so a literal export drags private types into the surface
or forces a construction redesign; upstream keeps its equivalent class private and exports only the
factory; and AP-3 warns against publishing a god client port to make a class constructible. Against
that, the issue's box 1 says **class**. If you choose B, say plainly that box 1 as written is not
satisfied and what should happen to it — but note the close contract above already keeps #1293 open,
so this does **not** become a close-gate problem for the product PR.

### 3. Explicit slow-type annotations

The plan annotates `MySqlQueryable.provider` and `.adapterName` and replaces private upstream type
references with package-owned aliases, adding `PrismaMySqlTransactionOptions`.

Verify the **measured baseline** yourself rather than accepting it: run `deno doc --lint` on the
package's `mod.ts` and confirm the count and identity of the pre-existing failures, and run the raw
package `deno publish --dry-run --allow-dirty`. The plan claims six `private-type-ref` errors and a
green dry-run with no real slow-type warning, and claims the JSR helper's lone `F-JSR-7` is a
banner-counting false positive. Confirm or refute each. **A pre-existing failure relabelled as a
success this leaf produced is the failure mode this check exists to catch.**

### 4. Tests

Are the proposed tests capable of failing? The plan promises per-boundary tests that fail if
notification stops, over-fires, duplicates, or masks the primary error. Judge whether the fake-client
approach can actually reach all eight boundaries — particularly pool acquisition and disposal, which
are pool-level rather than query-level — or whether some boundary is untestable as designed and the
plan is promising coverage it cannot deliver.

### 5. Surface and JSR gates

`jsrAudit.applicable` is **true** with named risks. Judge whether the evidence plan discharges them:
intentional export-map delta via `surface:diff`, no private-type leakage, `catalog:` materialization
for the external npm dependencies, the correctly-scoped claim that no `@netscript/*` dependency is
touched (so the exact-pin subcheck is **N/A rather than silently passed**), and absence of runtime
asset / top-level `import.meta` reads.

Also judge D7: exactly four contracted receipts (`check`, `test`, `publish-dry-run`, `arch-check`)
with distinct invocation IDs, supporting checks explicitly **not** promoted into the contracted set.
Is that honest scoping or an evasion that leaves a required gate unproven?

## Verdict

Write `plan-eval.md` in the leaf run dir containing exactly one of `PASS`, `FAIL_PLAN`, or the other
verdicts defined in `.llm/harness/evaluator/verdict-definitions.md`. Ground every finding in
something checkable — file and line, command output, or a named plan section. Do not pad with
praise; a finding a reader cannot verify is not a finding.

For each of the three open decisions, **rule** — do not list options and hand them back. That is the
one thing this gate must produce.

## Authority — narrow

You may change **only evaluator artifacts** (`plan-eval.md`), commit them, and push with
`git push origin HEAD:refs/heads/feat/prisma-mysql-adapter-surface`. You may post one structured
`[PHASE: PLAN-EVAL] [VERDICT: …]` comment **only if a PR exists** — at dispatch time none does; if
so, report the verdict to the orchestrator instead and do not create a PR.

You must **not**: implement any part of the plan, edit `packages/**` or `plugins/**`, edit
`docs/**`, touch `deno.lock`, open or flip a PR, relabel, merge, publish, close or file issues,
mutate central cluster state, take an expensive-gate lease, or run `scaffold.runtime`. Do not resume
or steer the Codex author thread. Do not launch another evaluator.

Report the terminal verdict, your rulings on the three open decisions, your evaluator commit, and
your recorded attachment identity.
