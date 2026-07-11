# Context pack — issue #665

- Baseline/branch: `955b4abf` / `fix/665-route-identity-effort`.
- Root cause proven: Codex CLI 0.144.1 `send-message-v2` leaves `turn/start.effort` null, so the
  child inherits host default `low` despite `-c model_reasoning_effort=medium`.
- Implemented: direct v2 JSONL app-server launch applies both config and per-turn effort; observed
  medium matches requested medium in live smoke thread `019f532e-3903-7133-b8d9-2a35aa196c2d`.
- Mismatch/pending evidence now exits non-zero with `BLOCKED:` action by default;
  `--allow-route-mismatch` is explicit opt-out.
- Validation: full agentic suite 224/224; scoped check/lint/fmt all green.
- Next: inspect diff, commit all source/docs/run artifacts, push explicit refspec.
- PLAN-EVAL waived by owner; no PR may be opened.
