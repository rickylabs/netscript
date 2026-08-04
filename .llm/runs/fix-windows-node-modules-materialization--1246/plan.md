# Plan — #1246 Windows npm materialization mitigation

## Outcome

Ship a 0.0.5 mitigation that stops a corrupt Deno project-local npm tree before Fresh/Vite starts,
reports the exact missing cache-backed files, and gives deterministic Windows recovery and a
pre-window Deno pin. Preserve the full upstream/native-Windows fix as 0.0.6 follow-up evidence.

## Locked decisions

1. **Ownership:** classify as upstream Deno, with NetScript owning detection and recovery UX.
2. **Affected window:** directly evidenced on 2.9.1, 2.9.3, and 2.9.4; treat 2.9.1–2.9.4 as an
   unresolved risk window without claiming a direct 2.9.2 reproduction.
3. **Verifier contract:** generate `.netscript/verify-node-modules.ts`. It resolves the project-local
   `.deno` tree and shared npm cache, maps each materialized package/version to its cache directory,
   and verifies every cache regular file exists locally.
4. **No silent success:** absent `.deno`, unavailable cache, zero verified packages, or any missing
   file is a non-zero actionable result. A hermetic execution test creates a complete shared-cache
   package and an incomplete project copy, then asserts the generated program fails with the exact
   diagnosis and remediation. A complete fixture proves the positive path.
5. **Start integration:** generated Fresh `dev` tasks run the root verifier before Vite. Aspire starts
   the same app task, so the diagnostic occurs at the affected boundary without Aspire-specific
   coupling.
6. **Manual contract:** root `deno.json` exposes `deps:verify`; generated README runs `deno install`
   then this verifier before either direct Fresh or Aspire startup.
7. **Pin:** generate a root `package.json` with `private: true` and exact `engines.deno: "2.9.0"`.
   Diagnostic text calls 2.9.0 the pinned pre-window fallback, not a proven native-Windows cure.
8. **Recovery text:** remove only the generated project's `node_modules`, rerun `deno install`, then
   rerun `deno task deps:verify`; if recurrence continues on Windows, use Deno 2.9.0. Link upstream
   issue #35804.
9. **Issue closure:** PR uses `Refs #1246`. Native Windows no-intervention startup and a Windows CI
   init→Aspire→frontend-serving proof remain for 0.0.6/upstream tracking.
10. **Architecture:** keep the verifier and package manifest as named Tier-1 generators under the
    existing Archetype-6 template boundary. No public CLI export or package dependency is added.

## Slices

### S0 — harness bootstrap and classification

- Files: run artifacts only.
- Gate: raw git boundary/status verification; research and decisions locked.
- Commit: harness plan/classification.

### S1 — verifier contract and scaffold integration

- Files: named workspace verifier/package manifest generators, constants, root/app task generation,
  scaffold root writer, and focused tests.
- Gate: focused `deno test` for the new generator, scaffold plan, workspace generators, and Fresh
  task generators; scoped check/lint/fmt for touched TypeScript.
- Commit: implementation plus executable no-op regression proof.

### S2 — consumer documentation and merge-readiness evidence

- Files: generated README tests, run artifacts, PR body/evidence.
- Gate: package CLI quality/architecture gates, then the canonical one-pass
  `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` at merge-readiness.
- Native Windows acceptance remains explicitly unavailable from WSL and unclaimed.
- Commit: evidence/docs if implementation changes require a separate bounded slice.

## Acceptance mapping

| #1246 acceptance | This PR |
| --- | --- |
| Classify reproducibility/ownership | Satisfied by issue evidence plus upstream tracker research |
| Frontend starts on Windows without manual repair | Not claimed; upstream/native Windows follow-up |
| Detect/report incomplete project materialization | Implemented and hermetically regression-tested |
| Windows CI init→Aspire→frontend serving | Not claimed; requires native Windows lane |
| Upstream recovery documented | Generated diagnostic and README, linked to upstream issue |

## Validation gates

- Focused executable unit/consumer tests, including a test that fails if detection becomes a no-op.
- Scoped check/lint/fmt (`ts,tsx`) through repo wrappers.
- `deno task quality:gate --package cli` or the current CLI quality command confirmed from live help.
- `deno task arch:check` / relevant package architecture gate.
- Full `scaffold.runtime` one-pass cleanup suite once, during merge-readiness.
- `deno doc --lint`/JSR audit is N/A unless implementation changes the CLI public export surface.

## Risks and mitigations

- **Cache layout variants:** enumerate registry roots and parse the local package's own `package.json`
  identity rather than assuming npmjs-only paths.
- **Peer-suffixed `.deno` directories:** derive name/version from materialized package metadata.
- **False success:** fail closed when no packages can be compared and exercise that law in tests.
- **Startup latency:** perform file existence comparison only; do not hash or copy content.
- **Platform-specific shell advice:** print both PowerShell and POSIX recovery commands.
- **Overclaiming causality:** distinguish the same upstream failure class from a proven concurrency
  trigger and distinguish the risk window from directly reproduced point versions.
- **Unrelated dirty lock:** explicit-path staging and raw git verification before every commit.

## Deferred scope

- Deno's root-cause fix and upstream release containing it.
- Native Windows CI coverage and no-intervention frontend-serving acceptance.
- Removing the temporary pin after upstream verification; target milestone 0.0.6.
