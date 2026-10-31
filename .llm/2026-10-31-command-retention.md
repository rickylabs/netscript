# 2026-10-31 — Installed command schema and bounded retention

Issue #2369, PR #2487. Existing schema contribution delivery now includes immutable SQL migration
sidecars, applied before deployment. Primary-key cursor pages bound retention discovery as well as
deletion. Canonical completion metadata and fresh locked parent checks protect saga replay safety;
exact PostgreSQL JSON text avoids numeric-roundtrip retention leaks.

Proof: fresh/adoption Prisma-generated migrations match reviewed PostgreSQL constraints/indexes;
nine retention tests, twelve semantic guard-removal controls, and full native conformance pass.
The coordinator must arm the required scaffold.runtime CI gate. No local full runtime smoke ran.

Lessons: a declared migration axis needs an actual installation/application consumer; RETURN LIMIT
without a bounded primary-key scan does not bound examined work; a green standalone schema fixture
does not prove installed contribution ownership; compare inherited full-export doc-lint findings
against the same main baseline before claiming regressions or gate success.
