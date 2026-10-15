-- People who can sign in. Passwords are stored only as adaptive hashes (bcrypt via Spring
-- Security's DelegatingPasswordEncoder, prefixed e.g. "{bcrypt}").
CREATE TABLE app_users (
    id              BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username        VARCHAR(100) NOT NULL,
    display_name    VARCHAR(200) NOT NULL,
    password_hash   VARCHAR(200) NOT NULL,
    role            VARCHAR(20)  NOT NULL CHECK (role IN ('HR_MANAGER', 'HR_ANALYST')),
    enabled         BOOLEAN      NOT NULL DEFAULT TRUE,
    failed_attempts INT          NOT NULL DEFAULT 0 CHECK (failed_attempts >= 0),
    locked_until    TIMESTAMPTZ,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX ux_app_users_username_lower ON app_users (lower(username));

-- Who made each salary change. Rows that predate sign-in came from the data import.
ALTER TABLE salary_history ADD COLUMN changed_by VARCHAR(100) NOT NULL DEFAULT 'data-import';
