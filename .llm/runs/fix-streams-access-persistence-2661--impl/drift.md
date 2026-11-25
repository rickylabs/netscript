# Drift — fix-streams-access-persistence-2661--impl

Append-only.

| Date | Severity | Entry |
| ---- | -------- | ----- |
| 2026-11-24 | minor | Owner matrix override recorded before launch: builder providerInstanceId `codex`, model `gpt-6.2-sol`, options `{reasoningEffort: 'xhigh'}`; reviewer Claude Opus 5.5 (`claude-opus-5-5`, effort `xhigh`), the batch coordinator acting as a different-family reviewer (Anthropic vs OpenAI). Transport is T3 `delegate_task` (owner-authorized) rather than the agentic launcher. See `worklog.md` § Owner model authorization. |
| 2026-11-24 | material | The coordinator rejected the provisional coalescing-only crash behavior. Successful read delivery now waits for a committed access, including SSE wakes. The existing bounded native adapter also checks the expiry, metadata projection, deletion and append hooks needed by this design. Re-run expiry, concurrent metadata and production fan-out tests when upgrading the upstream pin. |
