import { assertEquals } from 'jsr:@std/assert@1';
import { MssqlAdapter } from '../adapters/mssql.adapter.ts';

Deno.test('MssqlAdapter uses NTLM authentication for integrated security', () => {
  const adapter = new MssqlAdapter({
    host: 'localhost',
    database: 'app',
    integratedSecurity: true,
  });

  const config = (
    adapter as unknown as { buildAdapterConfig(): { authentication?: { type?: string } } }
  ).buildAdapterConfig();

  assertEquals(config.authentication?.type, 'ntlm');
});
