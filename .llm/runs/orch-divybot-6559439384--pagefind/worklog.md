# Worklog

## Design

1. **Public surface:** existing docs build, generated Pagefind JS API and strict reproducibility CLI. Caller-visible search/fallback/filter/count/hash behavior remains covered by browser tests.
2. **Vocabulary:** native filter, metadata and entry serialization; stable ingestion order means URL order before addHTMLFile. No new domain types.
3. **Ports:** existing Lume Pagefind processor and native npm Pagefind API, Deno build processes/filesystem, Playwright browser. No replacement abstractions.
4. **Constants:** exact Pagefind release 1.6.0 in site import map; stable comparator uses code-point URL order (not locale-dependent ordering). Existing lane definitions unchanged.
5. **Commit slices:** bootstrap/research → native reproducibility integration + full proof → strict CI policy removal after exact-head proof. Files and gates in plan.md; one subsystem, no sibling fanout.
6. **Deferred scope:** upstream generic CLI traversal fix, all token/layout/registry work, and binary postprocessing.
7. **Contributor path:** `tools/docs-site/README.md` documents the override, native ordering rationale and strict/browser commands.

## Bootstrap

Read assignment in full, issue/comments, AGENTS and harness/toolchain/PR/tools skills, existing retained memory. RTK absent; direct focused commands used. Fetched main equals baseline. Strict failure reproduced and retained. Toolbelt reports 1.6.0 stable; upstream #1124 explains the native defect. PLAN-EVAL selected because choosing/qualifying a new native release and removing a CI exception warrants separate-family review.

Owner evaluator override verbatim: `Independent separate-family read-only PLAN/IMPL evaluation as applicable; continue owner preference `claude -p --model claude-opus-5-5 --effort high`.`
Owner-specific PR instruction (draft, Refs #2453, no labels, cockpit owns merge) overrides generic closing-keyword/label/readiness boilerplate. Public artifacts omit host paths/session IDs; private transport evidence remains local. No questions needed.
