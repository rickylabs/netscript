# Worklog

## Design

1. Public surface: generated apps' AGENTS.md and ui:add page nextSteps. Existing function contracts unchanged.
2. Vocabulary: app preset, HTML shell, shared chrome and navigation; existing ConventionReference IDs extended.
3. Ports: existing scaffold/template interfaces; no new external interface.
4. Constants: LOOK_AND_FEEL_REFERENCES, THEME_GUIDE_SLUG, CUSTOMIZE_GUIDE_SLUG; retain PAGE_FRAME_GUIDANCE.
5. Commit slices: bootstrap plan; one implementation slice in the four assigned files, proven by semantic tests and configured gates; close evidence after independent review. Every implementation commit updates this run.
6. Deferred scope: recipe/docs/carrier updates owned by #2554; no command or token engine redesign.
7. Contributor path: packages/cli/src/kernel/templates/app/agent-conventions.ts defines generated app guidance.

PLAN-EVAL: N/A — mechanical bounded guidance update with owner-provided contract.

## Bootstrap

Read supplied leaf profile, skills and relevant harness/doctrine rules; no target profiles/ read.
Queried feature routing and checked issue comments, linked docs PR, duplicate PR search and available local memory.
