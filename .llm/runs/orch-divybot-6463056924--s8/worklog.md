# S8 worklog

## Design

1. Public surface: six-lane Utility docs shell, stable Vento components, light/dark, accessible mobile navigation and Pagefind palette.
2. Domain vocabulary: lane = curated docs branch; scheme = light/dark; location marker = ink square; code frame = tabs, path header, copy and scrollable numbered code; token = named role resolved from Figma contexts.
3. Ports: Lume page data and nav plugin; Pagefind search/results API; DOM dialog/IntersectionObserver/Clipboard; optional localStorage; filesystem only in generation/check tools.
4. Constants: scheme and lane sets in site data/browser modules; Figma collection modes in generator; shared browser viewport/scheme/route matrix; red-role allowlist limited to logo/error declarations.
5. Commit slices: tokens/fonts → shell/layout → components/prose → search/mobile → checks/evidence, as detailed in plan.md with owned files and proving gates.
6. Deferred scope: S8b content, package runtime and tokens v2 implementation, backend work, publishing and merge.
7. Contributor path: `tools/docs-site/README.md`.

## Owner override

“Run PLAN-EVAL before implementing and IMPL-EVAL after, both with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only. Fix once, record both verdicts.” This overrides the default feature evaluator matrix, preserving separate session/family.

## Bootstrap

- Routing resolved via matrix JSON, baseline synchronized to main; no existing implementation found.
- No labels per assignment. PR body uses Refs per operator-specific instruction (generic closing-keyword boilerplate conflicts). Final canonical reply uses assignment-file handoff.
- PLAN-EVAL pending; no implementation started.
