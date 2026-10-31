# Drift

- Assignment describes selector/projection work as remaining, but #2300/#2343 already merged it. Revalidated against main; preserve those contracts and prove them.
- RTK absent; use focused native commands and structured wrappers.
- Evaluator override recorded verbatim in worklog.md.
- Generic final-comment/closing instructions conflict with the specific owner capstone contract; start PR with Refs and retain issue open pending coordinator acceptance. Canonical final report uses the assignment file handoff.

- Consumer generation requires the declared streams dependency. Added streams with --no-db; verify its readiness too.
- Normal Deno CI has no Aspire SDK modules. Ordinary consumer tests check userland/registries and lint all helpers; full acceptance restores Aspire then checks the helpers against the actual SDK. No mock SDK.
- Generic plugin service context carries settings/KV and lazy DB access; it remains required for normal plugins. No-DB checks exclude SQL bindings/bootstrap, not this settings seam. Detached runner omits it entirely.

- Main advanced to da81516; integrated via merge, canonical asset regeneration resolved the only stash conflict.
- Local-source proof found published JSR service launch metadata. Fixed the local install and generic runtime-package discovery, and asserted source entrypoints rather than applying test-only helper rewrites.

- Final inventory validation discovered a generated Aspire manifest freshness gap. Add the six canonical inventory rows and re-review the new head; runtime proof remains unchanged because executable source is unchanged.

- The CI quality failure is publish-assets freshness, not the later parity step: regenerate the MCP publish wrapper after updating its docs corpus. check:publish-assets passes. Include both generated repairs in S3.

- CI shards test-2 through test-6 exposed inherited test-map cookie resolution and an outdated empty-tools assertion in addition to the stale MCP provenance. Root test support now declares the same emitted dependency; no version or runtime change; the necessary lock metadata exception is documented below. Preserve every behavioral auth/regression control. Aggregate check-test is red because these shards failed.

- Root cookie alias requires native root/private-lock workspace dependency metadata synchronization: frozen fixture subprocesses and private-lock parity reject the alias without it. Record and independently review only this necessary metadata change; compare resolved package versions and integrity. Initial regression run also found the host browser needed an explicit existing executable; no product/test behavior change for that.

- Required full-runtime CI now ran at d92acd5 and both tiers failed the same Flow-B fixture step after49 passes. Latest main's same tiers passed. The corrected absolute local service metadata changes argument-array formatting; the fixture still assumed one line and a JSR entrypoint. S4 repairs this fixture compatibility without changing product output or weakening the config/source validation. Prior final verdict is superseded by this CI failure pending repair and a fresh exact-head review.

- Automated merge-conflict relay requested rebase/force-push; explicit owner/coordinator policy requires merge. Integrated main7312ba4 by merge and canonically resolved only the generated MCP provenance conflict. Re-ran the scoped KV proof because upstream child-health runtime changed; PASS. Do not substitute this for the required full runtime CI verdict.
