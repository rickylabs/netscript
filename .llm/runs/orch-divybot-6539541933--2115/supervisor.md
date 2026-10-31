# Issue 2115 supervision

- Baseline: `4060d1e61da0a8324e77ed351b05a343d746a188`, identical to fetched `origin/main`.
- Branch: `orch/divybot-6539541933`; feature tier, leaf profile supplied by dispatcher.
- Implementer: Codex, OpenAI family, owner-requested high effort.
- Independent reviewer: Claude CLI, Anthropic family, `claude-opus-5-5`, high effort; read-only PLAN-EVAL and IMPL-EVAL with closed stdin. Reuse the same review session.
- Write surface: `packages/auth-kv-oauth/src/cookies.ts`, `packages/auth-kv-oauth/src/backend.ts` only if another parser exists, `packages/auth-kv-oauth/tests/cookie-policy_test.ts`, `packages/auth-kv-oauth/tests/auth_kv_oauth_test.ts`, `packages/auth-kv-oauth/README.md`, this run directory. Final report uses the ignored assignment handoff files.
- No preexisting issue-named branch or matching PR found. No triage comment was present. Start from main on the assigned branch.

## Owner routing override (verbatim)

> Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only.

`deno task agentic:matrix --tier feature --json` resolved implementation Sol xhigh, plan-evaluation GLM 5.3 then Fable 5.1, and implementation-evaluation Muse Spark 1.3 then Opus 5. Owner override above selects Opus high for both reviews. Separate-session and family independence remain required. Feature policy: max 2 plan rounds and 5 implementation rounds; stop after two consecutive terminal failures.

## CI repair scope addendum

CI quality reported stale generated MCP export corpus after the public parser JSDoc change. Authorized repair adds `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts` and any deterministic dependent publish carriers produced by the repository generator. Generated metadata only; no scaffold/template/runtime behavior. Record actual resulting files in drift.md.
