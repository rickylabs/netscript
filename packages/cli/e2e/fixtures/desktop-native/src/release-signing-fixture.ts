/** Ephemeral Ed25519 material used only by the native release E2E. */
export interface ReleaseSigningFixture {
  readonly privateKeyPem: string;
  readonly publicKeyBase64: string;
}

function pkcs8Pem(bytes: Uint8Array): string {
  const base64 = bytes.toBase64();
  const lines = base64.match(/.{1,64}/g) ?? [];
  return `-----BEGIN PRIVATE KEY-----\n${lines.join('\n')}\n-----END PRIVATE KEY-----\n`;
}

/** Generate exportable signing material compatible with the #456 release command. */
export async function createReleaseSigningFixture(): Promise<ReleaseSigningFixture> {
  const pair = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
  const privateKey = new Uint8Array(await crypto.subtle.exportKey('pkcs8', pair.privateKey));
  const publicKey = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
  return {
    privateKeyPem: pkcs8Pem(privateKey),
    publicKeyBase64: publicKey.toBase64(),
  };
}
