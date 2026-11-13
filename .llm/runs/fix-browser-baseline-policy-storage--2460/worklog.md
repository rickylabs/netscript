# Design checkpoint

1. Public surface: serious/critical axe findings block against exact reviewed baseline; moderate/minor remain visible in full artifacts. Original S0 captures retain decoded pixels and provenance while taking materially fewer bytes.
2. Vocabulary: blocking severity, complete axe report, immutable before capture, lossless storage representation, encoded hash vs decoded pixel hash.
3. Ports: existing axe report shape and Playwright artifact writer; native PNG optimizer for a one-time measured conversion; independent PNG decoding/pixel hashing. No browser component APIs or new framework dependencies.
4. Constants: name current blocking severities and the retained S0 capture location/budget/provenance fields rather than hide policy in test prose. Existing fingerprint format remains unchanged.
5. Commit slices: bootstrap research/plan; one cohesive policy/storage implementation with all original controls plus exact pixel/source proof; evaluator sign-off and final evidence in same implementation commit.
6. Deferred: S6 all-level blocking, S3 fingerprints/anatomy #2462, browser dependency/CI contract #2461, new baseline captures, publication/release.
7. Contributor path: tools/fresh-ui-browser/README.md explains policy, immutable capture provenance, storage method and validation command.

Research checkpoint before source edits: current policy already filters serious/critical, but lacks explicit moderate/minor controls. Original8PNG bytes=5812417. Pillow optimization made largest image larger; raw deflate recompression only saves about1.5%, insufficient. Evaluate native oxipng without touching source; preserve all chunks and independently compare decoded pixels. Lock exact method and budget only after measured result. PLAN-EVAL selected before retained PNG/source changes.
