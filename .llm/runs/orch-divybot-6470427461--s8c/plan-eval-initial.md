**Verdict: FAIL_PLAN**

There is one blocking finding. Everything else in the plan passes the plan gate (checklist below).

### Blocking finding 1: the final state of API kind tags is undecided and no slice proves it

- **Where:** `.llm/runs/orch-divybot-6470427461--s8c/plan.md` slice 2 and slice 6.
- **Problem:**
  - Slice 2 colours the kind tags with "non-red existing status roles until syntax export". That says the colours change after slice 6, but slice 6 doesn't include kind tags in its files, its mapping or its assertions. So the final colour source for the tags is an open decision, and the open-decision section doesn't list it. Leaving it open means either slice 2 gets redone without a gate, or the tags keep a temporary mapping that IMPL-EVAL can't check against a stated target.
  - Slice 2 also says the tags "distinguish class/function/interface/type/const". The non-red status roles are only info, success and warning, plus neutral (`docs/site/styles/tokens.css`). That is at most four tones for five kinds, so colour alone can't tell them apart as written.
- **Correction (pick one and record it under Open decisions):**
  - **(a)** Status roles are the final authority. Remove "until syntax export". State that each kind is identified by its visible label, with the tone mapping given (for example, which kinds share a tone). Keep the slice 2 gate as is.
  - **(b)** Kind tags move to generated syntax roles in slice 6. Add `apiTable.vto`, the kind map and the component CSS to slice 6's files. Add browser assertions that each tag's computed colour comes from the generated role. Add an AA contrast check for each tag against the API table background in both schemes, alongside the existing check of seven syntax roles on the code background.

### Plan-gate checklist evidence

- **Research present and current: yes.** Baseline d6dfab0 matches main. #2452 is correctly recorded as still open, and its fixes are reused in slice 5 rather than assumed to be in main (`drift.md`). Spot checks match the source:
  - Callouts only colour warning and error (`docs/site/styles/components.css:431-444`, `docs/site/_components/callout.vto`).
  - The highlighter registers only bash, json, TypeScript and plaintext (`docs/site/_config.ts:114-128`, `docs/site/deno.json`).
  - Style policy follows aliases and limits red to error/destructive selectors (`tools/docs-site/style-policy.ts:139-184`).
  - The Pages artifact upload runs `if: always()` (`.github/workflows/pages.yml:259`).
  - The axe filter is serious/critical (`tools/fresh-ui-browser/docs-tests/docs.spec.ts:34`).
- **Decisions locked: yes, except finding 1.**
  - **Colour authority comes only from tokens.** The generator emits `--ns-*` names only from the exported `codeSyntax` (`tools/docs-site/generate-tokens.ts:111-153`). The plan forbids authored colour values.
  - **Old declarations stay compatible.** Baseline light/dark declarations are saved as a fixture, and exact string equality is asserted.
  - **Generator extension matches the docs.** Adding Theme set mode A and the Theme B context matches `docs/design-system/GUIDELINES.md` §2.2.
- **Open-decision sweep: no, because of finding 1.** Waiting for the export's exact names until slice 6 is safe, because no new colour is introduced before then. #2450 and #2453 are explicitly deferred, and HTML stays byte-identical.
- **Commit slices: yes.** There are six, in order, each with files and a proving gate:
  - Callouts: NOTE/TIP/WARNING/CAUTION+ERROR mapping, with style-policy in scope.
  - Code headers: one header and shared labels, tested for keyboard, copy and no-JS.
  - File paths: ellipsis plus title, with a mobile check.
  - #2451: the #2452 reconciliation.
  - Figma syntax roles and IMPORTANT.
- **Risk register: yes.** It covers a missing export (BLOCKED, never made-up data), token drift, syntax AA, style-policy parsing after bundling, tab regressions, reproducibility and privacy.
- **Gate set selected: yes.** It includes the structured wrappers, docs verify, exports-drift, snippets, token freshness, and the browser matrix at 390 and 1280 px in light and dark across six page types. Axe serious/critical findings must be zero, the real negative controls must still fail, two builds must match, and generated-doc freshness, classifier tests and the full CLI E2E at readiness are all required.
- **Deferred scope explicit: yes.** #2450, #2453, and no package API, dependency or release work.
- **jsr-audit: N/A, with a stated reason.** This is a docs/tooling wave with no package surface.

Implementation should not start until finding 1 is fixed in `plan.md` and re-reviewed.
