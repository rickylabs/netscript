/**
 * Isolation fixture: import ONLY the Ollama subpath, then print the set of
 * registered provider ids as JSON. Run in a fresh subprocess by
 * `provider_isolation_test.ts` to prove that importing one subpath registers
 * exactly one provider (bundle isolation).
 *
 * @module
 */
import '../../ollama.ts';
import { listModelProviders } from '../../mod.ts';

console.log(JSON.stringify(listModelProviders()));
