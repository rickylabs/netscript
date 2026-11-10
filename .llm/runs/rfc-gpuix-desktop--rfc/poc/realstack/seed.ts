/**
 * Build the packaged seed database: the scaffold's migrated SQLite file plus
 * the same 1,200 deterministic records the simulated store generates, so the
 * simulated and real-stack builds render identical data volumes.
 *
 *   deno run -A realstack/seed.ts <workspace.db> <out.db>
 *
 * Inserted directly (not through the service) because the generated create
 * contract rejects `createdAt`, and the overview needs records spread over
 * eight weeks.
 *
 * @module
 */
import { DatabaseSync } from 'node:sqlite';
import { seedRecords } from '../app/service/store.ts';

const [source, out] = Deno.args;
await Deno.copyFile(source, out);
const db = new DatabaseSync(out);
const iso = (value: string) => value.replace(/Z$/, '+00:00');
const insert = db.prepare(
  'INSERT INTO "User" (reference, name, ownerName, ownerEmail, status, amount, currency, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
);
db.exec('BEGIN');
const records = seedRecords(1_200, Date.now());
for (const record of records) {
  insert.run(
    record.reference,
    `Order ${record.reference}`,
    record.ownerName,
    `${record.ownerName.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@example.com`,
    record.status,
    Math.round(record.amount * 100),
    record.currency,
    iso(record.createdAt),
    iso(record.updatedAt),
  );
}
db.exec('COMMIT');
const count = db.prepare('SELECT count(*) AS n FROM "User"').get() as { n: number };
db.close();
console.log(`seeded ${records.length} records → ${out} (${count.n} total)`);
