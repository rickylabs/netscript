#!/usr/bin/env -S deno run --allow-read
/**
 * Report file:/link: dependency specifiers in publishable workspace members.
 */
import { parse as parseJsonc } from 'jsr:@std/jsonc@^1.0.0/parse';
import { join } from 'jsr:@std/path@^1.0.0';
import {
  discoverWorkspaceMembers,
  type Finding,
  hasFail,
  lineOf,
  printFindings,
  readJsonFile,
  type WorkspaceMember,
} from './workspace.ts';

interface Args {
  json: boolean;
  failOnViolation: boolean;
}

type JsonObject = Record<string, unknown>;

function parseArgs(argv: string[]): Args {
  return {
    json: argv.includes('--json'),
    failOnViolation: argv.includes('--fail-on-violation'),
  };
}

function findingLevel(args: Args): 'WARN' | 'FAIL' {
  return args.failOnViolation ? 'FAIL' : 'WARN';
}

function visitStrings(value: unknown, visit: (value: string) => void): void {
  if (typeof value === 'string') {
    visit(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) visitStrings(item, visit);
    return;
  }
  if (value && typeof value === 'object') {
    for (const item of Object.values(value as JsonObject)) visitStrings(item, visit);
  }
}

function isFileOrLink(value: string): boolean {
  return value.startsWith('file:') || value.startsWith('link:');
}

async function scanJsonSurface(
  root: string,
  member: WorkspaceMember,
  path: string,
  args: Args,
): Promise<Finding[]> {
  const text = await Deno.readTextFile(join(root, path));
  const json = parseJsonc(text) as JsonObject;
  const findings: Finding[] = [];
  visitStrings(json.imports, (value) => {
    if (!isFileOrLink(value)) return;
    findings.push({
      ref: 'DEPS-FILE-LINK',
      level: findingLevel(args),
      message:
        `${member.root} imports ${value}; publishable units must not ship file:/link: specifiers`,
      path,
      line: lineOf(text, value),
    });
  });
  visitStrings(json.scopes, (value) => {
    if (!isFileOrLink(value)) return;
    findings.push({
      ref: 'DEPS-FILE-LINK',
      level: findingLevel(args),
      message:
        `${member.root} scopes ${value}; publishable units must not ship file:/link: specifiers`,
      path,
      line: lineOf(text, value),
    });
  });
  for (
    const section of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']
  ) {
    visitStrings(json[section], (value) => {
      if (!isFileOrLink(value)) return;
      findings.push({
        ref: 'DEPS-FILE-LINK',
        level: findingLevel(args),
        message:
          `${member.root} declares ${value}; publishable units must not ship file:/link: specifiers`,
        path,
        line: lineOf(text, value),
      });
    });
  }
  return findings;
}

/** Analyze publishable members for file:/link: dependency specifiers. */
export async function analyzeFileLinkSpecifiers(
  root: string,
  args: Args,
): Promise<Finding[]> {
  const members = (await discoverWorkspaceMembers(root)).filter((member) => member.publishable);
  const findings: Finding[] = [];
  for (const member of members) {
    findings.push(...await scanJsonSurface(root, member, member.denoJsonPath, args));
    if (member.packageJsonPath) {
      findings.push(...await scanJsonSurface(root, member, member.packageJsonPath, args));
    }
  }
  return findings.sort((a, b) => `${a.path}:${a.line}`.localeCompare(`${b.path}:${b.line}`));
}

async function main(): Promise<void> {
  const args = parseArgs(Deno.args);
  await readJsonFile(join(Deno.cwd(), 'deno.json'));
  const findings = await analyzeFileLinkSpecifiers(Deno.cwd(), args);
  printFindings(findings, args.json);
  Deno.exit(hasFail(findings) ? 1 : 0);
}

function printHelp(): void {
  console.log(
    [
      'deps/audit-file-link.ts — report file:/link: dependency specifiers in publishable members',
      '',
      'Usage:',
      '  deno run --allow-read .llm/tools/deps/audit-file-link.ts [flags]',
      '',
      'Flags:',
      '  --json                full JSON findings instead of the text report',
      '  --fail-on-violation   emit findings at FAIL level (exit 1 on any finding)',
      '  --help, -h            show this help',
    ].join('\n'),
  );
}

if (import.meta.main) {
  if (Deno.args.includes('--help') || Deno.args.includes('-h')) {
    printHelp();
    Deno.exit(0);
  }
  await main();
}
