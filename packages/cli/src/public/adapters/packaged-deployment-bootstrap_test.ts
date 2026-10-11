import { assert, assertEquals, assertRejects } from '@std/assert';
import { join } from '@std/path';
import type { CompileTarget } from '../../kernel/domain/deploy/compile-target.ts';
import type { InfrastructureConfig } from '../../kernel/domain/infrastructure-config.ts';
import {
  INSTALLATION_SECRET_FILE_ENV,
  PACKAGED_INSTALLATION_SECRET_FILE,
} from '../../kernel/domain/deploy/packaged-installation-credential.ts';
import { compileTarget } from '../../kernel/adapters/deploy/compile/compile-runner.ts';
import { buildServiceEnvironment } from '../../kernel/adapters/windows/servy/servy-environment.ts';
import { writeServyConfigs } from '../../kernel/adapters/windows/servy/servy-writer.ts';
import { installServiceDeploy } from '../features/deploy/install/install-service-deploy.ts';
import { PackagedDeploymentBootstrap } from './packaged-deployment-bootstrap.ts';
import { DenoProcess } from '../../kernel/adapters/runtime/process/deno-process.ts';

const infrastructure: InfrastructureConfig = {
  database: {
    name: 'db',
    provider: 'postgres',
    mode: 'external',
    connectionString: 'postgres://user@localhost/db',
  },
  cache: {
    name: 'cache',
    provider: 'redis',
    mode: 'external',
    host: 'localhost',
    port: 6379,
    connectionString: 'redis://localhost:6379',
  },
  additionalDatabases: {},
  otlpEndpoint: 'http://localhost:4318',
};

const targets: CompileTarget[] = [
  ['orders', 'service'],
  ['workers-api', 'plugin'],
  ['sagas-api', 'plugin'],
  ['triggers-api', 'plugin'],
  ['streams-api', 'plugin'],
  ['workers', 'worker'],
  ['sagas', 'worker'],
  ['triggers', 'worker'],
  ['web', 'app'],
].map(([name, type]) => ({
  name,
  type: type as CompileTarget['type'],
  entrypoint: 'main.ts',
  workdir: '.',
  permissions: ['--allow-read=./config', '--allow-env=PORT'],
  environment: { [INSTALLATION_SECRET_FILE_ENV]: 'development-host-reference' },
}));

async function fixture(use: (root: string) => Promise<void>): Promise<void> {
  const root = await Deno.makeTempDir();
  try {
    await use(root);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
}

async function writeDefinitions(root: string): Promise<void> {
  await writeServyConfigs(targets, join(root, 'config'), {
    installDir: 'C:\\original-installation',
    allTargets: targets,
    infrastructure,
    connectionStrings: {},
    projectRoot: 'build-project',
  });
  await Deno.mkdir(join(root, 'bin'), { recursive: true });
}

Deno.test('packaged carrier gives every backend only a relocatable reference, excludes apps', () => {
  for (const target of targets) {
    const environment = buildServiceEnvironment(
      target,
      targets,
      infrastructure,
      'target',
      {},
      'build-project',
    );
    assertEquals(
      environment[INSTALLATION_SECRET_FILE_ENV],
      target.type === 'app' ? undefined : PACKAGED_INSTALLATION_SECRET_FILE,
    );
    assert(!JSON.stringify(environment).includes('development-host-reference'));
  }
});

Deno.test('packaged Windows access policy restricts before material exists and refuses failed ACL commands', () =>
  fixture(async (root) => {
    await writeDefinitions(root);
    const config = join(root, 'config', 'workers.xml');
    await Deno.writeTextFile(
      config,
      (await Deno.readTextFile(config)).replace(
        '<RunAsLocalSystem>true</RunAsLocalSystem>',
        '<RunAsLocalSystem>false</RunAsLocalSystem><UserAccount>DOMAIN\\worker</UserAccount>',
      ),
    );
    const scripts: string[] = [];
    const file = join(root, '.data', 'aspire-secrets', 'installation.secret');
    const bootstrap = new PackagedDeploymentBootstrap({
      async exec(command, args) {
        assertEquals(command, 'powershell.exe');
        if (scripts.length === 0) {
          await assertRejects(() => Deno.stat(file));
        }
        scripts.push(args[args.length - 1]);
        return { code: 0, stdout: '', stderr: '' };
      },
    }, 'windows');
    await bootstrap.prepare(root, ['workers']);
    assertEquals(scripts.length, 2);
    const material = await Deno.readTextFile(file);
    for (const script of scripts) {
      assert(script.includes('SetAccessRuleProtection($true, $false)'));
      assert(script.includes('S-1-5-18'));
      assert(script.includes("'DOMAIN\\worker', 'ReadAndExecute'"));
      assert(!script.includes(material));
    }
    const failed = new PackagedDeploymentBootstrap({
      exec: () => Promise.resolve({ code: 1, stdout: material, stderr: material }),
    }, 'windows');
    const error = await assertRejects(() => failed.prepare(root, ['workers']));
    assert(!String(error).includes(material));
  }));

Deno.test('packaged install provisions on target before registration, reuses after relocation and restart', () =>
  fixture(async (root) => {
    let installation = join(root, 'target');
    await writeDefinitions(installation);
    const bootstrap = new PackagedDeploymentBootstrap(new DenoProcess());
    const secretPath = () => join(installation, '.data', 'aspire-secrets', 'installation.secret');
    let material: string | undefined;
    let registrations = 0;
    const dependencies = {
      bootstrap,
      manifests: {
        resolve: () =>
          Promise.resolve({
            installDir: installation,
            manifestDir: join(installation, 'config'),
            manifest: {
              name: 'fixture',
              version: '1',
              generatedAt: 'fixture',
              infrastructure: {},
              services: Object.fromEntries(
                targets.map((target) => [target.name, { type: target.type }]),
              ),
            },
          }),
      },
      services: {
        async install() {
          const current = await Deno.readTextFile(secretPath());
          if (material === undefined) material = current;
          assertEquals(current, material);
          registrations++;
          return { success: true, message: 'installed', code: 0 };
        },
        run: () => Promise.resolve({ success: true, message: 'unused', code: 0 }),
      },
      os: 'windows' as const,
    };
    await installServiceDeploy({ force: false }, dependencies);
    assertEquals(registrations, targets.length);
    const moved = join(root, 'relocated');
    await Deno.rename(installation, moved);
    installation = moved;
    await installServiceDeploy({ force: true }, dependencies);
    assertEquals(registrations, targets.length * 2);
    for (const target of targets) {
      const xml = await Deno.readTextFile(
        join(installation, 'config', `${target.name}.xml`),
      );
      assert(!xml.includes(material!));
      assert(!xml.includes('development-host-reference'));
      assert(!xml.includes('original-installation'));
      if (target.type !== 'app') {
        assert(xml.includes(PACKAGED_INSTALLATION_SECRET_FILE));
      }
    }
    // Bad files cannot be silently replaced with a new installation identity.
    await Deno.writeTextFile(secretPath(), 'invalid');
    await assertRejects(() => installServiceDeploy({ force: true }, dependencies));
    assertEquals(registrations, targets.length * 2);
    assertEquals(await Deno.readTextFile(secretPath()), 'invalid');
  }));

Deno.test('packaged scoped binary loads real service credential after target relocation; restart 20 times and parallel load', () =>
  fixture(async (root) => {
    const buildRoot = join(root, 'build');
    const initial = join(root, 'target');
    await Deno.mkdir(buildRoot);
    await writeDefinitions(initial);
    const bootstrap = new PackagedDeploymentBootstrap(new DenoProcess());
    await bootstrap.prepare(initial, targets.map((target) => target.name));
    // Resolve from package root rather than depending on a consumer import map.
    const serviceLoader = new URL(
      '../../../../service/src/auth/internal-credential/installation-secret.ts',
      import.meta.url,
    );
    await Deno.writeTextFile(
      join(buildRoot, 'main.ts'),
      `
      import { loadInstallationSecret } from ${JSON.stringify(serviceLoader.href)};
      const secret = await loadInstallationSecret();
      if (secret.kind !== 'netscript.installation-secret') throw new Error('missing handle');
      if (Deno.env.get('PORT') !== 'fixture-port') throw new Error('original env grant lost');
      if (await Deno.readTextFile('./config/allowed.txt') !== 'allowed') throw new Error('original read grant lost');
      if (Deno.args.length !== 0) throw new Error('unexpected credential argument');
      let denied = false;
      try { await Deno.readTextFile('../unrelated.txt'); }
      catch (error) { denied = error instanceof Deno.errors.NotCapable; }
      if (!denied) throw new Error('read scope widened');
      console.log('credential loaded; unrelated read denied');
    `,
    );
    const result = await compileTarget(targets[0], {
      projectRoot: buildRoot,
      binDir: join(initial, 'bin'),
      target: Deno.build.target,
      compileConfigContent: '{"nodeModulesDir":"none"}',
      bundleExternal: [],
    });
    assertEquals(result.success, true, result.error);
    const relocated = join(root, 'relocated');
    await Deno.rename(initial, relocated);
    const file = join(
      relocated,
      '.data',
      'aspire-secrets',
      'installation.secret',
    );
    const material = await Deno.readTextFile(file);
    await Deno.mkdir(join(relocated, 'bin', 'config'));
    await Deno.writeTextFile(join(relocated, 'bin', 'config', 'allowed.txt'), 'allowed');
    const binary = join(
      relocated,
      'bin',
      Deno.build.os === 'windows' ? 'orders.exe' : 'orders',
    );
    const run = () =>
      new Deno.Command(binary, {
        cwd: join(relocated, 'bin'),
        args: [],
        stdin: 'null',
        stdout: 'piped',
        stderr: 'piped',
        clearEnv: true,
        env: {
          [INSTALLATION_SECRET_FILE_ENV]: PACKAGED_INSTALLATION_SECRET_FILE,
          PORT: 'fixture-port',
        },
      }).output();
    const check = async () => {
      const output = await run();
      assertEquals(output.code, 0, new TextDecoder().decode(output.stderr));
      assertEquals(
        new TextDecoder().decode(output.stdout).trim(),
        'credential loaded; unrelated read denied',
      );
      assert(!new TextDecoder().decode(output.stdout).includes(material));
    };
    for (let repetition = 0; repetition < 20; repetition++) await check();
    await Promise.all(Array.from({ length: 4 }, check));
    assertEquals(await Deno.readTextFile(file), material);
    await Deno.rename(file, `${file}.retained`);
    const missing = await run();
    assert(missing.code !== 0);
    assert(!new TextDecoder().decode(missing.stderr).includes(material));
    await Deno.rename(`${file}.retained`, file);
    if (Deno.build.os !== 'windows') {
      await Deno.chmod(file, 0o000);
      try {
        await assertRejects(() => bootstrap.prepare(relocated, ['orders']));
      } finally {
        await Deno.chmod(file, 0o600);
      }
    }
  }));
