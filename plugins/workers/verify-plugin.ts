/**
 * Workers Plugin Verification Script
 *
 * Quick verification script to test that the workers plugin is functioning correctly.
 * Run with: deno run --allow-net plugins/workers/verify-plugin.ts
 *
 * Or from root: deno run --allow-net plugins/workers/verify-plugin.ts
 *
 * @module
 */

const API_BASE = Deno.env.get('WORKERS_API_URL') ?? 'http://localhost:8091';

console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('  Workers Plugin Verification');
console.log(`  API: ${API_BASE}`);
console.log('═══════════════════════════════════════════════════════════════');
console.log('');

async function verify() {
  try {
    // 1. Health Check
    console.log('1️⃣  Checking health...');
    const healthRes = await fetch(`${API_BASE}/health`);
    if (!healthRes.ok) {
      console.log('   ❌ Health check failed - is the service running?');
      console.log(`   Try: deno task workers:dev`);
      Deno.exit(1);
    }
    const health = await healthRes.json();
    console.log(`   ✅ Service healthy: ${health.status}`);
    console.log('');

    // 2. List Jobs
    console.log('2️⃣  Listing registered jobs...');
    const jobsRes = await fetch(`${API_BASE}/api/v1/workers/jobs`);
    const jobsData = await jobsRes.json();
    if (!jobsData.success) {
      console.log(`   ❌ Failed to list jobs: ${jobsData.error}`);
    } else {
      console.log(`   ✅ Found ${jobsData.data.total} jobs:`);
      for (const job of jobsData.data.jobs) {
        const schedule = job.schedule ? `[${job.schedule}]` : '[on-demand]';
        const status = job.enabled ? '🟢' : '🔴';
        console.log(`      ${status} ${job.id}: ${job.name} ${schedule}`);
      }
      if (jobsData.data.total === 0) {
        console.log('      (no jobs registered yet)');
      }
    }
    console.log('');

    // 3. List Tasks
    console.log('3️⃣  Listing registered tasks...');
    const tasksRes = await fetch(`${API_BASE}/api/v1/workers/tasks`);
    const tasksData = await tasksRes.json();
    if (!tasksData.success) {
      console.log(`   ❌ Failed to list tasks: ${tasksData.error}`);
    } else {
      console.log(`   ✅ Found ${tasksData.data.total} tasks:`);
      for (const task of tasksData.data.tasks) {
        console.log(`      📋 ${task.id}: ${task.name} [${task.type}]`);
      }
      if (tasksData.data.total === 0) {
        console.log('      (no tasks registered yet)');
      }
    }
    console.log('');

    // 4. List Executions
    console.log('4️⃣  Listing recent executions...');
    const execRes = await fetch(`${API_BASE}/api/v1/workers/executions?limit=5`);
    const execData = await execRes.json();
    if (!execData.success) {
      console.log(`   ❌ Failed to list executions: ${execData.error}`);
    } else {
      console.log(`   ✅ Found ${execData.data.total} recent executions:`);
      for (const exec of execData.data.executions) {
        const statusIcon = exec.status === 'completed'
          ? '✅'
          : exec.status === 'running'
          ? '🔄'
          : exec.status === 'failed'
          ? '❌'
          : exec.status === 'pending'
          ? '⏳'
          : '❓';
        console.log(`      ${statusIcon} ${exec.jobId} - ${exec.status} (${exec.triggeredBy})`);
      }
      if (execData.data.total === 0) {
        console.log('      (no executions yet)');
      }
    }
    console.log('');

    // 6. Seed Demo Data (optional)
    const seedArg = Deno.args.includes('--seed');
    if (seedArg) {
      console.log('5️⃣  Seeding demo data...');
      const seedRes = await fetch(`${API_BASE}/api/v1/workers/seed`, { method: 'POST' });
      const seedData = await seedRes.json();
      if (!seedData.success) {
        console.log(`   ❌ Failed to seed: ${seedData.error}`);
      } else {
        console.log(`   ✅ ${seedData.data.message}`);
        if (seedData.data.jobsCreated.length > 0) {
          console.log(`      Jobs: ${seedData.data.jobsCreated.join(', ')}`);
        }
        if (seedData.data.tasksCreated.length > 0) {
          console.log(`      Tasks: ${seedData.data.tasksCreated.join(', ')}`);
        }
      }
      console.log('');
    }

    // Summary
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  ✅ Verification Complete!');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('  Available commands:');
    console.log('');
    console.log('  # List jobs');
    console.log(`  curl ${API_BASE}/api/v1/workers/jobs`);
    console.log('');
    console.log('  # Seed demo data');
    console.log(`  curl -X POST ${API_BASE}/api/v1/workers/seed`);
    console.log('');
    console.log('  # Trigger a job');
    console.log(`  curl -X POST ${API_BASE}/api/v1/workers/jobs/<job-id>/trigger`);
    console.log('');
    console.log('  # Watch executions via SSE');
    console.log(`  curl -N ${API_BASE}/api/v1/workers/subscribe`);
    console.log('');

    if (!seedArg && jobsData.data.total === 0) {
      console.log('  💡 Tip: Run with --seed to create demo jobs:');
      console.log('     deno run --allow-net plugins/workers/verify-plugin.ts --seed');
      console.log('');
    }
  } catch (error) {
    console.log('');
    console.log('❌ Verification failed:');
    console.log(`   ${error instanceof Error ? error.message : error}`);
    console.log('');
    console.log('   Make sure the Workers API is running:');
    console.log('   - Via Aspire: deno task dev');
    console.log('   - Standalone: cd plugins/workers && deno task dev');
    console.log('');
    Deno.exit(1);
  }
}

await verify();
