# Drift

- Current main already fixed the JSON module-tag exemption; remaining JSON work is syntax/existence
  validation and explicit executable/data doc reporting. Do not duplicate the shipped exemption.
- Per-entrypoint token-config lint has a hidden private-reference diagnostic beyond the combined
 124 baseline. Scope includes it because every TypeScript entrypoint must pass.
- RTK unavailable. No accepted new product debt.
