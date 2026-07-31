import { startCombinedProcess } from './runtime.ts';

// The generated job registry is resolved and loaded by `startCombinedProcess`.
// This entrypoint used to resolve it against its own module URL and landed one
// directory short of the project root, so it silently ran with no user jobs.
// Entrypoints do not resolve the registry path — `resolveGeneratedJobRegistryUrl`
// is the only resolver.
await startCombinedProcess();
