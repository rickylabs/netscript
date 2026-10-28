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

PLAN-EVAL round 1: FAIL_PLAN (diagram strategy and durable token-source/CI triggering). Fixed once: locked inline generated SVG transform; preserved renderer output; durable snapshot under tools/docs-site/figma-variables; explicit Pages trigger paths and shipped browser module paths. Round 2 pending. Baseline docs build passed (236 HTML pages). Draft PR #2439 open.

## Plan gate — terminal decision record

- Round 1: FAIL_PLAN; diagram ownership/theming strategy and durable token source/CI triggering. Fixed once; evaluator confirmed those items resolved in round 2.
- Round 2: FAIL_PLAN; inlining removes the source image and alt from Markdown twins/llms.txt.
- Concrete amendment prepared: keep a hidden source `<img src alt>` for twin extraction; accessible inline SVG with unique IDs; verify the built twin and accessible diagram name. This amendment is unreviewed.
- Per supplied leaf profile and feature plan protocol, two FAIL_PLAN verdicts end the loop. No third round, no implementation, no self-certification. Escalated through PR #2439 and canonical assignment report.
- Evaluator read-only processes completed. No managed evaluator lease was acquired; none remains to release. Local MCP research processes were terminated after their responses. No app, browser server, database or container was started by this run.

## Baseline checks

| Command | Result | Meaning |
| --- | --- | --- |
| `deno task --cwd docs/site build` | exit 0 | Baseline only: 236 HTML pages; existing source-format/rendered-output gates pass. |
| `npm ci --ignore-scripts` in S0 harness | exit 0 | Existing pinned browser dependencies installed; no dependency source changes. |
| `npx playwright install chromium` in S0 harness | exit 0 | Browser preparation only; no test or screenshot claim. |
| `deno task --cwd docs/site diagrams:check` | exit 1 | Unproven baseline: pinned Mermaid browser could not launch because a system shared library is absent. Generated assets were not changed. |

No implementation checks, axe results, keyboard proof, Pagefind proof, link-check verdict or screenshot artifact exist for this PR. The full CLI E2E gate has not been run because implementation did not pass the prerequisite plan gate.

Reconcile: current head contains only this scoped run record; unrelated files, assignment and lock files remain uncommitted. Draft PR stays open for coordinator review; no labels, readiness, merge, tag or release actions taken.
