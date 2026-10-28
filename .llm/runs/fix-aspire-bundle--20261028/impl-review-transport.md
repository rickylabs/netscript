# Prepared review handoff

The pinned matrix query returned `glm_5_3_flash` at `provider_default` for straightforward
implementation evaluation. No evaluator process, provider request, or reservation has been made.

After the root signs the checkpoint, bind the source-only packet to its immutable SHA and use the
existing repository transport authority, `.llm/tools/agentic/opencode/opencode-run.ts`. Its verified
public APIs are `runOpenCode(options, dependencies?)`, `OpenCodeRunOptions`, and the pure
`opencodeRunArguments(options)`. The options include `message`, the catalog-resolved concrete
`model`, `variant`, `files`, `format`, `cwd`, `receiptPath`, `workloadTier`, and `workloadRole`.
Use the prepared prompt and the exact checkpoint source/evidence files as inputs. Do not invent a
provider slug or a CLI `--dry-run` option: concrete catalog attestation and launch guards belong to
the existing helper. Runtime-only provider state must remain outside tracked review artifacts.

The relevant checked-in documentation is `.llm/tools/agentic/README.md` (matrix and OpenCode turn
sections), `.llm/harness/workflow/lane-policy.md`, and the evaluator protocol/verdict definitions.
The source-only assignment is read-only and requires an independent session and vendor family.
This packet prepares the review; it does not pre-authorize an inference call or certify its result.
