# Coordinator revalidation — 2026-10-28

Validated production source: `29dc9de3e778803e4d2ea78b72dd076ba26cbc65`.

The reported run 40701543869 used the older 5eeebe2 source. The missing environment permission was
repaired in a6e91af, including the executable entrypoint and its plumbing regression. The four
spawning tasks are docs:snippets, docs:readme-fences, docs:snippets:test and docs:snippets:negative;
all declare --allow-env. Root tests and CI shards already grant child tests --allow-all. The docs
accuracy caller imports a policy constant without spawning, and already has environment permission.

Node spawn inherits the complete environment. A restricted variable list would change that existing
inheritance contract; the minimal task repair retains --allow-env.

All 23 quality validations below exited zero. Workspace installation also exited zero. The
review-thread gate exited zero: three threads answered, zero unanswered. Native allowlisted checks
produced durable receipts; setup and release preflight used their actual command exit codes. Raw
output remains outside Git. This evidence update changes no production source, test assertion,
ratchet, workflow or tracked lock.

| Validation               | Exit | Seconds |
| ------------------------ | ---: | ------: |
| quality-gate             |    0 |  29.712 |
| quality-job              |    0 | 243.377 |
| docs:readme-fences       |    0 | 139.598 |
| release-preflight        |    0 |   1.577 |
| docs-source-format       |    0 |   0.284 |
| docs-source-format-test  |    0 |   1.400 |
| prod-install             |    0 |   0.809 |
| lint-report              |    0 |   8.787 |
| fmt-check-report         |    0 |   2.316 |
| docs-tagline             |    0 |   0.328 |
| docs-accuracy            |    0 |   5.915 |
| jsdoc-example-compile    |    0 |  58.871 |
| agent-docs-prose         |    0 |  13.636 |
| mcp-export-corpus        |    0 |  10.730 |
| assets-barrel            |    0 |   1.280 |
| publish-assets           |    0 |   0.653 |
| emitted-samples          |    0 |   9.005 |
| netscript-jsr-specifiers |    0 |   1.185 |
| scaffold-versions        |    0 |   0.251 |
| aspire-version-parity    |    0 |   0.631 |
| publish-dry-run          |    0 |  45.388 |
| ai-peer-resolution       |    0 |  12.868 |
| audit-critical           |    0 |   0.524 |

README census: 36 READMEs, 200 fences, 99 TypeScript-like, 99 checked, zero exempt, zero
syntax-invalid, five known type errors across four READMEs, and no unattributed failure. No coverage
floor or error ceiling changed.

The first local README attempt ran concurrently with ci:quality. Dependency resolution added one
unrequested lock entry while README validation was checking lock integrity, so the guard correctly
failed. The diff was inspected, only that generated lock change was restored, and the sequential
README retry passed. The remaining checks ran sequentially, leaving the tracked lock unchanged.

Before this evidence-only push, exact-head CI at the source above was entirely green: core CI
40712271949, Pages 40712271904 and Code quality 40712271918. The new head still requires its own CI
confirmation in the READY reply. Independent source evaluation remains PASS; production blobs are
unchanged by this record.

Full scaffold runtime remains unproven after the earlier Aspire/Docker preflight failure. The
previously disclosed historical report limitation remains unchanged; there is no history rewrite.
Stop at READY without merge, tag, release or label changes.
