# Amendment PLAN-EVAL — follow-up verdict (AI peer correction plan, #2036 / PR #2087)

- Evaluator: same independent GLM max session family (opencode-go/glm-5.3-flash); re-evaluation of
  `amendment-plan-evaluate-1.md` `FAIL_FIX`, scoped per `amendment-plan-eval-followup.md` to the five
  remediated textual findings and the qualified version choice only. Plan-only; source implementation
  remains hard-stopped. No source/config/lock/branch/history/public-metadata writes; no delegates,
  CI polling, or sleeps; no repeat of already-established skill/doctrine/source/registry reads
  beyond the two changed declarations and cold-graph corroboration.
- Exact current head: `46ec3293b5f5474ab7816786d5221af536cae50f` (`fix/ai-peer-compatible-ranges`
  "docs(harness): remedy AI amendment plan gate findings"); qualification commit
  `be6557c0debf871e296f7d5f272a5b3b08c090b8`. Working-tree `plan.md` append verified identical to
  HEAD. Immutable AI source identity unchanged from `-1`: `76381639db9061222c517e2260d91daab1473ae3`
  (superseded PASS), source tree `b03385dc31cfee4df098639d5c22cd616db38d00`, baseline
  `872df8e21e0a8bf06cd0796c7808068dd67e2c4e`, CI head evidence `f2bbce3e…`.
- Inputs read: plan.md appended sections (lines 25–43), `age-qualified-family-graph.json`,
  `amendment-plan.md` (qualification-era evidence copy), npm stable-channel metadata for the two
  changed members and the transitive client.

## Checklist (re-evaluated findings only)

| Item | Result | Evidence / location |
| ---- | ------ | ------------------- |
| Commit slices | PASS | plan.md lines 31–37: A1 pins; A2 guard sweep + selection regression with separate selection/policy mutations; A3 dual-lock selective refresh; A4 bridge/docs + quality/JSR/doc-lint + F-7 adjudication; A5 fresh IMPL-EVAL. Ordered, each < 30 files, files + proving gates named. |
| Risk register | PASS | plan.md line 39: API drift, lock drift, peer surprises (exactly-one-core guard), guard cost (bounded concurrency), age policy (no bypass), shipment still owner work — each with mitigation. |
| Open-decision sweep | PASS | plan.md line 41: regression host resolved now (exported graph-inventory helper + retained policy regression); optional peers, lock mechanism, API adaptations marked safe-to-defer with detectors; version choice settled. |
| Mutation invariant | PASS | plan.md line 34: "mutations MUST disable graph selection and peer-policy separately, each fail then restored pass" — stronger than the `-1` requirement. |
| jsr-audit rubric | PASS | plan.md line 43: slow-type/private-reference risk named, all-export `deno doc --lint`, publish dry-run, `audit-jsr-package` for AI/Fresh, re-audit-or-rescope trigger, and the "never declare doc-lint green from a zero combined summary; baseline F-7 debt adjudicated only by independent evaluator" rule. |

## Family qualification (the one material change)

Verified against npm stable-channel metadata (2026-10-08) plus the provided cold graph:

- **Changed member 1 — core `0.65.0`**: exists; sole peer `@opentelemetry/api >=1.9.0` (optional);
  dependencies exactly match the graph (`@ag-ui/core 1.0.0`, `@tanstack/ai-utils ^0.4.1`,
  `@tanstack/ai-event-client ^0.13.1`, `@standard-schema/spec ^1.1.0`, `partial-json ^0.1.7`,
  `fast-json-patch ^3.1.1`).
- **Changed member 2 — Preact `0.19.5`**: peer `@tanstack/ai ^0.65.0` — admits the pinned core
  (0.20.0's `^0.65.1` would not); dep `@tanstack/ai-client ^0.37.0`; `@mcp-ui/client ^7` and
  `preact >=10.11.0` optional/unchanged.
- **One-core proof**: `@tanstack/ai-client@0.37.0` has no peers and depends on `@tanstack/ai
  ^0.65.0` — the decisive declaration, since `0.38.0` requires `^0.65.1` and would fork a second
  core. Anthropic 0.19.5, OpenAI 0.27.0, openai-base 0.12.4 all peer `^0.65.0`; MCP 0.8.0 and the
  client are dependencies on `^0.65.0` (unchanged from `-1`). `age-qualified-family-graph.json`
  resolves exactly one `@tanstack/ai@0.65.0` across all npmPackages with no module errors — a
  registry-level consequence of the verified declarations, not merely an assertion. openai 6.49.0,
  @modelcontextprotocol/client–server 2.3.1, zod 4.6.5 and the other resolutions fall inside their
  declared ranges.
- **Age policy consistency**: 0.65.1 / 0.20.0 published 2026-10-07T12:53Z (hours old);
  0.65.0 / 0.19.5 published 2026-10-06T13:3xZ. The "immediately preceding, default-age-qualified"
  selection is the coherent remaining family; the default policy is preserved, not bypassed, and no
  manifest/lock/policy change is planned beyond the named AI-family edges.

## Verdict

`PASS` — the amendment plan (with the remediation and qualification update at `46ec3293b`) satisfies
the Plan-Gate: all five prior findings checked, and the qualified family core 0.65.0 / Anthropic
0.19.5 / OpenAI 0.27.0 / MCP 0.8.0 / Preact 0.19.5 (transitive ai-client 0.37.0, openai-base 0.12.4)
is independently verified peer-coherent on exactly one core at the registry level. Implementation of
the A1–A5 slices may begin.

Conditions carried into implementation/IMPL-EVAL (unchanged obligations, not new findings): frozen
provider/Fresh/FreshUI checks, provider suite, production bundles, separate selection-and-policy
mutation proof, quality/JSR/doc-lint with explicit F-7 adjudication against
`ai-doc-private-ref-baseline-2036`, then a new independent IMPL-EVAL on final source. Original
source PASS remains superseded; no merge, publication, or release claims; `Refs #2036` stays
until a fixed published consumer exists.
