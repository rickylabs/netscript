# Drift — docs-streams-subscriber-capacity-2650--impl

Append-only.

| Date | Severity | Entry |
| ---- | -------- | ----- |
| 2026-11-24 | minor | Owner matrix override recorded before launch: builder providerInstanceId `codex`, model `gpt-6.2-sol`, options `{reasoningEffort: 'xhigh'}`; reviewer Claude Opus 5.5 (`claude-opus-5-5`, effort `xhigh`), the batch coordinator acting as a different-family reviewer (Anthropic vs OpenAI). Transport is T3 `delegate_task` (owner-authorized) rather than the agentic launcher. See `worklog.md` § Owner model authorization. |
| 2026-11-24 | minor | The first exploratory full invocation exited 1 at the 90-second single-stream 32-reader phase deadline. Higher-load smoke showed producer receipts could lag the offered appends. Final deadlines are four minutes per phase and 35 minutes globally, with five seconds for each open and a ten-second delivery grace after acknowledgement. The final report records offered and acknowledged timings separately. The fixed workload and scope are unchanged. |
