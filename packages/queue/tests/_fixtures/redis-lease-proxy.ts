/** A run-owned TCP interruption seam in front of a real Redis-compatible backend. */
export class LeaseProxy implements AsyncDisposable {
  readonly url: string;
  enabled = true;
  stalled = false;
  private readonly listener: Deno.TcpListener;
  private readonly connections = new Set<Deno.Conn>();
  private readonly tasks = new Set<Promise<void>>();
  private readonly accepting: Promise<void>;

  constructor(private readonly upstream: URL) {
    this.listener = Deno.listen({ hostname: '127.0.0.1', port: 0 });
    this.url = `redis://127.0.0.1:${this.listener.addr.port}`;
    this.accepting = this.accept();
  }

  drop(): void {
    this.enabled = false;
    for (const connection of this.connections) {
      try {
        connection.close();
      } catch { /* Already closed by the other direction. */ }
    }
  }

  private async accept(): Promise<void> {
    try {
      for await (const incoming of this.listener) {
        const task = this.forward(incoming).finally(() => this.tasks.delete(task));
        this.tasks.add(task);
      }
    } catch (error) {
      if (
        !(error instanceof Deno.errors.BadResource) && !(error instanceof Deno.errors.Interrupted)
      ) {
        throw error;
      }
    }
  }

  private async forward(incoming: Deno.TcpConn): Promise<void> {
    if (!this.enabled) {
      incoming.close();
      return;
    }
    let outgoing: Deno.TcpConn | undefined;
    try {
      outgoing = await Deno.connect({
        hostname: this.upstream.hostname,
        port: Number(this.upstream.port || 6379),
      });
      this.connections.add(incoming);
      this.connections.add(outgoing);
      if (!this.enabled) return;
      await Promise.all([
        incoming.readable.pipeTo(outgoing.writable).catch(() => {}),
        outgoing.readable.pipeThrough(
          new TransformStream<Uint8Array, Uint8Array>({
            transform: (chunk, controller) => {
              if (!this.stalled) controller.enqueue(chunk);
            },
          }),
        ).pipeTo(incoming.writable).catch(() => {}),
      ]);
    } finally {
      for (const connection of [incoming, outgoing]) {
        if (!connection) continue;
        this.connections.delete(connection);
        try {
          connection.close();
        } catch { /* Closed stream. */ }
      }
    }
  }

  async [Symbol.asyncDispose](): Promise<void> {
    this.listener.close();
    this.drop();
    await this.accepting;
    await Promise.all(this.tasks);
  }
}
