import { assertEquals } from '@std/assert';
import {
  defineWorkflow,
  WorkflowExecutor,
  MemoryWorkflowStateStore,
} from '@netscript/plugin-workers-core/workflow';
import type { TaskId } from '@netscript/plugin-workers-core/workflow';

Deno.test('WorkflowExecutor infrastructure-free testing and idempotent resume', async () => {
  const workflow = defineWorkflow('data-processing-pipeline')
    .taskStep('download', { taskId: 'download-file' as TaskId })
    .taskStep('transform', { taskId: 'transform-data' as TaskId })
    .build();

  const stateStore = new MemoryWorkflowStateStore();
  const executedSteps: string[] = [];
  let shouldFailTransform = true;

  // 1. Create a WorkflowExecutor with mock handlers for infrastructure-free testing
  const executor = new WorkflowExecutor({
    stateStore,
    runTaskStep: (step, _state) => {
      const taskId = step.taskId;
      executedSteps.push(taskId!);
      if (taskId === 'transform-data' && shouldFailTransform) {
        return Promise.reject(new Error('Transform step failed!'));
      }
      return Promise.resolve({ success: true });
    },
  });

  // 2. Execute the workflow (it will fail on the transform step)
  const firstRunState = await executor.execute(workflow, {
    executionId: 'pipeline-run-1',
  });

  assertEquals(firstRunState.status, 'failed');
  assertEquals(firstRunState.currentStepIndex, 2); // Failed step is recorded, advancing cursor
  assertEquals(executedSteps, ['download-file', 'transform-data']);

  // 3. Reset the failure flag
  shouldFailTransform = false;
  executedSteps.length = 0; // Clear execution log

  // 4. Simulate operator intervention: reset failed step to replay/resume it
  const savedState = await stateStore.findState(workflow.id, 'pipeline-run-1');
  if (savedState) {
    const resultsCopy = { ...savedState.results };
    delete resultsCopy.transform; // Remove the failed step result

    await stateStore.saveState({
      ...savedState,
      status: 'pending',
      currentStepIndex: 1, // Set cursor back to the transform step index
      results: resultsCopy,
    });
  }

  // 5. Resume the workflow using the executor
  const resumedState = await executor.execute(workflow, {
    executionId: 'pipeline-run-1',
  });

  assertEquals(resumedState.status, 'completed');
  assertEquals(resumedState.currentStepIndex, 2); // Completed all 2 steps
  
  // Idempotency check: "download" step is skipped on resume, only "transform" is run
  assertEquals(executedSteps, ['transform-data']);
});
