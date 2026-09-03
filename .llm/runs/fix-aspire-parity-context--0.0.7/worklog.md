# Worklog

## Design

Public surface unchanged: existing parity task and structured ParityReport. Existing ManifestRow
class drives two explicit context rules; no new public ports, dependencies or package APIs.
One implementation slice (<10 source files): tests, checker, ownership generator and generated TSV,
resource-name JSDoc. Contributor path remains checker + adjacent tests + manifest ownership rules.
No runtime/resources or broad refactor. PLAN-EVAL N/A for the bounded false-positive correction.

## 2026-09-03 recovery

Clean baseline main 94fe507af. Five phase-2 failures independently reproduced by the primary.
Child launch failed/not-attached; coordinator co-authors and requires independent review before
sign-off. No changes made in other authors' worktrees. Bootstrap draft PR follows this checkpoint.

## Implementation evidence — 2026-09-03 08:52Z

Draft PR #1982 opened from bootstrap 85efd5ae4. Five source/manifest paths changed; no generated
consumer skill, lock, workflow, public API or runtime behavior changed. The guard classifier only
recognizes standalone direct three-argument forbidText statements, an identifier input and literal
or identifier location. Other strings/argument positions still undergo ordinary pin scanning.

- Red before repair: focused structured tests 20 PASS / 4 FAIL, the four genuine context cases.
- Green: 27/27 tests; phase 1 PASS (959 checked, fail 0); phase 2 PASS (959 checked, fail 0,
  info 17, skipped 1, missing 0, manifestFresh true). Generator: 960 rows, 0 unmatched.
- Structured check: 4 files, 1 batch, zero diagnostics. Structured fmt: 4/4, zero findings.
- Initial lint correctly refused root .llm exclusions (3/4 dropped). Re-ran with the same root
  recommended/jsr/no-process-global/no-node-globals rules and no exclusions: 4/4 processed,
  zero findings/refusals. Temporary config is ignored .llm/tmp/parity-lint.json.
- quality:scan PASS: zero findings, 7 existing allowances. arch:check PASS: all roots FAIL=0,
  existing warning-only findings. git diff --check PASS. Release/runtime gate N/A for this leaf.

These are author receipts, not self-certification. Next: independent substantive review and formal
IMPL-EVAL on committed head; CI and review-thread verification before coordinator sign-off/merge.

## Owner-directed scan-domain amendment — 2026-09-03 09:00Z

Owner explicitly requests all LLM generated run files and transient state be ignored and this
correction wrapped into existing #1982. Added one shared path policy and regression tests across
parity/host-port/polling checks; removed the generated-guide floor exception. Framework source,
maintained docs, shipped generated sources, and tooling remain checked. Retained run files untouched.

- Focused suite: 55 passed, 0 failed; live manifest excludes every run/transient path while
  retaining core/doc examples. A new polling fixture initially omitted its body timing signal;
  corrected it to the already-detected deadline/delay shape (no polling detector weakening).
- Phase 2: PASS, 867 checked, 0 failures, 0 missing, manifestFresh true; manifest 868 rows,
  0 unmatched. Host-port scan: PASS, 966 source files, no findings.
- Structured check/lint: all 10 selected source files processed, zero diagnostics/findings;
  format required the existing polling scanner's source formatting and is rechecked before push.
- Scope now 11 source/manifest files plus AGENTS.md and scoped run artifacts. No runtime behavior,
  dependency, generated consumer bundle, or workflow change; no host runtime lease.

## Shipped helper closure — 2026-09-03 09:11Z

CI quality33736337155 / job100587782925 failed Generated asset freshness. The modified host-port
checker is shipped by agent init, so its new shared scope helper also needs a consumer-tools
support-module entry and canonical embedded tool carrier regeneration. Corrected both in this PR.
No extra executable tool or external dependency. The focused suite including the existing real-bundle
relative-import closure test passes58/58. Regeneration changes only agent-tools.generated.ts.
No lock movement. Consume the original c487e9273 evaluation then review this bounded dependency/
carrier correction on the same independent evaluator session; no unrelated source changes.

## Generated-project safeguard — 2026-09-03 09:19Z

Kept repository scans blind to run/scratch artifacts, but preserved the existing release fixture's
deliberate validation of a scaffold created under scratch. The host-port checker accepts one
explicit --generated-project root; the E2E caller selects it. Its internal .llm/runs remains
excluded. Regenerated the embedded carrier after this change. No application/runtime output change.

- Structured focused suite: 64 passed, 0 failed/ignored, including both boundary regressions and
  the existing shipped-import-closure tests.
- Structured check and format: all 12 selected files processed, no failures or diagnostics.
- Structured lint: initial invocation used an unsupported wrapper flag and exited before lint;
  corrected to the documented --config option with the existing no-exclusion lint config.
- Phase 2: 867 maintained paths, 0 failures/missing, manifestFresh true. Host ports: 966 files, PASS.
- Independent evaluation is still running on c487e9273; this later delta needs its own receipt
  in that same independent session before approval. CI quality on 3b6dac6dd is now green.
