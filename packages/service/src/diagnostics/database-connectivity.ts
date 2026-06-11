/**
 * Internal database connectivity diagnostics for service startup.
 *
 * @module
 */

import { createServiceLogger, type Logger } from '@netscript/logger';
import type { Database } from '../types.ts';

type DbEngine = 'mysql' | 'postgres' | 'mssql';
type ConnectivityFailureReason = 'TCP_UNREACHABLE' | 'QUERY_FAILED';

interface EngineConfig {
  displayName: string;
  defaultPort: number;
  uriEnv: string;
  connStringEnv: string;
  hostEnv: string;
  portEnv: string;
  databaseEnv: string;
  databaseAltEnv?: string;
  userEnv: string;
  tcpCheck: {
    command: string;
    dockerGrep: string;
    dockerRun: (port: number) => string;
    installUrl: string;
  };
  queryCheck: {
    loginCommand: (host: string, port: number) => string;
    listCommand: string;
    authHint: string;
  };
}

const DEFAULT_DB_ENGINE: DbEngine = 'mysql';
const LOCALHOST = 'localhost';
const LOCALHOST_IPV4 = '127.0.0.1';
const TCP_CHECK_TIMEOUT_MS = 3000;
const MAX_DATABASE_RETRIES = 3;
const DATABASE_RETRY_DELAY_MS = 2000;

const ENGINE_CONFIGS: Record<DbEngine, EngineConfig> = {
  mysql: {
    displayName: 'MySQL',
    defaultPort: 3306,
    uriEnv: 'MYSQLDB_URI',
    connStringEnv: 'ConnectionStrings__mysqldb',
    hostEnv: 'MYSQLDB_HOST',
    portEnv: 'MYSQLDB_PORT',
    databaseEnv: 'MYSQLDB_DATABASE',
    databaseAltEnv: 'MYSQLDB_DATABASENAME',
    userEnv: 'MYSQLDB_USER',
    tcpCheck: {
      command: 'mysqladmin ping',
      dockerGrep: 'mysql',
      dockerRun: (port: number) =>
        `docker run -d -p ${port}:3306 -e MYSQL_ALLOW_EMPTY_PASSWORD=yes mysql:8.4`,
      installUrl: 'https://dev.mysql.com/downloads/',
    },
    queryCheck: {
      loginCommand: (host: string, port: number) => `mysql -h ${host} -P ${port} -u root`,
      listCommand: 'mysql -e "SHOW DATABASES"',
      authHint: 'Check MySQL user grants and bind-address config',
    },
  },
  postgres: {
    displayName: 'PostgreSQL',
    defaultPort: 5432,
    uriEnv: 'POSTGRESDB_URI',
    connStringEnv: 'ConnectionStrings__postgresdb',
    hostEnv: 'POSTGRESDB_HOST',
    portEnv: 'POSTGRESDB_PORT',
    databaseEnv: 'POSTGRESDB_DATABASE',
    databaseAltEnv: 'POSTGRESDB_DATABASENAME',
    userEnv: 'POSTGRESDB_USER',
    tcpCheck: {
      command: 'pg_isready',
      dockerGrep: 'postgres',
      dockerRun: (port: number) =>
        `docker run -d -p ${port}:5432 -e POSTGRES_PASSWORD=postgres postgres:18`,
      installUrl: 'https://postgresql.org/download/windows/',
    },
    queryCheck: {
      loginCommand: (host: string, port: number) => `psql -h ${host} -p ${port} -U postgres`,
      listCommand: 'psql -l',
      authHint: 'Check pg_hba.conf allows password auth from localhost',
    },
  },
  mssql: {
    displayName: 'SQL Server',
    defaultPort: 1433,
    uriEnv: 'MSSQLDB_URI',
    connStringEnv: 'ConnectionStrings__mssqldb',
    hostEnv: 'MSSQLDB_HOST',
    portEnv: 'MSSQLDB_PORT',
    databaseEnv: 'MSSQLDB_DATABASE',
    databaseAltEnv: 'MSSQLDB_DATABASENAME',
    userEnv: 'MSSQLDB_USER',
    tcpCheck: {
      command: 'sqlcmd -Q "SELECT 1"',
      dockerGrep: 'mssql',
      dockerRun: (port: number) =>
        `docker run -d -p ${port}:1433 -e ACCEPT_EULA=Y -e SA_PASSWORD=YourStrong!Passw0rd mcr.microsoft.com/mssql/server:2025-latest`,
      installUrl: 'https://learn.microsoft.com/sql/database-engine/install-windows/',
    },
    queryCheck: {
      loginCommand: (host: string, port: number) => `sqlcmd -S ${host},${port} -U sa`,
      listCommand: 'sqlcmd -Q "SELECT name FROM sys.databases"',
      authHint: 'Check SQL Server authentication mode and user credentials',
    },
  },
};

/** Create a startup hook that verifies database connectivity. */
export function createDatabaseConnectivityStartupHook(options: {
  serviceName: string;
  database: Database;
}): () => Promise<void> {
  return async () => {
    await verifyDatabaseConnectivity(options.serviceName, options.database);
  };
}

async function verifyDatabaseConnectivity(
  serviceName: string,
  database: Database,
): Promise<void> {
  const logger = createServiceLogger(serviceName);
  const engineCfg = getEngineConfig();
  const { host, port } = resolveDatabaseEndpoint(engineCfg);

  logger.info(`Verifying ${engineCfg.displayName} connectivity`, {
    service: serviceName,
    host,
    port,
  });

  for (let attempt = 1; attempt <= MAX_DATABASE_RETRIES; attempt++) {
    const tcpReachable = await checkTcpPort(host, port, TCP_CHECK_TIMEOUT_MS);
    const isLastAttempt = attempt === MAX_DATABASE_RETRIES;

    if (!tcpReachable) {
      if (!isLastAttempt) {
        logger.warn(`${engineCfg.displayName} is not reachable; retrying`, {
          service: serviceName,
          host,
          port,
          attempt,
          maxRetries: MAX_DATABASE_RETRIES,
          retryDelayMs: DATABASE_RETRY_DELAY_MS,
        });
        await delay(DATABASE_RETRY_DELAY_MS);
        continue;
      }

      logConnectionDiagnostics(logger, serviceName, host, port, 'TCP_UNREACHABLE', engineCfg);
      return;
    }

    try {
      await database.$queryRaw`SELECT 1`;
      logger.info('Database connection verified', { service: serviceName, host, port });
      return;
    } catch (error) {
      const displayMessage = extractRootCause(error) ?? errorToMessage(error);
      if (!isLastAttempt) {
        logger.warn('Database query check failed; retrying', {
          service: serviceName,
          attempt,
          maxRetries: MAX_DATABASE_RETRIES,
          retryDelayMs: DATABASE_RETRY_DELAY_MS,
          error: displayMessage,
        });
        await delay(DATABASE_RETRY_DELAY_MS);
        continue;
      }

      logConnectionDiagnostics(
        logger,
        serviceName,
        host,
        port,
        'QUERY_FAILED',
        engineCfg,
        displayMessage,
      );

      if (error instanceof Error && error.stack) {
        logger.error('Database query failure stack', { stack: error.stack });
      }
    }
  }
}

function getEngineConfig(): EngineConfig {
  const provider = Deno.env.get('DB_PROVIDER') as DbEngine | null;
  return provider && provider in ENGINE_CONFIGS
    ? ENGINE_CONFIGS[provider]
    : ENGINE_CONFIGS[DEFAULT_DB_ENGINE];
}

function resolveDatabaseEndpoint(engineCfg: EngineConfig): { host: string; port: number } {
  const dbUri = Deno.env.get(engineCfg.uriEnv) ?? Deno.env.get(engineCfg.connStringEnv);
  let host = Deno.env.get(engineCfg.hostEnv) ?? LOCALHOST;
  let port = Number.parseInt(
    Deno.env.get(engineCfg.portEnv) ?? String(engineCfg.defaultPort),
    10,
  );

  if (dbUri) {
    try {
      const url = new URL(dbUri);
      host = url.hostname || host;
      port = Number.parseInt(url.port, 10) || port;
    } catch {
      // Environment fallbacks remain authoritative when URI parsing fails.
    }
  }

  return { host, port };
}

async function checkTcpPort(host: string, port: number, timeoutMs: number): Promise<boolean> {
  const resolvedHost = host === LOCALHOST ? LOCALHOST_IPV4 : host;

  try {
    const conn = await Promise.race([
      Deno.connect({ hostname: resolvedHost, port }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('TCP timeout')), timeoutMs)
      ),
    ]);
    conn.close();
    return true;
  } catch {
    return false;
  }
}

function logConnectionDiagnostics(
  logger: Logger,
  serviceName: string,
  host: string,
  port: number,
  reason: ConnectivityFailureReason,
  engineCfg: EngineConfig,
  errorMessage?: string,
): void {
  logger.error(buildConnectionDiagnostics(serviceName, host, port, reason, engineCfg, errorMessage));
}

function buildConnectionDiagnostics(
  serviceName: string,
  host: string,
  port: number,
  reason: ConnectivityFailureReason,
  cfg: EngineConfig,
  errorMessage?: string,
): string {
  const maskedUri = maskConnectionUri(Deno.env.get(cfg.uriEnv));
  const databaseName = Deno.env.get(cfg.databaseEnv) ??
    (cfg.databaseAltEnv ? Deno.env.get(cfg.databaseAltEnv) : undefined) ??
    '(not set)';

  const lines = [
    '',
    '   ┌─────────────────────────────────────────────────────────────',
  ];

  if (reason === 'TCP_UNREACHABLE') {
    lines.push(
      `   │ [${serviceName}] ${cfg.displayName} is NOT reachable at ${host}:${port}`,
      '   │',
      '   │ The TCP port is not accepting connections. This means',
      `   │ ${cfg.displayName} is either not running or not listening on this`,
      '   │ host/port combination.',
    );
  } else {
    lines.push(
      `   │ [${serviceName}] ${cfg.displayName} is reachable at ${host}:${port}`,
      '   │    but database queries are failing.',
    );
    if (errorMessage) {
      lines.push(`   │ Error: ${errorMessage}`);
    }
    lines.push(
      '   │',
      '   │ Possible causes: wrong credentials, database does not exist,',
      `   │ Prisma schema mismatch, or ${cfg.queryCheck.authHint}.`,
    );
  }

  lines.push(
    '   ├─────────────────────────────────────────────────────────────',
    '   │ When running outside Aspire (e.g. Windows Services via Servy),',
    `   │ ${cfg.displayName} must be running independently. Aspire manages its`,
    `   │ own ${cfg.displayName} container only during \`aspire run\`.`,
    '   │',
    formatEnvLine(cfg.uriEnv, maskedUri),
    formatEnvLine(cfg.hostEnv, Deno.env.get(cfg.hostEnv) ?? '(not set)'),
    formatEnvLine(cfg.portEnv, Deno.env.get(cfg.portEnv) ?? '(not set)'),
    formatEnvLine(cfg.databaseEnv, databaseName),
    '   │',
    '   │ Quick checks:',
  );

  if (reason === 'TCP_UNREACHABLE') {
    lines.push(
      `   │   1. Is ${cfg.displayName} running? ${cfg.tcpCheck.command} -h ${host} -p ${port}`,
      `   │   2. If using Docker: docker ps | grep ${cfg.tcpCheck.dockerGrep}`,
      `   │   3. Start it: ${cfg.tcpCheck.dockerRun(port)}`,
      `   │   4. Or install: ${cfg.tcpCheck.installUrl}`,
    );
  } else {
    lines.push(
      `   │   1. Test login: ${cfg.queryCheck.loginCommand(host, port)}`,
      `   │   2. Check database exists: ${cfg.queryCheck.listCommand}`,
      '   │   3. Run migrations: deno task prisma:migrate',
      `   │   4. ${cfg.queryCheck.authHint}`,
    );
  }

  lines.push('   └─────────────────────────────────────────────────────────────', '');
  return lines.join('\n');
}

function maskConnectionUri(uri: string | undefined): string {
  if (!uri) return '(not set)';
  try {
    const parsed = new URL(uri);
    return `${parsed.protocol}//${parsed.username}:***@${parsed.hostname}:${parsed.port}${parsed.pathname}`;
  } catch {
    return '(unparseable)';
  }
}

function formatEnvLine(name: string, value: string): string {
  return `   │ ${name}:${' '.repeat(Math.max(1, 14 - name.length))}${value}`;
}

function extractRootCause(error: unknown): string | undefined {
  if (!(error instanceof Error)) return undefined;

  let current: unknown = error;
  let deepestCause: string | undefined;

  while (current instanceof Error) {
    const metadata = readErrorMetadata(current);
    deepestCause = metadata ?? deepestCause;

    if (current.cause instanceof Error) {
      current = current.cause;
      if (current.message && !current.message.includes('invocation:')) {
        deepestCause = current.message;
        const code = readErrorCode(current);
        if (code) {
          deepestCause = `${code}: ${deepestCause}`;
        }
      }
    } else if (typeof current.cause === 'string' && current.cause) {
      deepestCause = current.cause;
      break;
    } else {
      break;
    }
  }

  return deepestCause;
}

function readErrorMetadata(error: Error): string | undefined {
  const meta = (error as { meta?: unknown }).meta;
  if (!meta || typeof meta !== 'object') return undefined;

  const record = meta as Record<string, unknown>;
  return typeof record.cause === 'string' && record.cause
    ? record.cause
    : typeof record.message === 'string' && record.message
    ? record.message
    : undefined;
}

function readErrorCode(error: Error): string | undefined {
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : undefined;
}

function errorToMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
