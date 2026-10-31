# Worklog

## Design

1. Public surface: netscript init --preset and ui:apply --preset; maintainer init shares the same preparation. No new CLI option or package export.
2. Domain vocabulary: resolved UI preset (decoded choices or validated remote theme/base plus cached transport); prepared init preset (application callback retaining resolution).
3. Ports: existing UiRegistryDependencies, FileSystemPort, transport, token engine and injected command preparation callback. No direct filesystem/network effects in application code.
4. Constants: exact HTTP loopback host set in resolver; existing schema and domain constants reused.
5. Commit slices: bootstrap plan; one implementation slice (preset resolver/application contract, init wiring, regressions, CLI reference and generated carriers), proven by focused wrappers and quality gates; final evidence/lesson commit after independent review. Every implementation commit updates this worklog and context pack.
6. Deferred scope: remaining issue boxes and broader registry URL policy; owner requires minimal change.
7. Contributor path: resolve-preset.ts owns URL policy/schema resolution; apply-init-preset.ts owns reusable prepared init operation. Existing init composition roots inject it. No new abstract, registry axis or feature folder.

## Bootstrap

Memory consulted before source/build work. Matrix resolved as JSON. RTK unavailable; native commands preserve semantics. Owner directives override generic labels/closing keywords/early-readiness instructions. Public evidence uses repository-relative paths and no session identities.

## Regression evidence

Baseline source was restored temporarily for the red run, then the implementation restored exactly. Structured test wrapper with --no-check and filter `/preset URLs require|init rejects bad/`: exit 1, zero passed, eight failed results (six public/maintainer bad URL/schema steps, parent failure, HTTP policy regression). The failures show real scaffold files left behind and external HTTP accepted. Full existing token tests are expensive; the red run selects only new regressions. Type checking is a separate required gate.

Documentation carriers regenerated using gen:agent-docs-prose then gen:publish-assets (exit 0). Docker daemon unreachable; runtime verdict must remain UNPROVEN if the canonical suite cannot execute.

## Gate progress

| Gate | Verdict |
| --- | --- |
| Scoped check | PASS, 10 selected source/test files, zero findings |
| Scoped lint / fmt | PASS, 10 processed, zero dropped, zero findings |
| quality:gate | PASS, durable command receipt retained privately |
| release:preflight | PASS, zero findings |
| docs:accuracy | PASS, durable command receipt retained privately |
| Carrier generation | PASS, gen:agent-docs-prose then gen:publish-assets |
| Root check tasks excluding assets-barrel | PASS, all 13 tasks (including live review thread gate) |
| scaffold.runtime with cleanup | UNPROVEN, raw exit 1: Docker daemon unreachable; failure at environment preflight and cleanup inventory |
| Leak reporter | Exit 0; inventory UNPROVEN; 24 unknown/unproven-owner survivors, none mutated |

Raw evidence stays outside Git because it contains machine paths. Public leak evidence contains verdict/counts only. All gate summaries refer to the working tree on the plan head; they are not claims about a future immutable implementation head. Independent Claude review and full selected CLI tests pending.

Site check:source-format, check:rendered-output, check:links and check:caveats all PASS. CLI JSR audit PASS (raw exit 0); unchanged metadata and export surface preserved. check:assets-barrel remains scheduled after the generated carrier is committed, because that gate compares Git diff.

Reconcile note: PR #2518 remains draft with Refs #2516 and release milestone 0.0.9; no labels applied. Only the first two issue requirements are included. No new issue filing or remaining-box work authorized.

## Independent slice review

Separate read-only Claude Opus 5.5 (requested high effort; observed model claude-opus-5-5, effort not independently attested) returned implementation PASS, no blockers. It independently checked changed sources and both entrypoints, and ran three focused tests (3 passed). Readiness limitations remain explicit. Advisory follow-ups accepted: preserve one-line recovery guidance for application-stage dependency/conflict failures; add explicit cached-byte retention coverage for registry theme payloads as well as preset JSON. These do not expand production scope. The same evaluator will receive final evidence and these small follow-ups.

Focused green regression wrapper: exit 0, 10 passed, zero failed/ignored. Includes six zero-scaffold failure cases across public/maintainer binaries, HTTPS/loopback policy, and retained preset JSON plus remote registry-theme payloads. Recovery guidance and regenerated prose carrier updated after evaluator advisories. Full selected CLI suite remains running.

Final advisory-follow-up test passed scoped check/lint/fmt again. After the recovery prose edit, regenerated carriers and re-ran docs:accuracy, check:agent-docs-prose, and check:publish-assets: all exit 0. The same independent evaluator is reviewing the follow-ups and final evidence, with session continuity retained privately.

## Implementation slice sign-off

Full selected CLI test wrapper completed: exit 0, 43 passed, zero failures/ignores. The later remote-cache advisory test additionally passed in the focused 10-result regression run. Same independent evaluator returned final implementation PASS after reviewing both advisories and public gate summaries; it independently ran the two retained-payload tests (2 passed). Its report predates completion of the full CLI suite; that pending item is now resolved by cli-tests-evidence.json. Supervisor accepts the substantive independent slice review and commits the implementation. Runtime stays UNPROVEN for unavailable Docker. Remaining: post-commit assets-barrel, exact-head CI, final handoff.
