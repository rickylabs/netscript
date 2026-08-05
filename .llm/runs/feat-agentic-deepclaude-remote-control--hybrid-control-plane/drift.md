# Drift Log: hybrid Claude Remote Control

## 2026-08-05 — transparent DeepClaude mode is outside supported Claude behavior

- **What:** The reference implementation claims Remote Control with `ANTHROPIC_BASE_URL`, but
  current Claude disables exactly that combination and older compatible-gateway builds lack Remote
  Control.
- **Source:** official Claude Code changelog, upstream `aattaran/deepclaude` source, and local
  2.1.91/2.1.222 probes.
- **Expected:** A split proxy alone would enable mobile Remote Control with OpenRouter inference.
- **Actual:** There is no official-version overlap; transparent replacement would need patching or
  TLS interception.
- **Severity:** architectural
- **Action:** rescope
- **Evidence:** `research.md` findings 2–6 and merged PR #1314.
