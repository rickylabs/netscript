# Drift — plugin-runtime-wiring

- #959 described a root-import-map validator; the concrete failure was bare dynamic import from the
  CLI module graph instead of project workspace-member resolution. Corrected on issue #959.
- #962 described the generated runtime generally; the service generator was already correct. The
  missing import was in the background processor entrypoint. Corrected on issue #962.
- Transactional rollback across arbitrary third-party plugin-owned scaffold writes remains outside
  this slice's safe host-owned mutation boundary. Host-owned install identity writers are coherent,
  and removal is exact/idempotent; no claim of rollback for opaque plugin-owned mutations is made.

