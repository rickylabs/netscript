use harness. You are the Stage-B discovery agent (Codex · GPT-5.6 Sol · medium,
`normal_implementation` lane used for research) of seed run `plan-unified-runtime--seed`
(issue #824), supervised by the Fable 5 beta-11 orchestrator (session
86d308d5-c761-4e5d-a41f-8be959bc46d2).

## SKILL

Read `.llm/harness/workflow/seed-run.md` (stage B contract + evidence-citation gate) and
`.llm/runs/plan-unified-runtime--seed/supervisor.md`. You are in worktree
`/home/codex/repos/wt-g8-seed` on branch `plan/unified-runtime`.

## Task — Stage B: cited discovery corpus for the unified-runtime board

Produce `.llm/runs/plan-unified-runtime--seed/research/` with one file per topic. EVERY finding
must cite its source (file path+line, `deno doc` surface, fetched-doc extract saved under
`.llm/tmp/docs/`, or external URL). An uncited claim is not a finding — the stage-G evaluator
fails the plan on uncited load-bearing claims. Topics:

1. **nitro-v3.md** — Nitro v3 LIVE docs (nitro.build): deno preset maturity/limitations; the
   full adapter surface (database, cache/storage, KV, tasks, WebSocket, lifecycle hooks); cloud
   deploy presets. Fetch the actual docs pages, save extracts to `.llm/tmp/docs/`, cite URLs.
2. **adapter-mapping.md** — map Nitro's adapter surface against SHIPPED `@netscript/*` adapters
   (use `deno doc` on packages: kv, queue, data, service, workers/sagas/triggers/streams plugin
   cores). Table: capability × Nitro surface × NetScript package × fit/gap.
3. **sagas-constraint.md** — the old "Nitro excludes sagas" constraint (#327 D1, 2026-07-03,
   flagged STALE): what exactly does the live Nitro v3 tasks/queue story support, and does the
   constraint still hold? Verdict with citations both ways.
4. **orpc-fresh.md** — oRPC + Fresh 2 integration surface vs Nitro's h3-based routing: what a
   NetScript-on-Nitro composition would have to bridge (cite orpc.dev + Fresh docs + repo code).
5. **market.md** — the external leg (MANDATORY per stage B): how comparable frameworks solve
   unified single/multi-process deployment (Nuxt/Nitro itself, Next standalone, Remix/RR7,
   SvelteKit adapters, Redwood, Wasp): what NetScript's composition contract can steal or must
   beat. Cite URLs.
6. **drift-ledger.md** — every place where live reality contradicts PR #822 RFC §3/§D or issue
   bodies (drift candidates for the supervisor).

Method: read PR #822's rfc.md (`.llm/runs/rfc-single-deployment--orchestrator/`) FIRST for the
frame; prefer `deno doc` over broad source reads; save every fetched extract. Commit the corpus
in topic-sized commits, push via `git push origin HEAD:refs/heads/plan/unified-runtime`, and
comment the corpus summary on draft PR #850. Planning-only: NO framework code changes, NO board
mutations (issues/epics/milestones/labels), NO edits outside `.llm/`.

## Stop-lines (HARD — read twice)

1. Merge requires CI green + opposite-family eval PASS on the PR. Owner granted standing beta-11
   merge authorization (2026-07-17 in-turn) once that bar is met.
2. HARD STOP before any release publish (`release:cut`, JSR publish, tag push, canary or stable)
   — owner sign-off in-turn only; a stale or relayed approval does not count.
3. HARD STOP before closing milestone 13 — owner sign-off only.
4. These stop-lines are repeated verbatim in EVERY sub-agent brief. A sub-brief without the
   stop-lines section is invalid.
5. The #824 seed run is drafts-only until owner ratification; its board filing needs the owner
   in-turn.
