use harness

## SKILL

- netscript-harness — perform the Amendment A1 substantive Slice 2 review; no self-certification.
- netscript-doctrine — review Archetype 2 framework code, contract-first design, helper justification, and dependency direction.
- netscript-tools — verify structured gate evidence and lock hygiene.

You are a fresh independent opposite-family reviewer for Slice 2 of issue #1824. Work read-only. Do
not edit, commit, push, or contact GitHub. The implementation session is Codex
`01a05611-ee74-7ff2-9234-8e00691a3523`; you must be a distinct native Claude session.

Inspect the diff from HEAD, the complete run artifacts under
.llm/runs/fix-sdk-browser-full-key-normalization--impl, and the relevant SDK/Aspire source. Verify:

1. The SDK browser full-key resource segment applies Aspire's exact `/[^a-zA-Z0-9_]/g` rule.
2. The implementation comment names `packages/aspire/src/application/build-vite-env-var-name.ts`
   as contract source and the cross-package test protects parity.
3. `createBrowserServiceShortEnvKey` and `createServerServiceEnvKey` behavior/code are unchanged.
4. There is no production SDK↔Aspire dependency, no public export change, no `any`, unsafe cast,
   lint-ignore, lock change, or unrelated source edit.
5. The RED→GREEN evidence and every user-required gate/result in worklog are truthful. Independently
   rerun the smallest checks needed to substantiate the verdict; do not start Aspire, Docker,
   Playwright, or any runtime service.

Return exactly:

VERDICT: PASS or CHANGES_REQUESTED
IDENTITY: observed model/effort/session
FINDINGS: numbered findings, or none
GATES: commands and exit codes you independently ran
EVIDENCE: concise paths inspected
