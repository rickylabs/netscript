# Worklog

## Design checkpoint

1. Public surface: docs:snippets still type-checks documentation; hung checks fail with source path
   and line before the workflow deadline.
2. Domain vocabulary: snippet deadline bounds a compiler process; process group includes descendants.
3. Ports: Deno subprocess APIs and native process-group termination; existing extracted fence and
   workspace resolver contracts.
4. Constants: named default snippet deadline and bounded process cleanup policy.
5. Commit slices: bootstrap run (artifact inspection); one implementation slice (compiler, process
   runner, fixtures/tests, Pages build timeouts; docs snippet and scoped quality gates); evaluation
   and READY evidence (run records; independent review).
6. Deferred scope: utility-browser job belongs to #2455; export drift redesign is outside this fix.
7. Contributor path: `.llm/tools/docs/snippet-compiler.ts`.

## Research

- Consulted existing repository memory for MCP stdio research, generated docs and environment.
- No exposed NetScript MCP tools or memory connector; use local CLI MCP stdio and run-local memory.
- RTK is unavailable; use direct commands and preserve raw exit codes.
- Triage comments contain no orchid-triage report; PR search for 2454 returned none.
- Compiler currently awaits one unbounded `Deno.Command(...).output()` for all modules, inheriting
  stdin. Extractor only parses text; snippet bodies are never executed.
- Owner instructions override generic template: PR starts with Refs URL, no closing keywords,
  no labels, stop at READY. Canonical final issue report uses excluded file handoff.

## Owner evaluator override (verbatim)

Run IMPL-EVAL after implementing with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only. Fix once and record the verdict.
