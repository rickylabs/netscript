# S2 substantive supervisor review

Decision: sign off locked S2. This review is not per-leaf IMPL-EVAL.

Reviewed all fifteen product/documentation files and independently verified every recorded source hash. Reviewed ten runtime test groups, two declaration controls and actual gate history. The private binding retains input/output/transaction types without casts, requires the private runtime capability and authenticates the original object with a typed per-definition WeakMap. Public exports provide only marker/capability types and no callable handler or runtime capability. Reflection and copied-definition controls prove refusal without execution.

Canonical serialization follows the primary RFC 8785 numeric/string and UTF-16 ordering rules, including integer-like keys. Strict I-JSON snapshots, aggregate/depth/byte safeguards, pre-parse checks and exact stored roundtrip reject unsupported and noncanonical data. The schema guard captures canonical input before validation and requires equal output, preventing repeated transforms during replay. Neutral validation remains accepted. Redacted failures normalize bounded fields and exclude trusted causes from serialization.

Final scoped check, proving tests, lint/format, service docs, whole-map reference drift, quality/architecture and isolated service publish exit 0. Ten named runtime mutants and two real-export declaration mutants each fail with exit 1 and pass restored with exit 0. Supervisor independently reran quality-scan and arch-check through durable native receipts: both exit 0 at pre-signoff HEAD 5023427004b37a561570a1a23bb4b7e21faf0c51, against the matching source manifest. Contracts doc lint retains the unchanged existing oRPC doctrine sanction at raw exit 1; no S2 documentation exception is needed.

Direct Standard Schema and release-matched database imports are declared and publication checked. Supervisor compared complete npm/JSR dependency bodies under normalized peer keys: identical; only workspace metadata and native peer identifiers changed. No versions/integrities changed. Native why provenance was checked separately from the wrapper field that drops stderr. Reference inventories repair the owned S1 CI drift finding.

S2 proving runtime count is fourteen: ten S2 groups plus four S1 contract groups. This does not claim a complete service-package regression run. S3 must run complete affected package suites and clean consumer/declaration/production-install qualification before final C1 evaluation.

No new debt, suppression, unsafe cast, root enlargement, executor or relay implementation is accepted. S3 is released only after this commit is pushed and commented on draft PR #2082.
