-- Reference data the HR Manager filters and groups by.
-- Small, slow-changing tables: seeded here so every environment starts identical.

CREATE TABLE countries (
    code          CHAR(2)      PRIMARY KEY,           -- ISO 3166-1 alpha-2
    name          VARCHAR(100) NOT NULL UNIQUE,
    currency_code CHAR(3)      NOT NULL               -- ISO 4217; one currency per country (ADR-0003)
);

-- Reference rates for cross-country comparison only. Salaries are never stored converted.
CREATE TABLE fx_rates (
    currency_code CHAR(3)       PRIMARY KEY,
    usd_rate      NUMERIC(18,8) NOT NULL CHECK (usd_rate > 0),  -- USD value of 1 unit of currency
    as_of         DATE          NOT NULL
);

ALTER TABLE countries
    ADD CONSTRAINT fk_countries_currency FOREIGN KEY (currency_code) REFERENCES fx_rates (currency_code);

CREATE TABLE departments (
    id   SMALLINT     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE job_titles (
    id    SMALLINT     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name  VARCHAR(100) NOT NULL UNIQUE,
    level SMALLINT     NOT NULL CHECK (level BETWEEN 1 AND 6)  -- seniority, for ordering and bands
);

INSERT INTO fx_rates (currency_code, usd_rate, as_of) VALUES
    ('USD', 1.00000000, DATE '2026-10-01'),
    ('GBP', 1.27000000, DATE '2026-10-01'),
    ('EUR', 1.08000000, DATE '2026-10-01'),
    ('INR', 0.01200000, DATE '2026-10-01'),
    ('CAD', 0.73000000, DATE '2026-10-01'),
    ('AUD', 0.66000000, DATE '2026-10-01'),
    ('SGD', 0.74000000, DATE '2026-10-01'),
    ('BRL', 0.18000000, DATE '2026-10-01');

INSERT INTO countries (code, name, currency_code) VALUES
    ('US', 'United States',  'USD'),
    ('GB', 'United Kingdom', 'GBP'),
    ('DE', 'Germany',        'EUR'),
    ('FR', 'France',         'EUR'),
    ('IN', 'India',          'INR'),
    ('CA', 'Canada',         'CAD'),
    ('AU', 'Australia',      'AUD'),
    ('SG', 'Singapore',      'SGD'),
    ('BR', 'Brazil',         'BRL');

INSERT INTO departments (name) VALUES
    ('Engineering'), ('Product'), ('Design'), ('Data'), ('Sales'), ('Marketing'),
    ('Customer Support'), ('Finance'), ('People'), ('Legal'), ('Operations');

INSERT INTO job_titles (name, level) VALUES
    ('Associate',           1),
    ('Specialist',          2),
    ('Senior Specialist',   3),
    ('Software Engineer',   2),
    ('Senior Software Engineer', 3),
    ('Staff Engineer',      4),
    ('Principal Engineer',  5),
    ('Product Manager',     3),
    ('Senior Product Manager', 4),
    ('Designer',            2),
    ('Senior Designer',     3),
    ('Data Analyst',        2),
    ('Data Scientist',      3),
    ('Account Executive',   2),
    ('Sales Manager',       4),
    ('Manager',             4),
    ('Senior Manager',      5),
    ('Director',            6);
