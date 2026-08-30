# Lease preflight

- Timestamp: `2026-08-29T22:26:47Z`
- Worktree: `/home/codex/repos/netscript-aspire-13-5-s2`
- Branch: `test/aspire-13-5-s2-runtime-verification`
- HEAD: `21d516224fe35e92957f0998ee848bbf2024eda0`

## Aspire inventory

Command: `aspire ps --format Json --non-interactive --nologo`

Exit code: `0`

```json
[]
```

## Docker inventory

Command: `docker ps -a --format '{{json .}}'`

Exit code: `0`

Raw output: empty (no visible containers).

## Tool help drift

Commands:

- `deno task agentic:leak-check --help` → exit `1`, `unknown argument: --help`.
- `deno task agentic:teardown --help` → exit `1`, `unknown argument: --help`.

The checked-in argument parsers were read after these failures; this run uses their accepted scoped
arguments directly.
