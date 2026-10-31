# S2 checkpoint evidence bundle

Root accepted the workers GREEN checkpoint in `../root-s2-source-acceptance.md`. Public service
doc-lint is zero; the unchanged four owning tests pass with explicit sanitizers. Numeric F-5 is
`DEBT_ACCEPTED` for the exact22 names through2026-11-10. Full export-map doc-lint has two errors;
baseline qualification and S7/publish disposition remain open. Recipe typechecking succeeded,
then denied runtime module evaluation; runnable-host behavior remains unqualified.

`s2-evidence.json.gz` contains UTF-8 JSON with257 records. Each record has its original repository
relative path, byte length, SHA-256 and exact original bytes encoded as base64. The companion
manifest exposes paths, lengths and hashes without the payload. The bundle includes new S2
receipts, the three native implementation turns, immutable public planning packets, independent
review exports/checkpoints/verdict copies and process observations. It excludes profile/session
databases, caches, credentials and generated consumer integration. All original files remain at
their original paths; no prior committed history was rewritten.

Archive SHA-256: `250cf1177af8877a991601325019a2143f07466756836ff7d683522a7df4407c`.
All257 records were decompressed, base64-decoded and hash/length checked against both the archive
manifest and the still-present original files. The input size is14,612,418 bytes; compressed size
is4,560,761 bytes. The archiver refuses reparse paths and private/cache state, with512-file and
64MiB input ceilings. The exact source tool is retained locally at
`.llm/tmp/native-host-policy-u1-implementation/archive-s2-evidence.ps1`.

A read-only verification needs no extraction or dependencies:

```ts
const path = '.llm/runs/fix-native-host-policy--u1/receipts/s2-evidence.json.gz';
const bytes = await Deno.readFile(path);
const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
const bundle = await new Response(stream).json();
for (const file of bundle.files) {
  const data = Uint8Array.from(atob(file.contentBase64), (char) => char.charCodeAt(0));
  const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', data))]
    .map((byte) => byte.toString(16).padStart(2, '0')).join('');
  if (data.length !== file.bytes || hash !== file.sha256) throw new Error(file.path);
}
console.log(bundle.files.length);
```

Native raw final wording claiming no recipe evaluation is superseded by root's acceptance receipt:
the `deno run --check` stage typechecked, then importing the host Redis adapter attempted an env
read and was denied. Current full-map errors are `WorkersContract` to `WorkersContractDefinition`
and `WorkersContractImplementer` to `implement` in the existing core contract owner. An unchanged
owner hash does not establish an executed1582 baseline. Root owns that comparison separately.

S3 must retain all required controls and actual plain/trusted TLS within a reviewed test allocation.
The earlier projected480-line conflict is not an accepted waiver. S3, streams S4-S6, S7, independent
IMPL, CI/release and published production E2E remain open.
