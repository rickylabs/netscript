# Drift

- Current main already fixed the JSON module-tag exemption; remaining JSON work is syntax/existence
  validation and explicit executable/data doc reporting. Do not duplicate the shipped exemption.
- Per-entrypoint token-config lint has a hidden private-reference diagnostic beyond the combined
 124 baseline. Scope includes it because every TypeScript entrypoint must pass.
- RTK unavailable. No accepted new product debt.

- The hidden token-config reference is now resolved through its existing token-contract exports.
- Rejected broad upstream JSX re-export (thousands of unrelated native findings) and opaque own
  VNode approximations (public API widening). Exact upstream namespace types plus an empty module
  dependency projection satisfy both native docs and JSR fast-check; plain empty imports do not.
- A cold dependency resolver failure was transient: full retry and independent current-tree quality
  rerun passed with no dependency or lock changes. Candidate receipts are not final-head proof.
