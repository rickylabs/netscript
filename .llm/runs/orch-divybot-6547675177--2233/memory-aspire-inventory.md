# Agent install tests participate in Aspire scan inventory

A test using the real initAgent flow includes aspireAgentInitializer. That newly makes it
an Aspire mention and adds a sorted row to the generated tracked-path inventory.
Run canonical `.llm/tools/validation/aspire-surface-manifest.ts` with read/run=git/write=fixtures,
then `deno task check:aspire-version-parity`. Four carrier freshness tasks and quality:gate
do not include this additional required CI quality check. Keep the generated inventory current.
