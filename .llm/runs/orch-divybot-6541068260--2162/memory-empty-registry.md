# Empty registry paths

Protocol 2 saga and trigger renderers already emit typed empty maps. The worker manifest renderer
short-circuits on empty local folders, before scanning pluginDirs, and emits null. Legacy host
generation rejects total zero sources before invoking plugin generation. Runtime workers loader
already has a passing empty registry test; saga supervisor likewise accepts empty definitions.
Doctor's shared runtime-registry-drift.ts can warn for zero selected sources without widening the
boolean DoctorReport API. Saga and worker adapter completeness checks still need empty support.
