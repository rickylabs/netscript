# Phase 2 environment — 2026-11-01

Deno 2.9.7 and Codex are on PATH. RTK is absent; use direct commands with structured repo wrappers for verdicts. Prior phase memory lives in `.llm/runs/orch-divybot-6557001595--2570/`, sample projection memory in `.llm/runs/orch-divybot-6560133380--2579/`. No separate memory service or global memory directory is available.

When resuming a read-only reviewer, explicitly pass `-c sandbox_mode='"read-only"'` as well as model/effort: resume otherwise loads the global sandbox default. Verify the launch banner before accepting the review. The accidental unrestricted resume was stopped, discarded, and resumed read-only; no tool use or source writes occurred.
