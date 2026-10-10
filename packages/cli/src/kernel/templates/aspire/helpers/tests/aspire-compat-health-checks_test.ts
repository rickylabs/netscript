/**
 * @module templates/aspire/helpers/aspire-compat-health-checks_test
 *
 * Executes the generated compatibility helper against real local Node sockets.
 */

import { assert, assertEquals, assertMatch } from 'jsr:@std/assert@^1'
import { afterAll, describe, it } from 'jsr:@std/testing@^1/bdd'
import { createServer, type Server, type Socket } from 'node:net'
import { fromFileUrl, resolve, toFileUrl } from 'jsr:@std/path@^1'
import { type FakePostgresServer, startFakePostgresServer } from './fake-postgres-server.ts'

const compatContent = await Deno.readTextFile(
  new URL(
    '../../../../assets/aspire/helpers/_aspire-compat.ts.template',
    import.meta.url,
  ),
)

const generatedRoot = resolve(
  await Deno.makeTempDir({
    prefix: 'netscript-aspire-health-',
  }),
)
const helpersDir = `${generatedRoot}/.helpers`
const modulesDir = `${generatedRoot}/.aspire/modules`
await Deno.mkdir(helpersDir, { recursive: true })
await Deno.mkdir(modulesDir, { recursive: true })
await Deno.writeTextFile(
  `${modulesDir}/aspire.mts`,
  `// Verbatim 13.5.3 declarations from the restored aspire.mts module:
// HealthStatus l.619-624; HealthCheckResult l.1013-1021;
// EndpointReference l.4696-4701; EndpointReferencePromise l.4763-4768.
export enum HealthStatus {
  Unhealthy = "Unhealthy",
  Degraded = "Degraded",
  Healthy = "Healthy",
}

/** ATS-friendly custom health check result. */
export interface HealthCheckResult {
  /** Gets the health status returned by the health check. */
  status?: HealthStatus;
  /** Gets an optional description for the health check result. */
  description?: string | null;
  /** Gets optional string data for the health check result. */
  data?: Record<string, string>;
}

export interface EndpointReference {
  /** Gets the port for this endpoint. */
  port(): Promise<number>;
  /** Gets the host for this endpoint. */
  host(): Promise<string>;
}

export interface EndpointReferencePromise extends PromiseLike<EndpointReference> {
  /** Gets the port for this endpoint. */
  port(): Promise<number>;
  /** Gets the host for this endpoint. */
  host(): Promise<string>;
}
`,
)
const compatPath = `${helpersDir}/_aspire-compat.mts`
const runtimeCompatPath = `${helpersDir}/_aspire-compat.runtime.mts`
const generatedConfigPath = `${generatedRoot}/deno.json`
const zodSpecifier = import.meta.resolve('zod')
await Deno.writeTextFile(
  generatedConfigPath,
  `${JSON.stringify({
    lock: false,
    imports: { zod: zodSpecifier },
    compilerOptions: {
      strict: true,
      noImplicitAny: true,
      noImplicitReturns: true,
      isolatedDeclarations: false,
    },
    fmt: {
      useTabs: false,
      lineWidth: 100,
      indentWidth: 2,
      semiColons: true,
      singleQuote: true,
    },
  }, null, 2)}\n`,
)
await Deno.writeTextFile(compatPath, compatContent)
// The generated helper loads `pg` from the AppHost's node_modules; the test resolves the
// same bare specifier to the workspace-locked npm package instead.
const POSTGRES_CLIENT_MODULE_DECLARATION = "const POSTGRES_CLIENT_MODULE = 'pg';"
assertEquals(compatContent.split(POSTGRES_CLIENT_MODULE_DECLARATION).length, 2)
const runtimeCompatContent = compatContent.replace("from 'zod';", `from '${zodSpecifier}';`)
await Deno.writeTextFile(
  runtimeCompatPath,
  runtimeCompatContent.replace(
    POSTGRES_CLIENT_MODULE_DECLARATION,
    "const POSTGRES_CLIENT_MODULE = 'npm:pg@^8.21.0';",
  ),
)
const clientlessCompatPath = `${helpersDir}/_aspire-compat.clientless.mts`
await Deno.writeTextFile(
  clientlessCompatPath,
  runtimeCompatContent.replace(
    POSTGRES_CLIENT_MODULE_DECLARATION,
    "const POSTGRES_CLIENT_MODULE = 'data:text/javascript,export default {}';",
  ),
)
await Deno.writeTextFile(
  `${generatedRoot}/format-sentinel.ts`,
  'export const formatSentinel = true;\n',
)
const compatModule = await import(
  `${toFileUrl(runtimeCompatPath).href}?test=${crypto.randomUUID()}`
)
const clientlessCompatModule = await import(
  `${toFileUrl(clientlessCompatPath).href}?test=${crypto.randomUUID()}`
)

afterAll(async () => {
  await Deno.remove(generatedRoot, { recursive: true })
})

describe('generated Aspire listener readiness helpers', () => {
  it('type-checks the emitted helper in a generated workspace shape', async () => {
    const result = await new Deno.Command(Deno.execPath(), {
      args: [
        'check',
        '--config',
        generatedConfigPath,
        '--no-lock',
        compatPath,
      ],
      stdout: 'piped',
      stderr: 'piped',
    }).output()

    assertEquals(result.code, 0, new TextDecoder().decode(result.stderr))
  })

  it('formats the emitted helper as generated TypeScript', async () => {
    const result = await new Deno.Command(Deno.execPath(), {
      args: [
        'fmt',
        '--check',
        '--config',
        generatedConfigPath,
        'format-sentinel.ts',
        '.helpers/_aspire-compat.mts',
      ],
      cwd: generatedRoot,
      stdout: 'piped',
      stderr: 'piped',
    }).output()

    assertEquals(
      result.code,
      0,
      `${new TextDecoder().decode(result.stdout)}${new TextDecoder().decode(result.stderr)}`,
    )
  })

  it('reports a local TCP listener as Healthy', async () => {
    const server = await startServer()
    try {
      const result = await compatModule.createListenerReadinessCheck({
        kind: 'postgres',
        host: '127.0.0.1',
        port: serverPort(server),
      })()

      assertEquals(result, {
        status: 'Healthy',
        description: `postgres listener ready on 127.0.0.1:${
          serverPort(server)
        }`,
      })
    } finally {
      await closeServer(server)
    }
  })

  it('reports a closed local TCP port as Unhealthy with ECONNREFUSED', async () => {
    const server = await startServer()
    const port = serverPort(server)
    await closeServer(server)

    const result = await compatModule.createListenerReadinessCheck({
      kind: 'postgres',
      host: '127.0.0.1',
      port,
    })()

    assertEquals(result.status, 'Unhealthy')
    assertEquals(
      result.description,
      'postgres listener unreachable: ECONNREFUSED',
    )
    assertEquals(result.data.code, 'ECONNREFUSED')
    assertEquals(result.data.host, '127.0.0.1')
    assertEquals(result.data.port, String(port))
    assertMatch(result.data.elapsedMs, /^\d+$/)
  })

  it('bounds a black-hole TCP address at 2000 ms with ETIMEDOUT', async () => {
    const startedAt = performance.now()
    const result = await compatModule.createListenerReadinessCheck({
      kind: 'postgres',
      host: '192.0.2.1',
      port: 65_000,
    })()
    const elapsedMs = performance.now() - startedAt

    assertEquals(result.status, 'Unhealthy')
    assertEquals(result.description, 'postgres listener unreachable: ETIMEDOUT')
    assertEquals(result.data.code, 'ETIMEDOUT')
    assertEquals(result.data.host, '192.0.2.1')
    assertEquals(result.data.port, '65000')
    assertMatch(result.data.elapsedMs, /^\d+$/)
    assertEquals(elapsedMs >= 1_900 && elapsedMs < 3_500, true)
  })

  it('publishes endpoint allocation timeout as Unhealthy instead of hanging', async () => {
    const startedAt = performance.now()
    const result = await compatModule.createEndpointListenerReadinessCheck({
      kind: 'postgres',
      endpoint: () => new Promise(() => {}),
    })()
    const elapsedMs = performance.now() - startedAt

    assertEquals(result.status, 'Unhealthy')
    assertEquals(
      result.description,
      'postgres listener unreachable: endpoint not allocated within 2000ms',
    )
    assertEquals(result.data.code, 'ENDPOINT_UNALLOCATED')
    assertEquals(result.data.host, '<unallocated>')
    assertEquals(result.data.port, '<unallocated>')
    assertMatch(result.data.elapsedMs, /^\d+$/)
    assertEquals(elapsedMs >= 1_900 && elapsedMs < 3_500, true)
  })

  it('sends an array-encoded PING and accepts one-segment +PONG', async () => {
    let request = ''
    const server = await startServer((socket) => {
      socket.once('data', (data) => {
        request = data.toString('utf8')
        socket.end('+PONG\r\n')
      })
    })
    const port = serverPort(server)
    try {
      const result = await compatModule.createRespPingCheck({
        host: '127.0.0.1',
        port,
      })()

      assertEquals(request, '*1\r\n$4\r\nPING\r\n')
      assertEquals(result, {
        status: 'Healthy',
        description: `RESP listener ready on 127.0.0.1:${port}`,
      })
    } finally {
      await closeServer(server)
    }
  })

  it('accumulates a split +PONG reply through CRLF', async () => {
    const server = await startServer((socket) => {
      socket.once('data', () => {
        socket.write('+PO')
        setTimeout(() => {
          if (!socket.destroyed) socket.end('NG\r\n')
        }, 25)
      })
    })
    const port = serverPort(server)
    try {
      const result = await compatModule.createRespPingCheck({
        host: '127.0.0.1',
        port,
      })()

      assertEquals(result, {
        status: 'Healthy',
        description: `RESP listener ready on 127.0.0.1:${port}`,
      })
    } finally {
      await closeServer(server)
    }
  })

  it('reports NOAUTH as Unhealthy with endpoint and received bytes', async () => {
    const result = await withRespReply('-NOAUTH Authentication required.\r\n')

    assertEquals(result.status, 'Unhealthy')
    assertMatch(result.description, /RESP listener unhealthy: NOAUTH/)
    assertRespFailureData(
      result.data,
      'NOAUTH',
      '-NOAUTH Authentication required.\\r\\n',
    )
  })

  it('reports garbage as EPROTO with received bytes', async () => {
    const result = await withRespReply('garbage\r\n')

    assertEquals(result.status, 'Unhealthy')
    assertMatch(result.description, /RESP listener unhealthy: EPROTO/)
    assertRespFailureData(result.data, 'EPROTO', 'garbage\\r\\n')
  })

  it('reports a closed RESP port as ECONNREFUSED without waiting for the deadline', async () => {
    const server = await startServer()
    const port = serverPort(server)
    await closeServer(server)
    const startedAt = performance.now()

    const result = await compatModule.createRespPingCheck({
      host: '127.0.0.1',
      port,
    })()
    const elapsedMs = performance.now() - startedAt

    assertEquals(result.status, 'Unhealthy')
    assertMatch(result.description, /RESP listener unhealthy: ECONNREFUSED/)
    assertRespFailureData(result.data, 'ECONNREFUSED', '')
    assertEquals(elapsedMs < 500, true)
  })

  it('times out when a RESP server accepts the connection but never replies', async () => {
    let acceptedSocket: Socket | undefined
    const server = await startServer((socket) => {
      acceptedSocket = socket
    })
    const port = serverPort(server)
    const startedAt = performance.now()
    try {
      const result = await compatModule.createRespPingCheck({
        host: '127.0.0.1',
        port,
      })()
      const elapsedMs = performance.now() - startedAt

      assertEquals(result.status, 'Unhealthy')
      assertMatch(result.description, /RESP listener unhealthy: ETIMEDOUT/)
      assertRespFailureData(result.data, 'ETIMEDOUT', '')
      assertEquals(elapsedMs >= 1_900 && elapsedMs < 3_500, true)
    } finally {
      acceptedSocket?.destroy()
      await closeServer(server)
    }
  })
})

describe('generated Aspire PostgreSQL credential readiness', () => {
  const PASSWORD = 'fixture-right-0d9c3f'
  const WRONG_PASSWORD = 'fixture-wrong-7a41be'

  it('reports Healthy only after an authenticated SELECT 1', async () => {
    const server = await startFakePostgresServer({ kind: 'password', password: PASSWORD })
    try {
      const result = await credentialCheck(server, PASSWORD)

      assertEquals(result, {
        status: 'Healthy',
        description: `postgres credentials accepted on 127.0.0.1:${server.port}`,
      })
      assertEquals(server.attempts, [{ user: 'postgres', password: PASSWORD }])
    } finally {
      await server.close()
    }
  })

  it('reports a rejected password as an auth failure while the listener is Healthy', async () => {
    const server = await startFakePostgresServer({ kind: 'password', password: PASSWORD })
    try {
      const listener = await compatModule.createListenerReadinessCheck({
        kind: 'postgres',
        host: '127.0.0.1',
        port: server.port,
      })()
      const result = await credentialCheck(server, WRONG_PASSWORD)

      assertEquals(listener.status, 'Healthy')
      assertEquals(result.status, 'Unhealthy')
      assertMatch(
        result.description,
        new RegExp(
          `^postgres credential check failed: auth 28P01 \\(invalid_password\\) at 127\\.0\\.0\\.1:${server.port} after \\d+ ms$`,
        ),
      )
      assertCredentialFailureData(result.data, 'auth', '28P01', server.port)
      assertEquals(server.attempts, [{ user: 'postgres', password: WRONG_PASSWORD }])
      assertNoCredentialBytes(result, [WRONG_PASSWORD, PASSWORD, 'authentication failed'])
    } finally {
      await server.close()
    }
  })

  it('classifies a missing role as auth and a missing database as database', async () => {
    const cases = [
      { sqlstate: '28000', failureClass: 'auth', name: 'invalid_authorization_specification' },
      { sqlstate: '3D000', failureClass: 'database', name: 'invalid_catalog_name' },
      { sqlstate: '57P03', failureClass: 'starting', name: 'cannot_connect_now' },
    ] as const
    for (const fixture of cases) {
      const server = await startFakePostgresServer({
        kind: 'reject-startup',
        sqlstate: fixture.sqlstate,
        message: `server text naming role "postgres" and secret ${PASSWORD}`,
      })
      try {
        const result = await credentialCheck(server, PASSWORD)

        assertEquals(result.status, 'Unhealthy')
        assertMatch(
          result.description,
          new RegExp(
            `^postgres credential check failed: ${fixture.failureClass} ${fixture.sqlstate} \\(${fixture.name}\\) at `,
          ),
        )
        assertCredentialFailureData(
          result.data,
          fixture.failureClass,
          fixture.sqlstate,
          server.port,
        )
        assertNoCredentialBytes(result, [PASSWORD, 'server text', 'role "postgres"'])
      } finally {
        await server.close()
      }
    }
  })

  it('classifies an unknown server error by SQLSTATE without echoing its text', async () => {
    const server = await startFakePostgresServer({
      kind: 'reject-startup',
      sqlstate: 'XX000',
      message: `internal error mentioning ${PASSWORD}`,
    })
    try {
      const result = await credentialCheck(server, PASSWORD)

      assertEquals(result.status, 'Unhealthy')
      assertMatch(result.description, /^postgres credential check failed: server XX000 at /)
      assertCredentialFailureData(result.data, 'server', 'XX000', server.port)
      assertNoCredentialBytes(result, [PASSWORD, 'internal error'])
    } finally {
      await server.close()
    }
  })

  it('reports a closed port as a listener failure without waiting for the deadline', async () => {
    const server = await startFakePostgresServer({ kind: 'password', password: PASSWORD })
    const port = server.port
    await server.close()
    const startedAt = performance.now()

    const result = await credentialCheck({ port }, PASSWORD)
    const elapsedMs = performance.now() - startedAt

    assertEquals(result.status, 'Unhealthy')
    assertMatch(result.description, /^postgres credential check failed: listener ECONNREFUSED at /)
    assertCredentialFailureData(result.data, 'listener', 'ECONNREFUSED', port)
    assertEquals(elapsedMs < 1_000, true)
  })

  it('bounds a server that accepts the socket but never answers the login', async () => {
    const server = await startFakePostgresServer({ kind: 'silent' })
    const startedAt = performance.now()
    try {
      const result = await credentialCheck(server, PASSWORD)
      const elapsedMs = performance.now() - startedAt

      assertEquals(result.status, 'Unhealthy')
      assertMatch(result.description, /^postgres credential check failed: timeout ETIMEDOUT at /)
      assertCredentialFailureData(result.data, 'timeout', 'ETIMEDOUT', server.port)
      assertEquals(elapsedMs >= 1_900 && elapsedMs < 3_500, true)
    } finally {
      await server.close()
    }
  })

  it('publishes endpoint allocation timeout as a listener failure instead of hanging', async () => {
    const result = await compatModule.createPostgresCredentialReadinessCheck({
      endpoint: () => new Promise(() => {}),
      password: PASSWORD,
    })()

    assertEquals(result.status, 'Unhealthy')
    assertMatch(
      result.description,
      /^postgres credential check failed: listener ENDPOINT_UNALLOCATED at <unallocated>:<unallocated> after \d+ ms$/,
    )
    assertEquals(result.data?.class, 'listener')
    assertNoCredentialBytes(result, [PASSWORD])
  })

  it('reports a missing pg client as a client failure without attempting a login', async () => {
    const server = await startFakePostgresServer({ kind: 'password', password: PASSWORD })
    try {
      const result = await clientlessCompatModule.createPostgresCredentialReadinessCheck({
        endpoint: () => Promise.resolve(fixedEndpoint(server.port)),
        password: PASSWORD,
      })()

      assertEquals(result.status, 'Unhealthy')
      assertMatch(
        result.description,
        /^postgres credential check failed: client PG_CLIENT_UNAVAILABLE at /,
      )
      assertCredentialFailureData(result.data, 'client', 'PG_CLIENT_UNAVAILABLE', server.port)
      assertEquals(server.attempts, [])
    } finally {
      await server.close()
    }
  })
})

interface CredentialCheckResult {
  readonly status: string
  readonly description: string
  readonly data?: Record<string, string>
}

function fixedEndpoint(port: number) {
  return {
    host: () => Promise.resolve('127.0.0.1'),
    port: () => Promise.resolve(port),
  }
}

async function credentialCheck(
  server: Pick<FakePostgresServer, 'port'>,
  password: string,
): Promise<CredentialCheckResult> {
  return await compatModule.createPostgresCredentialReadinessCheck({
    endpoint: () => Promise.resolve(fixedEndpoint(server.port)),
    password,
  })()
}

function assertCredentialFailureData(
  data: Record<string, string> | undefined,
  failureClass: string,
  code: string,
  port: number,
): void {
  assert(data, 'credential failure must publish classified data')
  assertEquals(Object.keys(data).sort(), ['class', 'code', 'elapsedMs', 'host', 'port'])
  assertEquals(data.class, failureClass)
  assertEquals(data.code, code)
  assertEquals(data.host, '127.0.0.1')
  assertEquals(data.port, String(port))
  assertMatch(data.elapsedMs, /^\d+$/)
}

function assertNoCredentialBytes(result: unknown, forbidden: readonly string[]): void {
  const serialized = JSON.stringify(result)
  for (const value of forbidden) {
    assertEquals(serialized.includes(value), false, `health result leaked ${value}`)
  }
}

interface RespFailureResult {
  readonly status: string
  readonly description: string
  readonly data: Record<string, string>
}

async function withRespReply(reply: string): Promise<RespFailureResult> {
  const server = await startServer((socket) => {
    socket.once('data', () => socket.end(reply))
  })
  try {
    return await compatModule.createRespPingCheck({
      host: '127.0.0.1',
      port: serverPort(server),
    })()
  } finally {
    await closeServer(server)
  }
}

function assertRespFailureData(
  data: Record<string, string>,
  code: string,
  received: string,
): void {
  assertEquals(data.code, code)
  assertEquals(data.host, '127.0.0.1')
  assertMatch(data.port, /^\d+$/)
  assertMatch(data.elapsedMs, /^\d+$/)
  assertEquals(data.received, received)
}

async function startServer(
  connectionListener?: (socket: Socket) => void,
): Promise<Server> {
  const server = createServer(connectionListener)
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  return server
}

function serverPort(server: Server): number {
  const address = server.address()
  if (typeof address !== 'object' || address === null) {
    throw new Error('test server did not expose a TCP address')
  }
  return address.port
}

async function closeServer(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve())
  })
}

// Keep Deno's file-URL handling exercised explicitly; generated modules are loaded from disk,
// not evaluated from a source string that could bypass their relative import contract.
assertEquals(fromFileUrl(toFileUrl(compatPath)), compatPath)
