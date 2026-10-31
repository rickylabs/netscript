# Environment and evaluation

No external memory connector is exposed; consult committed run memory. RTK is unavailable;
Deno 2.9.7, gh and Claude CLI are available. Native Redis binaries may be reused from private
project run dependencies; keep backend configuration, evaluator session identity and raw logs
outside Git. Use `.llm/tools/agentic/claude/claude-print.ts` for noninteractive evaluator launch
and same-session resume. The assignment explicitly overrides the matrix evaluator model.
