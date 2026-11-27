import {
  assertEquals,
  assertRejects,
  assertStringIncludes,
  assertThrows,
} from 'jsr:@std/assert@^1';
import { dirname, fromFileUrl, join } from 'jsr:@std/path@^1';

import {
  ASPIRE_BUMP_ALLOWLIST,
  ASPIRE_STABLE_PACKAGES,
  highestCommonStableVersion,
  latestBrowsersVersionForTrain,
  latestStableVersion,
  parseCliArgs,
  planOrApplyAspireBump,
} from './aspire-bump.ts';

async function seedFixtureRepo(root: string): Promise<void> {
  const files: Record<string, string> = {
    'packages/cli/src/kernel/constants/scaffold/scaffold-versions.ts':
      `export const SCAFFOLD_VERSIONS = {
  ASPIRE_SDK: '17.0.0',
  DOTNET_SDK: '10.0.0',
  NETSCRIPT_NUGET: '1.0.0',
  GARNET_TOOL: '2.2.14',
  APPHOST_PG: '8.23.1',
} as const;
`,
    'packages/cli/src/kernel/constants/scaffold/scaffold-aspire.ts':
      `export const SCAFFOLD_ASPIRE_INTEGRATIONS = {
  POSTGRES: { PACKAGE_ID: 'Aspire.Hosting.PostgreSQL', VERSION: '17.0.0' },
  MYSQL: { PACKAGE_ID: 'Aspire.Hosting.MySql', VERSION: '17.0.0' },
  MSSQL: { PACKAGE_ID: 'Aspire.Hosting.SqlServer', VERSION: '17.0.0' },
  JAVASCRIPT: { PACKAGE_ID: 'Aspire.Hosting.JavaScript', VERSION: '17.0.0' },
  BROWSERS: { PACKAGE_ID: 'Aspire.Hosting.Browsers', VERSION: '17.0.0-preview.1.26567.5' },
} as const;
`,
    '.github/toolchain.env': `NETSCRIPT_DENO_VERSION=v2.9.8
NETSCRIPT_DOTNET_VERSION=10.0.x
NETSCRIPT_ASPIRE_CLI_VERSION=17.0.0
NETSCRIPT_ASPIRE_SDK_VERSION=17.0.0
`,
    '.github/workflows/e2e-cli.yml': `jobs:
  scaffold-runtime:
    steps:
      - uses: denoland/setup-deno@v2
        with:
          deno-version: "2.9.8"
      - uses: actions/setup-dotnet@v5
        with:
          dotnet-version: "10.0.x"
      - uses: actions/cache@v4
        with:
          path: ~/.nuget/packages
          key: nuget-aspire-\${{ runner.os }}-17.0.0-v1
      - uses: actions/cache@v4
        with:
          path: ~/.dotnet/aspire-cli
          key: aspire-cli-\${{ runner.os }}-17.0.0-v1
      - run: dotnet tool install Aspire.Cli --tool-path "$HOME/.dotnet/aspire-cli" --version 17.0.0
      - run: |
          case "$aspire_version" in
            17.0.0|17.0.0+*) ;;
            *) echo "Expected Aspire CLI 17.0.0, got $aspire_version" >&2; exit 1 ;;
          esac
`,
    '.github/workflows/e2e-cli-prod.yml': `jobs:
  scaffold-runtime-jsr:
    steps:
      - uses: actions/cache@v4
        with:
          path: ~/.nuget/packages
          key: nuget-aspire-\${{ runner.os }}-17.0.0-v1
      - uses: actions/cache@v4
        with:
          path: ~/.dotnet/aspire-cli
          key: aspire-cli-\${{ runner.os }}-17.0.0-v1
      - run: dotnet tool install Aspire.Cli --tool-path "$HOME/.dotnet/aspire-cli" --version 17.0.0
      - run: |
          case "$aspire_version" in
            17.0.0|17.0.0+*) ;;
            *) echo "Expected Aspire CLI 17.0.0, got $aspire_version" >&2; exit 1 ;;
          esac
`,
    '.github/workflows/e2e-cli-prod-local.yml': `jobs:
  scaffold-runtime-prod-local:
    steps:
      - uses: actions/cache@v4
        with:
          path: ~/.nuget/packages
          key: nuget-aspire-\${{ runner.os }}-17.0.0-v1
      - uses: actions/cache@v4
        with:
          path: ~/.dotnet/aspire-cli
          key: aspire-cli-\${{ runner.os }}-17.0.0-v1
      - run: dotnet tool install Aspire.Cli --tool-path "$HOME/.dotnet/aspire-cli" --version 17.0.0
      - run: |
          case "$aspire_version" in
            17.0.0|17.0.0+*) ;;
            *) echo "Expected Aspire CLI 17.0.0, got $aspire_version" >&2; exit 1 ;;
          esac
`,
    '.github/scripts/aspire-nuget-cache-policy.test.ts':
      `const ASPIRE_VERSION = '17.0.0';\nconst ASPIRE_CACHE_SUFFIX = '17.0.0-v1';\nconst UNRELATED = '10.0.0';\n`,
    'docs/site/explanation/aspire.md': 'Aspire 17.0.0 untouched doc\n',
  };

  for (const [relPath, content] of Object.entries(files)) {
    const abs = join(root, relPath);
    await Deno.mkdir(dirname(abs), { recursive: true });
    await Deno.writeTextFile(abs, content);
  }
}

Deno.test('latestStableVersion and latestBrowsersVersionForTrain select semver-ordered versions', () => {
  assertEquals(
    latestStableVersion(['13.5.3', '17.0.0-preview.1', '17.0.0', '17.0.1', '17.0.2-rc.1']),
    '17.0.1',
  );
  assertEquals(
    latestBrowsersVersionForTrain(
      ['17.0.0-preview.1.26567.5', '17.0.1-preview.1.26600.1', '17.0.1-preview.2.26610.1'],
      '17.0.1',
    ),
    '17.0.1-preview.2.26610.1',
  );
});

Deno.test('dry-run writes zero files and reports all 7 allowlisted changes', async () => {
  const root = await Deno.makeTempDir();
  try {
    await seedFixtureRepo(root);
    const report = await planOrApplyAspireBump({
      repoRoot: root,
      apply: false,
      fetchPackageVersions: (pkg) =>
        Promise.resolve(
          pkg === 'Aspire.Hosting.Browsers'
            ? ['17.0.0-preview.1.26567.5', '17.0.1-preview.1.26600.1']
            : ['17.0.0', '17.0.1'],
        ),
    });

    assertEquals(report.mode, 'dry-run');
    assertEquals(report.targetVersion, '17.0.1');
    assertEquals(report.targetBrowsersVersion, '17.0.1-preview.1.26600.1');
    assertEquals(report.changedFiles, [...ASPIRE_BUMP_ALLOWLIST]);

    // Dry-run must leave disk completely untouched.
    const versionsOnDisk = await Deno.readTextFile(join(root, ASPIRE_BUMP_ALLOWLIST[0]));
    assertStringIncludes(versionsOnDisk, "ASPIRE_SDK: '17.0.0'");
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('apply writes ONLY the 7 allowlisted files, preserves unrelated pins, and is idempotent', async () => {
  const root = await Deno.makeTempDir();
  try {
    await seedFixtureRepo(root);
    const first = await planOrApplyAspireBump({
      repoRoot: root,
      apply: true,
      offline: true,
      targetVersion: '17.0.1',
      targetBrowsersVersion: '17.0.1-preview.1.26600.1',
    });

    assertEquals(first.mode, 'apply');
    assertEquals(first.changedFiles, [...ASPIRE_BUMP_ALLOWLIST]);

    // Verify exact Aspire updates and preserved unrelated pins.
    const versions = await Deno.readTextFile(join(root, ASPIRE_BUMP_ALLOWLIST[0]));
    assertStringIncludes(versions, "ASPIRE_SDK: '17.0.1'");
    assertStringIncludes(versions, "DOTNET_SDK: '10.0.0'");
    assertStringIncludes(versions, "NETSCRIPT_NUGET: '1.0.0'");
    assertStringIncludes(versions, "GARNET_TOOL: '2.2.14'");
    assertStringIncludes(versions, "APPHOST_PG: '8.23.1'");

    const integrations = await Deno.readTextFile(join(root, ASPIRE_BUMP_ALLOWLIST[1]));
    assertStringIncludes(integrations, "Aspire.Hosting.PostgreSQL', VERSION: '17.0.1'");
    assertStringIncludes(integrations, "Aspire.Hosting.JavaScript', VERSION: '17.0.1'");
    assertStringIncludes(
      integrations,
      "Aspire.Hosting.Browsers', VERSION: '17.0.1-preview.1.26600.1'",
    );

    const toolchain = await Deno.readTextFile(join(root, ASPIRE_BUMP_ALLOWLIST[2]));
    assertStringIncludes(toolchain, 'NETSCRIPT_DENO_VERSION=v2.9.8');
    assertStringIncludes(toolchain, 'NETSCRIPT_DOTNET_VERSION=10.0.x');
    assertStringIncludes(toolchain, 'NETSCRIPT_ASPIRE_CLI_VERSION=17.0.1');
    assertStringIncludes(toolchain, 'NETSCRIPT_ASPIRE_SDK_VERSION=17.0.1');

    const workflow = await Deno.readTextFile(join(root, ASPIRE_BUMP_ALLOWLIST[3]));
    assertStringIncludes(workflow, 'deno-version: "2.9.8"');
    assertStringIncludes(workflow, 'dotnet-version: "10.0.x"');
    assertStringIncludes(workflow, 'key: nuget-aspire-${{ runner.os }}-17.0.1-v1');
    assertStringIncludes(workflow, 'key: aspire-cli-${{ runner.os }}-17.0.1-v1');
    assertStringIncludes(workflow, '--version 17.0.1');
    assertStringIncludes(workflow, '17.0.1|17.0.1+*) ;;');

    const policy = await Deno.readTextFile(join(root, ASPIRE_BUMP_ALLOWLIST[6]));
    assertStringIncludes(policy, "const ASPIRE_VERSION = '17.0.1';");
    assertStringIncludes(policy, "const ASPIRE_CACHE_SUFFIX = '17.0.1-v1';");
    assertStringIncludes(policy, "const UNRELATED = '10.0.0';");

    // Non-allowlisted docs file must remain untouched.
    const doc = await Deno.readTextFile(join(root, 'docs/site/explanation/aspire.md'));
    assertEquals(doc, 'Aspire 17.0.0 untouched doc\n');

    // Second apply with the same versions must produce 0 changed files.
    const second = await planOrApplyAspireBump({
      repoRoot: root,
      apply: true,
      offline: true,
      targetVersion: '17.0.1',
      targetBrowsersVersion: '17.0.1-preview.1.26600.1',
    });
    assertEquals(second.changedFiles, []);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('rejects invalid prerelease targetVersion fail-closed', async () => {
  const root = await Deno.makeTempDir();
  try {
    await seedFixtureRepo(root);
    await assertRejects(
      () =>
        planOrApplyAspireBump({
          repoRoot: root,
          offline: true,
          targetVersion: '17.0.1-preview.1',
        }),
      Error,
      'Invalid targetVersion',
    );
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('real checked-in repository workflows match offline bump plan with zero drift', async () => {
  const repoRoot = join(dirname(fromFileUrl(import.meta.url)), '../../..');
  const report = await planOrApplyAspireBump({ repoRoot, apply: false, offline: true });
  assertEquals(report.targetVersion, '17.0.0');
  assertEquals(report.changedFiles, []);
});

Deno.test('apply pre-validates all 7 files before writing so later failures leave earlier files untouched', async () => {
  const root = await Deno.makeTempDir();
  try {
    await seedFixtureRepo(root);
    const brokenWorkflow = join(root, '.github/workflows/e2e-cli-prod-local.yml');
    await Deno.writeTextFile(brokenWorkflow, 'name: broken\n');
    const beforeFiles = await Promise.all(
      ASPIRE_BUMP_ALLOWLIST.map((p) => Deno.readTextFile(join(root, p))),
    );

    await assertRejects(
      () =>
        planOrApplyAspireBump({
          repoRoot: root,
          apply: true,
          offline: true,
          targetVersion: '17.0.1',
          targetBrowsersVersion: '17.0.1-preview.1.26600.1',
        }),
      Error,
      'Expected exact pin pattern not found',
    );

    const afterFiles = await Promise.all(
      ASPIRE_BUMP_ALLOWLIST.map((p) => Deno.readTextFile(join(root, p))),
    );
    assertEquals(afterFiles, beforeFiles);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('online resolver selects highest common intersection and rejects cross-major Browsers fallback', async () => {
  assertEquals(
    highestCommonStableVersion([
      ['17.0.0', '17.0.2'],
      ['17.0.0', '17.0.1'],
      ['17.0.0', '17.0.1', '17.0.2'],
    ]),
    '17.0.0',
  );
  assertEquals(
    latestBrowsersVersionForTrain(['13.5.3-preview.1', '18.0.0-preview.1'], '17.0.0'),
    null,
  );
  assertEquals(
    latestBrowsersVersionForTrain(['17.0.0-preview.1.26567.5', '18.0.0-preview.1'], '17.0.1'),
    '17.0.0-preview.1.26567.5',
  );

  const root = await Deno.makeTempDir();
  try {
    await seedFixtureRepo(root);
    const report = await planOrApplyAspireBump({
      repoRoot: root,
      apply: false,
      fetchPackageVersions: (pkg) => {
        if (pkg === ASPIRE_STABLE_PACKAGES[0]) return Promise.resolve(['17.0.0', '17.0.2']);
        if (pkg === 'Aspire.Hosting.Browsers') {
          return Promise.resolve(['17.0.0-preview.1.26567.5', '18.0.0-preview.1']);
        }
        return Promise.resolve(['17.0.0', '17.0.1']);
      },
    });
    assertEquals(report.targetVersion, '17.0.0');
    assertEquals(report.targetBrowsersVersion, '17.0.0-preview.1.26567.5');

    await assertRejects(
      () =>
        planOrApplyAspireBump({
          repoRoot: root,
          apply: false,
          fetchPackageVersions: (pkg) =>
            Promise.resolve(
              pkg === 'Aspire.Hosting.Browsers'
                ? ['13.5.3-preview.1', '18.0.0-preview.1']
                : ['17.0.0'],
            ),
        }),
      Error,
      'No compatible same-train Aspire.Hosting.Browsers',
    );
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('parseCliArgs handles -- separator, --dry-run, and conflicting --apply + --dry-run', () => {
  const parsed = parseCliArgs(['--', '--dry-run', '--offline', '--json']);
  assertEquals(parsed, {
    help: false,
    apply: false,
    offline: true,
    json: true,
    targetVersion: undefined,
    targetBrowsersVersion: undefined,
  });
  assertThrows(
    () => parseCliArgs(['--', '--dry-run', '--apply']),
    Error,
    'Cannot combine --apply and --dry-run',
  );
});

Deno.test('offline and explicit crossed-train SDK/Browsers pairs reject fail-closed across all paths', async () => {
  const root = await Deno.makeTempDir();
  try {
    await seedFixtureRepo(root);
    const beforeFiles = await Promise.all(
      ASPIRE_BUMP_ALLOWLIST.map((p) => Deno.readTextFile(join(root, p))),
    );

    // Offline major bump without matching --browsers-version would keep 17.0.0-preview.*; must fail.
    await assertRejects(
      () =>
        planOrApplyAspireBump({
          repoRoot: root,
          apply: true,
          offline: true,
          targetVersion: '18.0.0',
        }),
      Error,
      'Incompatible Aspire trains',
    );

    // Online explicit Browsers pin from 16.0.0 train with 17.0.0 SDK must fail even if present on NuGet.
    await assertRejects(
      () =>
        planOrApplyAspireBump({
          repoRoot: root,
          apply: false,
          offline: false,
          targetVersion: '17.0.0',
          targetBrowsersVersion: '16.0.0-preview.1',
          fetchPackageVersions: (pkg) =>
            Promise.resolve(
              pkg === 'Aspire.Hosting.Browsers'
                ? ['16.0.0-preview.1', '17.0.0-preview.1.26567.5']
                : ['17.0.0'],
            ),
        }),
      Error,
      'Incompatible Aspire trains',
    );

    const afterFailure = await Promise.all(
      ASPIRE_BUMP_ALLOWLIST.map((p) => Deno.readTextFile(join(root, p))),
    );
    assertEquals(afterFailure, beforeFiles);

    // Offline major bump with explicit same-train --browsers-version succeeds cleanly.
    const matched = await planOrApplyAspireBump({
      repoRoot: root,
      apply: false,
      offline: true,
      targetVersion: '18.0.0',
      targetBrowsersVersion: '18.0.0-preview.1.27000.1',
    });
    assertEquals(matched.targetVersion, '18.0.0');
    assertEquals(matched.targetBrowsersVersion, '18.0.0-preview.1.27000.1');
    assertEquals(matched.changedFiles, [...ASPIRE_BUMP_ALLOWLIST]);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
