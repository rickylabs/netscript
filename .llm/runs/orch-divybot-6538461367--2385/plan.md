# Plan & Design — READY FOR REVIEW

Scope: SCOPE-docs; no package/plugin architectural changes, no JSR audit needed. Existing public CLI contract is the authority. Dispatcher leaf profile applies. PLAN-EVAL is required explicitly by the owner even though this is a bounded docs correction.

## Locked decisions

1. Correct the lifecycle table to `netscript plugin update <name>` and `netscript plugin update workers`, describing host re-pinning/regeneration. Add explicit installed-name guidance and a concrete example in the CLI command reference consumed by the docs bundle.
2. Extend the existing docs:snippets source scan with a small CLI-example policy. Inspect full Markdown/Vento source so inline code, HTML tables and fenced commands all receive the guard across every page, independent of the TypeScript coverage floor. Reject scoped package specifiers and jsr:-prefixed specifiers after plugin update, including quoted operands and wrapped whitespace; allow installed names, placeholders, flags, and package specifiers for install.
3. Cover the policy with source-analysis integration tests in the existing snippet-extractor test entrypoint. Add a named negative fixture to the existing snippets CLI and document it in snippet-coverage.md.
4. Verify against the unchanged main public CLI in an isolated scratch project, with no services started. Record actual update exit and generated registry evidence. Use help output to verify spelling.
5. Preserve docs-only scope including run artifacts. Do not regenerate or commit package carriers. Report freshness conflict if CI requires the excluded carrier update; never weaken a gate.

## Slices and gates

- S0: run bootstrap and plan; files in this run directory; plan review is the gate. Commit/push and open draft PR now.
- S1: guide/reference corrections, CLI-example policy, snippet-policy integration, extractor tests, worker negative-fixture registration, fixture, snippet-coverage documentation, and run updates. Gates: structured check/test/lint/fmt wrappers for changed TS; docs:snippets; raw negative-fixture exit and real-page reintroduction control; docs build/link/caveats; public main CLI update success. Separate read-only review before sign-off commit. Commit/push and record scope/evidence on PR.
- S2: evidence and close record only; final implementation review at the exact pushed SHA after readiness and current CI inspection. No further commit after that review; publish verdict in PR/final report.

## Risks and mitigation

- Inline HTML regression escapes fence-only parsing: scan complete source and test the actual lifecycle-table shape.
- False positives on valid install commands/installed names: focused positive controls and command-specific matching.
- CLI fixture may need registry access: exercise the real public command, record failure honestly if unavailable; no mocked success claim.
- Generated docs carrier freshness conflicts with docs-only scope: preserve gates, report exact check and coordinator follow-up. No outside-scope write.
- Final review becomes stale: compare local, pushed, PR heads before final evaluation and do not commit its result afterward.

## Open decisions / deferred scope

No unresolved design decisions. Carrier publication is safe to defer to coordinator as mandated by the docs lane; report it as unproven if required. General shell parsing and validation of all CLI verbs are outside this bounded defect. No CLI or runtime/scaffold changes, no local scaffold.runtime E2E, labels, milestones, merge, tag, or release.

## PLAN-EVAL refinements before implementation

PASS, no blockers. Adopt N2: reject `<pkg>`, `<package>`, `<specifier>` placeholders including HTML entities. N3 exact S1 files: docs/site/orchestration-runtime/how-to/add-a-plugin.md; docs/site/reference/cli/commands.md; .llm/tools/docs/{cli-example-policy.ts,snippet-policy.ts,snippet-extractor_test.ts,check-snippets-worker.ts,snippet-coverage.md}; .llm/tools/docs/fixtures/plugin-update-package-specifier/docs/site/page.md. N4 terminology is source-aligned to public CLI help (“installed plugin”). N1 carrier freshness is expected to fail until a coordinator-authorized refresh; a READY delivery is not a merge-ready claim while it fails.
