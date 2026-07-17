use harness

# Slice S2 — docs tools: `search_docs` / `list_docs` / `get_doc` over `docs/site`

## SKILL

Read before coding: `.agents/skills/netscript-doctrine/SKILL.md`,
`.agents/skills/netscript-tools/SKILL.md`, `.agents/skills/rtk/SKILL.md`.

## Identity + ground rules

- WSL Codex implementation agent. Worktree (ABSOLUTE, every file op):
  `/home/codex/repos/ns-combo-s2`. Branch: `feat/netscript-mcp-skills-s2-docs`. Absolute paths in
  all shell commands; never touch other checkouts.
- **Base verification preflight (mandatory, first)**: `git -C /home/codex/repos/ns-combo-s2 log
  --oneline -1` must show `3870c553`, and `/home/codex/repos/ns-combo-s2/packages/mcp/mod.ts`
  must exist. If not, STOP and report.
- GitHub issue: rickylabs/netscript#726 (epic #721, umbrella PR #715). Conventional commits
  referencing `#726` (no closing keyword).
- Lock hygiene: no new dependencies expected; do not commit `deno.lock` churn.
- Scope ONLY S2. Do not touch telemetry flows, CLI trigger, doctor beyond registering nothing new.

## Context

- Design: `/home/codex/repos/ns-combo-s2/.llm/runs/mcp-skills--orchestrator/design.md` §3 (docs
  tools), §2 (doctrine); S1 landed the contracts + registry + runner — READ
  `packages/mcp/src/domain/tool-contracts.ts`, `tool-types.ts`, `application/tool-registry.ts`,
  `application/flows/doctor-flow.ts` (the flow pattern), `cli.ts` (composition point).
- Docs corpus: `docs/site/**` Markdown (Lume). Diátaxis-ish tree: tutorials, how-to, reference,
  explanation, capabilities + domain folders. Front matter carries title/description.

## Deliverables

1. **Docs corpus port** (`src/domain/`, mirror the telemetry-probe-port pattern): interface for
   list/search/get over an indexed corpus; typed read models (slug, title, description, section
   headings, bounded content).
2. **Filesystem corpus adapter** (`src/infrastructure/`): walks a docs root (constructor option;
   `cli.ts` wires a `--docs-root` flag / `NETSCRIPT_DOCS_ROOT` env / sensible default resolution
   relative to project root), parses front matter (title/description) + headings (sections),
   builds an in-memory index lazily with mtime-based reuse. EXCLUSIONS (hard, tested): anything
   outside the docs root; within it, exclude `_plan/`, `_data/`, `_components/`, `_includes/`,
   underscore-prefixed files/dirs generally. Never index `docs/architecture/doctrine/` or
   `docs/ROADMAP.md` (they live outside `docs/site`, but add a defensive test).
3. **Flows** (`src/application/flows/`): `list_docs` (slug + title + one-line description,
   limit-bounded), `search_docs` (ranked lexical scoring over title/headings/body with
   title>heading>body weighting; returns slug + title + snippet + score), `get_doc` (slug →
   full doc OR one section when `section` param matches a heading, slugified match; content
   truncated by the runner policy). Wire flows in `cli.ts` composition (keep the injection
   pattern: `createToolRegistry({ ...flows })`).
4. **Contract fit**: if S1's input/output schemas for the three docs tools need adjustment to
   carry these shapes, adjust minimally in `tool-contracts.ts` and keep the schema tests green.
5. **Tests** (`packages/mcp/tests/`): fixture corpus under `tests/fixtures/docs/` (do NOT depend
   on the real `docs/site` in unit tests) — search→get funnel round-trip, exclusion rules,
   section extraction, ranking sanity, limit/truncation bounds. Plus one integration test gated
   to skip when `docs/site` is absent that lists the real corpus.
6. **Public wording**: all tool output/descriptions public-audience; run the grep gate
   `grep -rInE "eis|VIF|CSB|PR #|dogfood" packages/mcp` → must be empty.

## Validation (run, paste real output into worklog)

- `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/mcp --ext ts`
- `.llm/tools/run-deno-lint.ts` + `run-deno-fmt.ts` same scope
- `deno test --no-lock --allow-env --allow-net --allow-run --allow-read packages/mcp/tests/`
- `deno task arch:check`; `deno task doc:lint --root packages/mcp --pretty` if that task exists
  (else `deno doc --lint` on entrypoints); publish dry-run from the package.

## Definition of done

Deliverables + validations green with evidence in
`/home/codex/repos/ns-combo-s2/.llm/runs/mcp-skills--orchestrator/s2/worklog.md` (append-only),
drift in `s2/drift.md` if any. Small logical commits on the branch, then push:
`git -C /home/codex/repos/ns-combo-s2 push origin HEAD:refs/heads/feat/netscript-mcp-skills-s2-docs`.
Do NOT open a PR; do NOT merge — the supervisor reviews and merges into the umbrella.
