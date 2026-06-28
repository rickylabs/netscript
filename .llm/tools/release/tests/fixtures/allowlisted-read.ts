const fixtureUrl = new URL('./sample.txt', import.meta.url);

export async function loadAllowedFixture(): Promise<string> {
  return await Deno.readTextFile(fixtureUrl); // preflight-allow: test fixture read
}
