# Tier-A plan review — #1293 `prisma-mysql-adapter-surface`

Reviewer: `topic-features-0.0.7`, native Claude Opus 5 · high · Remote Control, session
`19621a0b-c6a0-47c6-b826-93c1634a6875`. Opposite-family to the Codex author thread
`01a0048f-8d95-7682-a3ce-1c1926aba75c`.

Subject: `research.md` (131 lines) and `plan.md` (259 lines) in
`.llm/runs/feat-prisma-mysql-adapter-surface--1293/`, produced from base `284dda90a`.

Verdict: **ACCEPTED — decision-heavy; PLAN-EVAL warranted.**

## Claims I re-derived rather than accepted

The plan rests on measured baselines. A baseline that is wrong poisons every later "we fixed it"
claim, so I re-ran the load-bearing ones myself.

| Research claim | My check | Result |
| --- | --- | --- |
| F-16: `deno doc --lint` fails today with exactly six `private-type-ref` errors | ran `deno doc --lint packages/prisma-adapter-mysql/mod.ts` | **confirmed** — "Found 6 documentation lint errors", including `PrismaMySqlConnectedAdapter["queryRaw"] → SqlResultSet` at `adapter.ts:522` and `["startTransaction"] → IsolationLevel` at `:530` |
| F-7: the capability probe swallows every failure, so `connect()` can appear to succeed | read `adapter.ts:700-718` | **confirmed** — `getCapabilities` wraps the probe query in `try`/`catch` and returns `{ supportsRelationJoins: false }` on any error. A bad credential or unreachable host is indistinguishable from an old server |
| F-15: raw publish dry-run is green with no real slow-type warning | ran `deno publish --dry-run --allow-dirty` in the package | **confirmed** — `Success Dry run complete`, 8 files |
| F-18: `examples/**` is outside the publish set | read the dry-run file list | **confirmed** — no `examples/` path among the 8 files |
| F-6: upstream keeps its connected adapter class private and scopes the hook narrowly | read `@prisma/adapter-mariadb@7.8.0` from the Deno npm cache | **confirmed, and sharper than stated** — `index.d.mts:37` exports exactly one class, the `PrismaMariaDb` **factory**; `:61-62` documents `onConnectionError?: (err: mariadb.SqlError) => void` as "Callback attached to transaction connection `error` events"; `index.mjs:386` invokes it at exactly one site |

Two observations the research did not draw out, which I am adding to the record:

- Our published signature is `(err: Error) => void` — **wider** than upstream's `(err: SqlError)`.
  Whatever predicate is chosen, the type cannot be narrowed now without a breaking change, so the
  predicate has to be carried by documentation and tests rather than by the type.
- Upstream's narrow "transaction connection `error` events" predicate does **not** satisfy #1293's
  stated motivation ("the example wants to show what happens when the pool fails"). The precedent
  and the issue's intent genuinely pull apart. That is a decision, not a lookup — and it is the
  strongest single argument that this plan needs a formal gate.

## Tree and process hygiene

- Leaf tree is clean apart from the untracked run directory. The `deno.lock` modification I observed
  mid-turn is **gone** — the watch item I raised resolved itself, and the plan's risk register
  already carries "Validation churns `deno.lock` → inspect raw Git status after every command".
- Base is `284dda90a`, the live `origin/main` tip, matching dispatch.
- The author stopped where it was told to stop and explicitly declined to decide its own gate
  determination or launch an evaluator. That is the behaviour the brief asked for.

## Assessment of the plan itself

**Strengths worth recording.** It refused to inherit the issue's stale premise, and instead of
treating "wire the hook" as one mechanical change it enumerated eight distinct failure boundaries and
showed that only some route through `errors.ts` — which is what makes a blanket `onError()` override
wrong rather than merely inelegant. It measured the doc-lint and publish baselines *before* editing,
so a later green result cannot be mistaken for work it did not do. It caught that the JSR helper's
lone `F-JSR-7` warning is a banner-counting false positive and deferred to the raw dry-run, per the
`jsr-audit` skill. And it declined to substitute the already-shipped interface for the issue's
literal class-export wording on its own authority.

**Gaps I raise, none blocking.**

1. **Duplicate-notification risk is listed but not designed against.** The risk register names "same
   transaction failure notifies twice through lifecycle and operation catches" and proposes
   "centralize notification and assert exact call count". Given `adapter.ts:351-406` rejects
   `connectionReady` *and* a background `.catch()` logs, a single acquisition failure has two
   plausible paths to the hook. The plan should name the single notification choke point as a design
   constraint, not only as a test assertion.
2. **`executeScript` (F-9) is enumerated but absent from the slice plan.** It bypasses `performIO()`
   and rejects raw. Either it is in the predicate's scope or it is explicitly excluded; leaving it
   implicit invites an inconsistency finding later.
3. **Acceptance box 4 is marked "must resolve now / owner"** but is not resolvable by the evaluator
   either — it is close-gate and issue-scope authority. Escalated (below) rather than left to the
   gate.

## Escalated item — RESOLVED by coordinator ruling

The coordinator has since ruled: **split-close.** #1293 acceptance box 4 is preserved **unchanged**.
The product PR carries `Part of #1293` with **no closing keyword**, and may merge on its own product
gates and evaluation while #1293 stays open. That merge satisfies the #1293 → #1112 implementation
prerequisite, after which the fixes/docs-example leaf runs in its own orchestrator; only when #1112
rewrites and verifies the executable example may box 4 be checked and #1293 closed.

This is a **cross-lane close contract, not a plan question**. The PLAN-EVAL is explicitly barred from
weakening, reinterpreting, or deciding it. The analysis below is retained as the record of why the
question arose and what the alternatives were.

## The one thing neither I nor the PLAN-EVAL can decide (resolved above)

#1293's acceptance box 4 reads "#1112's example rewritten against the shipped surface and verified
executable". The coordinator ruled that docs-owned #1112 and the site reference stay **out** of this
leaf with the follow-up dependency recorded. Both cannot be true at once for a PR carrying
`Closes #1293`: `netscript-pr`'s close-gate requires the `acceptance-evidence` block to mirror the
checkboxes, and this leaf cannot truthfully tick that box.

Two clean resolutions exist, and choosing between them is issue-scope authority:

- **Amend #1293's box 4** to the package-owned half ("the package example consumes the shipped
  surface and type-checks"), leaving the site rewrite to #1112. `Closes #1293` then stands.
- **Split the close**: this PR references #1293 without a closing keyword and states the remaining
  scope, and #1293 closes when #1112 lands.

The coordinator chose the **second** option. The leaf's safe default was therefore correct and now
becomes the binding instruction rather than a placeholder.

## Determination

**PLAN-EVAL required.** This is not a close call. Three genuine design decisions remain open — the
value-class export versus the already-shipped connected interface, the hook predicate across eight
boundaries with divergent error handling, and whether capability-probe failure stays non-fatal — and
each changes the public surface, the test set, or `connect()` semantics. `lane-policy.md:61-64`
reserves `PLAN-EVAL: N/A` for small or mechanical work with a complete contract; this is neither.

Gate scope, per the coordinator's grant: callback timing and error semantics, the public adapter
export, explicit slow-type annotations, tests, and the surface/JSR gates. The evaluator is bound to
those and to the three open decisions — not to a free roam over the plan.

## Precondition before dispatch

The plan must be **committed and pushed** with local == remote and a clean tree. At review time it
was uncommitted and unpushed; the author has been instructed to commit, record the coordinator
disposition, and push. The gate does not launch until that head exists.
