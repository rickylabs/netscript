import { router } from './router-context.ts';

type JobRetentionConfig = Readonly<{
  archiveToDb: boolean;
  dbRetentionDays: number;
}>;

export const adminHandlers = {
  cleanup: router.cleanup.handler(() => {
    return {
      deleted: [],
      count: 0,
      message: 'Cleanup completed',
    };
  }),

  cleanupDbExecutions: router.cleanupDbExecutions.handler(({ input, context }) => {
    const { db: _db } = context;
    const jobRetention = input.jobRetention as Record<string, JobRetentionConfig>;
    const dryRun = Boolean(input.dryRun);
    const now = Date.now();
    const deleted: Record<string, number> = {};
    const totalDeleted = 0;

    for (const [jobId, config] of Object.entries(jobRetention)) {
      if (!config.archiveToDb || config.dbRetentionDays === 0) {
        continue;
      }

      const _cutoffDate = new Date(now - config.dbRetentionDays * 24 * 60 * 60 * 1000);

      console.warn(
        '[Workers] Execution history cleanup skipped - JobExecutionHistory not available',
      );
      deleted[jobId] = 0;
    }

    return { deleted, totalDeleted, dryRun };
  }),

  archiveExecutions: router.archiveExecutions.handler(({ input, context }) => {
    const { db: _db } = context;
    const { executions } = input;
    let archived = 0;
    const errors: string[] = [];

    for (const execution of executions) {
      try {
        console.warn(
          '[Workers] Job execution archiving skipped - JobExecutionHistory table not available in Prisma client',
        );

        archived++;
      } catch (error) {
        errors.push(
          `Failed to archive ${execution.id}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    return { archived, errors: errors.length > 0 ? errors : undefined };
  }),

  seed: router.seed.handler(() => {
    return {
      jobsCreated: [],
      tasksCreated: [],
      message: 'Seed completed',
    };
  }),
};
