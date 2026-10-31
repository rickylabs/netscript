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
