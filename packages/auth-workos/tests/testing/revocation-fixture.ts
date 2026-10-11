import type { AuthnRequest, WorkosSessionClient } from '../../mod.ts';

export const cutoff = '2026-10-11T12:00:00.000Z';
export const issuedAt: number = Date.parse(cutoff) / 1000 - 60;

export function accessToken(iat: number = issuedAt): string {
  return `header.${btoa(JSON.stringify({ iat, exp: iat + 3600 }))}.signature`;
}

export function sessionClient(): WorkosSessionClient {
  return {
    userManagement: {
      loadSealedSession({ sessionData }) {
        const [subject, id] = sessionData.split(':');
        const result = {
          authenticated: true as const,
          user: { id: subject },
          sessionId: id,
          accessToken: accessToken(),
        };
        return {
          authenticate: () => Promise.resolve(result),
          refresh: () => Promise.resolve(result),
        };
      },
    },
  };
}

export function sessionRequest(value: string): AuthnRequest {
  return {
    method: 'GET',
    path: '/private',
    header: () => undefined,
    headers: () => new Headers(),
    cookie: () => value,
  };
}
