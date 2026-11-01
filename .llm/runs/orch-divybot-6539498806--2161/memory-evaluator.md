# Independent review launch

Use the existing .llm/tools/agentic/claude/claude-print.ts wrapper with --model claude-opus-5-5 --effort high --prompt <file>. It spawns claude -p with stdin null. Prompt explicitly forbids edits/mutations/delegation and requests blockers only. Capture raw stream JSON outside Git; the result includes the session identity used for --resume. Never commit raw evaluator event streams: they contain private operational metadata.
