# Final verification — Deno 2.9.7

Source head: `7d9fd6a94d82d12e3accc9eca198efe66d655466` plus the isolated template assertion correction. No emitted source/carrier changed after visual acceptance.

| Gate | Result | Evidence |
| --- | --- | --- |
| `check:desktop-native-fixture` | PASS (exit 0) | `s4-check-desktop-native-fixture.log` |
| `check:emitted-samples` | PASS (exit 0) | `s4-check-emitted-samples.log` |
| `check:streams-types` | PASS (exit 0) | `s4-check-streams-types.log` |
| `check:child-health-docs` | PASS (exit 0) | `s4-check-child-health-docs.log` |
| `check:mcp-export-corpus` | PASS (exit 0) | `s4-check-mcp-export-corpus.log` |
| `check:assets-barrel` | PASS (exit 0) | `s4-check-assets-barrel.log` |
| `check:agent-docs-prose` | PASS (exit 0) | `s4-check-agent-docs-prose.log` |
| `check:publish-assets` | PASS (exit 0) | `s4-check-publish-assets.log` |
| `check:scaffold-versions` | PASS (exit 0) | `s4-check-scaffold-versions.log` |
| `check:aspire-version-parity` | PASS (exit 0) | `s4-check-aspire-version-parity.log` |
| `check:netscript-jsr-specifiers` | PASS (exit 0) | `s4-check-netscript-jsr-specifiers.log` |
| `check:aspire-host-ports` | PASS (exit 0) | `s4-check-aspire-host-ports.log` |
| `check:figma-names` | PASS (exit 0) | `s4-check-figma-names.log` |
| `check:review-threads` | PASS (exit 0) | `s4-check-review-threads.log` |
| `check:design-skill` | PASS (exit 0) | `s4-check-design-skill.log` |
| `release:preflight` | PASS (exit 0) | `s4-release-preflight.log` |
| `docs:accuracy` | PASS (exit 0) | `s4-docs-accuracy.log` |
| `quality:gate` | PASS (exit 0) | `s4-quality-gate.log` |
| `publish:dry-run` | PASS (exit 0) | `s4-publish-dry-run.log` |

Additional evidence:

- Complete43-file CLI/template/resource/service suite:302PASS,0FAIL (`s4-scaffold-tests.json`).
- Structured check/lint/fmt:19 changed source files PASS; isolated test correction separately PASS. Generated empty/service/plugin apps pass scoped checks.
- CSS budgets:3PASS, no budget increase. Actual installed component/layout CSS175876raw/21828gzip bytes; page composition6668raw/1585gzip bytes.
- Browser:72 pagecases,12 interactionsets,0pageerrors;96images. Independent visual PASS, worst per-page fidelity/quality>=8.
- Publish asset regeneration no diff; all required carrier freshness checks PASS.
- CLI full-export doclint PASS. FreshUI full-export doclint FAIL124 diagnostics in unchanged baseline files; source attribution verified, no new exports. See s4-jsr-audit.md.

## Runtime — UNPROVEN

Exact command `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` exited1. Deno preflight passed; Aspire doctor and cleanup failed because the Docker daemon was unavailable. Runtime behavior never executed. This is not a policy skip, and the PR remains draft/not READY. Container cleanup could not be inspected; foreign/unknown Aspire resources remain untouched.

## Evidence handling

Allowlisted gates ran through the durable repository runner. Public copies normalize repository-root and tool-generated temporary paths; unchanged output hashes refer to raw captured bytes retained in private run evidence. Do not recompute raw hashes from normalized tails. Other gates retain exact argv and raw exit in s4-gates.json. Wrapper results are the scoped verdict source. Supplemental source comparisons do not replace required runtime or external evaluation.

## Remaining review

Final separate read-only Claude Opus5.5 high IMPL-EVAL: code PASS, no blocking findings. Merge readiness remains NOT READY because runtime is UNPROVEN. See impl-eval.md.
