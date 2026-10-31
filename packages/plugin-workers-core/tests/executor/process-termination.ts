/** Poll an owned Linux PID until reaped or zombie, propagating unexpected read errors. */
export async function terminated(pid: number): Promise<boolean> {
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      const stat = await Deno.readTextFile(`/proc/${pid}/stat`);
      if (stat.slice(stat.lastIndexOf(')') + 2).split(' ')[0] === 'Z') return true;
    } catch (error) {
      // Linux can report ESRCH when a task disappears during the stat read.
      // Deno exposes it as an Error rather than a dedicated errors class.
      if (
        error instanceof Deno.errors.NotFound ||
        (error instanceof Error && error.message.startsWith('No such process (os error 3)'))
      ) return true;
      throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  return false;
}
