# GLM 5.2 live lane evidence — 2026-07-12

No credential values, headers, or environment dumps are included. The key was late-bound from
`~/.config/netscript-agentic/openrouter.env` in the child shell.

## Claude/OpenRouter isolated recipe

- Profile: `claude-openrouter`
- Model: `z-ai/glm-5.2`
- Transport: OpenRouter Anthropic Messages skin
- Isolation: dedicated `CLAUDE_CONFIG_DIR`; `ANTHROPIC_API_KEY` explicitly empty;
  `ANTHROPIC_AUTH_TOKEN` bound from `OPENROUTER_API_KEY`.
- Cached native Claude credentials were not read.

### Minimal text control

```text
exit: 0
turns: 1
result: GLM_TEXT_OK
non-empty: true
reported cost: $0.007735
```

### Agentic tool acceptance

```text
exit: 0
turns: 2
requested tool: Bash(pwd)
tool result: /home/codex/repos/ns-fix-agentic-lanes
final result: GLM_AGENTIC_OK
non-empty: true
reported cost: $0.013531
```

### Checked-in runtime wrapper acceptance

Command surface: `claude/claude-print.ts` with the isolated `claude-openrouter` child environment.

```text
exit: 0
turns: 2
tool: Bash(pwd)
tool result: /home/codex/repos/ns-fix-agentic-lanes
final result: GLM_RUNTIME_ADAPTER_OK
non-empty: true
reported cost: $0.139986
```

The higher wrapper cost reflects the full project/harness instruction and tool surface; the cheap
provider canary remains the promotion gate.

## Structured provider canaries

### Claude GLM

```json
{
  "status": "passed",
  "fanOutEligible": true,
  "capabilities": {
    "tools": "supported",
    "reasoning": "supported",
    "streaming": "supported"
  },
  "process": { "exitCode": 0, "timedOut": false }
}
```

### Codex GLM

```json
{
  "status": "failed",
  "fanOutEligible": false,
  "incompatibility": "codex-native-namespace-tool",
  "incompatibilitySource": "observed",
  "capabilities": {
    "tools": "unsupported",
    "reasoning": "unsupported",
    "streaming": "supported"
  },
  "process": { "exitCode": 1, "timedOut": false }
}
```

The Codex result reproduces the carried-in 400-class Responses/native-namespace incompatibility and
is now a declared, tested preset capability rather than a silent retry path.
