# Manifest parity negative controls

Run the structured test wrapper with --filter "generated carrier MANIFEST bytes".
Removing either production provenance row or replacing either value with this.now().toISOString()
must fail the exact full-byte equality assertion (one failed test, process exit 1).
Restore source in finally. Never confuse launch/type-check failure with a valid negative control.
All four mutations were exercised; see negative-controls.json.
