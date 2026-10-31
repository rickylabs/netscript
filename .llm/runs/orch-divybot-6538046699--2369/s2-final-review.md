**VERDICT: PASS.** The exact-text change resolves the precision concern and the negative-control evidence satisfies the condition; I only looked at the delta. The S2 commit still waits on the full native conformance rerun passing.

**Exact-text comparison**
- Both the page read and the locked parent read now return `envelope::text AS "envelopeText"`. The DELETE matches on `s.envelope::text = selected."envelopeText"`, with that column declared as `text` in the recordset.
- The fresh parent's text from the locked read is what gets compared.
- The payload sent to the DELETE now carries only `instanceId`, `keyHash`, `version` and `envelopeText`, so no parsed JavaScript envelope is involved.
- PostgreSQL always prints the same jsonb value as the same text, so a parent that hasn't changed always matches, whatever numbers it holds. There's no hash and no collision risk.
- The test sets `counter` to 9007199254740993 directly in SQL with `jsonb_set`, so the large number never passes through JavaScript. The expected counts went from 11 scanned / 5 deleted to 12 / 6, and `large-json` is absent from the surviving keys, so its marker must be deleted.

**Negative controls**
- Twelve controls, each producing a semantic test failure rather than a compile or SQL error, cover every guard I listed. The record shows outbox age, outbox lease, terminal status, completion window, group window, fresh-metadata recheck, parent version, DELETE envelope, parent lock, both query limits, and policy validation each turned their focused real-Postgres test red.
- Each of the nine retention tests is turned red by at least one control.
- Removing the version check in both places at once (the fresh-parent comparison and the DELETE predicate) is a reasonable way to treat one guard with two layers.
- The limit controls raise the SQL `LIMIT` instead of breaking the parameter, so a red result proves excess work, not invalid SQL.

VERDICT: PASS
