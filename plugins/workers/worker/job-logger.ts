import { createWorkerLogger, type Logger } from '@netscript/logger';

/** Per-job diagnostics use the host process's existing structured logging configuration. */
export const workerJobLogger: Logger = createWorkerLogger('runtime');
