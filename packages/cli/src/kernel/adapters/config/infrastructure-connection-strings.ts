import {
  CACHE_DEFAULT_PORT,
  CACHE_PROVIDERS,
  CACHE_URI_PREFIXES,
  DB_DEFAULT_PORTS,
  DB_PROVIDERS,
  DB_URI_PREFIXES,
} from '../../constants/providers.ts';

// ============================================================================
// CONNECTION STRING PARSERS
// ============================================================================

export interface ParsedDbConnection {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  provider: string;
}

/**
 * Parse a PostgreSQL connection string (URI or ADO.NET format).
 */
export function parsePostgresConnectionString(connStr: string): ParsedDbConnection {
  // URI format: postgres://user:password@host:port/database
  const uriMatch = connStr.match(
    /^(?:postgres|postgresql):\/\/([^:]+)?(?::([^@]*))?@([^:/?]+)(?::(\d+))?(?:\/([^?]*))?/i,
  );
  if (uriMatch) {
    return {
      provider: DB_PROVIDERS.POSTGRES,
      user: uriMatch[1] ?? 'postgres',
      password: uriMatch[2] ?? '',
      host: uriMatch[3] ?? 'localhost',
      port: uriMatch[4] ? parseInt(uriMatch[4], 10) : DB_DEFAULT_PORTS[DB_PROVIDERS.POSTGRES],
      database: uriMatch[5] ?? 'postgres',
    };
  }

  // ADO.NET format: Host=localhost;Port=5432;Database=db;Username=user;Password=pass
  const adonet: ParsedDbConnection = {
    provider: DB_PROVIDERS.POSTGRES,
    host: 'localhost',
    port: DB_DEFAULT_PORTS[DB_PROVIDERS.POSTGRES],
    database: 'postgres',
    user: 'postgres',
    password: '',
  };
  for (const part of connStr.split(';')) {
    const [k, ...v] = part.split('=');
    const val = v.join('=').trim();
    switch (k.trim().toLowerCase()) {
      case 'host':
        adonet.host = val;
        break;
      case 'port':
        adonet.port = parseInt(val, 10);
        break;
      case 'database':
        adonet.database = val;
        break;
      case 'username':
      case 'user id':
      case 'uid':
        adonet.user = val;
        break;
      case 'password':
      case 'pwd':
        adonet.password = val;
        break;
    }
  }
  return adonet;
}

/**
 * Parse a MySQL connection string (URI or ADO.NET format).
 */
export function parseMysqlConnectionString(connStr: string): ParsedDbConnection {
  const uriMatch = connStr.match(
    /^mysql:\/\/([^:]+)?(?::([^@]*))?@([^:/?]+)(?::(\d+))?(?:\/([^?]*))?/i,
  );
  if (uriMatch) {
    return {
      provider: DB_PROVIDERS.MYSQL,
      user: uriMatch[1] ?? 'root',
      password: uriMatch[2] ?? '',
      host: uriMatch[3] ?? 'localhost',
      port: uriMatch[4] ? parseInt(uriMatch[4], 10) : DB_DEFAULT_PORTS[DB_PROVIDERS.MYSQL],
      database: uriMatch[5] ?? 'mysql',
    };
  }

  const adonet: ParsedDbConnection = {
    provider: DB_PROVIDERS.MYSQL,
    host: 'localhost',
    port: DB_DEFAULT_PORTS[DB_PROVIDERS.MYSQL],
    database: 'mysql',
    user: 'root',
    password: '',
  };
  for (const part of connStr.split(';')) {
    const [k, ...v] = part.split('=');
    const val = v.join('=').trim();
    switch (k.trim().toLowerCase()) {
      case 'server':
        adonet.host = val;
        break;
      case 'port':
        adonet.port = parseInt(val, 10);
        break;
      case 'database':
        adonet.database = val;
        break;
      case 'user':
      case 'uid':
      case 'user id':
        adonet.user = val;
        break;
      case 'password':
      case 'pwd':
        adonet.password = val;
        break;
    }
  }
  return adonet;
}

/**
 * Parse an MSSQL / SQL Server connection string.
 */
export function parseMssqlConnectionString(connStr: string): ParsedDbConnection {
  const adonet: ParsedDbConnection = {
    provider: DB_PROVIDERS.MSSQL,
    host: 'localhost',
    port: DB_DEFAULT_PORTS[DB_PROVIDERS.MSSQL],
    database: 'master',
    user: 'sa',
    password: '',
  };
  for (const part of connStr.split(';')) {
    const [k, ...v] = part.split('=');
    const val = v.join('=').trim();
    switch (k.trim().toLowerCase()) {
      case 'server':
      case 'data source': {
        const serverMatch = val.match(/^(?:tcp:)?([^,]+)(?:,(\d+))?/);
        if (serverMatch) {
          adonet.host = serverMatch[1].trim();
          if (serverMatch[2]) adonet.port = parseInt(serverMatch[2], 10);
        }
        break;
      }
      case 'database':
      case 'initial catalog':
        adonet.database = val;
        break;
      case 'user id':
      case 'uid':
        adonet.user = val;
        break;
      case 'password':
      case 'pwd':
        adonet.password = val;
        break;
    }
  }
  return adonet;
}

/**
 * Parse a cache connection string (garnet://host:port,password=X or host:port).
 */
export function parseCacheConnectionString(connStr: string, provider: string): {
  host: string;
  port: number;
  password?: string;
} {
  // garnet://host:port,password=X or redis://...
  const uriMatch = connStr.match(/^(?:garnet|redis):\/\/([^:/?]+)(?::(\d+))?(?:,password=(.+))?/i);
  if (uriMatch) {
    return {
      host: uriMatch[1],
      port: uriMatch[2] ? parseInt(uriMatch[2], 10) : CACHE_DEFAULT_PORT,
      password: uriMatch[3],
    };
  }

  // Plain host:port or host:port,password=X
  const plainMatch = connStr.match(/^([^:,]+)(?::(\d+))?(?:,password=(.+))?/i);
  if (plainMatch) {
    return {
      host: plainMatch[1],
      port: plainMatch[2] ? parseInt(plainMatch[2], 10) : CACHE_DEFAULT_PORT,
      password: plainMatch[3],
    };
  }

  return {
    host: provider === CACHE_PROVIDERS.GARNET ? '127.0.0.1' : 'localhost',
    port: CACHE_DEFAULT_PORT,
  };
}

// ============================================================================
// PROVIDER INFERENCE
// ============================================================================

/**
 * Infer the database provider from a connection string URI scheme.
 */
export function inferDbProvider(connStr: string): string {
  const lower = connStr.toLowerCase();
  for (const [provider, prefixes] of Object.entries(DB_URI_PREFIXES)) {
    if (prefixes.some((p) => lower.startsWith(p))) return provider;
  }
  // ADO.NET heuristics
  if (lower.includes('trusted_connection') || lower.includes('encrypt=')) return DB_PROVIDERS.MSSQL;
  if (lower.includes('server=') && lower.includes('port=3306')) return DB_PROVIDERS.MYSQL;
  // Respect DB_PROVIDER env var (set via .env.local / --env-file), then fall back
  // to postgres (the engine configured in appsettings.json for this project).
  // Previously hardcoded to MYSQL which caused services to check for MySQL
  // connectivity even when the project uses Postgres.
  const envProvider = Deno.env.get('DB_PROVIDER')?.toLowerCase();
  if (envProvider && envProvider in DB_DEFAULT_PORTS) return envProvider;
  return DB_PROVIDERS.POSTGRES;
}

/**
 * Infer cache provider from a connection string.
 */
export function inferCacheProvider(connStr: string): string {
  const lower = connStr.toLowerCase();
  for (const [provider, prefixes] of Object.entries(CACHE_URI_PREFIXES)) {
    if (prefixes.some((p) => lower.startsWith(p))) return provider;
  }
  return CACHE_PROVIDERS.GARNET;
}

// ============================================================================
// URI BUILDERS
// ============================================================================

export function buildDatabaseUri(parsed: ParsedDbConnection): string {
  const provider = parsed.provider;
  const encodedPassword = encodeURIComponent(parsed.password);

  if (provider === DB_PROVIDERS.MYSQL) {
    return `mysql://${parsed.user}:${encodedPassword}@${parsed.host}:${parsed.port}/${parsed.database}`;
  }
  if (provider === DB_PROVIDERS.MSSQL || provider === DB_PROVIDERS.SQLSERVER) {
    return `sqlserver://${parsed.host}:${parsed.port};database=${parsed.database};user id=${parsed.user};password=${parsed.password}`;
  }
  // postgres
  return `postgres://${parsed.user}:${encodedPassword}@${parsed.host}:${parsed.port}/${parsed.database}`;
}

export function buildCacheUri(
  host: string,
  port: number,
  password?: string,
  provider?: string,
): string {
  const scheme = provider === CACHE_PROVIDERS.REDIS ? 'redis' : 'garnet';
  if (password) {
    return `${scheme}://${host}:${port},password=${password}`;
  }
  return `${scheme}://${host}:${port}`;
}
