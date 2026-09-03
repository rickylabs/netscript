import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
import { fromFileUrl } from 'jsr:@std/path@^1';
import { artifactText, collectInstallArtifacts, substituteTokens } from '@netscript/plugin/adapter';
import { workersAdapterPlugin } from '../plugin.ts';
import { DEFAULT_JOB_INPUT, jobScaffolder, taskScaffolder, workflowScaffolder } from './mod.ts';
import { jobStub } from './job/job.stub.ts';

const FORBIDDEN_PREFIXES = [
  'plugins/',
  'services/',
  'contracts/',
  'src/runtime/',
  'src/aspire/',
  'bin/',
  'scaffold.plugin.json',
  'deno.json',
] as const;

Deno.test('workers install starter job is byte-identical to add job default emission', () => {
  const installJob = collectInstallArtifacts(workersAdapterPlugin).find((artifact) =>
    artifact.path === 'workers/jobs/health-check.ts'
  );
  const addJob = jobScaffolder.emit(DEFAULT_JOB_INPUT)[0];

  assertEquals(installJob?.path, addJob.path);
  assertEquals(installJob ? artifactText(installJob) : undefined, artifactText(addJob));
});

Deno.test('workers install starter job is deno fmt clean', async () => {
  const installJob = collectInstallArtifacts(workersAdapterPlugin).find((artifact) =>
    artifact.path === 'workers/jobs/health-check.ts'
  );
  const temporaryDirectory = await Deno.makeTempDir({ prefix: 'netscript-workers-job-' });
  const generatedJobPath = `${temporaryDirectory}/health-check.ts`;

  try {
    await Deno.writeTextFile(generatedJobPath, artifactText(installJob!));
    const output = await new Deno.Command(Deno.execPath(), {
      args: [
        'fmt',
        '--check',
        '--config',
        fromFileUrl(new URL('../../../../../deno.json', import.meta.url)),
        generatedJobPath,
      ],
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    const decoder = new TextDecoder();
    const diagnostics = `${decoder.decode(output.stdout)}${decoder.decode(output.stderr)}`;

    assertEquals(output.code, 0, diagnostics);
  } finally {
    await Deno.remove(temporaryDirectory, { recursive: true });
  }
});

Deno.test('workers add job emits the same shape at the user-named path', () => {
  const [artifact] = jobScaffolder.emit({ id: 'welcome-email' });

  assertEquals(artifact.path, 'workers/jobs/welcome-email.ts');
  const source = artifactText(artifact);
  assertStringIncludes(source, 'welcomeEmailJob');
  assertStringIncludes(source, "jobId: 'welcome-email'");
  assertStringIncludes(source, 'const PayloadSchema = z.object({}).passthrough().default({})');
  assertStringIncludes(source, 'defineJobHandler(\n  PayloadSchema,');
});

Deno.test('workers install emits only userland glue under workers', () => {
  const artifacts = collectInstallArtifacts(workersAdapterPlugin);

  assertEquals(artifacts.map((artifact) => artifact.path), [
    'workers/plugin.ts',
    'workers/jobs/health-check.ts',
    'workers/tasks/validate-payload.ts',
    'workers/mod.ts',
    'workers/runtime.ts',
  ]);
  for (const artifact of artifacts) {
    assertEquals(artifact.path.startsWith('workers/'), true);
    for (const forbidden of FORBIDDEN_PREFIXES) {
      assertEquals(
        artifact.path.includes(forbidden),
        false,
        `artifact ${artifact.path} must not contain ${forbidden}`,
      );
    }
  }

  const controlPlane = artifacts.find((artifact) => artifact.path === 'workers/plugin.ts');
  assertStringIncludes(artifactText(controlPlane!), 'NETSCRIPT_CONTRIBUTION_BUILDERS');
  assertStringIncludes(
    artifactText(controlPlane!),
    "{ callee: 'defineJob', axis: 'jobs' }",
  );
});

Deno.test('workers task scaffolder preserves multi-runtime task emission', () => {
  assertEquals(
    taskScaffolder.emit({ id: 'resize-image', runtime: 'deno' })[0].path,
    'workers/tasks/resize-image.ts',
  );
  assertEquals(
    taskScaffolder.emit({ id: 'resize-image', runtime: 'python' })[0].path,
    'workers/tasks/resize-image.py',
  );
  assertEquals(
    taskScaffolder.emit({ id: 'resize-image', runtime: 'shell' })[0].path,
    'workers/tasks/resize-image.sh',
  );
  assertEquals(
    taskScaffolder.emit({ id: 'resize-image', runtime: 'powershell' })[0].path,
    'workers/tasks/resize-image.ps1',
  );
  const custom = taskScaffolder.emit({
    id: 'resize-image',
    runtime: 'python',
    entrypoint: 'scripts/resize.py',
  })[0];
  assertEquals(custom.path, 'scripts/resize.py');
  assertStringIncludes(artifactText(custom), 'sys.argv[1:]');

  const denoSource = artifactText(
    taskScaffolder.emit({ id: 'resize-image', runtime: 'deno' })[0],
  );
  assertStringIncludes(denoSource, "defineTask(\n  'resize-image',\n)");
});

Deno.test('workers workflow resource is add-only', () => {
  const installPaths = collectInstallArtifacts(workersAdapterPlugin).map((artifact) =>
    artifact.path
  );
  const [workflow] = workflowScaffolder.emit({ id: 'daily-maintenance' });

  assertEquals(installPaths.includes(workflow.path), false);
  assertEquals(workflow.path, 'workers/workflows/daily-maintenance.ts');
});

Deno.test('workers resource token map rejects misspelled tokens at compile time', () => {
  // @ts-expect-error JOB_EXPORT is required by jobStub.
  substituteTokens(jobStub, { JOB_ID: 'broken' });
  assertEquals(true, true);
});
