# Context pack — release-0.0.5--orchestration

**RESUME STATE — written 2026-08-04 ~10:0xZ for a fresh orchestrator session (post-/clear).**
Read this file + the last ~150 lines of `worklog.md` + `drift.md` (D1–D14), then execute
"Immediate actions" below. You are the 0.0.5 milestone orchestrator (Fable 5 · low), owner
grants D7 (full autonomy: merge, canary publish; stable cut only with all gates green) and D12
(quota redemption used; 1 reset left, expires 12 Aug). Standing constraints: every `gh` call
carries `--repo rickylabs/netscript`; verify artifacts never exit codes; refs-check after every
body edit before merge; no keyword-adjacent issue references in prose (entities decode!).

## Scoreboard

- **Merged through the gate (19 PRs):** waves 1–2 complete + #1212 (draft-CI economy), #1214
  (metadata-event churn fix), #1205 (#1187 pr-checks), #1204 (#1132 S6 read tools), #1203
  (#1109 runtime docs), #1209 (#1106… no — #1208-P1 tutorials, `Refs`), #1193 (#1184 sagas
  glue), #1198 (#1190 engine, `Refs`), #1199 (#1130), #1200 (#1106), #1194 (#1131), #1192
  (#1191), #1182 (#1127-29), #1183 (#1134), #1181 (#1171+#1105), #1180 (#1166 `Refs`).
- **Canaries:** canary.1 GREEN PAIR; canary.2 published + reconciled (labels/note/drift PASS,
  sagas pair aboard); canary.3 GREEN PAIR (payload #1212; pinned prod E2E success). **The
  0.0.5 train currently satisfies the stable-cut green-pair precondition.**
- **Milestone:** ~29 open. Evidence-held opens: #1190 (both-backends protocol pending), #1166
  (canary demonstration boxes), #1149/#1090 (observational), #1139 (F2-gated out), epics
  #1126/#1169/#1117, #1208 (P2/P3 via docsorch), #1210, #1201/#1197 (canary.3-train
  measurement), #1196, #1119, #1102, #1093, #1108, #1110, #1112, #1116, #1115, #1085, #1024,
  #1004 (evidence-held), #1148, #1168-measurement… see plan.md dispositions.

## LIVE THREADS at handoff (re-arm everything — session watchers died with /clear)

1. **#1211 (ports/#1202, p1) — OWNER PRIORITY, canary-blocking.** All contexts green EXCEPT
   close-gate (one honest unticked DoD box: "clean local one-pass; cloud CI green"). **A
   scaffold.runtime proof run on its branch (`ns005-ports` worktree) was RUNNING at handoff**
   (~27 min in, containers live, silent past the historic 51/1 failure point — the port fix
   working). ACTION: check `docker ps` + the suite process; if it completed, read its Summary
   from the worktree/`.llm/tmp` logs; if the /clear killed it, RE-RUN
   `cd /home/codex/repos/ns005-ports && deno task e2e:cli run scaffold.runtime --cleanup
   --format pretty` under a Monitor. On pass (52/52 or 70/70): tick the PR body box with the
   recorded result, rerun the close-gate job, merge #1211.
2. **#1206 (S7/#1133) — second owner priority.** 7/9 tasks; last blocker = #1133's evidence
   box (scaffolded app resolves live ports via the aspire-cli adapter through
   `list_api_services`). Its agent (thread `019fcb61-764c-7f71-ac1b-21ba9ede1ee5`, worktree
   `ns005-s7`) was steered: rebase on main post-#1211, run the evidence, tick, push, ready.
   Watch its PR head; gate + merge on ready. Expensive slot: after the #1211 proof run.
3. **CANARY.4 — owner deadline "within the hour" (given ~10:0xZ).** Dispatch
   `gh workflow run release-canary.yml --repo rickylabs/netscript -f target-version=0.0.5`
   once #1211 (+#1206 if in time) merge — or AT the deadline with whatever is aboard (train
   already holds #1204, #1203, #1209, #1214). Then verify: JSR versions, pinned prod E2E,
   `Record green canary pair` step, labels/note/drift (stage-E worklog record + #1149 comment).
4. **Sagas evidence completion:** after #1211 merges (working local scaffolds), the both-
   backends seven-point protocol closes #1190 (hand-close on recording) — either resume sagas
   thread `019fc9c3-2d9f-7da3-89d1-2dcd2f12f222` (worktree `ns005-sagas`) or run it directly.
   Then #1166's boxes (canary payload demonstrations — canary.2/3 notes are evidence) and
   #1149 hand-close on accumulated records.
5. **docsorch** (separate self-managed orchestrator, session `763d39f5`, worktree
   `ns-docs-orch`): owns #1208 P2/P3 + #1210 main-pages revamp. Coordinates via PR comments +
   its brief file. Do not push to its branches; it was told not to push to yours.
6. **devocracy orchestrator** revived as session `dd54a91e` (pinning to canary.3; expects
   canary.4 note).
7. **Fleet watchers to re-arm:** (a) 5-min milestone PR-state poll (ready flips, head moves,
   30-min draft-head staleness); (b) rollout-age vs PR-head divergence check for live threads
   (s7: `019fcb61-764c`; sagas: `019fc9c3-2d9f`; ports agent thread `019fcbaf-c9a2` is idle —
   its PR is complete except the box). Monitor tool, persistent, filtered output.

## Remaining wave plan (compressed)

Wave 4 (dispatch when lanes free): #1201 export-surface corpus (brief exists:
`slices/export-surface-mcp/`), #1135 S9, #1136 S10, #1104 cron. Then wave 5: #1102, #1093,
#1108; wave 6+: #1110, #1112, #1116, #1115, #1119, #1085, #1004+#1148 evidence, #1024, #1196.
The #1197+#1201 instrumented measurement runs against the canary.3+ train. Cut: cut-time
checklist (milestone-run.md stage F) → `release:cut`/`release:publish` per netscript-release —
stable publish only with every gate green (D7).

## Key mechanics learned (do not relearn)

- Required contexts: quality, check-test, deps-report (+close-gate convention). Latest-per-name
  via `commits/<sha>/check-runs?filter=latest`, jobs truth via `runs/<id>/jobs?filter=latest`.
- Stale/blocked merges: full rerun of the run (never `--failed` alone — it cancels siblings);
  if still blocked, fresh SHA (empty commit or rebase). #1214 killed the metadata-churn source.
- Close-gate reds are usually unticked ISSUE boxes → verify evidence independently, tick with
  citation comment, rerun the job.
- agy/launcher/CLI statuses lie; artifacts only. Launch briefs need `use harness` + `## SKILL`.
- `release:canary-label -- --published-version X --head origin/main` (needs GH_TOKEN env) for
  canary reconciliation.

Findings log: worklog "Findings for #1163" 1–26+; drift D1–D14.
