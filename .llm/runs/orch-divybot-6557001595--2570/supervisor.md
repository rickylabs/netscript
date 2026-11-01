# Scaffold Utility pages — #2570

- Baseline: `0af8fd9e7904ee2c848d0a4213c7853edec3ad21`.
- Branch: `orch/divybot-6557001595`; repository root: `.`.
- Tier: feature; role: implementation; supplied dispatcher leaf profile applies.
- Author: Codex, owner-requested `gpt-6-astra`, high effort.
- PLAN-EVAL / IMPL-EVAL: separate read-only Claude sessions, owner-requested
  `claude-opus-5-5`, high effort. Visual evaluation: separate read-only
  `gpt-6-astra` session. No implementation self-certification.
- Routing inspected with `deno task agentic:matrix --tier feature --json`.
  Explicit brief routes override matrix defaults; exact grant recorded in worklog.
- Public artifacts use repository-relative paths and omit session identifiers.

## Authorized write surface

- This run directory (plans, evaluations, visual proof, gate evidence, memory).
- `packages/cli/src/kernel/assets/app/` scaffold templates.
- `packages/cli/src/kernel/application/` scaffold assembly and capability projection.
- `packages/cli/src/public/features/init/` template context if required.
- `packages/cli/tests/` and `packages/cli/src/**/*test.ts` focused scaffold regressions.
- CLI generated asset carriers and documented generated carrier chain outputs.
- Scaffold documentation if changed behavior requires it.
- `.divybot-final-report.md` (untracked publication handoff only).

No duplication of #2488 component implementations; no showcase plumbing (#2571).
Any additional surface must be declared as drift before editing.

Registration surface clarification: `kernel/assets/manifest.ts`,
`kernel/adapters/templates/scaffold-template-assets.ts`, and init's UI registry
item selection are authorized for new page assets/CommandPalette dependencies.
Known post-install clients may expose installed-unwired state; such a remaining
required state prevents full acceptance/READY. No post-init reconciler rewrites
are planned; request-time projection is the locked mechanism.
