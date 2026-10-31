# Private token lock repair

Deno install/update alone preserves the malformed pre-existing path-scurry edge. Resolve Style Dictionary 5.7.1 with Deno using an explicit private --lock path; then repair that edge using the lru-cache 11.5.1 entry already present in the root lock, retaining jsonld’s 6.0.0 edge. Check/lint and frozen build validate the resulting graph. Keep the private lock’s original compact-array serialization: rewriting the whole JSON with a generic pretty printer adds hundreds of unrelated lines. Explicit --lock matters: --config alone can select the workspace root lock.
