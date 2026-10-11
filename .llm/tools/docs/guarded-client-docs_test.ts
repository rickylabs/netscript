import { assert, assertEquals } from '@std/assert';
import { join } from '@std/path';

const root = new URL('../../../', import.meta.url);
const tutorialPath = 'docs/site/tutorials/workspace/05-route-authz.md';
const sdkPath = 'docs/site/reference/sdk/index.md';

function fence(markdown: string, marker: string): string {
  const blocks = [...markdown.matchAll(/```ts\n([\s\S]*?)\n```/g)];
  const block = blocks.find((match) => match[1].startsWith(marker));
  assert(block, `Missing compiled documentation example: ${marker}`);
  return block[1];
}

Deno.test('route authorization tutorial retains completion sections and tracked debt caveat', async () => {
  const tutorial = await Deno.readTextFile(new URL(tutorialPath, root));
  for (
    const marker of [
      'The `200` body echoes',
      'An empty `members` array is still a `200`',
      'Route-Level Scope Authorization Boundary',
      '<!-- caveat: arch-debt:seamless-auth-roadmap -->',
      '## Verify your progress',
      '## What you built',
      '## Next Steps',
      '{{ comp.nextPrev(',
    ]
  ) {
    assert(tutorial.includes(marker), `Missing tutorial completion content: ${marker}`);
  }
});

Deno.test('guarded client docs compile public entrypoints and prove REST/RPC 401/403/200', async () => {
  const tutorial = await Deno.readTextFile(new URL(tutorialPath, root));
  const sdk = await Deno.readTextFile(new URL(sdkPath, root));
  const contract = fence(tutorial, '// contracts/versions/v1/workspace.contract.ts');
  const generatedClient = fence(
    tutorial,
    '// apps/dashboard/routes/examples/workspace/(_lib)/workspace-session.ts',
  );
  const sdkClient = fence(sdk, '// Authenticated workspace SDK client.');
  const tutorialPolicy = fence(tutorial, '// Explicit public policy');
  const sdkPolicy = fence(sdk, '// Explicit public policy.');
  const template = await Deno.readTextFile(
    new URL('packages/cli/src/kernel/assets/auth/bff.ts.template', root),
  );
  const temporaryRoot = new URL('.llm/tmp/', root);
  await Deno.mkdir(temporaryRoot, { recursive: true });
  const directory = await Deno.makeTempDir({
    dir: temporaryRoot.pathname,
    prefix: 'guarded-client-docs-',
  });
  try {
    const config = JSON.parse(await Deno.readTextFile(new URL('deno.json', root)));
    const imports = { ...config.imports };
    for (const name of ['@orpc/client', '@orpc/server', 'zod']) {
      imports[name] = `npm:${name}@${config.catalog[name]}`;
    }
    const importMap = join(directory, 'imports.json');
    await Deno.writeTextFile(importMap, JSON.stringify({ imports }));
    const files = {
      'contract.ts': contract,
      'bff.ts': template.replace('{{authServiceName}}', "'auth'"),
      'tutorial.ts': generatedClient
        .replace("'@my-workspace/contracts'", "'./contract.ts'")
        .replace("'../../../../../../auth/bff.ts'", "'./bff.ts'"),
      'sdk.ts': sdkClient.replace("'@my-workspace/contracts'", "'./contract.ts'") +
        '\nexport { workspaceClient };\n',
      'tutorial-policy.ts': tutorialPolicy,
      'sdk-policy.ts': sdkPolicy,
      'controls.ts': controls,
    };
    for (const [name, contents] of Object.entries(files)) {
      await Deno.writeTextFile(join(directory, name), contents);
    }
    for (
      const args of [
        [
          'check',
          '--import-map',
          importMap,
          '--unstable-kv',
          ...Object.keys(files).map((name) => join(directory, name)),
        ],
        [
          'run',
          '--import-map',
          importMap,
          '--unstable-kv',
          '--allow-all',
          join(directory, 'controls.ts'),
        ],
      ]
    ) {
      const result = await new Deno.Command(Deno.execPath(), {
        args,
        cwd: root,
        stdout: 'piped',
        stderr: 'piped',
      }).output();
      assertEquals(result.code, 0, new TextDecoder().decode(result.stderr));
      if (args[0] === 'run') {
        assert(
          new TextDecoder().decode(result.stdout).includes('20 sequential + 5 parallel controls'),
        );
      }
    }
  } finally {
    await Deno.remove(directory, { recursive: true });
  }
});

// Run the actual extracted examples, including the shipped generated BFF helper.
const controls = `
import { assert, assertEquals, assertRejects } from '@std/assert';
import { ORPCError } from '@orpc/client';
import { createService, type ServiceHandlerContext } from '@netscript/service';
import { createContractAuthorizer, createStaticCredentialAuthenticator } from '@netscript/service/auth';
import { createServiceClient } from '@netscript/sdk/client';
import { WorkspaceContractV1, WorkspaceV1 } from './contract.ts';
import { workspaceClient, listWorkspaceMembers } from './sdk.ts';
import { handleWorkspaceMembers, loadWorkspaceMembers } from './tutorial.ts';

const router = WorkspaceV1.$context<ServiceHandlerContext>().router({
  members: WorkspaceV1.$context<ServiceHandlerContext>().members.handler(({ input, context }) => {
    assert(context.principal);
    return { ...input, subject: context.principal.subject, members: [] };
  }),
});
const app = createService(router, { name: 'workspace' })
  .withRPC({ rpcPath: '/api/rpc/v1/workspace' })
  .withAuthn({
    authenticator: createStaticCredentialAuthenticator({ credentials: {
      read: { subject: 'user:reader', scopes: ['workspace:read'] },
      write: { subject: 'user:writer', scopes: ['workspace:write'] },
    } }),
    allowAnonymous: ['/health', '/api/openapi.json', '/api/docs'],
  })
  .withAuthz({ authorizer: createContractAuthorizer(WorkspaceContractV1) })
  .withHealth()
  .withOpenAPI()
  .withDocs()
  .build();
const server = Deno.serve({ hostname: '127.0.0.1', port: 0, onListen() {} }, (request) => app.fetch(request));
const key = 'services__workspace__http__0';
const previous = Deno.env.get(key);
// Set discovery once for every sequential and concurrent call; restore it only after all finish.
Deno.env.set(key, 'http://127.0.0.1:' + server.addr.port);
const anonymous = createServiceClient({ contract: WorkspaceContractV1, serviceName: 'workspace' });
const input = { workspace: 'ws-1', limit: 20, offset: 0 };
async function verify() {
  for (const [token, status] of [[undefined, 401], ['write', 403], ['read', 200]] as const) {
    const response = await app.request('/api/workspace/ws-1/members', {
      headers: token ? { authorization: 'Bearer ' + token } : {},
    });
    assertEquals(response.status, status);
    await response.arrayBuffer();
  }
  const unauthenticated = await assertRejects(() => anonymous.members(input));
  assert(unauthenticated instanceof ORPCError);
  assertEquals(unauthenticated.status, 401);
  const forbidden = await assertRejects(() => listWorkspaceMembers('write'));
  assert(forbidden instanceof ORPCError);
  assertEquals(forbidden.status, 403);
  assertEquals(await listWorkspaceMembers('read'), { ...input, subject: 'user:reader', members: [] });
  await assertRejects(() => workspaceClient.members(input, { context: {} }), Error);
  for (const [token, status] of [['write', 403], ['read', 200]] as const) {
    const request = new Request('https://example.test/members', {
      headers: { cookie: '__Host-ns_session=' + token },
    });
    if (status === 403) {
      const denied = await assertRejects(() => loadWorkspaceMembers(request, 'ws-1'));
      assert(denied instanceof ORPCError);
      assertEquals(denied.status, 403);
    } else {
      assertEquals(await loadWorkspaceMembers(request, 'ws-1'), {
        ...input, subject: 'user:reader', members: [],
      });
    }
  }
  for (const [token, status] of [[undefined, 401], ['write', 403], ['read', 200]] as const) {
    const request = new Request('https://example.test/members', {
      headers: token ? { cookie: '__Host-ns_session=' + token } : {},
    });
    const response = await handleWorkspaceMembers(request, 'ws-1');
    assertEquals(response.status, status);
    assertEquals(response.headers.get('cache-control'), 'no-store');
    assertEquals(await response.json(), status === 200
      ? { ...input, subject: 'user:reader', members: [] }
      : { authenticated: false });
  }
  const health = await app.request('/health');
  assertEquals(health.status, 200);
  await health.arrayBuffer();
  for (const path of ['/api/openapi.json', '/api/docs']) {
    const discovery = await app.request(path);
    assertEquals(discovery.status, 200);
    await discovery.arrayBuffer();
  }
}
try {
  for (let iteration = 0; iteration < 20; iteration++) await verify();
  await Promise.all(Array.from({ length: 5 }, () => verify()));
  console.log('20 sequential + 5 parallel controls');
} finally {
  if (previous === undefined) Deno.env.delete(key); else Deno.env.set(key, previous);
  await server.shutdown();
}
`;
