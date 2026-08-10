# Plan: generated database schemas as contract predecessors

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-1332-generated-schema-contract-predecessor--leaf` |
| Branch | `docs/1332-generated-schema-contract-predecessor` |
| Phase | `implement` |
| Target | Documentation site plus narrow docs compile fixture |
| Archetype | N/A — no package/plugin behavior or public export changes |
| Scope overlays | `SCOPE-docs.md`; browser validation for the rendered homepage |

## Archetype

No package archetype applies. This is a docs-only leaf that reads package/CLI public surfaces and
adds an out-of-package docs regression fixture. The docs overlay governs source alignment, state vs
target separation, link integrity, terminology, and drift.

## Current Doctrine Verdict

The described packages retain their current doctrine verdicts: database `Refactor`, Fresh
`Restructure`, SDK `Keep`, contracts `Keep`, and CLI `Restructure`. This leaf documents verified
current behavior only and makes no doctrine-compliance claim.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A1 | Public and generated schema types define the shapes the documentation must show. |
| A2 | The DB-less and DB-backed paths remain explicit instead of hiding generation behind magic. |
| A3 | Tab 0 is optional progressive disclosure; the simple contract-first path stays readable. |
| A14 | Compile fixtures, docs gates, diagram parity, links, and browser checks preserve accuracy. |

## Goal

Fully resolve issue #1332 in one draft PR by teaching generated DB schemas as the normative optional
predecessor for DB-backed products, correcting the homepage type/cache example, proving every new
snippet, and preventing the two alias emitters or CRUD exports from drifting silently.

## Scope

- Add the optional DB predecessor to the type-flow diagram and homepage contract tabs.
- Correct homepage claims and provide the scaffold-shaped SDK/query factory module before the page.
- Correct the contract explanation and add private-field omission plus explicit relation composition.
- Add the required database/contracts/route/server/builder/service cross-links.
- Add the narrow `docs:contract-derivation` fixture and three failing negative cases.
- Produce compile, link, rendering, responsive, semantic, and lock-equality evidence.

## Non-Scope

- No framework behavior or `packages/**`/`plugins/**` source changes.
- No reusable site-wide snippet extractor; issue #1374 owns that expansion.
- No relation-aware generated schema claim and no generated nested-input claim.
- No edits to issue #1332, no merge, no ready-for-review transition, no IMPL-EVAL impersonation.
- No changes in `/home/codex/repos/ns-homepage-type-flow`.

## Hidden Scope

- Both independent `@database/zod` alias emitters must participate in the fixture.
- The homepage tab-3 defect requires a pre-fix failing check and a post-fix passing check.
- PR body evidence must exactly mirror all eight live acceptance boxes.
- Every slice must update run artifacts, commit, push by explicit refspec, and receive a PR comment.
- Both lock files must remain byte-identical to baseline.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Add a real first tab labelled as optional. | Existing tabbed disclosure avoids permanent weight for DB-less readers. |
| D2 | Homepage shows one narrowed model; `contracts.md` carries depth. | Keeps the landing page concise. |
| D3 | Use real `<Model>Schema`/`CreateInput`/`UpdateInput` names only. | Matches the generated CRUD barrel. |
| D4 | Use only in-repo verified examples and names. | Public docs cannot depend on private projects. |
| D5 | Compose `Product` and `Warehouse` relation output explicitly. | No relation-aware barrel export is verified. |
| D6 | Fixture paths and root task names are fixed by plan v2. | Enables future #1374 absorption without duplicate tooling. |
| D7 | Add `.withSearchParams(z.object({ limit: z.coerce.number()... }))`, reconcile contract naming, and keep `getCachedEntry` server-only. | Corrects the proven route-search/input mismatch while preserving cache-first flow. |
| D9 | Preserve both lock files by byte and expected Git object ID. | Validation must not introduce dependency churn. |
| D10 | Report snippet/page/line/command/result evidence, including pre-fix FAIL. | Compile evidence is the acceptance bar. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Tab label wording | safe to defer | Must visibly say optional; exact concise wording is editorial. |
| Cross-link sentence wording | safe to defer | Destinations and direction are locked. |
| Browser evidence file names | safe to defer | Store reproducible output under the run dir; do not commit screenshots unless needed. |

No unresolved decision would force implementation rework.

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Fixture accidentally compiles through only the root alias | Resolve the documented module from generated `contracts/deno.json`; test root and contracts aliases independently. |
| Mock generator output makes the test tautological | Invoke the real `writeCrudZodBarrel` and real scaffold emitters. |
| Homepage snippet looks correct but does not type-check | Assemble complete scratch modules and record pre-fix FAIL/post-fix PASS with `deno check --unstable-kv`. |
| Docs accuracy literals or unknown xref keys break the build | Run `docs:accuracy`, use only generated aliases, and use plain URLs where xref keys do not exist. |
| Diagram SVG drifts from Mermaid | Render through the repo task and require `diagrams:check` exit 0. |
| Validation rewrites locks | Check Git diffs and exact object IDs after relevant commands; restore only baseline lock paths if rewritten. |
| Homepage structure breaks hard assertions | Preserve the two `h2` headings and exactly five destination links. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-6 speculative abstraction | risk | Keep the fixture narrow and issue-specific; #1374 owns extraction. |
| AP-14 duplicated contracts | existing docs risk | Derive API schemas from generated schemas while explicitly selecting public fields. |
| AP-17 unverified public surface | existing docs risk | Check every symbol with `deno doc`, `deno why`, or the real generator fixture. |

## Fitness Gates

Package fitness gates F-1 through F-19 are N/A because no `packages/**` or `plugins/**` source is
changed. The docs overlay and owner-specified scoped TS/docs/browser gates are required.

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `.llm/harness/debt/arch-debt.md` | none | This leaf neither changes package structure nor claims existing verdicts are resolved. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | Contract derivation | `rtk proxy deno task docs:contract-derivation` | PASS, including three non-zero negative fixtures |
| 2 | Fixture quality | scoped check/lint/fmt wrappers over `.llm/tools/docs` | PASS |
| 3 | Diagram parity | `deno task diagrams:render` then `deno task diagrams:check` in `docs/site` | PASS |
| 4 | Root docs | `rtk proxy deno task docs:links`; `rtk proxy deno task docs:accuracy` | PASS |
| 5 | Site | source-format, build, links, caveats, diagram parity from `docs/site` | PASS |
| 6 | Snippets | scratch `deno check --unstable-kv` modules plus derivation fixture | Required FAIL/PASS sequence and final PASS |
| 7 | Browser | Playwright at 390/1024/1600 in light/dark | Tabs, links, diagram, semantics, no overflow |
| 8 | Locks | exact Git diff and object IDs | No diff; expected two hashes |

## Dependencies

- Real generator and scaffold sources on the branch baseline.
- Local Deno 2.9 toolchain and package cache.
- GitHub draft PR and per-slice comments.
- Supervisor-controlled separate IMPL-EVAL after this implementation handoff.

## Drift Watch

- Any difference in generated export names, alias targets, `withSearchParams` resolution,
  query-factory surface, cache-provider requirement, xref keys, or diagram/render tasks.
- Any need to touch `packages/**`/`plugins/**`, existing gates, lock files, or the foreign prototype.
