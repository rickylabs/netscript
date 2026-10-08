# Drift
Owner HARNESS.md supplies gpt-6.1-sol high and independent GLM max bindings; these explicit bindings govern this run.
Public brief forbids operator paths/session ids, overriding harness identity/path fields.
Main moved since PR baseline; merge-generated conflicts only. Current close-gate CI is green despite unanswered threads, so use live thread evidence.
Full CLI tests initially failed 12/1823 because TMPDIR was mounted noexec and PATH resolved a mise Deno shim in child workspaces/empty environments. The 106 tests across all affected baseline files pass with the real Deno binary first on PATH and a task-scoped executable TMPDIR; no source/test suppression. Full CLI rerun pending.
Local scaffold.runtime cannot pass preflight: Docker daemon unavailable and Aspire doctor reports missing .NET SDK. Use the repository's opt-in GitHub scaffold lanes for the full runtime gate at the pushed head; do not weaken preflight or touch unrelated host resources.
JSR audit first invocation lacked allow-write for its output; rerun with required output permission exits 0.

Independent GLM requested on OpenCode Go with max; provider returns Go usage limit exceeded before a substantive review. Stopped only this run's process. Owner-authorized fallback: native agy gemini-3.8-flash-high at high, still separate session/vendor from OpenAI. No GLM verdict claimed.
