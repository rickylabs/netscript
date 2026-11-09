/**
 * Embedded workspace service built with `@netscript/service`.
 *
 * The desktop process hosts it on a loopback port so the UI talks to it exactly
 * as it would to a remote, Aspire-hosted NetScript service (typed oRPC client,
 * cookie session, durable SSE stream). Point the UI at a remote URL and nothing
 * else changes.
 */
import { implement, ORPCError } from '@orpc/server';
import { type AuthenticatorPort, buildServiceRpcPath, createService, type Principal } from '@netscript/service';
import { DenoKvAdapter, type KvStore } from '@netscript/kv';
import {
  ACTIVITY_STREAM_PATH,
  type ActivityEntry,
  type Job,
  RECORD_STATUSES,
  type RecordStatus,
  SERVICE_NAME,
  SESSION_COOKIE,
  STATUS_LABEL,
  workspaceContract,
} from '../contract.ts';
import { WorkspaceStore } from './store.ts';
import { ActivityStream } from './activity-stream.ts';

const SESSION_TTL_MS = 7 * 86_400_000;
const DEMO_PASSWORD = 'netscript';
const ANONYMOUS: Principal = { subject: 'anonymous', scopes: [], roles: [], scheme: 'custom', claims: {} };

interface SessionRecord {
  readonly subject: string;
  readonly name: string;
  readonly email: string;
}

type Ctx = { principal?: Principal };

export interface WorkspaceServiceOptions {
  /** Deno KV file for persisted mutations and sessions. */
  readonly kvPath?: string;
  /** Background activity rate in events per second (simulated workers). */
  readonly eventsPerSecond?: number;
  /** Extra host routes checked first (the webview build serves its page here). */
  readonly routes?: (request: Request, path: string) => Response | undefined | Promise<Response | undefined>;
  /** Fixed port (0 = ephemeral). */
  readonly port?: number;
}

export interface RunningWorkspaceService {
  readonly url: string;
  readonly store: WorkspaceStore;
  readonly stream: ActivityStream;
  readonly kv: KvStore;
  setEventsPerSecond(rate: number): void;
  stop(): Promise<void>;
}

function requireMember(context: Ctx): Principal {
  const principal = context.principal;
  if (!principal || principal.subject === 'anonymous') {
    throw new ORPCError('UNAUTHORIZED', { message: 'Sign in to access the workspace.' });
  }
  return principal;
}

function nameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? 'member';
  return local.split(/[._-]/).filter(Boolean).map((part) => part[0].toUpperCase() + part.slice(1)).join(' ') || 'Member';
}

export async function startWorkspaceService(options: WorkspaceServiceOptions = {}): Promise<RunningWorkspaceService> {
  const kv = new DenoKvAdapter(undefined, options.kvPath);
  const store = new WorkspaceStore(kv);
  await store.load();
  const stream = new ActivityStream();

  const os = implement(workspaceContract).$context<Ctx>();
  const router = os.router({
    overview: {
      get: os.overview.get.handler(({ input, context }) => {
        requireMember(context);
        return store.overview(input.periodDays);
      }),
    },
    records: {
      list: os.records.list.handler(({ input, context }) => {
        requireMember(context);
        return store.page(input.page, input.pageSize, input.query, input.status);
      }),
      get: os.records.get.handler(({ input, context }) => {
        requireMember(context);
        const record = store.get(input.id);
        if (!record) throw new ORPCError('NOT_FOUND', { message: `Record ${input.id} not found.` });
        return record;
      }),
      setStatus: os.records.setStatus.handler(async ({ input, context }) => {
        const principal = requireMember(context);
        const record = store.get(input.id);
        if (!record) throw new ORPCError('NOT_FOUND', { message: `Record ${input.id} not found.` });
        const updated = await store.upsert({ ...record, status: input.status, updatedAt: new Date().toISOString() });
        publishActivity(String(principal.claims.name ?? principal.subject), `marked ${STATUS_LABEL[input.status].toLowerCase()}`, updated.reference, updated.id);
        return updated;
      }),
      create: os.records.create.handler(async ({ input, context }) => {
        const principal = requireMember(context);
        const now = new Date().toISOString();
        const index = store.size + 10_000;
        const created = await store.upsert({
          id: `rec_${crypto.randomUUID().slice(0, 8)}`,
          reference: `ORD-${index}`,
          ownerName: input.ownerName,
          status: 'draft',
          amount: input.amount,
          currency: input.currency,
          createdAt: now,
          updatedAt: now,
        });
        publishActivity(String(principal.claims.name ?? principal.subject), 'created', created.reference, created.id);
        return created;
      }),
    },
    jobs: {
      list: os.jobs.list.handler(({ context }) => {
        requireMember(context);
        return [...store.jobs.values()];
      }),
    },
    session: {
      me: os.session.me.handler(({ context }) => {
        const principal = context.principal;
        if (!principal || principal.subject === 'anonymous') return null;
        return { subject: principal.subject, name: String(principal.claims.name), email: String(principal.claims.email) };
      }),
    },
  });

  const authenticator: AuthenticatorPort = {
    async authenticate(request) {
      // Browser hosts send the HttpOnly cookie; native hosts send the same id as a bearer token.
      const bearer = request.header('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
      const sessionId = request.cookie(SESSION_COOKIE) ?? bearer;
      const session = sessionId ? (await kv.get<SessionRecord>(['workspace', 'sessions', sessionId]))?.value : undefined;
      if (!session) return { ok: true, principal: ANONYMOUS };
      return {
        ok: true,
        principal: { subject: session.subject, scopes: ['workspace'], roles: ['member'], scheme: 'custom', claims: { name: session.name, email: session.email } },
      };
    },
  };

  const app = await createService(router as never, { name: 'workspace', version: '0.1.0' })
    .withAuthn({ authenticator, protect: ['/api'] })
    // The SDK addresses /api/rpc/v1/<routerName>; the builder default is /api/rpc.
    .withRPC({ rpcPath: buildServiceRpcPath({ routerName: SERVICE_NAME }) })
    .withHealth()
    .build();

  function publishActivity(actor: string, verb: string, label: string, recordId?: string): void {
    const entry: ActivityEntry = { id: crypto.randomUUID(), actor, verb, label, recordId, timestamp: new Date().toISOString() };
    stream.publish('activity', entry.id, entry, 'insert');
  }

  function publishJob(job: Job): void {
    stream.publish('job', job.id, job, 'upsert');
  }

  function sessionIdFrom(request: Request): string | undefined {
    const cookie = request.headers.get('cookie') ?? '';
    const fromCookie = cookie.split(/;\s*/).find((part) => part.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1);
    return fromCookie ?? request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  }

  async function sessionFrom(request: Request): Promise<SessionRecord | undefined> {
    const id = sessionIdFrom(request);
    return id ? (await kv.get<SessionRecord>(['workspace', 'sessions', id]))?.value : undefined;
  }

  async function handleAuth(request: Request, path: string): Promise<Response> {
    if (path === '/auth/sign-in' && request.method === 'POST') {
      const body = await request.json().catch(() => ({})) as { email?: string; password?: string };
      const email = String(body.email ?? '').trim().toLowerCase();
      if (!email.includes('@') || body.password !== DEMO_PASSWORD) {
        return Response.json({ error: 'Invalid email or password.' }, { status: 401 });
      }
      const id = crypto.randomUUID();
      const session: SessionRecord = { subject: `user_${email}`, name: nameFromEmail(email), email };
      await kv.set(['workspace', 'sessions', id], session, { expireIn: SESSION_TTL_MS });
      publishActivity(session.name, 'signed in', 'desktop');
      return Response.json({ subject: session.subject, name: session.name, email }, {
        headers: { 'set-cookie': `${SESSION_COOKIE}=${id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_MS / 1000}` },
      });
    }
    if (path === '/auth/sign-out' && request.method === 'POST') {
      const id = sessionIdFrom(request);
      if (id) await kv.delete(['workspace', 'sessions', id]);
      return new Response(null, { status: 204, headers: { 'set-cookie': `${SESSION_COOKIE}=; Path=/; HttpOnly; Max-Age=0` } });
    }
    return new Response('Not found', { status: 404 });
  }

  const server = Deno.serve({ hostname: '127.0.0.1', port: options.port ?? 0, onListen() {} }, async (request) => {
    const path = new URL(request.url).pathname;
    const extra = await options.routes?.(request, path);
    if (extra) return extra;
    if (path.startsWith('/auth/')) return handleAuth(request, path);
    if (path === ACTIVITY_STREAM_PATH) {
      if (!(await sessionFrom(request))) return new Response('Unauthorized', { status: 401 });
      return stream.respond(request);
    }
    return app.fetch(request);
  });

  // Simulated workers: job progress plus record activity, at a tunable rate.
  const actors = ['Grace Hopper', 'Alan Turing', 'Radia Perlman', 'Barbara Liskov'];
  let rate = options.eventsPerSecond ?? 0.5;
  let timer: ReturnType<typeof setInterval> | undefined;
  let tickCount = 0;
  const tick = async () => {
    tickCount++;
    const jobs = [...store.jobs.values()];
    const job = jobs[tickCount % jobs.length];
    const progress = job.state === 'completed' ? 0 : Math.min(100, job.progress + 7);
    const next: Job = {
      ...job,
      progress,
      state: progress >= 100 ? 'completed' : 'running',
      updatedAt: new Date().toISOString(),
    };
    store.jobs.set(job.id, next);
    publishJob(next);
    if (tickCount % 3 === 0) {
      const page = store.page(1 + (tickCount % 20), 1);
      const record = page.rows[0];
      if (record) {
        const status: RecordStatus = RECORD_STATUSES[(RECORD_STATUSES.indexOf(record.status) + 1) % RECORD_STATUSES.length];
        const updated = await store.upsert({ ...record, status, updatedAt: new Date().toISOString() });
        publishActivity(actors[tickCount % actors.length], `moved to ${STATUS_LABEL[status].toLowerCase()}`, updated.reference, updated.id);
      }
    }
  };
  const schedule = () => {
    if (timer) clearInterval(timer);
    timer = rate > 0 ? setInterval(() => void tick(), Math.max(10, 1000 / rate)) : undefined;
  };
  schedule();

  return {
    url: `http://127.0.0.1:${server.addr.port}`,
    store,
    stream,
    kv,
    setEventsPerSecond(next) {
      rate = next;
      schedule();
    },
    async stop() {
      if (timer) clearInterval(timer);
      await server.shutdown();
      await kv[Symbol.asyncDispose]?.();
    },
  };
}
