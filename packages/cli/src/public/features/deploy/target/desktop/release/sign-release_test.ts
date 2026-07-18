import { assertEquals } from 'jsr:@std/assert@^1';
import {
  decodePkcs8Pem,
  importReleasePrivateKey,
  signNativeReleasePayload,
  signReleaseString,
} from './sign-release.ts';

Deno.test('Ed25519 envelope signs the exact preserved UTF-8 string', async () => {
  const keys = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
  const signed = '{"version":"2.0.0", "futureGraph":{"node":1}}';
  const envelope = await signReleaseString(signed, keys.privateKey);

  assertEquals(envelope.signed, signed);
  assertEquals(
    await crypto.subtle.verify(
      'Ed25519',
      keys.publicKey,
      Uint8Array.fromBase64(envelope.signature),
      new TextEncoder().encode(envelope.signed),
    ),
    true,
  );
});

Deno.test('native composer preserves native shape and PKCS8 PEM import verifies', async () => {
  const keys = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
  const pkcs8 = new Uint8Array(await crypto.subtle.exportKey('pkcs8', keys.privateKey));
  const pem = `-----BEGIN PRIVATE KEY-----\n${pkcs8.toBase64()}\n-----END PRIVATE KEY-----`;
  const imported = await importReleasePrivateKey(decodePkcs8Pem(pem));
  const envelope = await signNativeReleasePayload({
    manifestVersion: 1,
    sequence: 7,
    version: '2.0.0',
    patches: { '1.0.0': { name: 'one.bsdiff', sha256: 'ab' } },
  }, imported);

  assertEquals(JSON.parse(envelope.signed), {
    manifestVersion: 1,
    sequence: 7,
    version: '2.0.0',
    patches: { '1.0.0': { name: 'one.bsdiff', sha256: 'ab' } },
  });
  assertEquals(
    await crypto.subtle.verify(
      'Ed25519',
      keys.publicKey,
      Uint8Array.fromBase64(envelope.signature),
      new TextEncoder().encode(envelope.signed),
    ),
    true,
  );
});
