# Resume issue 2401

Branch `orch/divybot-6541778987`; run is this directory. Goal: prevent shipped Aspire CLI polling leaks without upgrading 13.5.3. Primary defect is database compatibility operation-runner.ts's 1-second describe loop. Existing AspireCommandExecutor is the extension seam. Plan in plan.md; inventory/research in research.md. PLAN-EVAL required before source implementation. No runtime resources started. Coordinator owns labels, scaffold.runtime CI and merge. Final report must be atomic excluded-file handoff starting READY (or BLOCKED); never commit assignment/report files.
