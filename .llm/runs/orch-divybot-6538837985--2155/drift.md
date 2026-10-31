# Drift

- Intake: RTK is not installed; direct commands preserve real exit codes.
- Owner override: Claude Opus 5.5 high for evaluations; exact grant in worklog.
- Scope risk: generated package carriers are prohibited by the assignment. Any stale carrier verdict remains unproven until coordinator integration; never weaken that gate.
- The assignment asks for Acceptance boxes, but live issue has none. Map all twelve numbered items instead.

- Verified scope conflict: prose freshness check passes before docs edits and fails after them with stalePaths [`agent-docs-prose.generated.ts`]. This carrier is under packages/cli and cannot be updated in E2's assigned surface. Coordinator integration is required; no gate is weakened.
- First docs verify caught one incorrect new anchor; fixed it and reran full verify successfully.
- New docs tool lint is excluded by root config; explicit root-rule config without exclusions processes the owned file and passes.

- Independent S1 review PASS for docs. Its suggested publish-assets check was run: PASS, because it embeds the existing carrier. Do not confuse that result with fresh rendered-site prose; coordinator must rerun the chain after regeneration.

- Final CI preflight found the Aspire scan manifest stale because the restored worker lesson now mentions Aspire. Scope addition: regenerate only `.llm/tools/validation/fixtures/aspire-surface-manifest.tsv` with its existing generator. This is docs tooling allowed by the assignment; it adds the maintained lesson to the scan, without changing scan rules, exclusions or package/plugin code. Record as a small follow-up slice before exact-head evaluation.

- Coordinator authorization resolves the generated-package boundary: https://github.com/rickylabs/netscript/pull/2494#issuecomment-6539166396. Only canonical generator outputs required for docs carrier freshness may change under packages. No authored framework source or plugins changes. Final review must name the new exact pushed head.

- Main integration required after #2487 landed (8902e1a). One generated prose-carrier conflict; resolve through canonical generation against incoming main's corpus, retaining the merged docs. No rebase, force push or authored runtime conflict. Final evaluation and gates must use the new merged head.

- Post-READY main advanced to 4060d1e61da0a8324e77ed351b05a343d746a188. One generated CLI prose conflict; canonical regeneration from merged docs resolves it. Incoming file-watch identity documentation is preserved. The prior c37a625 MERGE/green checks remain historical. No rebase, force push or authored framework conflict.

- Another post-READY integration: main67d4704 (#2496 Redis listener concurrency). One generated CLI prose conflict; canonical regeneration preserves incoming worker tuning and the audit layout correction. Previous b9aa6cd round4 MERGE is historical. Next exact-head evaluation is the final allowed round5; no rebase or force push.
