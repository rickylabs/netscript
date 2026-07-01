# Drift — CLI `dx`-runnable slice

## 2026-06-25 — `deno dx` subcommand unavailable in local Deno 2.8.3

- Severity: significant
- Source: S1 empirical probe
- Planned assumption: the surfaced command form in the brief and plan was written as `deno dx jsr:@netscript/cli ...`.
- Observed reality: `deno dx jsr:@std/http/file-server --help` exits 1 with `Module not found "file:///home/codex/repos/netscript-cli-dx-runnable/dx"`, and `deno help` lists no `dx` subcommand. The available command is `deno x`.
- Decision: implement the JSR runnable default export and use the actually verified public command form `deno x jsr:@netscript/cli ...` for S2 docs. This preserves the plan's exports-based mechanism and verified-form-only rule while correcting the command spelling to match the installed Deno runtime.
- Debt: no architecture debt. This is command-surface wording drift, not a package structure violation.
