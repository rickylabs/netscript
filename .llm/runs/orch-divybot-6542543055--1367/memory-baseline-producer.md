# Current-main file-backed producer finding

On baseline 851d1ce92d91352aa0d7b9c29ba6e3e4ee39bae2, the structured test wrapper command
`deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all --unstable-kv plugins/streams/services/src/tests/storage-restart_test.ts`
passed 3/3 (exit 0). It uses real DurableStreamProducer upserts + delete, verifies three nonempty
HTTP events before restart, then identical events afterward in file mode. The old silent producer
write loss does not reproduce under this existing current-main acceptance scenario. This is
process-boundary baseline evidence, not yet the generated-project Aspire restart verdict.
