# IMPL-EVAL Repair Evidence — #812 F1/F2

Date: 2026-07-17

Authorizing evaluator verdict: `FAIL_FIX` from
`/home/codex/repos/netscript-beta10-cli/.llm/runs/beta10-cli--orchestrator/slices/811-canary/evaluate.md`.
The earlier generator-arranged Qwen PASS artifact is retained for history but is not treated as the
authorizing verdict.

## Merge repair

- Fetched and merged `origin/main` at `aa14e452` into `feat/811-release-canary`.
- Resolved the expected conflicts in `cut.ts` and the release skill source/mirror.
- `prepareRelease()` remains the single stable/canary gate owner and now also runs main's
  `gen:publish-assets` before residue/readiness, returning the generated assets in the staged file
  set.
- Release doctrine preserves canary-first publication, same-semver retry, exact-version
  `--minimum-dependency-age=0` resolution, generated publish assets, and the canonical #810
  preflight/sunset language. Source and mirror are byte-identical.

## Live negative proofs on the merged tree

Each probe ran `deno task publish:readiness`; every seed was removed immediately afterward.

| Seed | Required result | Observed evidence |
| --- | --- | --- |
| `packages/config/mod.ts`: text import with `with { type: 'text' }` | FAIL | exit 1; `import-attribute-preflight: FAIL`; detector required generated TypeScript constants and printed both `denoland/deno#35546` and authenticated-canary sunset conditions |
| `packages/config/mod.ts`: `jsr:@netscript/contracts` without a version | FAIL | exit 1; `versionless-specifiers: FAIL`; `framework-emitted or executed jsr:@netscript/* specifier must include a version` |
| registry-absent `@netscript/readiness-seed` with a nonstandard README | FAIL | exit 1; `first-publish: FAIL`; reported missing `# @netscript/` H1, Install, Quick example/start, Docs link, and docs-site reference |

The final seed-free `deno task publish:readiness` returned exit 0 with all eight composed rows PASS
and the #35546/authenticated-canary sunset in the canonical-preflight evidence.

## Automated gates

| Gate | Result |
| --- | --- |
| Full release-tools suite | PASS — 61 passed, 0 failed |
| Real-preflight readiness unit | PASS — spawns the actual `preflight-text-imports.ts` CLI against a seeded fixture; no mocked detector throw |
| Release TypeScript check | PASS — 32 files, `--unstable-kv`, 0 findings |
| Release TypeScript lint | PASS — 32 files, 0 findings |
| Release TypeScript format | PASS — 32 files, 0 findings |
| Changed-file quality | PASS — 4 repair TypeScript files, 0 findings, 0 allowances |
| Skill source/mirror sync | PASS — 17 skills, 21 mirrored files |

No live JSR publish was performed. The branch remains draft and requires a fresh supervisor-triggered
IMPL-EVAL; this repair does not self-certify.
