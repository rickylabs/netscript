#!/usr/bin/env -S deno run --allow-read
/**
 * Report the workspace dependency and task baseline used by dependency-shape scanners.
 */
import { collectWorkspaceFacts, type DependencyUse } from './workspace.ts';

interface Args {
  json: boolean;
}

function parseArgs(argv: string[]): Args {
  return { json: argv.includes('--json') };
}

function keyOf(use: DependencyUse): string {
  return `${use.registry}:${use.name}`;
}

function summarizeDependencies(dependencies: DependencyUse[]) {
  const byDep = new Map<string, DependencyUse[]>();
  for (const use of dependencies) {
    const key = keyOf(use);
    const entries = byDep.get(key) ?? [];
    entries.push(use);
    byDep.set(key, entries);
  }
  return [...byDep.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, uses]) => ({
    key,
    members: [...new Set(uses.map((use) => use.member.root))].sort(),
    ranges: [...new Set(uses.map((use) => use.range || use.raw))].sort(),
    sources: [...new Set(uses.map((use) => use.source))].sort(),
    refs: uses.map((use) => `${use.path}:${use.line}`).sort(),
  }));
}

function summarizeTasks(tasks: Awaited<ReturnType<typeof collectWorkspaceFacts>>['tasks']) {
  const taskNames = new Set(tasks.map((task) => task.name));
  return tasks.map((task) => {
    const referencedTasks = [...taskNames]
      .filter((name) =>
        new RegExp(`\\bdeno\\s+task\\s+${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(
          task.command,
        )
      )
      .sort();
    return {
      owner: task.member?.root ?? '<root>',
      name: task.name,
      command: task.command,
      refs: referencedTasks,
      path: `${task.path}:${task.line}`,
    };
  });
}

async function main(): Promise<void> {
  const args = parseArgs(Deno.args);
  const facts = await collectWorkspaceFacts();
  const dependencySummary = summarizeDependencies(facts.dependencies);
  const taskSummary = summarizeTasks(facts.tasks);
  const result = {
    generatedAt: new Date().toISOString(),
    members: facts.members.map((member) => ({
      name: member.name,
      root: member.root,
      publishable: member.publishable,
      packageJson: member.packageJsonPath,
    })),
    catalogEntries: Object.keys(facts.catalog).sort(),
    dependencies: dependencySummary,
    tasks: taskSummary,
    counts: {
      members: facts.members.length,
      catalogEntries: Object.keys(facts.catalog).length,
      dependencyKeys: dependencySummary.length,
      dependencyUses: facts.dependencies.length,
      tasks: facts.tasks.length,
    },
  };

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(
    `deps:census members=${result.counts.members} catalog=${result.counts.catalogEntries} deps=${result.counts.dependencyKeys} uses=${result.counts.dependencyUses} tasks=${result.counts.tasks}`,
  );
  for (const dep of dependencySummary) {
    console.log(
      `  ${dep.key} members=${dep.members.length} ranges=${dep.ranges.join(', ') || '<none>'}`,
    );
  }
}

function printHelp(): void {
  console.log(
    [
      'deps/census.ts — report the workspace dependency + task baseline for shape scanners',
      '',
      'Usage:',
      '  deno run --allow-read .llm/tools/deps/census.ts [--json]',
      '',
      'Flags:',
      '  --json      full JSON report instead of the one-line + per-dep summary',
      '  --help, -h  show this help',
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
