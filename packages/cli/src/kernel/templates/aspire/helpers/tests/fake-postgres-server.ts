/**
 * @module templates/aspire/helpers/fake-postgres-server
 *
 * Minimal PostgreSQL v3 wire-protocol server for exercising the generated credential check
 * with the real `pg` client: startup, cleartext password authentication, one simple query.
 * It accepts every TCP connection, so a listener check against it is always Healthy — the
 * credential outcome is decided only by the configured login behaviour.
 */

import { Buffer } from 'node:buffer'
import { createServer, type Server, type Socket } from 'node:net'

/** How the fake server answers a login. */
export type FakePostgresLogin =
  | { readonly kind: 'password'; readonly password: string }
  | { readonly kind: 'reject-startup'; readonly sqlstate: string; readonly message: string }
  | { readonly kind: 'silent' }

/** One login attempt as the server observed it. */
export interface FakePostgresAttempt {
  readonly user: string | undefined
  readonly password: string | undefined
}

/** A running fake server. */
export interface FakePostgresServer {
  readonly port: number
  readonly attempts: readonly FakePostgresAttempt[]
  close(): Promise<void>
}

const PROTOCOL_VERSION_3 = 196_608
const AUTHENTICATION_OK = 0
const AUTHENTICATION_CLEARTEXT_PASSWORD = 3
const INT4_TYPE_OID = 23

/** Start a fake server on an ephemeral loopback port. */
export async function startFakePostgresServer(
  login: FakePostgresLogin,
): Promise<FakePostgresServer> {
  const attempts: FakePostgresAttempt[] = []
  const sockets = new Set<Socket>()
  const server = createServer((socket) => {
    sockets.add(socket)
    socket.once('close', () => sockets.delete(socket))
    socket.on('error', () => undefined)
    serveConnection(socket, login, attempts)
  })
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  return {
    port: serverPort(server),
    attempts,
    close: async () => {
      for (const socket of sockets) socket.destroy()
      await new Promise<void>((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve())
      })
    },
  }
}

function serveConnection(
  socket: Socket,
  login: FakePostgresLogin,
  attempts: FakePostgresAttempt[],
): void {
  let buffered = Buffer.alloc(0)
  let startup: Record<string, string> | undefined
  socket.on('data', (chunk: Buffer) => {
    buffered = Buffer.concat([buffered, chunk])
    if (!startup) {
      if (buffered.length < 4) return
      const length = buffered.readInt32BE(0)
      if (buffered.length < length) return
      const protocol = buffered.readInt32BE(4)
      startup = protocol === PROTOCOL_VERSION_3 ? readStartupParameters(buffered, length) : {}
      buffered = buffered.subarray(length)
      onStartup(socket, login, attempts, startup)
    }
    while (buffered.length >= 5) {
      const length = buffered.readInt32BE(1)
      if (buffered.length < length + 1) return
      const type = String.fromCharCode(buffered[0])
      const body = buffered.subarray(5, length + 1)
      buffered = buffered.subarray(length + 1)
      onMessage(socket, login, attempts, startup, type, body)
    }
  })
}

function onStartup(
  socket: Socket,
  login: FakePostgresLogin,
  attempts: FakePostgresAttempt[],
  startup: Record<string, string>,
): void {
  switch (login.kind) {
    case 'silent':
      attempts.push({ user: startup.user, password: undefined })
      return
    case 'reject-startup':
      attempts.push({ user: startup.user, password: undefined })
      socket.end(errorResponse(login.sqlstate, login.message))
      return
    case 'password':
      socket.write(authentication(AUTHENTICATION_CLEARTEXT_PASSWORD))
  }
}

function onMessage(
  socket: Socket,
  login: FakePostgresLogin,
  attempts: FakePostgresAttempt[],
  startup: Record<string, string> | undefined,
  type: string,
  body: Buffer,
): void {
  if (type === 'p' && login.kind === 'password') {
    const password = body.subarray(0, body.indexOf(0)).toString('utf8')
    attempts.push({ user: startup?.user, password })
    if (password !== login.password) {
      socket.end(
        errorResponse('28P01', `password authentication failed for user "${startup?.user}"`),
      )
      return
    }
    socket.write(Buffer.concat([authentication(AUTHENTICATION_OK), readyForQuery()]))
    return
  }
  if (type === 'Q') {
    socket.write(Buffer.concat([
      rowDescription('?column?'),
      dataRow('1'),
      message('C', cstring('SELECT 1')),
      readyForQuery(),
    ]))
    return
  }
  if (type === 'X') socket.end()
}

function readStartupParameters(buffer: Buffer, length: number): Record<string, string> {
  const parameters: Record<string, string> = {}
  const fields = buffer.subarray(8, length).toString('utf8').split('\0')
  for (let index = 0; index + 1 < fields.length; index += 2) {
    if (fields[index]) parameters[fields[index]] = fields[index + 1]
  }
  return parameters
}

function authentication(code: number): Buffer {
  const body = Buffer.alloc(4)
  body.writeInt32BE(code)
  return message('R', body)
}

function readyForQuery(): Buffer {
  return message('Z', Buffer.from('I'))
}

function errorResponse(sqlstate: string, text: string): Buffer {
  return message(
    'E',
    Buffer.concat([
      field('S', 'FATAL'),
      field('V', 'FATAL'),
      field('C', sqlstate),
      field('M', text),
      Buffer.from([0]),
    ]),
  )
}

function rowDescription(name: string): Buffer {
  const column = Buffer.alloc(18)
  column.writeInt32BE(0, 0)
  column.writeInt16BE(0, 4)
  column.writeInt32BE(INT4_TYPE_OID, 6)
  column.writeInt16BE(4, 10)
  column.writeInt32BE(-1, 12)
  column.writeInt16BE(0, 16)
  const count = Buffer.alloc(2)
  count.writeInt16BE(1)
  return message('T', Buffer.concat([count, cstring(name), column]))
}

function dataRow(value: string): Buffer {
  const encoded = Buffer.from(value, 'utf8')
  const header = Buffer.alloc(6)
  header.writeInt16BE(1, 0)
  header.writeInt32BE(encoded.length, 2)
  return message('D', Buffer.concat([header, encoded]))
}

function field(code: string, value: string): Buffer {
  return Buffer.concat([Buffer.from(code), cstring(value)])
}

function cstring(value: string): Buffer {
  return Buffer.concat([Buffer.from(value, 'utf8'), Buffer.from([0])])
}

function message(type: string, body: Buffer): Buffer {
  const header = Buffer.alloc(5)
  header.write(type, 0)
  header.writeInt32BE(body.length + 4, 1)
  return Buffer.concat([header, body])
}

function serverPort(server: Server): number {
  const address = server.address()
  if (typeof address !== 'object' || address === null) {
    throw new Error('fake Postgres server did not expose a TCP address')
  }
  return address.port
}
