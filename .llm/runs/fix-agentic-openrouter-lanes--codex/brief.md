use harness

## SKILL

netscript-harness + netscript-tools + netscript-pr. Implementation slice on branch
`fix/agentic-openrouter-lanes` (worktree `/home/codex/repos/ns-fix-agentic-lanes`, based on
current origin/main `ec61dc78`). Deliverable: a SEPARATE PR to `main` — this is deliberately
independent of the design umbrella PR #685 so it can merge first.

**Owner is available live:** if you need a decision, credential, or a manual step, JUST ASK in
your session — the owner steers you directly from mobile. Do not silently stub around a
blocker.

# Mission: durably fix the agentic OpenRouter lanes (NO STUBS)

On 2026-07-12 the dashboard-design orchestrator proved the repo's OpenRouter model lanes are
broken end-to-end (full details: `.llm/runs/dashboard-design--orchestrator/run-eval.md` on
branch `design/dev-dashboard-revamp`, section "GLM 5.2 capability test"). Reproduced failures:

1. **`launch-codex-slice` composes an unsupported flag.** With `--profile X --profile-home D`
   it runs `codex --profile 'X' --model '…' -c model_reasoning_effort='…' debug app-server
   send-message-v2 "$msg"` and codex v0.144.1 rejects it:
   `Error: --profile only applies to runtime commands and codex mcp: codex, codex exec, …`.
   File: `.llm/tools/agentic/codex/launch-codex-slice.ts` (see `profileFlags` around L340).
2. **Codex Responses wire × OpenRouter GLM = 400.** After working around (1) via
   `codex exec --profile`, every turn fails with OpenRouter:
   `{"error":{"message":"No endpoints found that support the native namespace tool type. To
   learn more about provider routing, visit: …/provider-selection","code":400}}` — codex
   declares a native `namespace`-type tool GLM endpoints don't accept. Investigate codex
   config surface (tool selection/compat flags, e.g. disabling the freeform/namespace tool
   forms, web-search tool, unified exec tool, or an OpenRouter provider-routing pin to an
   endpoint that supports it) until a GLM agentic turn actually completes. If codex↔OpenRouter
   is PROVABLY incompatible for GLM today, the durable fix is: make the **claude-custom-env
   lane** actually work (see 4) AND encode the codex-lane incompatibility as a structured,
   tested capability in `runtime/provider-profiles.ts` / provider-canary (a documented,
   machine-checked "unsupported" is acceptable; a silent stub is not).
3. **Config-format traps** (fix the repo adapter/tooling so nobody hits them again):
   codex now rejects legacy `[profiles.x]` tables when `--profile x` is used — the profile
   must live at `<CODEX_HOME>/<name>.config.toml` (the format
   `runtime/adapters/codex-profile-adapter.ts` already emits — good; make the launcher
   actually materialize + use it instead of expecting a manual CODEX_HOME); and
   `wire_api = "chat"` is no longer supported (`responses` only) — assert/emit accordingly.
4. **claude-custom-env lane returns empty completions.** `ANTHROPIC_BASE_URL=
   https://openrouter.ai/api ANTHROPIC_AUTH_TOKEN=<key> claude -p --model z-ai/glm-5.2 "…"`
   exits 0 with NO output (only the connectors warning + a stdin warning). Diagnose (likely
   the anthropic-compat endpoint path or model-id mapping) and either fix the invocation
   recipe (document + encode it in the runtime claude adapter so it is launchable — the
   adapter currently hard-codes "Claude launch and resume are not implemented by the S3
   static-smoke adapter" in `runtime/adapters/claude-adapter.ts`) or prove the endpoint
   can't serve `-p` sessions and encode that as a structured capability too. At least ONE
   lane (codex or claude) must drive a real GLM 5.2 agentic turn end-to-end.
5. **Launcher exit-code bug:** `launch-codex-slice` exits 1 with
   `WARN: no thread id captured` even when the turn COMPLETED successfully (observed on a
   fully successful gpt-5.6-sol run). Successful sends must exit 0; parse the thread id from
   the v0.144 app-server output format.
6. **Canary coverage:** extend `deno task agentic:provider-canary` (or its runner) so every
   `OPENROUTER_PRESETS` entry has a cheap structured canary that catches lane breakage
   (usage/launch validation level is fine; live-turn canary behind an explicit flag). Wire the
   canary into the suite's test surface so CI flags a broken preset.

## Ground rules

- **No stubs, no dead code, no "TODO later".** Every fix lands with tests (the agentic suite
  has `*_test.ts` conventions and a no-hardcoded-volatile guard — model ids/endpoints go in
  `.llm/tools/agentic/config/`).
- The OpenRouter key for LIVE verification is sourced from
  `~/.config/netscript-agentic/openrouter.env` (export line). NEVER print or commit the key.
  A live GLM turn (cheap, one-shot) is the acceptance proof for (2)/(4) — record the
  transcript/evidence (sans key) in this run dir.
- Validation: scoped wrappers (`.llm/tools/run-deno-check.ts --root .llm/tools/agentic --ext ts`),
  `deno task agentic:*` smoke of what you touched, and the relevant `_test.ts` files. Do NOT
  run repo-wide fmt.
- Keep lock hygiene: no deno.lock churn unless required by a reviewed dependency change.
- Artifacts: keep a `worklog.md` + `drift.md` in this run dir
  (`.llm/runs/fix-agentic-openrouter-lanes--codex/`).
- When done: commit, push `fix/agentic-openrouter-lanes`, open a PR to `main` via
  `deno run -A .llm/tools/agentic/github/gh-pr.ts create --head fix/agentic-openrouter-lanes
  --base main --allow-base-main --title "fix(agentic): durable OpenRouter lane repair
  (launcher profile/exit bugs, GLM lane viability, preset canaries)" --body-file <file>`.
  PR body: problem/fix/evidence table + `Refs #400` is NOT needed — this is agentic tooling,
  reference the run-eval findings instead. Apply labels `type:fix`, `area:tooling`,
  `priority:p1`, one `status:` label, milestone Backlog/Triage — per the netscript-pr skill.
- Post a short completion comment on your own PR summarizing evidence (live-turn proof).
