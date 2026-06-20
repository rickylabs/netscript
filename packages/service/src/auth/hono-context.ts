/**
 * Hono context variable augmentation for NetScript service middleware.
 *
 * @module
 */

import type { Logger } from '@netscript/logger';
import type { Principal } from './types.ts';

declare module 'hono' {
  interface ContextVariableMap {
    principal: Principal | undefined;
    logger: Logger | undefined;
  }
}
