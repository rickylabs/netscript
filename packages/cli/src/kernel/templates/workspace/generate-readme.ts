/**
 * @module templates/workspace/generate-readme
 *
 * Tier 1 generator for the project root `README.md`.
 *
 * The README must reflect the answers the user actually gave — TS vs
 * legacy Aspire AppHost, whether an example service was scaffolded,
 * which database engine (if any) was chosen. A static template cannot
 * express those conditionals so this lives as a programmatic generator.
 */

import { toPascalCase } from '@std/text';
import type { DbEngineChoice } from '../../domain/db-engine.ts';

/** Options for generating the project root `README.md`. */
export interface ReadmeOptions {
  /** Project name (kebab-case). */
  readonly name: string;
  /** App name that was scaffolded (e.g. `dashboard`). */
  readonly appName: string;
  /** `true` when --no-aspire was used (no orchestration layer scaffolded). */
  readonly noAspire: boolean;
  /** `true` when the user opted into the legacy C# AppHost. */
  readonly legacyAspire: boolean;
  /** Scaffolded example service name, or `undefined`. */
  readonly serviceName?: string;
  /** Engine chosen for the primary database, or `'none'`. */
  readonly dbEngine: DbEngineChoice;
}

const ENGINE_LABELS: Record<Exclude<DbEngineChoice, 'none'>, string> = {
  postgres: 'PostgreSQL',
  mysql: 'MySQL',
  mssql: 'SQL Server',
  sqlite: 'SQLite',
};

const ENGINE_ENV_VARS: Record<Exclude<DbEngineChoice, 'none'>, string> = {
  postgres: 'POSTGRES_URI',
  mysql: 'MYSQL_URI',
  mssql: 'MSSQL_URI',
  sqlite: 'DATABASE_URL',
};

/**
 * Generate the `README.md` contents for a newly scaffolded project.
 *
 * @param options - Answer-driven options covering orchestration, service,
 *   and database choices.
 * @returns Markdown string with a trailing newline.
 */
export function generateReadme(options: ReadmeOptions): string {
  const lines: string[] = [];
  lines.push(`# ${toPascalCase(options.name)}`);
  lines.push('');
  lines.push('A NetScript application scaffolded with `netscript init`.');
  lines.push('');
  lines.push('## Quick Start');
  lines.push('');
  lines.push('```bash');
  if (!options.noAspire) {
    if (options.legacyAspire) {
      lines.push('# Start the full Aspire orchestration (C# AppHost)');
      lines.push('dotnet run --project dotnet/AppHost');
    } else {
      lines.push('# Restore Aspire SDK modules (once), then start orchestration');
      lines.push(
        '# (run from the aspire/ subfolder so `aspire` sees apphost.mts + aspire.config.json)',
      );
      lines.push('cd aspire && aspire restore');
      lines.push('aspire run');
    }
  } else {
    lines.push('# Start the Fresh app directly (no Aspire orchestration)');
    lines.push(`deno task --cwd apps/${options.appName} dev`);
  }
  lines.push('```');
  lines.push('');

  lines.push('## Project Structure');
  lines.push('');
  lines.push('```');
  lines.push(`${options.name}/`);
  lines.push(`├── apps/${options.appName}/   # Fresh frontend (defineFreshApp)`);
  lines.push('├── contracts/        # Shared oRPC contracts (versioned)');
  if (options.serviceName) {
    lines.push(`├── services/${options.serviceName}/ # Example oRPC service`);
  }
  lines.push('├── plugins/          # Plugin registry and implementations');
  if (!options.noAspire && options.legacyAspire) {
    lines.push('├── dotnet/           # Aspire C# orchestration (AppHost + ServiceDefaults)');
  } else if (!options.noAspire) {
    lines.push(
      '├── aspire/           # Aspire TypeScript orchestration (isolated Node.js runtime)',
    );
    lines.push('│   ├── apphost.mts   # Entry point for `aspire run`');
    lines.push('│   ├── .helpers/     # Generated register-*.mts helpers');
    lines.push('│   ├── .aspire/      # Aspire SDK modules (aspire restore output)');
    lines.push('│   └── package.json  # tsx + vscode-jsonrpc (isolated from the Deno workspace)');
  }
  if (!options.noAspire) {
    lines.push('├── appsettings.json  # NetScript infrastructure config (Services/Databases/…)');
  }
  lines.push('├── deno.json         # Workspace root configuration');
  lines.push('└── netscript.config.ts  # NetScript framework configuration');
  lines.push('```');
  lines.push('');

  lines.push('## Commands');
  lines.push('');
  lines.push(
    'Use `packages/cli/bin/netscript-dev.ts` for local contributor workflows; `packages/cli/bin/netscript.ts` mirrors the published public CLI surface.',
  );
  lines.push('');
  lines.push('| Command | Description |');
  lines.push('| --- | --- |');
  lines.push(
    `| \`deno task --cwd apps/${options.appName} dev\` | Start the Fresh app (Vite dev server) |`,
  );
  if (options.serviceName) {
    lines.push(
      `| \`deno task --cwd services/${options.serviceName} dev\` | Start the ${options.serviceName} oRPC service |`,
    );
  }
  if (!options.noAspire) {
    if (options.legacyAspire) {
      lines.push('| `dotnet run --project dotnet/AppHost` | Start Aspire orchestration (C#) |');
    } else {
      lines.push('| `cd aspire && aspire run` | Start Aspire orchestration (TypeScript AppHost) |');
      lines.push('| `cd aspire && aspire restore` | Restore Aspire SDK modules (run once) |');
    }
  }
  lines.push('| `deno task check` | Type-check all workspace members |');
  lines.push('| `deno task lint`  | Run linter |');
  lines.push('| `deno task fmt`   | Format code |');
  lines.push('| `deno task test`  | Run tests |');
  lines.push(
    '| `deno run -A packages/cli/bin/netscript-dev.ts --help` | Show local contributor CLI commands |',
  );
  lines.push('| `deno run -A packages/cli/bin/netscript.ts --help` | Show public CLI commands |');
  lines.push('');

  if (options.serviceName) {
    lines.push(`## Example Service — \`${options.serviceName}\``);
    lines.push('');
    lines.push(
      `The \`${options.serviceName}\` service is an oRPC handler wired to ` +
        `\`contracts/versions/v1/${options.serviceName}.contract.ts\`. It exposes` +
        ` \`${options.serviceName}.health.check\` via \`/rpc\` and a plain \`/health\` endpoint.`,
    );
    lines.push('');
    lines.push(
      'Extend the contract with additional procedures, then implement matching ' +
        `handlers under \`services/${options.serviceName}/src/routers/\`.`,
    );
    lines.push('');
  }

  if (options.dbEngine !== 'none') {
    const engineLabel = ENGINE_LABELS[options.dbEngine];
    lines.push('## Database');
    lines.push('');
    if (options.noAspire) {
      const envVar = ENGINE_ENV_VARS[options.dbEngine];
      lines.push(
        `Primary database: **${engineLabel}**. Self-provision the database and expose ` +
          `its connection string with \`${envVar}\` or \`DATABASE_URL\`.`,
      );
    } else {
      lines.push(
        `Primary database: **${engineLabel}** (key \`${options.dbEngine}\` in ` +
          '`appsettings.json`). The Aspire orchestration layer provisions it ' +
          `on \`${options.legacyAspire ? 'dotnet run' : 'aspire run'}\` — no manual container ` +
          'setup required.',
      );
    }
    lines.push('');
    lines.push('Use the local contributor CLI for database commands in this workspace:');
    lines.push('');
    lines.push('```bash');
    lines.push('deno run -A packages/cli/bin/netscript-dev.ts db init --name init');
    lines.push('deno run -A packages/cli/bin/netscript-dev.ts db generate');
    lines.push('deno run -A packages/cli/bin/netscript-dev.ts db seed');
    lines.push('deno run -A packages/cli/bin/netscript-dev.ts db status');
    lines.push('```');
    lines.push('');
    if (!options.noAspire) {
      if (options.dbEngine === 'sqlite') {
        lines.push(
          'SQLite is configured as a non-persistent file database; update ' +
            '`Persistent: true` in `appsettings.json` to retain data across runs.',
        );
      } else {
        lines.push(
          'The container is persistent by default. Update `Persistent: false` ' +
            'in `appsettings.json` if you prefer an ephemeral instance during ' +
            'development.',
        );
      }
      lines.push('');
    }
  }

  lines.push('## Learn More');
  lines.push('');
  lines.push('- [NetScript Documentation](https://github.com/rickylabs/netscript)');
  lines.push('- [Deno Manual](https://docs.deno.com)');
  lines.push('- [Fresh](https://fresh.deno.dev)');
  lines.push('- [oRPC](https://orpc.unnoq.com)');
  lines.push('');

  return lines.join('\n');
}
