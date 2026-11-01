# Run source sweeps after compiler-consumer fixture tests finish

The combined suite's worker header negative controls create and remove u3-headers-* files
under plugins/workers/tests/streams/. A concurrent quality:gate can list one of those paths
then fail NotFound while reading it after test cleanup. Root/static sweeps and those fixture
tests share mutable roots, so run final sweeps after the full suite exits and cleans up.
Do not add scan exclusions or suppressions for this race. Preserve the failed receipt and
rerun the exact quality command sequentially at the stable source. Root file selection may
also observe temporary fixtures; final source checks should run after cleanup as well.

The same full run also had one TLS child read-permission failure on native scalar.generated.ts
while canonical asset generation was writing files. The unchanged isolated TLS control passes
on stable source (1/0/0). Do not claim causation from that observation alone. All source
writers, generators and broad sweeps are now finished before the complete rerun starts;
no fixture permissions or assertions are relaxed. Preserve both complete-run receipts.
