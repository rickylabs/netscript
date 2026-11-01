# Scaffold Utility pages — #2570

- Baseline: `0af8fd9e7904ee2c848d0a4213c7853edec3ad21`.
- Branch: `orch/divybot-6557001595`; repository root: `.`.
- Tier: feature; role: implementation; supplied dispatcher leaf profile applies.
- Author: Codex, owner-requested `gpt-6-astra`, high effort.
- PLAN-EVAL / IMPL-EVAL: separate read-only Claude sessions, owner-requested
  `claude-opus-5-5`, high effort. Visual evaluation: separate read-only
  `gpt-6-astra` session. No implementation self-certification.
- Routing inspected with `deno task agentic:matrix --tier feature --json`.
  Explicit brief routes override matrix defaults; exact grant recorded in worklog.
- Public artifacts use repository-relative paths and omit session identifiers.

## Authorized write surface

- This run directory (plans, evaluations, visual proof, gate evidence, memory).
- `packages/cli/src/kernel/assets/app/` scaffold templates.
- `packages/cli/src/kernel/application/` scaffold assembly and capability projection.
- `packages/cli/src/public/features/init/` template context if required.
- `packages/cli/tests/` and `packages/cli/src/**/*test.ts` focused scaffold regressions.
- CLI generated asset carriers and documented generated carrier chain outputs.
- Scaffold documentation if changed behavior requires it.
- `.divybot-final-report.md` (untracked publication handoff only).

No duplication of #2488 component implementations; no showcase plumbing (#2571).
Any additional surface must be declared as drift before editing.

Registration surface clarification: `kernel/assets/manifest.ts`,
`kernel/adapters/templates/scaffold-template-assets.ts`, and init's UI registry
item selection are authorized for new page assets/CommandPalette dependencies.
Known post-install clients may expose installed-unwired state; such a remaining
required state prevents full acceptance/READY. No post-init reconciler rewrites
are planned; request-time projection is the locked mechanism.

S2 registration extension: scaffold package constants and local/JSR import resolver
may add direct SDK discovery and workers contract subpaths required by generated
server capability loaders. This changes app dependencies, not plugin contracts.

S2 debt resolution authorizes an additive entry in .llm/harness/debt/arch-debt.md.
The existing service-add flow may connect a newly generated memory client to an
exactly unchanged scaffold records placeholder; authored files remain untouched.
This completes B2's safe template-owned client selection, not arbitrary inspection.

S2 correction extends the declared resolver surface to public/adapters/jsr-import-resolver.ts and maintainer/adapters/local-import-resolver.ts: public service-add fixture exposed missing direct-import entries. Both use existing release constants; version parity now exercises the actual public resolver.

S3 allows a minimal correction in the existing Fresh UI CommandPalette component
and its generated registry carrier: browser proof found keyboard Enter selects no
command because onValueChange is a no-op. Reuse the existing callback contract;
no new component or #2488 fork. App CSS/nav composition remains the design surface.

S3 shared CommandPalette correction also covers caller-owned filtering, conditional
empty rendering, reset on reopen and top offset in its existing CSS. L1 Combobox
explicitly leaves filtering to callers; this block previously omitted that work.
No API expansion. CSS budget measurement includes the changed offset bytes.
The existing palette render tests in packages/fresh-ui/tests/registry/components/ui/
command-palette.test.tsx are included in S3: hooks require a real Preact render.

S3 visual round1 FAIL: all page classes pass except command (7/7.5). Corrections
remain in the existing shared palette: native Dialog.Close with visible Esc/Close,
keyboard-help footer,16px SVG search and highlighted-row rule. No prop changes.
Capture a real ArrowDown active state and prove visible-close behavior. Reuse the
same Astra reviewer for round2; a second terminal visual failure ends the loop.

S3 terminal: independent code and visual PASS, accepted for sign-off.

Final independent IMPL-EVAL codePASS accepted for S4 sign-off. RuntimeUNPROVEN
prevents READY; draft retained. No next implementation slice or self-certification.

Supplemental same-session policy review distinguishes runtime cost-policy skip
(valid) from draft-skipped requiredCI (unproven). Initial draft delivery fulfilled;
review transition authorized to execute requiredCI. No labels or merge.

S5 CI repair authorizes canonical formatting of app layout/navigation templates,
manifest expectation correction in kernel/templates/app/generators-config_test.ts,
whitespace-independent shell assertion in template-asset_test.ts, embedded carrier,
and expanded focused test evidence. No behavior/UI redesign; independent review
before sign-off. Formatting equivalence must prove previous visual output retained.

S5 extends to existing route/navigation template test fixtures and public init
resource regeneration regression. Diagnose the conflict before choosing a fix;
retain idempotence and authored-file conflict protection. No test suppression.

S5 supervisor sign-off: independent implementation PASS plus final 387-test green
suite satisfies the review condition. Reviewed scope is 14 source/test/doc/carrier
files. No ownership/reconcile weakening, no visual behavior change, no lock churn.
Approve this repair slice for commit and normal push; remote CI remains pending.
