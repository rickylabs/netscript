import { PrismaMySql } from '@netscript/prisma-adapter-mysql';

Deno.test('MySQL adapter example type-check', () => {
  const config = {
    hostname: 'localhost',
    port: 3306,
    username: 'root',
    password: 'password',
    db: 'mydb',
    poolSize: 5,
    timeout: 10000,
  };

  const adapterFactory = new PrismaMySql(config, {
    database: 'mydb',
  });

  const _factory: PrismaMySql = adapterFactory;
});
