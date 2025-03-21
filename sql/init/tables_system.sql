CREATE SCHEMA IF NOT EXISTS sys;

CREATE TABLE sys.log(
    name VARCHAR NOT NULL,
    info JSONB NOT NULL,
    level VARCHAR NOT NULL,
    create_time TIMESTAMPTZ NOT NULL DEFAULT 'now()'
);
CREATE INDEX idx_sys_log_level_name_create_time ON sys.log(level, name, create_time);
CREATE INDEX idx_sys_log_level ON sys.log(create_time);