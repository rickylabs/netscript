import { assertEquals } from 'jsr:@std/assert@^1';
import { buildAuthSession } from '@netscript/plugin-auth-core/testing';
import { AuthStreamEventSchema } from '@netscript/plugin-auth-core/streams';
import { MemoryStreamProducer } from '@netscript/plugin-streams-core/testing';
import { emitOidcCompleted, emitSessionRevoked, emitTokenRefreshed } from '../../streams/server.ts';
import type { AuthSession, AuthStreamEvent } from '../../streams/mod.ts';

Deno.test('auth stream emit helpers project authSession lifecycle state', () => {
  const producer = new MemoryStreamProducer();
  const events: AuthStreamEvent[] = [];
  const now = () => new Date('2026-01-01T12:00:00.000Z');

  const session = buildAuthSession({
    id: 'sess_stream',
    userId: 'user_stream',
    providerId: 'oidc',
    subject: 'user:user_stream',
  });
  const completed = emitOidcCompleted(session, {
    producer,
    sink: (event) => events.push(event),
    now,
  });
  const refreshedSession = {
    ...session,
    refreshedAt: '2026-01-01T12:30:00.000Z',
  };
  const refreshed = emitTokenRefreshed(refreshedSession, {
    producer,
    sink: (event) => events.push(event),
    now,
  });
  const revoked = emitSessionRevoked(refreshedSession, {
    producer,
    sink: (event) => events.push(event),
    now,
  });

  assertEquals(completed.type, 'auth.oidc.completed');
  assertEquals(refreshed.type, 'auth.token.refreshed');
  assertEquals(revoked.type, 'auth.session.revoked');
  assertEquals(events.map((event) => event.type), [
    'auth.oidc.completed',
    'auth.token.refreshed',
    'auth.session.revoked',
  ]);

  const projection = new Map<string, AuthSession>();
  const states: string[] = [];
  for (const event of producer.events()) {
    if (event.operation === 'upsert' && event.entityType === 'authSession' && event.value) {
      const sessionEntity = event.value as unknown as AuthSession;
      projection.set(sessionEntity.id, sessionEntity);
      states.push(sessionEntity.state);
    }
  }

  assertEquals(states, ['active', 'active', 'revoked']);
  assertEquals(projection.get('sess_stream')?.refreshedAt, '2026-01-01T12:30:00.000Z');
  assertEquals(projection.get('sess_stream')?.state, 'revoked');
  assertEquals(projection.get('sess_stream')?.revokedAt, '2026-01-01T12:00:00.000Z');
});

Deno.test('auth stream emit helpers return AuthStreamEvent payloads', () => {
  const producer = new MemoryStreamProducer();
  const session = buildAuthSession({ id: 'sess_shape', providerId: 'oidc' });

  for (
    const event of [
      emitOidcCompleted(session, { producer }),
      emitTokenRefreshed({ ...session, refreshedAt: '2026-01-01T12:30:00.000Z' }, { producer }),
      emitSessionRevoked(session, { producer }),
    ]
  ) {
    const parsed = AuthStreamEventSchema.safeParse(event);
    assertEquals(parsed.success, true);
    assertEquals(parsed.success ? parsed.data.type : undefined, event.type);
  }
});

Deno.test('auth stream emit helpers isolate producer failures from callers', () => {
  const failingProducer = {
    upsert() {
      throw new Error('stream unavailable');
    },
    delete() {
      throw new Error('stream unavailable');
    },
    flush: () => Promise.resolve(),
    close: () => Promise.resolve(),
  };
  const warnings: unknown[][] = [];
  const previousWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    warnings.push(args);
  };

  try {
    const event = emitOidcCompleted(buildAuthSession({ id: 'sess_fail' }), {
      producer: failingProducer,
    });

    assertEquals(event.type, 'auth.oidc.completed');
    assertEquals(warnings.length, 1);
  } finally {
    console.warn = previousWarn;
  }
});
