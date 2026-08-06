use harness

## SKILL

- `netscript-harness` — treat this as an independent adversarial implementation review.
- `netscript-tools` — inspect the raw diff and run bounded read-only checks.
- `claude-manager` — evaluate real Claude Code session/Remote Control semantics.
- `rtk` — use repository-standard read-heavy wrappers when helpful.

Adversarially review PR branch `feat/agentic-remote-model-proxy` against baseline
`015ddef6d226d6cf2773c21e116a1debbf3d1cac`. This is local WSL tooling; do not dispatch cloud
agents and do not modify files. Inspect the harness run under
`.llm/runs/feat-agentic-remote-model-proxy--split-gateway/`, the raw diff, and all new tests.

Pay special attention to security and truthfulness:

1. Exact `/v1/messages` routing and URL/path/query construction.
2. Anthropic OAuth vs OpenRouter credential isolation in both headers and child environment.
3. Streaming, malformed request behavior, hop-by-hop headers, SSRF, listener exposure, and cleanup.
4. Claude 2.1.222 argv semantics for new daemon, resume, and fork.
5. Whether the implementation actually satisfies Remote Control rather than merely inference.

Live evidence you must incorporate:

- `claude remote-control` exits before requests when `ANTHROPIC_BASE_URL` is loopback: Remote
  Control is only available through `api.anthropic.com`.
- Interactive `--resume ... --fork-session --remote-control` remains alive and successfully
  compacts through DeepSeek, but its registry entry
  `~/.claude/sessions/1278992.json` has no `bridgeSessionId`; a native attached session registry
  entry does. Therefore the current fork is not remotely attached.
- `CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST=1` bypasses the host error but disables subscription login
  and produces “You must be logged in”.
- Third-party deepclaude's documented split-base approach predates this Claude restriction and its
  current shell still sets loopback `ANTHROPIC_BASE_URL`.

Determine whether there is a safe, maintainable, evidence-backed approach that retains the literal
`api.anthropic.com` base for Claude's guard while routing only inference elsewhere (for example a
transport proxy), or whether the feature must be explicitly classified unsupported on current
Claude. Do not recommend bypassing TLS verification, installing a persistent trusted root, leaking
OAuth, patching the Claude binary, or making unsupported success claims.

Return:

- verdict: `PASS`, `FAIL_FIX`, or `FAIL_RESCOPE`;
- findings ordered high to low with file/line evidence;
- concrete fixes/tests;
- a separate runtime-feasibility conclusion.
