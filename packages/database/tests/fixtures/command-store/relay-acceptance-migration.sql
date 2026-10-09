-- Apply through the consumer migration workflow to the previous C3 schema. Never runtime DDL.
ALTER TABLE netscript_command_outbox ADD COLUMN acceptance_identity varchar(256), ADD COLUMN accepted_at timestamptz(3), ADD CONSTRAINT command_outbox_acceptance CHECK ((acceptance_identity IS NULL) = (accepted_at IS NULL));
