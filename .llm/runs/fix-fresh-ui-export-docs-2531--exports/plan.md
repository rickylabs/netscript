# Plan & Design — READY FOR REVIEW

Own all #2531 acceptance. Preserve runtime APIs, component behavior, dependency versions and the
contracts.json path/schema/content. No token/style/native redesign.

Package shape: Fresh UI is a runtime/behavior surface (Archetype 3); the touched declaration seam
is contract-only. Validation tools are Archetype 6. Apply documentation scope, with public consumer
and component tests protecting the frontend runtime. Existing folder-size/vocabulary warnings are
not deepened. Public-surface A1/A2, upstream-first A7 and anti-patterns AP-1/AP-5/AP-16 apply.

Locked decisions:
1. Document/export the types already referenced by public signatures. Compound namespaces use
   explicit structurally identical prop-to-VNode signatures, keeping implementations private.
2. Distinguish executable entrypoints from JSON data exports in reports. Validate data existence
   and JSON syntax; a data export never passes as an executable doc-lint run. Native Deno's JSON
   module-documentation limitation is stated explicitly. Do not filter actual TypeScript findings.
3. Cover the independent token-config entrypoint and every other published entry separately.
4. Retain zero suppression, zero runtime-removal and unchanged contracts.json constraints.

Slices: S0 research/bootstrap; S1 public documentation/type closure with package/consumer gates;
S2 truthful JSON export validation with real negative controls; S3 canonical generation, quality,
publication, independent final review and final-head CLI E2E CI.

Gates: structured full-export doc-lint, JSR metadata audit, native member publication dry-run,
Fresh UI package/public consumer/contract tests, tooling integration negative controls, scoped
check/lint/fmt, broader quality/architecture, carrier freshness and every root check task, required
CI including the canonical one-pass scaffold.runtime suite at final head.

PLAN-EVAL: N/A: bounded documentation/type visibility and gate repair with issue-defined contracts;
no runtime architecture choice or destructive migration. Independent implementation review mandatory.
No new accepted debt. Contributor path: packages/fresh-ui/interactive.ts for public types;
.llm/tools/run-deno-doc-lint.ts for export documentation reporting.
