-- Prisma cannot represent CHECK constraints. Applied by the migration tooling, never at runtime.
-- Conditional installation also supports applications adopting the original command-store fixture.
DO $netscript$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_constraint WHERE conrelid = 'netscript_command_outbox'::regclass AND conname = 'netscript_command_outbox_attempt_count_check') THEN
    ALTER TABLE netscript_command_outbox ADD CONSTRAINT netscript_command_outbox_attempt_count_check CHECK (attempt_count >= 0);
  END IF;
  IF NOT EXISTS (SELECT FROM pg_constraint WHERE conrelid = 'netscript_command_outbox'::regclass AND conname = 'command_outbox_acceptance') THEN
    ALTER TABLE netscript_command_outbox ADD CONSTRAINT command_outbox_acceptance CHECK ((acceptance_identity IS NULL) = (accepted_at IS NULL));
  END IF;
  IF NOT EXISTS (SELECT FROM pg_constraint WHERE conrelid = 'netscript_command_outbox'::regclass AND conname = 'command_outbox_lease') THEN
    ALTER TABLE netscript_command_outbox ADD CONSTRAINT command_outbox_lease CHECK ((claim_token IS NULL) = (claim_until IS NULL));
  END IF;
END
$netscript$;
