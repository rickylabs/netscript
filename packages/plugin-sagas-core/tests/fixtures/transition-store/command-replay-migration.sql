-- Reviewed incremental addition to hosts with the native saga runtime tables.
-- Apply through host migration tooling before selecting the atomic adapter.
CREATE TABLE saga_runtime_command_applied_key (
 instance_id varchar(200) NOT NULL, key_hash varchar(64) NOT NULL,
 created_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(instance_id,key_hash), CHECK (key_hash ~ '^[0-9a-f]{64}$')
);
