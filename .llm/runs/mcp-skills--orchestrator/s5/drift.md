# Drift Log: `@netscript/mcp` S5

This file is append-only.

## 2026-07-12 — corrected preflight baseline

- **What:** Slice brief named `30fd0288`; supervisor corrected the required base to `dd89ced9`, which contains that commit plus S4/S5 briefs.
- **Expected:** HEAD `30fd0288`.
- **Actual:** HEAD `dd89ced9`, explicitly authorized by supervisor.
- **Severity:** minor.
- **Action:** Continue from `dd89ced9`; no source divergence.

## 2026-07-12 — plugin doctor dependency inversion

- **What:** The CLI plugin doctor use case is not exported from `@netscript/cli` and depends on CLI kernel/config adapters; S7 will make CLI depend on MCP.
- **Expected:** Prefer wrapping the typed CLI use case if dependency direction is clean.
- **Actual:** Direct MCP → CLI import would be heavy and cyclic; the checks are too non-trivial to duplicate.
- **Severity:** architectural.
- **Action:** Define MCP-owned `ProjectDoctorPort`; ship an informational warning stub in S5 and have S7 inject the real CLI-side adapter. Document in README and tests.
