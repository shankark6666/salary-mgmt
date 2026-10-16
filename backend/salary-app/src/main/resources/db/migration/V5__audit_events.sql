-- Security-relevant actions that are not already captured as data (salary changes live in
-- salary_history). First user: bulk exports, the one way the whole dataset leaves the system.
CREATE TABLE audit_events (
    id          BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    actor       VARCHAR(100) NOT NULL,
    action      VARCHAR(50)  NOT NULL,
    details     VARCHAR(1000) NOT NULL,
    occurred_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX ix_audit_events_occurred ON audit_events (occurred_at DESC);
