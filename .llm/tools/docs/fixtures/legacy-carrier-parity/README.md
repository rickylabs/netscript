# Frozen legacy carrier parity fixtures

These test-only inputs were copied from the legacy carriers at commit
`7debd41797fd14e64d377243a1c5a01963eafe70`, before the page/entrypoint migration. They are outside
every published package. They are not regenerated from current sources.

`legacy-docs.json.gz` and `legacy-exports.json.gz` are the original compressed inputs.
`digests.json` pins SHA-256 of each decoded page, the original `llms-full.txt`, and compact UTF-8
JSON of the normalized export corpus. Tests convert these fixed inputs into the new row format and
run the production decoders against those digests. Future docs/API changes do not replace this
baseline; a decoding regression still fails after the migration merges.
