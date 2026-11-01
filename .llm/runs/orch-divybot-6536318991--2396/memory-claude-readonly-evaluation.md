# Noninteractive read-only Claude evaluation

Use the owner's exact model and effort, closed stdin, read-only tools, and `dontAsk`.
The Claude CLI's `--allowedTools` and `--mcp-config` are variadic: place `--` before the
positional prompt or it can interpret that prompt as an MCP config path. A CLI parse failure
is a failed launch, not an evaluator verdict or a consumed review round.
Keep the session identifier and raw JSON transcript in private local run output; publish only
the privacy-safe report and requested/observed model identity. Re-steer the same evaluator
session for repairs; do not replace a failure with a fresh evaluator.
