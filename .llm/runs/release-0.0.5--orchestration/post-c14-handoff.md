# Post-C14 handoff

## Released and verified

- Main payload: `d6db645a89d830e6c36e838e8e1dac98fc84fde5` via #1340.
- Prerelease: [`v0.0.5-canary.14`](https://github.com/rickylabs/netscript/releases/tag/v0.0.5-canary.14),
  published `2026-08-06T21:39:04Z`.
- Immutable tag content: `d405def432b46d8119162a605b7e988db9d3f1fc`.
- Authoritative tag-bound same-semver recovery:
  [run 31128595811](https://github.com/rickylabs/netscript/actions/runs/31128595811) — success;
  production path, registry verification, and `release/canary-pair` passed.
- Exact canary-pinned production E2E:
  [run 31128614286](https://github.com/rickylabs/netscript/actions/runs/31128614286) — success.
- The earlier child failure was only a transient JSR 502. It remains as evidence; the supported
  same-semver recovery established the green pair without cutting canary.15.

## Landed and remaining

- #1315 (`95a60cbaf…`) closed #1295; #1316 (`51787c3ae…`) closed #1189; #1317
  (`765e8b732…`) closed #1117; #1318 (`a5c13ecdd…`) closed #1115. All four and #1340 are merged
  with terminal `status:shipped` reconciliation.
- Only open 0.0.5 PR: #1337, the orchestration record. No implementation PR is open.
- Open 0.0.5 issues (27): #1338; W1 #1312/#1148, #1024/#1328, #1324/#1330; W2 #1325, #1329,
  #1202/#1327; W3 #1326, #1102/#1197, #1119; W4 #1333, #1208, #1108; W5 #1137/#1138,
  #1332/#1334; terminal evidence/umbrella rows #1004/#1090/#1126/#1166/#1169.

## Canary.15 dependency order

1. W1-A #1312 + #1148 — publish-budget/residue safety.
2. W1-B #1024 + #1328 — consumer agent tool bundle and generated quality tasks.
3. W1-C #1324 + #1330 — OpenCode MCP attachment and provider-valid resume.

These are three separate, small direct-to-main PRs, not one aggregate PR. Billing Run waits until
their content is published as canary.15: canary.14 lacks W1-B's consumer surface and W1-C's MCP and
resume fixes, so an earlier demo would validate stale published behavior rather than the intended
agent-assisted run.

## Pace and safety rules

- One meaningful tightly connected cluster per draft PR, directly against `main`; independent
  current-head CI/review and ready-for-review immediately after separate IMPL-EVAL PASS plus green
  gates. The orchestrator branch is coordination history only.
- PLAN-EVAL only for genuinely complex/decision-heavy work. Independent IMPL-EVAL is mandatory.
  Default: `deepseek/deepseek-v4-flash-0731` max. Only when the OpenRouter lane is blocked, use
  Gemini 3.6 Flash high through the checked-in AGY/Google toolchain.
- No OpenHands until fixed. Never repeat valid evidence because a default changed. Repair only an
  actual failing current-head gate.
- One writer per thread/worktree. Never overlap app-server and CLI/tmux resume for thread
  `019fd77c-f583-7b01-aed8-c8665ac09230` in
  `/home/codex/repos/ns005-milestone-orchestrator`.
- Protected root `deno.lock` remains unstaged; terminal observed SHA-256:
  `1c4d59cc38c00742997d3c20dc39ae79b7966891422969b7b444d76642d0ccc1`. Do not stage, restore,
  overwrite, or include it.
- Quarantined worktrees remain untouched and must not be cleaned or reused:
  `/home/codex/repos/ns005-t2a-refresh.6hYJaW` and
  `/home/codex/repos/ns005-t2b-refresh.DMBKiM`.

## First action after `/clear`

Fetch and re-query `origin/main` plus issues #1312/#1148, then create W1-A in a fresh clean
worktree as the first small draft PR directly against `main`. Do not start Billing Run or cut
canary.15 before the declared payload is merged and independently green.
