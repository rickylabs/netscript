# S5a implementation evidence

Final framework source head: ccdac3a8b2464ab7c25302db5eac901ca72d930e, plus the generated
Aspire manifest freshness repair (two helper/test rows plus the archival lesson row). Root check/lint/fmt/docs and publication receipts record the parent head
with the S6c working tree; final token and quality receipts record the source
head. Exact final-head CI must independently verify the pushed tree. Raw logs,
structured wrapper JSON, durable gate receipts and independent transcripts are
retained privately in the project run. This record carries relative paths and
verdicts only; exact-head GitHub check links are added after CI.

## Behavior and negative controls

- Explicit figma:ci PASS:15 source files checked,12 tests passed,0 ignored,
  browser main IIFE and iframe ESM built. Stateful Plugin API mock reproduces all
  ten handoff files byte-for-byte:9 collections,2186 variables. DTCG format and
  resolver use the official2025.10 schemas; full inverse retains modes, aliases,
  raw float precision, WEB syntax, scopes and oklch extensions.
- Native import tests cover alias cycles, type/mode/name errors, WEB removal,
  stable IDs and alpha spelling. Main bundle executes without DOM/decompression
  globals. Actual Figma host execution is UNPROVEN.
- GitHub API mock changes Scheme bevel/edge Light and one Theme Studio scalar,
  creates exactly one file/tree entry and PR, and checks the complete theme diff
  permits literal values/oklch only. Unknown names, aliases/metadata changes,
  compact baseline formatting and reordered baseline keys refuse all POSTs.
- Name checker PASS on pinned2186 variables plus portable fixture. A supplied
  item with unknown WEB name fails nonzero with collection/variable/CSS name.
  Required quality CI executes explicit plugin gates even for tools-only paths;
  README supplies the same checker for export theme repositories.
- URL service tests4/0/0; init/preset regressions27/0/0; final grouped URL/native/
  init selection14/0/0; dependent-retention control1/0/0. Negative URL/schema/
  compiler/name/local-edit/custom-root/path cases preserve staged application
  state. Replacement preserves external dependents on a retired lock entry.
- Native command acceptance uses a real loopback HTTP theme export and one
  local-source init --preset URL in a clean scaffold, then runs its deno task
  check successfully. Actual ui:apply and a later tokens build retain the
  modified values. Invalid schema preserves lock/CSS. Test cleans its project.

## Repository and publication gates

- Root check PASS:4031 files,34 batches,0 failed batches.
- Root lint and fmt PASS:2768 files each,38 batches,0 findings. These scopes
  exclude tools and CLI, covered by explicit plugin and scoped CLI wrappers.
- Scoped CLI check/lint/fmt PASS:16 files,0 findings. Plugin scope15 files.
- docs:accuracy PASS:111/111 direct commands,176 recursive paths; both live
  --preset options ratified. docs:exports-drift and source formatting PASS.
- Generated agent prose, MCP export corpus, assets barrel and publish assets
  current. Every root check:* task passed:desktop-native-fixture,emitted-samples,
  streams-types,child-health-docs,mcp-export-corpus,assets-barrel,agent-docs-prose,
  publish-assets,scaffold-versions,aspire-version-parity,netscript-jsr-specifiers,
  aspire-host-ports,figma-names,review-threads. Thread gate:0 unanswered.
- release:preflight PASS; workspace publish:dry-run PASS; native Fresh UI
  publish-size test1/0/0, below5MB. No docs/site/deno.lock churn committed.
- tokens:validate PASS, including canonical source freshness across96 inputs;
  tokens:check PASS:88 outputs and24 theme presets. Existing theme sources and
  approved handoff bytes remain unchanged.
- CLI JSR audit PASS. Fresh UI audit retains the exact baseline JSON @module
  false positive; new folder warnings eliminated. Full Fresh UI doc-lint has
  the same124 inherited findings as baseline; tokens.ts entrypoint exits0.
  These inherited failures are not represented as green whole-package gates.

## Explicitly unproven

The exact canonical command was executed:
`deno task e2e:cli run scaffold.runtime --cleanup --format pretty`.
It exited1 in preflight because Docker daemon is unavailable, before runtime
resources started. Runtime verdict:UNPROVEN, as explicitly permitted by brief.
Leak reporter:24 unproven survivors,0 positively owned survivors,0 mutations.
Foreign/unknown resources were left alone; only counts are retained publicly.

Optional Chromium UI smoke could not launch (missing libnspr4.so), so browser UI
execution and actual Figma editor acceptance remain UNPROVEN. Fixture/schema/
mock/sandbox and bundling evidence is separate from those native-host claims.
Code Connect remains deferred phase2 after #2488; Refs #2418, no auto-closure.

## Evaluation and readiness

All source slices independently reviewed PASS by the same native read-only
Claude Opus5.5/high session. Formal IMPL-EVAL PASS; see evaluate.md. This is not READY;
required checks must be green on the final exact head before the READY report.

Pinned upstream MIT LICENSE independently fetched at the NOTICE SHA and compared
byte-for-byte: PASS. Formal evaluator was offline for that comparison.
