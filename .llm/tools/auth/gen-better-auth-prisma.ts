#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-env

import { parseArgs } from 'jsr:@std/cli@^1/parse-args';

type GeneratorArgs = {
  readonly config?: string;
  readonly output?: string;
  readonly yes?: boolean;
  readonly help?: boolean;
};

const args = parseArgs(Deno.args, {
  string: ['config', 'output'],
  boolean: ['yes', 'help'],
  alias: {
    c: 'config',
    o: 'output',
    y: 'yes',
    h: 'help',
  },
}) as GeneratorArgs;

if (args.help) {
  printHelp();
  Deno.exit(0);
}

if (!args.config) {
  console.error('Missing required --config <path> option.');
  printHelp();
  Deno.exit(2);
}

const commandArgs = [
  'run',
  '--allow-read',
  '--allow-write',
  '--allow-env',
  '--allow-net',
  '--allow-run',
  'npm:@better-auth/cli@1.6.20',
  'generate',
  '--config',
  args.config,
];

if (args.output) {
  commandArgs.push('--output', args.output);
}
if (args.yes) {
  commandArgs.push('--yes');
}

const command = new Deno.Command(Deno.execPath(), {
  args: commandArgs,
  stdin: 'inherit',
  stdout: 'inherit',
  stderr: 'inherit',
});
const status = await command.spawn().status;
Deno.exit(status.code);

function printHelp(): void {
  console.log(`Generate better-auth Prisma models for a NetScript database schema.

Usage:
  deno run --allow-read --allow-write --allow-run --allow-env .llm/tools/auth/gen-better-auth-prisma.ts --config ./auth.ts --output ./database/better-auth.prisma --yes

Options:
  --config, -c  better-auth config module consumed by @better-auth/cli
  --output, -o  output Prisma schema contribution path
  --yes, -y     forward non-interactive confirmation to @better-auth/cli
  --help, -h    show this help
`);
}
