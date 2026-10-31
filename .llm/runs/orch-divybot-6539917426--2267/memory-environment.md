# Environment and delivery

RTK is absent; use direct focused git/gh reads and repository structured Deno
wrappers. Git author identity was unset; configured repository-local identity to
the authenticated repository owner and existing commit author's public GitHub
noreply address before the first commit. No attribution footer.

Use `.llm/tools/agentic/claude/claude-print.ts` with the owner-requested model and
effort; stdin is closed by the launcher, and `--resume` preserves evaluator
context. Keep raw stream output outside Git; copy only sanitized verdict text.

Canonical final report uses excluded `.divybot-final-report.tmp`, atomically
renamed to `.divybot-final-report.md`. This queues publication; it is not proof
of accepted publication. No direct final issue comment.
