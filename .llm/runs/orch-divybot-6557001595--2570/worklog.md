# Worklog

## Bootstrap — 2026-11-01

Read the complete assignment and live issue scope/comments. No orchid-triage
comment and no existing PR covering #2570 found. Memory consulted. Working tree
was clean. Feature matrix queried successfully with Deno 2.9.7.

Owner routing grant (verbatim):

> PLAN-EVAL and IMPL-EVAL: `claude -p --model claude-opus-5-5 --effort high`, read-only.

> Visual gate: an independent `codex exec -m gpt-6-astra` review, run read-only in a separate session, compares each rendered page with its Figma screen.

The dispatcher assigns implementation `model: gpt-6-astra`, `effort: high`.
These explicit routes override matrix defaults. Independence remains mandatory.

Design checkpoint pending research; no implementation begun.

## Design

1. Public surface: generated dashboard, records/list-detail, settings, signin and
   Cmd/Ctrl+K; existing `/design` retained. No new CLI flags or package exports.
2. Domain vocabulary: capability absence/readiness/unavailability, generated route,
   record summary/detail, browser preference. These carry real state only.
3. Ports: existing template/filesystem/formatter ports, typed SDK service client,
   request-local auth BFF, browser storage and registry components.
4. Constants: route aliases/navigation, existing plugin registration identifiers,
   capability state values and local preference keys; no copied business metrics.
5. Commit slices: S1 shell/empty pages; S2 live capabilities; S3 visual proof;
   S4 carriers/gates. Files and proving gates are enumerated in plan.md.
6. Deferred: opt-in showcase #2571, new framework components #2488, business data,
   workload/provider setup, release/merge. No new architecture debt planned.
7. Contributor path: scaffold page template README for composing capabilities;
   generated navigation.ts remains the route extension entrypoint.

Reconcile: source and live issue match the assignment. Owner's specific Refs-only,
no-label, READY process takes precedence over generic dispatcher close/ready boilerplate.
