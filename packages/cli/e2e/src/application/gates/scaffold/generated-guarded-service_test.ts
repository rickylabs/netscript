import { SCAFFOLD_APP_IMPORTS } from '../../../../../src/kernel/constants/scaffold/scaffold-app-catalog.ts';
import { reconcileBrowserAuth } from '../../../../../src/kernel/adapters/plugin/browser-auth-reconciler.ts';
import { addProtectedProbeProcedure } from './probe-generated-guarded-service.ts';
import { writeInstalledAuthFixture } from '../../../../../tests/installed-auth-fixture.ts';
import { assertEquals, assertStringIncludes } from '@std/assert';
import { dirname, join, toFileUrl } from '@std/path';
import { MemoryFileSystemAdapter } from '../../../../../src/kernel/adapters/scaffold/memory-fs.ts';
import { Scaffolder } from '../../../../../src/kernel/adapters/scaffold/scaffolder.ts';
import { StringTemplateAdapter } from '../../../../../src/kernel/adapters/scaffold/template-adapter.ts';
import { ServiceScaffolder } from '../../../../../src/kernel/adapters/service/scaffolder.ts';
import { createContractScaffolder } from '../../../../../src/kernel/adapters/contracts/contract-scaffolder.ts';
import { DefaultContractTemplateRegistry } from '../../../../../src/kernel/adapters/contracts/templates/contract-template-registry.ts';
import { ContractVersionRegistry } from '../../../../../src/kernel/adapters/contracts/version-registry.ts';
import { ContractWorkspaceResolver } from '../../../../../src/kernel/adapters/contracts/workspace-resolver.ts';
import { DenoGeneratedSourceFormatter } from '../../../../../src/kernel/adapters/runtime/process/deno-generated-source-formatter.ts';
import { DenoProcess } from '../../../../../src/kernel/adapters/runtime/process/deno-process.ts';
import { GATE } from '../../../domain/cli-surface.ts';
import { GENERATED_AUTH_CASES } from './generated-auth-checks.ts';
import { GUARDED_SERVICE_PROBE_SOURCE } from './guarded-service-probe-source.ts';

Deno.test('generated auth/users: native sessions pass every runtime case and public-route controls are red', async () => {
  const fs = new MemoryFileSystemAdapter();
  const templateAdapter = new StringTemplateAdapter(fs);
  const scaffolder = new Scaffolder(templateAdapter, fs);
  const formatter = new DenoGeneratedSourceFormatter(new DenoProcess());
  await fs.writeFile('/project/deno.json', JSON.stringify({ workspace: [], imports: {} }));
  await writeInstalledAuthFixture(fs, '/project');
  await createContractScaffolder({
    scaffolder,
    templateAdapter,
    templateRegistry: new DefaultContractTemplateRegistry(),
    versionRegistry: new ContractVersionRegistry(fs, formatter),
    workspaceResolver: new ContractWorkspaceResolver(fs),
    formatter,
  }).scaffoldFull({
    options: {
      projectName: 'guard-probe',
      targetPath: '/project',
      importMode: 'jsr',
      force: false,
    },
    serviceContract: { serviceName: 'users', version: 'v1' },
  });
  const result = await new ServiceScaffolder(scaffolder, fs, templateAdapter, formatter).scaffold({
    projectName: 'guard-probe',
    targetPath: '/project',
    serviceName: 'users',
    servicePort: 3000,
    importMode: 'jsr',
    force: false,
  });
  await fs.writeFile(
    '/project/appsettings.json',
    JSON.stringify({
      NetScript: {
        ...JSON.parse(await fs.readFile('/project/appsettings.json')).NetScript,
        Services: { users: result.configEntry },
        Apps: { web: { Type: 'app', Workdir: 'apps/web' } },
      },
    }),
  );
  await fs.writeFile(
    '/project/apps/web/utils.ts',
    `import { createDefine } from 'fresh';
export const define = createDefine();`,
  );
  await reconcileBrowserAuth('/project', fs, formatter);
  const root = await Deno.makeTempDir({ prefix: 'guarded-service-' });
  try {
    for (
      const path of [
        'auth/service.ts',
        'auth/bff.ts',
        'apps/web/utils.ts',
        'apps/web/routes/examples/users/session.ts',
        'contracts/mod.ts',
        'contracts/versions/v1/mod.ts',
        'contracts/versions/v1/users.contract.ts',
        ...result.scaffoldResult.filesCreated.map((path) => path.slice('/project/'.length)),
      ]
    ) {
      const target = join(root, path);
      await Deno.mkdir(dirname(target), { recursive: true });
      const source = await fs.readFile('/project/' + path);
      await Deno.writeTextFile(
        target,
        path.endsWith('/main.ts')
          ? source.replace(
            'await defineService(router, {',
            'export const running = await defineService(router, {',
          )
          : source,
      );
    }
    await addProtectedProbeProcedure(root);
    const repo = new URL('../../../../../../../', import.meta.url);
    const config = JSON.parse(await Deno.readTextFile(new URL('deno.json', repo))) as {
      imports: Record<string, string>;
      catalog: Record<string, string>;
    };
    await Deno.writeTextFile(
      join(root, 'imports.json'),
      JSON.stringify({
        imports: {
          ...config.imports,
          ...Object.fromEntries(
            ['@orpc/server', '@orpc/contract', 'zod'].map((
              name,
            ) => [name, `npm:${name}@${config.catalog[name]}`]),
          ),
          fresh: SCAFFOLD_APP_IMPORTS.fresh,
          '@guard-probe/contracts': toFileUrl(join(root, 'contracts/mod.ts')).href,
        },
      }),
    );
    const probe = join(root, 'probe.ts');
    const probeSource = GUARDED_SERVICE_PROBE_SOURCE
      .replaceAll('__AUTH_MAIN__', new URL('plugins/auth/services/src/main.ts', repo).href)
      .replaceAll('__AUTH_SOURCE__', new URL('plugins/auth/services/src', repo).href)
      .replaceAll('__AUTH_CHECKS__', new URL('./generated-auth-checks.ts', import.meta.url).href)
      .replaceAll('__SERVICE_MAIN__', toFileUrl(join(root, 'services/users/src/main.ts')).href)
      .replaceAll(
        '__APP_SESSION_ROUTE__',
        toFileUrl(join(root, 'apps/web/routes/examples/users/session.ts')).href,
      )
      .replaceAll(
        '__HTTP_CONTRACT__',
        new URL('../../../domain/http-contract.ts', import.meta.url).href,
      );
    await Deno.writeTextFile(probe, probeSource);
    const runProbe = async (authCase?: string) => {
      const execution = await new Deno.Command(Deno.execPath(), {
        args: [
          'run',
          '--lock',
          new URL('deno.lock', repo).pathname,
          '--frozen',
          '-A',
          '--unstable-kv',
          '--config',
          new URL('deno.json', repo).pathname,
          '--import-map',
          join(root, 'imports.json'),
          probe,
          ...(authCase ? [authCase] : []),
        ],
        stdout: 'piped',
        stderr: 'piped',
      }).output();
      const output = new TextDecoder().decode(execution.stdout) +
        new TextDecoder().decode(execution.stderr);
      return { code: execution.code, output };
    };
    for (const authCase of [undefined, ...GENERATED_AUTH_CASES]) {
      const { code, output } = await runProbe(authCase);
      assertEquals(code, 0, output);
      assertStringIncludes(
        output,
        authCase
          ? authCase + ' PASS'
          : 'Generated guarded service PASS: discovery/demo public200; protected REST/RPC anonymous401, denied403, permitted200; anonymous health200',
      );
      if (!authCase) {
        assertStringIncludes(
          output,
          'Generated app guarded call PASS: SDK bearer contribution; request-scoped cookie; anonymous401, authenticated200, anonymous401',
        );
      }
    }
    // Public controls mutate the shipped composition, never a harness-composed listener.
    const authMainUrl = new URL('plugins/auth/services/src/main.ts', repo);
    const authMain = (await Deno.readTextFile(authMainUrl)).replace(
      /from '(\.\.?\/[^']+)'/g,
      (_match, path: string) => "from '" + new URL(path, authMainUrl).href + "'",
    );
    const authControlPath = join(root, 'auth-main-control.ts');
    const mainPath = join(root, 'services/users/src/main.ts');
    const guardedMain = await Deno.readTextFile(mainPath);
    for (const authCase of GENERATED_AUTH_CASES) {
      let controlSource = probeSource;
      if (
        authCase === GATE.BEHAVIOR_SERVICE_API_UNAUTHENTICATED ||
        authCase === GATE.BEHAVIOR_SERVICE_API_AUTHENTICATED
      ) {
        const publicMain = guardedMain.replace(
          /\bauth:\s*\{[\s\S]*?\n {2}\},/,
          "auth: { public: true, reason: 'Guarded-to-public negative control' },",
        );
        assertEquals(
          publicMain === guardedMain,
          false,
          'Control must remove generated service guard',
        );
        await Deno.writeTextFile(mainPath, publicMain);
      } else {
        let controlMain = authMain;
        if (authCase === GATE.BEHAVIOR_AUTH_SESSION_AUTHENTICATED) {
          controlMain = controlMain.replace('request: currentAuthRequest()', 'request: undefined');
        } else {
          controlMain = controlMain.replace(
            'auth: createAuthServiceGuard(registry)',
            "auth: { public: true, reason: 'Guarded-to-public negative control' }",
          ).replace(
            'middleware: [withAuthRequest]',
            `middleware: [async (context, next) => {
              if (new URL(context.req.url).pathname.endsWith('/signout')) return context.json({ signedOut: true });
              await next();
            }, withAuthRequest]`,
          );
        }
        assertEquals(
          controlMain === authMain,
          false,
          'Control must mutate shipped auth entrypoint',
        );
        await Deno.writeTextFile(authControlPath, controlMain);
        controlSource = controlSource.replace(authMainUrl.href, toFileUrl(authControlPath).href);
      }
      await Deno.writeTextFile(probe, controlSource);
      const control = await runProbe(authCase);
      assertEquals(
        control.code,
        1,
        authCase + ': native public control must be red: ' + control.output,
      );
      assertStringIncludes(
        control.output,
        authCase === GATE.BEHAVIOR_AUTH_SESSION_AUTHENTICATED
          ? 'credential must authenticate'
          : authCase === GATE.BEHAVIOR_AUTH_SIGNOUT_FOREIGN_SESSION
          ? 'foreign selector must be refused'
          : 'served 200',
      );
      await Deno.writeTextFile(mainPath, guardedMain);
    }
    // With no composition guard the handler still refuses absent principals. An owned
    // signout must succeed too, so deleting only main.ts's guard cannot stay green.
    const missingGuard = authMain.replace('auth: createAuthServiceGuard(registry),', '');
    assertEquals(missingGuard === authMain, false);
    await Deno.writeTextFile(authControlPath, missingGuard);
    await Deno.writeTextFile(
      probe,
      probeSource.replace(authMainUrl.href, toFileUrl(authControlPath).href),
    );
    const missingGuardControl = await runProbe(GATE.BEHAVIOR_AUTH_SIGNOUT_FOREIGN_SESSION);
    assertEquals(missingGuardControl.code, 1, missingGuardControl.output);
    assertStringIncludes(missingGuardControl.output, 'Service auth requires');
    // Explicitly making the entrypoint public still must fail the owned-signout check.
    await Deno.writeTextFile(
      authControlPath,
      authMain.replace(
        'auth: createAuthServiceGuard(registry)',
        "auth: { public: true, reason: 'Guarded-to-public negative control' }",
      ),
    );
    const publicCompositionControl = await runProbe(GATE.BEHAVIOR_AUTH_SIGNOUT_FOREIGN_SESSION);
    assertEquals(publicCompositionControl.code, 1, publicCompositionControl.output);
    assertStringIncludes(publicCompositionControl.output, 'expected HTTP 200, served 401');
    assertEquals(result.configEntry.PluginReferences, ['auth']);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
