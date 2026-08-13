import { assert, assertEquals } from '@std/assert';

interface SourceLine {
  number: number;
  indent: number;
  text: string;
}

interface WorkflowStep {
  name: string;
  run?: string;
  workingDirectory?: string;
}

interface PagesWorkflowContract {
  eventPaths: Record<'pull_request' | 'push', string[]>;
  buildSteps: WorkflowStep[];
}

function sourceLines(source: string): SourceLine[] {
  return source.split('\n').flatMap((raw, index) => {
    if (raw.trim() === '' || raw.trimStart().startsWith('#')) return [];
    const indent = raw.length - raw.trimStart().length;
    if (indent % 2 !== 0) throw new Error(`pages.yml:${index + 1}: odd indentation`);
    return [{ number: index + 1, indent, text: raw.trim() }];
  });
}

function sectionEnd(lines: SourceLine[], start: number): number {
  const parentIndent = lines[start].indent;
  const next = lines.findIndex((line, index) => index > start && line.indent <= parentIndent);
  return next < 0 ? lines.length : next;
}

function childIndex(
  lines: SourceLine[],
  start: number,
  end: number,
  indent: number,
  key: string,
): number {
  const matches = lines.flatMap((line, index) =>
    index > start && index < end && line.indent === indent && line.text === `${key}:` ? [index] : []
  );
  if (matches.length !== 1) {
    throw new Error(`pages.yml: expected one ${key} section at indent ${indent}`);
  }
  return matches[0];
}

function scalar(line: SourceLine, key: string): string | undefined {
  const prefix = `${key}:`;
  return line.text.startsWith(prefix) ? line.text.slice(prefix.length).trim() : undefined;
}

function parsePagesWorkflow(source: string): PagesWorkflowContract {
  const lines = sourceLines(source);
  const root = (key: string) => childIndex(lines, -1, lines.length, 0, key);
  const on = root('on');
  const onEnd = sectionEnd(lines, on);
  const eventPaths = {} as Record<'pull_request' | 'push', string[]>;

  for (const event of ['pull_request', 'push'] as const) {
    const eventStart = childIndex(lines, on, onEnd, 2, event);
    const eventEnd = sectionEnd(lines, eventStart);
    const pathsStart = childIndex(lines, eventStart, eventEnd, 4, 'paths');
    const pathsEnd = sectionEnd(lines, pathsStart);
    eventPaths[event] = lines.slice(pathsStart + 1, pathsEnd).map((line) => {
      if (line.indent !== 6 || !line.text.startsWith('- ')) {
        throw new Error(`pages.yml:${line.number}: malformed ${event}.paths entry`);
      }
      return line.text.slice(2);
    });
  }

  const jobs = root('jobs');
  const build = childIndex(lines, jobs, sectionEnd(lines, jobs), 2, 'build');
  const steps = childIndex(lines, build, sectionEnd(lines, build), 4, 'steps');
  const stepsEnd = sectionEnd(lines, steps);
  const stepStarts = lines.flatMap((line, index) =>
    index > steps && index < stepsEnd && line.indent === 6 && line.text.startsWith('- name:')
      ? [index]
      : []
  );
  const buildSteps = stepStarts.map((start, ordinal) => {
    const end = stepStarts[ordinal + 1] ?? stepsEnd;
    const name = lines[start].text.slice('- name:'.length).trim();
    const fields = lines.slice(start + 1, end).filter((line) => line.indent === 8);
    return {
      name,
      run: fields.map((line) => scalar(line, 'run')).find((value) => value !== undefined),
      workingDirectory: fields.map((line) => scalar(line, 'working-directory')).find((value) =>
        value !== undefined
      ),
    };
  });

  return { eventPaths, buildSteps };
}

Deno.test('Pages structurally revalidates docs for package and plugin changes before Lume', async () => {
  const workflow = parsePagesWorkflow(await Deno.readTextFile('.github/workflows/pages.yml'));
  const requiredPaths = [
    'docs/site/**',
    'packages/**',
    "'!packages/**/tests/**'",
    "'!packages/cli/e2e/**'",
    "'!packages/**/*_test.ts'",
    "'!packages/**/*.test.ts'",
    'plugins/**',
    "'!plugins/**/tests/**'",
    "'!plugins/**/*_test.ts'",
    "'!plugins/**/*.test.ts'",
    '.llm/tools/docs/**',
    'deno.json',
    'deno.lock',
    '.github/scripts/ci-classify-changes.ts',
    '.github/scripts/ci-classify-changes.test.ts',
    '.github/workflows/pages.yml',
  ];
  assertEquals(workflow.eventPaths.pull_request, requiredPaths);
  assertEquals(workflow.eventPaths.push, requiredPaths);

  const snippetIndex = workflow.buildSteps.findIndex((step) =>
    step.run === 'deno task docs:snippets'
  );
  const lumeIndex = workflow.buildSteps.findIndex((step) => step.run === 'deno task build');
  assert(snippetIndex >= 0, 'Pages build job must invoke deno task docs:snippets');
  assert(lumeIndex >= 0, 'Pages build job must invoke the Lume build');
  assert(snippetIndex < lumeIndex, 'docs:snippets must run before the Lume build');
  assertEquals(
    workflow.buildSteps[snippetIndex].workingDirectory,
    undefined,
    'docs:snippets must run from the repository root',
  );
  assertEquals(workflow.buildSteps[lumeIndex].workingDirectory, 'docs/site');
});
