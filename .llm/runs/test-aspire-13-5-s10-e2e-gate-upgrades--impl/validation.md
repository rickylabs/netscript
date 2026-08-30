# Phase-A validation — S10 #1722

| Gate | Verdict | Evidence |
| --- | --- | --- |
| RED-first contracts | expected fail, 0/6 | `receipts/01-red-structured-gates.json` |
| Scoped `deno check --unstable-kv` | pass, 187 files, 0 diagnostics | `.llm/tmp/s10-check.json` |
| Scoped lint | pass, 179 files, 0 findings | `.llm/tmp/s10-lint.json` |
| Scoped fmt | pass, 179 files, 0 findings | `.llm/tmp/s10-fmt.json` |
| Config-excluded catalog lint/fmt | pass | raw stdin `deno lint` / `deno fmt --check` |
| CLI-E2E tests | pass, 186/186 | `.llm/tmp/s10-tests.json` |
| `quality:scan` | pass | `.llm/tmp/s10-quality-scan.log` |
| `arch:check` | pass, no failures | `.llm/tmp/s10-arch-check.log`; intentional warning D-04 |
| `check:assets-barrel` | pass | `.llm/tmp/s10-assets.log` |
| `check:publish-assets` | pass | `.llm/tmp/s10-publish-assets.log` |
| `check:emitted-samples` | pass, 47 samples / 37 paths | `.llm/tmp/s10-emitted-samples.log` |

The `.llm/tmp` logs are local transient evidence; this committed summary and the PR commit/comment
trail are the handoff record. No Phase-B runtime command was run.
