# Public retry and DLQ type documentation

Full-export doc:lint exposes private references hidden by plain source checks. Retry vocabulary and JobRetryDefinition need named runtime exports when their public aliases refer to them. The worker module must also export sibling JobRunnerClock and canonical queue DLQ types used by WorkerOptions and its job specializations. These are core contracts, not vendored upstream exports. After fixing the new references, both package audits retain only the two inherited workers.contract-types.ts diagnostics.

Registry RegisterJobInput uses an index-signature/Omit facade that can erase known fields during type checking. The canonical retry resolver accepts unknown and validates a narrow definition schema, avoiding manual casts or duplicating that facade.
