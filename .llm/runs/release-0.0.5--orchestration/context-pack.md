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

## Immediate actions

1. **#1227 (p0, REOPENED) is the pilot's only blocker.** PR **#1305** is deliberately draft:
   S1 (capture Aspire CLI logs) done; S2 (signature retry + pinned cache) and S3 (**N
   consecutive green published-canary walks**) open. **Do not merge on a single green CI run** —
   for an intermittent defect that is indistinguishable from luck (finding 42). Read the
   captured `~/.aspire/logs/cli_*.log` diagnosis first.
2. **#1274 rewrite** — the pilot is also gated on it; owned by **docsorch** (session
   `763d39f5`, PR #1215). Coordinate, do not duplicate: docsorch owns the page, #1294 owns the
   executable walk, and the drift check binds them.
3. When #1227 is genuinely proven, dispatch the next canary (D16: dispatch when a *named* slice
   completes and the train reads as one release-note line) and re-run the walk.

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
