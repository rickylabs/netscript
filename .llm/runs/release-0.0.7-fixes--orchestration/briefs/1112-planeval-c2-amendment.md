# Brief — #1112 bounded plan amendment (PLAN-EVAL cycle-2 F1-b), plan-only

You are the canonical author for run `fix-prisma-mysql-honest-example--0.0.7` (issue #1112, draft PR
#1711), Codex thread `01a047f1-56bf-7060-b9c4-dbc5dc4ad2a8`, worktree
`/home/codex/repos/netscript-007-leaf-prisma-mysql`, branch `fix/prisma-mysql-honest-example`, head
`da769cd7c8e0438f2317ed761ec10bce15692d03`.

PLAN-EVAL cycle 2 returned terminal `FAIL_PLAN`. The owner has **accepted** its blocking finding and
authorized exactly the bounded correction below. There is no cycle 3 and no third evaluator. This is
a **plan-only amendment**: you edit run artifacts, not product code.

## Owner framing — record this explicitly

Prisma 8 is imminent and the Prisma-next RFC will rewrite the database layer. Record this correction
as a **temporary Prisma 7 correctness measure**, not new architecture and not expanded investment.
Say so in the plan (a Prisma-7-scoped note on D3 is the right home). Do not let the amendment grow
into a durable design commitment, a new abstraction, or additional product paths.

## The blocking finding you are correcting (F1-b)

The evaluator's artifact is commit `60cf79ee54ca17dfaa7d62c609290993040539f9` on
`refs/heads/eval/plan-eval-1711-cycle-2`, file
`.llm/runs/fix-prisma-mysql-honest-example--0.0.7/plan-eval-cycle-2.md`; the public comment is
`5454993523`. Read the artifact before editing.

Substance, independently re-derived by the supervisor on deno 2.9.5 from a `git archive` of
`da769cd7c`:

- Literal `await import('./.generated/client.ts')`, generated output **absent**, ordinary root
  wrapper → `filesSelected: 12, failedBatches: 0, occurrences: 0`, exit 0.
- Same literal form with the client **present** under the scratch config, deliberate misuse probe →
  `TS2322 — Type 'PrismaClient<never, GlobalOmitConfig | undefined, DefaultArgs>' is not assignable
  to type 'number'`; i.e. the real generated type, not `any`.

So the literal dynamic import satisfies every gate-1 property the non-literal form was chosen for
**and** keeps static typing of the shipped example. Deno 2.9.5 defers an unresolvable *dynamic*
literal import to runtime; only a *static* import yields `TS2307`. The non-literal URL form bought
nothing and made the shipped example `any`.

This also corrects the supervisor's own earlier Tier-A PASS, which verified that the non-literal form
worked but never asked whether it was necessary. You are not at fault for following it.

## Authorized amendment — exactly this

1. **Literal specifier.** Replace `const generatedClientUrl = new URL('./.generated/client.ts',
   import.meta.url).href` + `await import(generatedClientUrl)` with the literal
   `const { PrismaClient } = await import('./.generated/client.ts');` everywhere the plan pins the
   example's import shape. Record the observed deno-2.9.5 behaviour above as the rationale, replacing
   the false "the non-literal specifier is deliberate" premise.
2. **Gate 5 checks the actual example.** Add a structured check of the real file under the scratch
   config, with the generated client present:
   `run-deno-check.ts --file packages/prisma-adapter-mysql/examples/basic-usage.ts --ext ts
   --deno-arg --config=.llm/tmp/prisma-example-check-deno.json`, expected 1 selected / 0
   diagnostics. Keep the import-only smoke. The scratch compatibility wrapper **may stay** as a D17
   probe if you judge it useful — it is simply no longer the sole type evidence.
3. **Gate 1 wording preserved, plus one addition.** Keep the existing statement that gate 1 leaves
   `PrismaClient`/`prisma` untyped (still true with the client absent). Add that gate 5 now types the
   **example itself**. Do not overclaim gate 1.
4. **Risk register.** The row "Example recreates the connected-adapter mistake" changes from a prose
   mitigation to the gate-5 example check; the evaluator observed `TS2741 Property 'connect' is
   missing in type 'PrismaMySqlConnectedAdapter'` for that exact mistake under the literal form.
5. **Fold the three advisories:**
   - **A1** — import-map wording: state in owned example/README prose that the generated client needs
     `@prisma/client` resolvable via the consumer's import map / `npm:` specifier. Root `deno.json`
     lists it only under `catalog:`, not `imports:`. Wording inside owned paths; no new path.
   - **A2** — generated-window note: one sentence that gate 1 is **undefined** while `.generated`
     exists, so an implementer does not report a red mid-window run as a defect.
   - **A3** — smoke guard: name `import.meta.main` as a gate-5 precondition and require `main()`
     invocation to stay exclusively inside that guard, so a later edit cannot turn the smoke into a
     live MySQL call.

## Boundaries — hard

- **Seven-product-path ceiling unchanged.** No eighth path.
- **No implementation during this amendment.** Plan/run artifacts only. Do not touch
  `packages/`, `plugins/`, `docs/site/`, or any product file.
- **No `deno.lock` modification.** A modified lock is an out-of-envelope side effect; if a probe
  dirties it, restore it before committing.
- No runtime, Aspire, Docker, browser, `e2e:cli`, expensive-gate lease, merge, label, readiness flip,
  or PR state change.
- No exclusion, ambient declaration, `// @ts-ignore`, or ungenerated `@prisma/client` stub — the five
  prohibitions stand.
- Everything else the evaluator reproduced is unaffected and must not move: D17, the wrapper's D17
  evidence, the import-only smoke, the source-only `toMysql2PoolOptions` seam, the non-breaking TLS
  deprecation, `supervisor.md`, and the census wording.

## Artifacts to update

Within `.llm/runs/fix-prisma-mysql-honest-example--0.0.7/`: `plan.md` (D3 at ~line 110, the scope
bullet at ~58-60, the open-decision row at ~130, the coherent-example-contract ¶ at ~145 and
~158-159, the gate-5 protocol at ~172-176 and ~242-244, the gate-1 row at ~253, the risk row at
~278), `research.md` (the non-literal rationale at ~55, ~169, ~182, ~196-200, ~214, ~298),
`context-pack.md` (~29, ~51). Record the amendment and its trigger in `worklog.md` and any genuine
divergence in `drift.md`.

## Finish

Commit and **explicitly push** the branch with a full refspec. Report the exact resulting head SHA.
Then stop — the supervisor runs a fresh focused Tier-A against that head. Do not self-certify, do not
implement, and do not request or launch another evaluator.
