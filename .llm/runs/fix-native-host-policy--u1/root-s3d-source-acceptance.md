# Root acceptance: workers trusted TLS checkpoint

Root read the complete appended TLS test and final native-request correction,
the formatter-only diff and all thirteen sealed receipt hashes. Eight owning
tests pass (zero failures/ignores, 16310 ms); selected three files have clean
types, lint and formatting. Actual configured-client HTTPS requests return
401 and 200 through native auth; an ordinary client rejects the untrusted
certificate. Clients close before idempotent listener shutdown/port reuse,
then the test-owned KV closes. No TLS bypass or trust-store mutation is used.

Verified test bytes are SHA256
`9fe8f84e883445b22b418322777a3b742d2eeb7df537907c35c30beab1522c55`.
Root then removed only the misleading comment word `only` from the CA-trust
description. Its exact one-word diff preserves all executable code, assertions
and fixture bytes; final canonical fmt check selects one file and passes.
Final source is 461 readable lines, within the explicitly extended 465-line
checkpoint cap and 480-line doctrine cap, SHA256
`89f89312b14186f5bdcda52ac813d7e306f698c4b39f22390669c26227c8407d`.
The 304-line prefix, helper, original tests, public PEM contents, configuration,
locks and prior verdicts remain unchanged. No exclusive ambient trust-store
isolation is claimed. No additional behavior rerun is needed for that comment.

Preserve the native 300-second authoring timeout, initial TS2353 errors and
formatter RED as earlier failures distinct from later source verification.
Accept only this isolated workers TLS checkpoint. Signal/drain, legacy,
streams, full consumers, documentation/publish and independent IMPL gates
remain open. Linux docs workflow 40605465746 passed at reference checkpoint
439dae54; main checks remain draft-skipped. No full-app/security acceptance.

Authorize one checkpoint commit/push, a new audited evidence bundle and honest
draft PR update. Do not mark ready, merge, close issues or start another model
slice without its concrete root-reviewed brief.
