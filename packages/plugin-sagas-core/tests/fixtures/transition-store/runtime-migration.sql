-- Reviewed setup fixture matching the shipped native saga runtime models.
CREATE TABLE saga_runtime_state (
 instance_id varchar(200) PRIMARY KEY, saga_id varchar(100) NOT NULL,
 version integer NOT NULL, envelope jsonb NOT NULL,
 created_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at timestamp(3) NOT NULL
);
CREATE TABLE saga_runtime_transition (
 instance_id varchar(200) NOT NULL, version integer NOT NULL, record jsonb NOT NULL,
 created_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(instance_id,version)
);
CREATE TABLE saga_runtime_correlation (
 id uuid PRIMARY KEY, saga_id varchar(100) NOT NULL, correlation_key varchar(200) NOT NULL,
 instance_id varchar(200) NOT NULL, created_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at timestamp(3) NOT NULL, UNIQUE(saga_id,correlation_key)
);
