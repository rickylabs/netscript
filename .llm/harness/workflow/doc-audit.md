# Documentation Audit Profile

This profile governs documentation changesets under the 2026-09-04 delegation matrix. Route the
writer through the workload tier's `documentation` cell and route accuracy review through the same
tier's `implementation_evaluation` cell. The active matrix and different-vendor-family rule in
[`lane-policy.md`](./lane-policy.md) are authoritative; historical `docs_audit` and `docs_polish`
lane names are deserialize-only.

## Pipeline

1. **Generate** — the selected documentation writer authors the changeset.
2. **Audit** — one separate, different-vendor-family evaluator audits the whole changeset and
   records a structured gate log.
3. **Fix** — re-steer the same writer session on the same model. A fresh fixer is exceptional and
   must be justified in the run log.
4. **Re-audit** — re-steer the same evaluator session. Documentation has a hard maximum of two
   evaluation rounds regardless of the tier's larger IMPL-EVAL allowance.
5. **Polish** — the writer edits in place for voice, flow, and precision after accuracy passes.
6. **Merge** — only after the exact-head gates and substantive review are green.

The audit unit is the entire changeset, never one pass per author. Cross-page contradictions,
baseline drift, and false completeness claims only become visible at changeset scope.

## Independence and evidence

The writer and evaluator must be separate sessions from different vendor families. If the first
evaluator candidate conflicts with the selected writer, skip it and continue the declared evaluator
chain. Every accuracy gate is executed by the evaluator; generator claims are not gate evidence.
Record workload tier, requested/observed identities, exact head, fallback reason, and any paid-route
expense decision.

## Polish doctrine

- Edit acceptable documents in place; do not spend tokens re-authoring them.
- Rewrite only when the audit explicitly found that the document requires a rewrite.
- Polish never changes technical claims. Accuracy doubts return to the audit cycle.
- Keep the same writer session when possible to preserve authoring context.

## Gate set

| Gate                       | What it checks                                                                                                         |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `deno task docs:links`     | Internal links resolve and the changeset leaves no dangling references.                                                |
| Site build                 | The documentation site builds cleanly with the changeset applied.                                                      |
| Internal-wording scan      | Changed public lines contain no issue/PR numbers, internal project names, or internal process vocabulary.              |
| Versionless-specifier scan | Pinnable `jsr:@netscript/*` examples use the `{{ releaseSpecifier }}` convention.                                      |
| Command/API accuracy       | Every documented command family is sampled against the live public entrypoint; API claims are checked with `deno doc`. |
| Template/generated drift   | Generated barrels, registries, and described output match their source templates.                                      |
| Navigation/front matter    | New pages are navigable, have correct front matter, and are not orphaned.                                              |
| Prose quality              | Heading structure, context, redundancy, and command setup are reader-ready.                                            |
| Cross-page consistency     | Changed claims do not contradict the rest of the documentation tree.                                                   |

## Gate log

The evaluator records one row per gate in the run artifact:

| Column     | Content                                                    |
| ---------- | ---------------------------------------------------------- |
| Gate       | Gate name from the table above.                            |
| Command(s) | Exact commands executed.                                   |
| Scope      | Files, pages, command families, and changed lines covered. |
| Result     | `PASS` or `FAIL`.                                          |
| Findings   | Concrete file/line/claim findings.                         |
| Proceeded  | Fixed in place, returned to writer, or blocked.            |

These logs are intended for later pattern-mining into `.llm/tools/docs/` automation. Keep them
structured and complete.

## Escalation

After two failed documentation evaluation cycles, stop the loop and surface the exact unresolved
decision/evidence boundary. Unrelated lanes continue.
