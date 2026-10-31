# Worklog

## Design

1. Public surface: corrected lifecycle guide and CLI reference; existing docs:snippets rejects plugin-update package specifiers with source location. Public CLI behavior is unchanged.
2. Domain vocabulary: installed name (workers), package specifier (@netscript/plugin-workers or jsr:...), CLI example diagnostic (source file and line).
3. Ports: existing source walker and Deno filesystem/process interfaces; no new infrastructure abstraction.
4. Constants: named plugin-update example pattern, named negative fixture. Do not enumerate first-party plugin names in policy.
5. Commit slices: S0 run/plan bootstrap; S1 docs correction and regression gate plus evidence; S2 evaluation/close evidence. Exact files and gates in plan.md.
6. Deferred scope: other CLI verbs and general shell grammar, CLI implementation, package carriers, runtime E2E and release. Owner restricts docs lane and reserves merge for coordinator.
7. Contributor path: `.llm/tools/docs/snippet-coverage.md` describes gate scope and negative controls; policy implementation will be `.llm/tools/docs/cli-example-policy.ts`.

## Bootstrap

- Full assignment read; owner-specific PR opening line and no-closing-keyword instruction takes precedence over generic dispatcher PR boilerplate. Final report uses the requested file handoff, not a direct issue comment.
- Matrix queried for feature tier. Owner evaluator and high-effort override recorded verbatim in supervisor.md.
- No Acceptance boxes in live issue body; report each requested outcome explicitly instead of inventing issue checkboxes.
- No labels or milestones changed, per owner instruction.
- Pending PLAN-EVAL before implementation.
