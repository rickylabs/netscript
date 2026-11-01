# Compensation baseline

At f683946 (#2499), commitCompensation already calls #persistTransition and canonical commitTransition with saga-compensation-v1 + saga id + instance id + version. Do not reintroduce separate replay writes. Existing saga-compensation-persistence_test.ts uses only MemorySagaStore. Real provider fault proofs belong alongside tests/fixtures/transition-store/postgres-conformance.ts.template and KV atomic tests. Granular custom stores are rejected at registration; none receives a weaker runtime guarantee.
