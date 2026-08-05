# Context pack — release-0.0.5--orchestration

**RESUME STATE — rewritten 2026-08-05 ~00:15 local.** Read this + the last ~200 lines of
`worklog.md` + `drift.md` (D1–D17), then execute "Immediate actions". You are the 0.0.5
milestone orchestrator (Fable 5 · low). Owner grants: **D7** full autonomy (merge, canary
publish; stable cut only with all gates green), **D16** canary cadence delegated to you.
Standing constraints: every `gh` call carries `--repo rickylabs/netscript`; verify artifacts,
never exit codes or status panels; refs-check after every body edit before merge.

## THE CURRENT GOAL: canary.10+ must pass the wave-6 pilot bar

Owner set canary.10 as the wave-6 pilot release. **The bar**: on a clean machine, a person or
agent follows the Quickstart end to end and reaches a verified working state **unattended**.
That bar is now enforced by a gate, not by hand: `quickstart.walk` (#1294, merged) runs seven
independent verdicts against the **published** CLI inside `e2e-cli-prod.yml`.

**Latest measured result** (2 runs @ published `0.0.5-canary.10`):

| # | Step | Status |
| --- | --- | --- |
| 1 | install published CLI | PASS ×2 |
| 2 | `netscript init` | PASS ×2 |
| 3 | add a service afterwards (#1290) | **PASS ×2** |
| 4 | `aspire restore` + `start` (#1227) | **PASS then FAIL — INTERMITTENT, the only red** |
| 5 | `db init`/`generate`/`seed` | PASS |
| 6 | documented project check | PASS (after #1304 fixed the gate's own invocation) |
| 7 | example service answers | PASS |

Runs: 30959430176 (step 4 PASS 22.3s), 30961102523 (step 4 FAIL 180.1s).


## PAUSED 2026-08-05 11:05 CEST — owner called a usage pause. Resume on their word.

**Nothing is mid-flight that breaks.** All watchers stopped (PR watcher, JSR ticket poll, gate
waiters) so nothing wakes this session. Codex lanes keep working independently.

**On resume, in order:**
1. Gate the four train PRs — **#1315** (#1295 Zod), **#1316** (#1189 plugin seam),
   **#1317** (#1117 MCP OpenAPI), **#1318** (#1115 agent follow) — all based on
   `canary/0.0.5-canary.13`. **Remember: `closingIssuesReferences` is `[]` on train PRs; read
   the body for `Closes #N`.** These are the FIRST train merges — confirm the close-gate really
   resolves acceptance from the body keyword before trusting it.
2. **#1316 carries an honestly-unticked box 5** (live catalog→fixture request + OTEL) — the
   slice refused to start a third AppHost while foreign ones ran. Needs a free slot or
   `--isolated`; do not tick it without the runtime evidence.
3. Re-arm the JSR ticket poll (token at `~/.config/jsr-ticket-token`, curl config at
   `~/.config/jsr-curl.cfg`) — **and remind the owner to revoke that token**, it was pasted in
   chat.
4. Two owner decisions outstanding: **#1295** rescope (TanStack cluster upgrade vs kvdex vs a
   documented two-instance boundary — I advise against the canary-AG-UI trade), and **#1149**
   (accept 0.0.5 evidence against 0.0.4-worded criteria, or rewrite the criteria).

**LIVE ISSUE the owner must decide on, not me:** two Postgres containers share one PGDATA at
`/home/codex/repos/w6-planning-board/w6-board/.data/postgres` (`postgres-750e2409`,
`postgres-45ba5b03`), with an orphaned `db-operation` AppHost up 6h — **#1310 in the wild** on
the wave-6 board. The owner authorised killing stale parallel-agent processes; I was stopping
ONLY the orphan (`aspire stop --apphost .../aspire/db-operation/apphost.mts`) and left the
resident host alone, when the pause landed. Not done. That project predates #1311 so it does
not carry the fix.

## Immediate actions

1. **#1227 ROOT-CAUSED — it is upstream, not ours.** `microsoft/aspire#18958` ("Stop leaking
   orphaned aspire-managed NuGet search helpers"), merged 2026-08-03, milestone 13.5. Our pinned
   CLI **13.4.6 (2026-06-20) predates it by 44 days**. Leaked NuGet helper processes accumulate
   and starve the restore → "Failed to prepare: A task was canceled", exit 6. Explains the
   intermittency, local+cloud repro, and why it worsened over a long session. Verified: 13.4.6
   SDK restore through the fixed daily CLI = **exit 0 in 13.06s, no helper leaked**.
   **PR #1308** pins that daily build and is DRAFT until **five consecutive published-canary
   workflows** pass. That proof is the pilot's last gate. #1305 closed as superseded.
2. **Do not re-open the Deno path as a #1227 cure.** #1307 (merged) measured it: CommunityToolkit
   Deno grows the graph 83→84 packages; #18627 removes Node/npm reliance but not the 75-library
   managed restore floor. **Recommendation: one stable 13.5 upgrade** if #18627+#18628 merge
   before the cut (combining them with #18958); otherwise take #18958 alone and keep
   `addExecutable('deno', ...)`.
3. **Possible high-leverage work**: #1307 enumerated the five maintainer threads blocking the
   owner's `microsoft/aspire#18628` — polyglot AppHost exercise coverage (TS/Java/Python/Go),
   OTLP protocol preservation in K8s publishing, Docker package-script alignment, native-OTLP
   gating when no endpoint is injected, and README consistency. Awaiting owner direction before
   dispatching; #18628 landing is what converts our daily-build pin into a stable upgrade.
4. **#1274 rewrite: DONE** (#1309 merged 01:43Z). Both owner-named pilot gates are now down to
   item 1 alone.

## Scoreboard

- **Owner onboarding wave: 11/11 dispositioned** — closed #1250, #1253, #1254, #1247, #1248,
  #1252, #1234, #1235, #1236, #1251; #1246 mitigated with the issue honestly moved to 0.0.6
  (upstream deno/deno#35804); #1280 split as genuinely blocked (TS AppHosts cannot register
  custom health checks + Deno KV Connect has no health endpoint — refused to ship a fake probe).
- **Caveat burn-down COMPLETE** — kill list #1228/#1225/#1229/#1230/#1231 all fixed and their
  markers deleted; reframe #1288 landed. Warning-flavoured debt call-outs: 27 → **0**. What
  remains is 18 design statements, each pointing at an open debt entry.
- **Also merged**: #1188 (close-gate now unions sidebar links + body keywords + commit
  messages — verified it *strengthens* the gate), #1219, #1196, #1290, #1287 (structural
  QueryClient seam; retired the documented `as unknown as` cast), #1294, #1304, #1116, #1242,
  #1226, #1232, #1233, #1241, #1220, #1286, #1291.
- **Canaries**: canary.8 GREEN PAIR (holds the stable-cut precondition). canary.9 failed pair
  (#1227). **canary.10 published all 25 packages** but its run aborted on a transient status
  poll — recovered standalone: `release:canary-label` all five checks PASS, prerelease note
  created, drift clean. Its pair is unproven pending #1227.

## Open, filed tonight, not yet scheduled

#1278 (type-soundness umbrella — A.1 already ticked by #1287), #1279 (migration chapter),
#1295 (**eradicate Zod 3 / align on npm** — `deno info` proves npm peers requiring `^4.0.0`
resolve to 3.25.76; three Zod instances coexist; sequenced AFTER the pilot canary because the
blast radius is 18 packages + lock), #1293, #1296, #1262, #1263, #1243.

## Key mechanics (do not relearn)

- **TRAIN PRs (base `canary/**`): `closingIssuesReferences` is ALWAYS `[]`** — GitHub only
  computes closing refs for PRs targeting the default branch. Do NOT read that as a missing
  keyword; check the PR body for `Closes #N` instead. The close-gate itself is unaffected:
  `resolveClosingIssueReferences` unions the API set with body keywords and commit messages
  (this is #1188, merged 2026-08-05 — it is what makes the train strategy safe; without it a
  train PR would have an empty closing set and the acceptance gate would pass vacuously).
- Required contexts: quality, check-test, deps-report, close-gate. Latest-per-name via
  `commits/<sha>/check-runs?filter=latest`; job truth via `runs/<id>/jobs?filter=latest`.
- **Acceptance evidence: use `box-index`, never `box:` text** — ticking a box appends a
  citation, which invalidates text keys (finding 32).
- A stale close-gate red is often just timing: rerun the job (label re-add is idempotent and
  fires no event).
- **Run validation tooling from a tree at the ref CI uses** — the orchestrator worktree lags
  main and produced phantom failures (finding 35).
- `git diff origin/main...HEAD` (three dots) to ask "what did this branch change" (finding 34).
- Docs-lane scope check: `--name-only | grep -E '^(packages|plugins)/'` must be empty. `.llm/`
  tooling is permitted — a stricter brief made an agent revert work its own acceptance required
  (finding 37, revised).
- **Codex quota: BOTH resets are spent.** Next exhaustion has no local cure before 11 Aug
  09:22; fall back to the OpenHands cloud lane. Diagnose it by the **worktree branch** — still
  on the old branch means the dispatch never took (finding 39).
- A publish step's exit code is not the publish's outcome — check JSR before re-minting
  (finding 40). A new gate's first red is more likely the gate than the product (finding 41).

Findings log: worklog "Findings for #1163" 1–42; drift D1–D17.
