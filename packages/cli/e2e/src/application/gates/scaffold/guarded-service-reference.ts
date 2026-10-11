// Resolve the runtime source graph plus the public scaffold's range spellings.
// This entrypoint is installed by deps:check:reference-locks; it is never executed.
import './probe-generated-guarded-service.ts';
import '../../../../../../../plugins/auth/services/src/main.ts';
import '../../../../../../../packages/service/mod.ts';
import '../../../../../../../packages/kv/mod.ts';
import 'npm:@durable-streams/client@0.2.7';
import 'npm:@durable-streams/state@0.3.2';
