-- Applied after Prisma adds SagaInstance.status, before the upgraded runtime starts.
-- Keep the legacy reader's precedence; never descend into v2 business state.
UPDATE saga_instances
SET status = CASE
  WHEN CAST(state ->> 'projectionVersion' AS TEXT) = '2'
    AND state ->> 'status' IN ('pending', 'running', 'completed', 'failed', 'compensating', 'compensated', 'cancelled')
    THEN state ->> 'status'
  WHEN is_completed THEN 'completed'
  WHEN state ->> 'status' IN ('pending', 'running', 'completed', 'failed', 'compensating', 'compensated', 'cancelled')
    THEN state ->> 'status'
  ELSE 'running'
END;

-- PostgreSQL constraint: new lifecycle values require a new immutable sidecar.
DO $netscript$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_constraint WHERE conrelid = 'saga_instances'::regclass AND conname = 'saga_instances_status_check') THEN
    ALTER TABLE saga_instances ADD CONSTRAINT saga_instances_status_check
      CHECK (status IN ('pending', 'running', 'completed', 'failed', 'compensating', 'compensated', 'cancelled'));
  END IF;
END
$netscript$;
