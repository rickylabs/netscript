# Plan: PR 0B desired-state agentic runtime controller

## Scope

Implement issue #576 as an Archetype 6 internal tooling controller, stacked on PR #584. The plan
must define typed contracts before implementation, reuse existing agentic commands as adapters, and
keep provider-profile policy, evidence lanes, fallback policy, durable Codex recovery, harness route
migration, and rollout canaries in #577-#582.

## Locked Constraints

- One daemon-attached, mobile-visible WSL Codex thread owns planning and implementation.
- Native ext4 execution only.
- Stable machine-readable output plus useful human diagnostics.
- No secrets in repository files, command arguments, logs, comments, or run artifacts.
- Inspection and dry-run paths are read-only.
- Existing scripts become thin compatibility wrappers before retirement.
- No external evaluator dispatch unless the owner reverses the recorded waiver.

## Pending Design

The worker must complete the command schema, state model, adapter boundaries, implementation slices,
gate matrix, rollback behavior, and explicit #577-#582 deferrals before implementation begins.
