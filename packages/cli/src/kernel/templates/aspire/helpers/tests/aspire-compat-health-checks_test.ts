/**
 * @module templates/aspire/helpers/aspire-compat-health-checks_test
 *
 * Executes the generated compatibility helper against real local Node sockets.
 */

import { assertEquals, assertMatch } from 'jsr:@std/assert@^1'
import { afterAll, describe, it } from 'jsr:@std/testing@^1/bdd'
import { createServer, type Server, type Socket } from 'node:net'
import { fromFileUrl, resolve, toFileUrl } from 'jsr:@std/path@^1'

const compatContent = await Deno.readTextFile(
  new URL(
    '../../../../assets/aspire/helpers/_aspire-compat.ts.template',
    import.meta.url,
  ),
)

await Deno.mkdir('packages/cli/.tmp', { recursive: true })
const generatedRoot = resolve(
  await Deno.makeTempDir({
    dir: 'packages/cli/.tmp',
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
await Deno.writeTextFile(compatPath, compatContent)
const compatModule = await import(
  `${toFileUrl(compatPath).href}?test=${crypto.randomUUID()}`
)

afterAll(async () => {
  await Deno.remove(generatedRoot, { recursive: true })
})

describe('generated Aspire listener readiness helpers', () => {
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
