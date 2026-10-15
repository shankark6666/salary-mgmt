-- Employees and their append-only salary history.

-- Trigram indexes make "contains" search (ILIKE '%term%') on name/email index-backed.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE employees (
    id              BIGINT        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    employee_code   VARCHAR(20)   NOT NULL UNIQUE,
    full_name       VARCHAR(200)  NOT NULL,
    email           VARCHAR(254)  NOT NULL,
    country_code    CHAR(2)       NOT NULL REFERENCES countries (code),
    department_id   SMALLINT      NOT NULL REFERENCES departments (id),
    job_title_id    SMALLINT      NOT NULL REFERENCES job_titles (id),
    employment_type VARCHAR(20)   NOT NULL
        CHECK (employment_type IN ('FULL_TIME', 'PART_TIME', 'CONTRACTOR')),
    hire_date       DATE          NOT NULL,
    -- Annual base salary in the country's currency (see countries.currency_code).
    -- Denormalised from salary_history so lists and aggregates never need a join to it.
    salary          NUMERIC(14,2) NOT NULL CHECK (salary > 0),
    active          BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    version         BIGINT        NOT NULL DEFAULT 0      -- optimistic locking
);

-- Emails are unique regardless of case: Jane.Doe@acme.com and jane.doe@acme.com are one person.
CREATE UNIQUE INDEX ux_employees_email_lower ON employees (lower(email));

-- Insight queries group by country, then role, over active employees.
CREATE INDEX ix_employees_country_title ON employees (country_code, job_title_id) WHERE active;
CREATE INDEX ix_employees_department    ON employees (department_id);
CREATE INDEX ix_employees_name_trgm     ON employees USING gin (full_name gin_trgm_ops);
CREATE INDEX ix_employees_email_trgm    ON employees USING gin (email gin_trgm_ops);

CREATE TABLE salary_history (
    id              BIGINT        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    employee_id     BIGINT        NOT NULL REFERENCES employees (id),
    previous_salary NUMERIC(14,2) CHECK (previous_salary > 0),   -- NULL for the starting salary
    new_salary      NUMERIC(14,2) NOT NULL CHECK (new_salary > 0),
    effective_date  DATE          NOT NULL,
    reason          VARCHAR(500)  NOT NULL,
    changed_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX ix_salary_history_employee ON salary_history (employee_id, effective_date DESC, id DESC);
