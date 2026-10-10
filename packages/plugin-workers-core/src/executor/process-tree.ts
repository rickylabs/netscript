const MAX_TREE_PROCESSES = 4096;
const MAX_PID_LIST_BYTES = 65536;
const decoder = new TextDecoder();

/** Stop an owned child and its descendants without changing signal inheritance. */
export async function terminateProcessTree(child: Deno.ChildProcess): Promise<void> {
  if (Deno.build.os === 'windows') {
    try {
      await new Deno.Command('taskkill', {
        args: ['/PID', String(child.pid), '/T', '/F'],
        stdout: 'null',
        stderr: 'null',
      }).output();
    } catch { /* The owned tree may already have exited. */ }
  } else {
    // Snapshot parent-child ownership while parents are still alive. Killing
    // leaves first avoids losing that evidence when children are reparented.
    const descendants: number[] = [];
    const visited = new Set([child.pid]);
    for (const pid of visited) {
      for (const descendant of await childPids(pid)) {
        if (visited.size >= MAX_TREE_PROCESSES) break;
        if (!visited.has(descendant)) {
          visited.add(descendant);
          descendants.push(descendant);
        }
      }
    }
    for (const pid of descendants.reverse()) {
      try {
        Deno.kill(pid, 'SIGKILL');
      } catch { /* Already exited. */ }
    }
  }
  try {
    child.kill('SIGKILL');
  } catch { /* Already exited. */ }
}

async function childPids(pid: number): Promise<readonly number[]> {
  if (Deno.build.os === 'linux') {
    const children = new Set<number>();
    try {
      let threads = 0;
      for await (const thread of Deno.readDir(`/proc/${pid}/task`)) {
        if (++threads > MAX_TREE_PROCESSES) break;
        let file: Deno.FsFile | undefined;
        try {
          file = await Deno.open(`/proc/${pid}/task/${thread.name}/children`);
          for (const child of await readPidList(file.readable)) {
            if (children.size >= MAX_TREE_PROCESSES) break;
            children.add(child);
          }
        } catch {
          /* A thread may exit while its child list is being read. */
        } finally {
          try {
            file?.close();
          } catch { /* Stream cancellation closed it. */ }
        }
        if (children.size >= MAX_TREE_PROCESSES) break;
      }
    } catch { /* The parent may already have exited. */ }
    return [...children];
  }
  // macOS/BSD expose parent ownership through pgrep rather than Linux procfs.
  let query: Deno.ChildProcess | undefined;
  try {
    query = new Deno.Command('pgrep', {
      args: ['-P', String(pid)],
      stdout: 'piped',
      stderr: 'null',
    }).spawn();
    const children = await readPidList(query.stdout);
    await query.status;
    return children;
  } catch {
    return [];
  } finally {
    try {
      query?.kill('SIGKILL');
    } catch { /* Already exited. */ }
    if (query) await query.status;
  }
}

async function readPidList(stream: ReadableStream<Uint8Array>): Promise<number[]> {
  const reader = stream.getReader();
  let text = '';
  let size = 0;
  try {
    while (size < MAX_PID_LIST_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      const remaining = MAX_PID_LIST_BYTES - size;
      text += decoder.decode(value.subarray(0, remaining));
      size += value.length;
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  // If the byte budget cut a PID, omit that partial token rather than kill it.
  if (size >= MAX_PID_LIST_BYTES) text = text.slice(0, text.search(/\S*$/));
  return text.trim().split(/\s+/).slice(0, MAX_TREE_PROCESSES)
    .map(Number).filter((pid) => Number.isSafeInteger(pid) && pid > 0);
}
