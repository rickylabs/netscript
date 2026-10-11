/** Bounded RESP PING at a runtime-allocated endpoint; closes the socket even on timeout. */
export async function garnetPong(port: number, timeoutMs = 2_000): Promise<boolean> {
  let connection: Deno.TcpConn | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const operation = (async () => {
    connection = await Deno.connect({ hostname: '127.0.0.1', port });
    const request = new TextEncoder().encode('*1\r\n$4\r\nPING\r\n');
    let written = 0;
    while (written < request.length) written += await connection.write(request.subarray(written));
    const response = new Uint8Array(7);
    let read = 0;
    while (read < response.length) {
      const count = await connection.read(response.subarray(read));
      if (count === null) return false;
      read += count;
    }
    return new TextDecoder().decode(response) === '+PONG\r\n';
  })();
  try {
    return await Promise.race([
      operation,
      new Promise<boolean>((resolve) => {
        timer = setTimeout(() => resolve(false), timeoutMs);
      }),
    ]);
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
    connection?.close();
    // A connect completing after timeout still needs its handle closed.
    void operation.finally(() => connection?.close()).catch(() => {});
  }
}
