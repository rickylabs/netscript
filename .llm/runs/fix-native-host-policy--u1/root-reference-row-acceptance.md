# Root source acceptance: exact workers reference row

Root read the complete one-row diff at base `40f17ff5`, the canonical Windows
coverage failure, the unchanged discovery/checker source and the read-only
supporting drift-stage script. The singular `service` entry correctly names
`./services/mod.ts`; the legacy plural entry remains unchanged.

Accept this documentation checkpoint only. Canonical `docs:exports-drift`
remains RED on Windows because all 36 discovered paths contain backslashes
while mappings use slashes. The supporting normalized-coverage/unmodified-drift
run passes, including all thirteen worker entrypoints; it is not a canonical
PASS. Preserve both receipts. Upstream Linux docs CI must qualify the commit.
No checker edit, baseline doc-lint waiver, TLS or publication acceptance.

One checkpoint commit/push and honest draft PR update are authorized. A separate
Windows checker correction may be prepared later; do not fold it into this row.
