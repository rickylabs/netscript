use harness

## SKILL

- `netscript-harness` — conduct a separate formal IMPL-EVAL and write the tracked verdict.
- `netscript-doctrine` — assess the Archetype-6 research conclusion and dependency trade-off.
- `netscript-deno-toolchain` — assess Deno/package/version evidence without registry guesswork.
- internal `aspire` — assess the Aspire CLI experiments and AppHost claims.
- `netscript-tools` — interpret scoped validation and lock-hygiene evidence.
- `netscript-pr` — assess the research PR's references, scope, and metadata.
- `rtk` — use compact read-only repository inspection.

# IMPL-EVAL — Aspire Deno runtime / NuGet research

Act as the independent formal evaluator for draft PR #1307 on branch
`research/aspire-deno-runtime-path`. The implementation/research session authored the artifact; do
not accept its conclusions from prose alone.

Read the run artifacts under `.llm/runs/research-aspire-deno-runtime-path--1227-adjacent/`, inspect
the complete PR diff from baseline `00f96af76e5825422e8bc716a9c27d4c13e16f7f` through commit
`2951d612165125e6013168b158c9d80fdb4b1d9f`, and independently verify the load-bearing upstream
state. Focus on:

1. whether the executed 13.4.6 Toolkit fixture proves external `[AspireExport]` and runtime
   viability rather than merely code generation;
2. whether the 75/76/83/84 NuGet counts use a coherent definition and support the conclusion that
   Toolkit and first-party Deno grow rather than shrink the restore surface;
3. whether #18628 actually puts Deno in first-party `Aspire.Hosting.JavaScript`, and whether #18627
   changes only the AppHost guest toolchain rather than the managed integration probe;
4. whether the current #18628 blockers and proposed upstream contribution are faithful to the live
   unresolved threads/review state;
5. whether the milestone timeline is appropriately qualified and the exact watch signal is
   actionable;
6. whether the zero-NuGet/loss analysis, #1227 verdict, and 0.0.6 recommendation follow from the
   evidence without overclaiming; and
7. whether the diff remains research-only, preserves the inherited `deno.lock`, and the PR uses
   `Refs #1227` without a closing keyword.

You may run bounded read-only checks and repeat focused scratch experiments if necessary. Do not
edit product/scaffold source, mutate or restore `deno.lock`, commit, push, update the PR, or start
the full CLI E2E suite.

Write the verdict of record to
`.llm/runs/research-aspire-deno-runtime-path--1227-adjacent/evaluate.md` with:

- `**[PHASE: IMPL-EVAL] [VERDICT: PASS|FAIL_FIX|FAIL_RESCOPE]**`;
- evaluator route/model, session id, and inspected commit;
- blocking findings first, with citations/file evidence;
- assessment of each load-bearing claim and residual risk; and
- a concise PR recommendation.

PASS only if no correction to `research.md` is required. End your final response with exactly `DONE`
after writing the artifact, or `BLOCKED: <reason>` if the evaluation cannot proceed.
