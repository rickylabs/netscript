---
title: Extending Shared Contracts
description: Guidance for extending shared vocabulary without widening the root surface unnecessarily.
package: '@netscript/shared'
order: 30
---

# Extending

Add a shared primitive only when at least two packages need identical vocabulary.

Contributor path:

1. Add the explicit data type and schema in `src/domain/`.
2. Re-export it through `src/public/mod.ts`.
3. Document it in `docs/reference/` and the root README when it changes the 80% path.
4. Run the shared publish, doc, lint, and test gates.

Do not add generic utilities. Prefer Temporal, Web Platform APIs, `@std/*`, or package-owned ports.
