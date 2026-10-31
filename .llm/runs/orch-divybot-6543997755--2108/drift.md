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
