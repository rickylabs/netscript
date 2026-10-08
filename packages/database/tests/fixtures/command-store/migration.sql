-- Consumer-owned reviewed migration; apply through the application's migration workflow.
CREATE TABLE project (id text PRIMARY KEY, version integer NOT NULL DEFAULT 0, name text NOT NULL);
CREATE TABLE netscript_command_receipt (
 id text PRIMARY KEY,
 scope varchar(256) NOT NULL,
 command_name varchar(128) NOT NULL,
 command_version integer NOT NULL CHECK (command_version > 0),
 key_hash varchar(64) NOT NULL CHECK (key_hash ~ '^[0-9a-f]{64}$'),
 request_hash varchar(64) NOT NULL CHECK (request_hash ~ '^[0-9a-f]{64}$'),
 actor_kind varchar(16) NOT NULL CHECK (actor_kind IN ('principal','system')),
 actor_subject varchar(256) NOT NULL,
 correlation_id varchar(256) NOT NULL,
 response_json text,
 created_at timestamptz(3) NOT NULL,
 completed_at timestamptz(3),
 CONSTRAINT command_receipt_complete CHECK ((response_json IS NULL) = (completed_at IS NULL)),
 CONSTRAINT command_receipt_identity UNIQUE (scope,command_name,key_hash)
);
CREATE TABLE netscript_command_audit (
 id text PRIMARY KEY, execution_id text NOT NULL, command_name text NOT NULL,
 command_version integer NOT NULL, action text NOT NULL, subject_type text NOT NULL,
 subject_id text NOT NULL, actor_kind text NOT NULL, actor_subject text NOT NULL,
 actor_scheme text, correlation_id text NOT NULL, data_json text, occurred_at timestamptz(3) NOT NULL
);
CREATE TABLE netscript_command_outbox (
 id text PRIMARY KEY, execution_id text NOT NULL, command_name text NOT NULL,
 command_version integer NOT NULL, destination text NOT NULL, topic text NOT NULL,
 payload_json text NOT NULL, dedupe_key text NOT NULL, correlation_id text NOT NULL,
 traceparent text, tracestate text, available_at timestamptz(3) NOT NULL,
 attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
 claim_token text, claim_until timestamptz(3), published_at timestamptz(3),
 terminal_at timestamptz(3), last_failure text,
 CONSTRAINT command_outbox_lease CHECK ((claim_token IS NULL) = (claim_until IS NULL))
);
CREATE INDEX command_outbox_due ON netscript_command_outbox(available_at);
