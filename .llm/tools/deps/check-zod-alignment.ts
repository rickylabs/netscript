#!/usr/bin/env -S deno run --allow-read
/** Enforce a single npm Zod 4 instance across workspace manifests, source, and lock data. */
import { walk } from 'jsr:@std/fs@^1.0.0/walk';
import { join, normalize, relative } from 'jsr:@std/path@^1.0.0';
import { discoverWorkspaceMembers, readJsonFile } from './workspace.ts';

const ZOD_NAME = 'zod';
const WORKSPACE_ZOD_SPECIFIER = 'catalog:';
const ORPC_ZOD_V4_SPECIFIER = '@orpc/zod/zod4';

export interface ZodMemberImport {
  path: string;
  specifier: string;
}

export interface OrpcZodImport {
  path: string;
  specifier: string;
}

export interface ZodAlignmentInput {
  catalogZod?: string;
  memberImports: ZodMemberImport[];
  lockText: string;
  orpcImports: OrpcZodImport[];
}

export interface ZodAlignmentFinding {
  code: 'CATALOG' | 'MEMBER_SPECIFIER' | 'LOCK_INSTANCE' | 'ORPC_SURFACE';
  path: string;
  message: string;
}

export interface ZodAlignmentReport {
  findings: ZodAlignmentFinding[];
  resolvedInstances: string[];
}

function lockZodInstances(lockText: string): string[] {
  const lock = JSON.parse(lockText) as { npm?: Record<string, unknown> };
  return Object.keys(lock.npm ?? {})
    .filter((key) => /^zod@\d/.test(key))
    .sort();
}

/** Analyze materialized Zod dependency inputs without mutating the repository. */
export function analyzeZodAlignment(input: ZodAlignmentInput): ZodAlignmentReport {
  const findings: ZodAlignmentFinding[] = [];
  if (!input.catalogZod || !/^\^?4\./.test(input.catalogZod)) {
    findings.push({
      code: 'CATALOG',
      path: 'deno.json',
      message: `root catalog zod must be an npm v4 range, got ${input.catalogZod ?? '<missing>'}`,
    });
  }

  for (const member of input.memberImports) {
    if (member.specifier !== WORKSPACE_ZOD_SPECIFIER) {
      findings.push({
        code: 'MEMBER_SPECIFIER',
        path: member.path,
        message: `workspace zod must use ${WORKSPACE_ZOD_SPECIFIER}, got ${member.specifier}`,
      });
    }
  }

  const resolvedInstances = lockZodInstances(input.lockText);
  if (
    resolvedInstances.length !== 1 ||
    !/^zod@4\./.test(resolvedInstances[0] ?? '') ||
    input.lockText.includes('jsr:@zod/zod')
  ) {
    findings.push({
      code: 'LOCK_INSTANCE',
      path: 'deno.lock',
      message: `expected one npm Zod 4 instance and no JSR Zod, got ${
        resolvedInstances.join(', ') || '<none>'
      }`,
    });
  }

  for (const imported of input.orpcImports) {
    if (imported.specifier !== ORPC_ZOD_V4_SPECIFIER) {
      findings.push({
        code: 'ORPC_SURFACE',
        path: imported.path,
        message: `source must import ${ORPC_ZOD_V4_SPECIFIER}, got ${imported.specifier}`,
      });
    }
  }

  return { findings, resolvedInstances };
}

async function collectInput(root: string): Promise<ZodAlignmentInput> {
  const rootConfig = await readJsonFile(join(root, 'deno.json'));
  const catalog = (rootConfig.catalog ?? {}) as Record<string, unknown>;
  const memberImports: ZodMemberImport[] = [];
  const orpcImports: OrpcZodImport[] = [];
  const members = await discoverWorkspaceMembers(root);

  for (const member of members) {
    const config = await readJsonFile(join(root, member.denoJsonPath));
    const imports = (config.imports ?? {}) as Record<string, unknown>;
    if (typeof imports[ZOD_NAME] === 'string') {
      memberImports.push({ path: member.denoJsonPath, specifier: imports[ZOD_NAME] });
    }

    for await (
      const entry of walk(join(root, member.root), {
        match: [/\.[cm]?tsx?$/],
        skip: [/node_modules/, /\.generated/, /_fresh/, /\.deploy/],
      })
    ) {
      const text = await Deno.readTextFile(entry.path);
      for (
        const match of text.matchAll(
          /\b(?:import|export)\s+(?:type\s+)?(?:[^'";]*?\s+from\s+)?['"](@orpc\/zod(?:\/[^'"]*)?)['"]/g,
        )
      ) {
        orpcImports.push({
          path: normalize(relative(root, entry.path)),
          specifier: match[1],
        });
      }
    }
  }

  return {
    catalogZod: typeof catalog[ZOD_NAME] === 'string' ? catalog[ZOD_NAME] : undefined,
    memberImports,
    lockText: await Deno.readTextFile(join(root, 'deno.lock')),
    orpcImports,
  };
}

async function main(): Promise<void> {
  const report = analyzeZodAlignment(await collectInput(Deno.cwd()));
  if (report.findings.length === 0) {
    console.log(`zod-alignment PASS instances=${report.resolvedInstances.join(',')}`);
    return;
  }
  console.error(`zod-alignment FAIL findings=${report.findings.length}`);
  for (const finding of report.findings) {
    console.error(`${finding.code} ${finding.path} ${finding.message}`);
  }
  Deno.exit(1);
}

if (import.meta.main) await main();
