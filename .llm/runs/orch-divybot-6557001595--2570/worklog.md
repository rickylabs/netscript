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

PLAN-EVAL round 1 FAIL_PLAN: six blockers corrected in plan.md B1–B6. No product
implementation occurred. Real baseline no-db scaffold generated and served;
Chromium returned its home heading and captured baseline-home-light.png.

PLAN-EVAL round 2: PASS. B1–B6 closed by independent Claude Opus 5.5 review.
Implementation begins only now. The explicit corrections section is authoritative.

## S1 — shell and absent states

Implemented shared overview, records routes, settings, sign-in and command palette
using the existing registry components. Theme and route counts derive from actual
metadata. Removed fake rows and no-service CRUD marketing. Preserved canonical
service examples and development runtime links.

Independent slice review round 1 FAIL_FIX: configuration failures leaked into page
500s. Fixed with server-only logging and a safe unavailable projection for all five
capabilities. New behavioral fixture covers missing file, invalid JSON and schema.
Round 2 PASS; S2 remains explicitly unassessed. Wrapper evidence after that fix:
11 tests, generated app 47 files, scoped lint/format 5 files. Quality gate and CSS
budgets pass. No package contract or shared component changes.

Browser debugging: regenerating a live app left old Vite processes serving stale
Fresh island URLs. Stopped only exact-app-owned processes and restarted after
regeneration. Native combobox consumed first Escape; app global shortcut now owns
palette dismissal and restores focus. Full visual/variant evaluation remains S3.

Reconcile: no dependency or lock changes. The existing gap-component PR remains a
merge dependency; this slice composes main's supported components.

S1 final browser receipt: PASS, 16 page/width/scheme cases plus preference save,
reload, keyboard opening/dismissal and focus return. The shortcut keeps an immediate
open ref to handle Escape in the same frame as opening (before effects re-run).
This is actual browser proof, not inferred from the code review. Scoped check and
11 tests rerun after the final template change. CSS totals in s1-css-installed.json.

S1 terminal independent review: PASS (s1-terminal-review.md), including the immediate
shortcut state and actual browser receipt. Sign-off commit follows that review.
Browser dependency: `npm ci --ignore-scripts` in tools/fresh-ui-browser supplies
Playwright; Chromium uses the existing host browser libraries.
