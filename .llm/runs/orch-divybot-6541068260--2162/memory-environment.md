# Worker environment

RTK is unavailable; Deno 2.9.7, gh and native Claude are installed. No memory connector is
exposed; consult committed run memories. Git lacks author configuration despite assignment
boilerplate; use command-scoped identity matching the authenticated account's existing commits.
Native evaluator wrapper is .llm/tools/agentic/claude/claude-print.ts with --model
claude-opus-5-5 --effort high --prompt <file>. It closes stdin and supports --resume.
Raw stream output contains private operational data: keep it outside Git, save sanitized verdicts.
