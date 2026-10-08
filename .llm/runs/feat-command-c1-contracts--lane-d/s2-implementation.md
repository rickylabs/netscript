# S2 implementation evidence — supervisor review handoff

Scope: issue #1482, locked C1 S2 only. S1 was supervisor signed off at `5023427004b37a561570a1a23bb4b7e21faf0c51`. This slice is frozen for substantive supervisor review; no implementation verdict, sign-off commit or whole-C1 completion is claimed by this lane. S3 remains pending. Whole-chain PLAN-EVAL stays untouched.

## Product files and boundaries

[Source manifest](./s2-source-manifest.json) lists all 15 product/documentation files with exact hashes. The focused `packages/service/commands.ts` export contains values/envelopes, immutable definitions and record intents, redacted failures, synchronous codecs, and canonical encode/decode. Four domain files and three application files implement them. Runtime tests and a real-export declaration fixture prove the actual public surface. Service root exports remain unchanged. No executor, database implementation, relay, network IO, casts or lint suppression was added.

Definitions require a bounded durable name and positive safe definitionVersion, default to required idempotency, and freeze nested replay/record policies and codec bindings. Each definition owns a typed closure-private WeakMap. Its type-only unique-symbol marker carries a typed resolver requiring the private unique-symbol capability token and exact original object. Neither runtime symbol/token nor resolver helper appears in the public manifest. Reflective callers cannot supply the token; copied objects fail WeakMap identity authentication. This keeps handlers callable by a future internal executor without heterogeneous-map assertions or a public handle method. The real-export negative fixture proves input invariance, missing-handler/public-field forgery rejection, readonly policy, correct actors/version/failure retryability, and inability to invoke the marker with a caller token.

Canonical JSON uses the internal versioned `jcs-v1` protocol. RFC 8785 Appendix B finite IEEE-754 vectors exercise negative zero, subnormals, maximal doubles, exponent boundaries and rounding. UTF-16 ordering includes supplementary characters and integer-like property names; pairs serialize directly rather than relying on JavaScript object enumeration. Strings retain original Unicode without normalization and reject unpaired surrogates. Nonfinite numbers, undefined, class instances, sparse arrays, accessors, functions, symbols, hidden/extra fields, cycles and toJSON hooks are refused. Snapshots are deeply frozen. Bounds default to 64 nested containers, 10,000 aggregate values/keys and 1 MiB UTF-8 bytes; options only tighten. Oversized arrays are rejected before key enumeration, strings before escaping, and stored text before JSON.parse by raw byte/depth/token preflight.

Stored canonical text must equal exact reserialization; duplicate keys, alternate spellings, noncanonical ordering/whitespace, corrupted syntax and unsupported values are rejected. Safe __proto__ copying prevents prototype mutation. Codec input and schema output both receive bounded I-JSON checks. Async Standard Schema validation receives a synchronous-configuration diagnostic and rejected promises are observed.

Replay-stability clarification within the locked design: canonical input text is captured before schema validation and compared to canonical validated output. Neutral transforms are accepted; value-changing transforms, coercion and field stripping are refused so decoding a stored receipt cannot apply a transform twice. This is documented in the public README and reference. No C2 normalization shortcut is assumed.

CommandError validates/fixes the bounded failure vocabulary, freezes both error and safe failure, and serializes only the failure; a trusted cause is retained on the error but never serialized. The type union preserves per-kind retryability and safe phase/reason/capability enumerations.

## Meaningful per-test mutations

[Mutation evidence](./s2-mutation-evidence.json) records all ten named new runtime test groups. Every group failed with a named behavioral failure and exit1 under a distinct production mutation, then passed with exit0 after restoration. Controls reverse UTF-16 ordering, permit nonfinite numbers, bypass pre-parse bounds, bypass strict roundtrip, permit changing schema transforms, remove async-schema refusal, omit deep snapshot freezing, change the key default, authenticate a copied definition, and serialize a trusted cause. Two additional production type mutations widen expectedVersion and allow arbitrary capability symbols; each produces TS2578 at the real-export negative fixture (exit1), then restores clean check (exit0). Runtime mutants use --no-check so the failure is behavioral; final normal gates independently check restored source. No new test lacks a production mutation.

## Stable gate results

[Gate evidence](./s2-gate-evidence.json) retains initial owned findings and final actual exits with argv, pre-signoff head and source manifest reference. Raw receipts remain in task-private runtime storage.

| Stable S2 gate | Actual exit | Result |
| --- | --- | --- |
| Structured service check | 0 | 61 TypeScript files including real-export fixture; no diagnostics |
| Structured new codec/definition and existing contract proving suites | 0 | 14 passed: ten new S2 groups plus four S1 groups |
| Structured service lint / fmt | 0 / 0 | No findings, no suppression |
| Manifest and README formatting | 0 | Both checked |
| Service full four-entry export-map doc lint | 0 | Zero private references, missing JSDoc or other findings |
| Contracts full five-entry export-map doc lint | 1 | Unchanged sanctioned 17 combined upstream oRPC references; missing JSDoc0/other0 |
| quality:scan / arch:check durable receipts | 0 / 0 | No new quality findings; architecture retains baseline warnings |
| Whole-map docs:exports-drift durable receipt | 0 | Complete contracts symbols and all entrypoints match reference inventory |
| Native direct source dependency reports | 0 | Direct StandardSchema codec usage and database IsolationLevel ownership documented |
| Native stable dependency freshness | 0 | StandardSchema pinned1.1.0 equals latestStable1.1.0; behind0, no entry errors |
| Materialized service publish dry run | 0 | All four exports pass declaration/slow-type analysis and simulation |
| git diff --check | 0 | No whitespace defects |

The known S1 CI documentation inventory omission is repaired narrowly for both command subpaths, all new symbols and type-only markers. Initial service doclint exit1 had two first-party IsolationLevel references, resolved by a type-only re-export of the database-owned type from commands; final exit0. Runtime capability values remain private. Initial test lint exit1 had three require-await findings, repaired by Promise-returning callbacks. Initial RFC ordering test exit1 used Object.keys after parsing and observed JavaScript integer-key enumeration; the test oracle now checks canonical bytes directly. Initial docs inventory exit1 required explicit export-table rows rather than prose links; final whole-map drift passes.

Service declares exact already-pinned StandardSchema1.1.0 and database0.0.7 dependencies. Deno updated workspace/specifier sections and normalized npm peer-suffix keys in the lock; supervisor independently confirmed npm/jsr resolved dependency bodies are semantically unchanged. No dependency versions/integrities were upgraded and no lock/cache deletion or reload occurred. The existing why wrapper drops native stderr, so its transitivelyPresent=false field is not graph proof; direct native why exit0 reports the exact JSR dependency and direct source usage is verified. No unrelated wrapper repair is included.

Contracts doclint retains the existing named sanction in docs/architecture/doctrine/02-public-surface.md, “Sanctioned exception: slow-types for oRPC-bound packages”, as reviewed in S1. No new exception is needed for S2; its own service doclint is zero. Independent materialized publish succeeds.

## Next supervisor action

Review frozen S2 source, exact source hashes and gate/mutation evidence substantively, then sign off/commit/push/comment before releasing S3. S3 still owes clean materialized consumers, dedicated declaration negatives/export audit and frozen production install. No commit/push/GitHub action or evaluator artifact edit was performed by this lane.
