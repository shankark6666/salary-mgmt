# Architecture

How the system fits together, from the browser down to the database. The *why* behind each
choice lives in the [ADRs](adr/); this page is the map.

## 1. Runtime view

```mermaid
flowchart LR
    hr["HR Manager / Analyst<br/>(browser)"]

    subgraph release["compose.release.yml — one host"]
        direction LR
        ui["frontend<br/>Next.js 16 standalone<br/>:3000 (only published port)"]
        api["backend<br/>Spring Boot 4.1 · Java 21<br/>:8080 (internal)"]
        db[("postgres 16<br/>(internal, volume)")]
    end

    hr -- "HTTPS · session cookie<br/>HttpOnly · Secure · SameSite=Strict" --> ui
    ui -- "pages: nonce CSP, auth redirect (proxy.ts)" --> ui
    ui -- "/api/* proxied, same origin" --> api
    api -- "JDBC · Flyway migrations" --> db
```

- The browser only ever talks to **one origin**. Next.js serves the pages and forwards `/api/*`
  to Spring Boot, so cookies stay first-party and the API needs no CORS policy at all
  ([ADR-0006](adr/0006-session-authentication.md)).
- Only the UI port is published. The API and database are reachable solely inside the compose
  network; every container runs as a non-root user on a read-only filesystem with all Linux
  capabilities dropped.

## 2. Backend modules

A Maven modular monolith, structured like Craveo but sized for this problem
([ADR-0001](adr/0001-modular-monolith-hexagonal.md), [ADR-0004](adr/0004-what-we-left-out-from-craveo.md)).

```mermaid
flowchart TB
    app["salary-app<br/>launcher · config · Flyway migrations · seeder<br/>CurrentActor adapter (security → audit)"]
    identity["salary-identity<br/>accounts · lockout · sign-in<br/>HTTP security policy"]
    employee["salary-employee<br/>directory · hire/edit · salary changes<br/>history · CSV export · audit log"]
    insights["salary-insights<br/>pay by country/role · distribution<br/>outliers (read-only SQL)"]
    common["salary-common<br/>ApiResponse envelope · exceptions<br/>GlobalExceptionHandler"]

    app --> identity & employee & insights
    identity --> common
    employee --> common
    insights --> common
```

Arrows are the only allowed dependencies; business modules never depend on each other (see the
rules below).

Inside each business module, ports and adapters keep the rules framework-free:

```mermaid
flowchart LR
    web["adapter.in.web<br/>controllers · DTOs · validation"]
    portin["application.port.in<br/>use-case interfaces"]
    svc["application.service<br/>orchestration · transactions"]
    domain["domain<br/>Employee · SalaryChange<br/>(plain Java)"]
    portout["application.port.out<br/>repositories · read model · audit"]
    infra["infrastructure.persistence<br/>JPA (writes) · SQL (reads)"]

    web --> portin --> svc
    svc --> domain
    svc --> portout
    infra -. implements .-> portout
```

| Rule | Enforced by |
|---|---|
| `domain` imports no Spring, JPA or Hibernate | `ArchitectureTest` |
| `application` never sees adapters or infrastructure | `ArchitectureTest` |
| Controllers never reach persistence | `ArchitectureTest` |
| Business modules never import Spring Security; they ask `CurrentActor` | `ArchitectureTest` |
| `employee` and `insights` never import each other | `ArchitectureTest` |

## 3. Writes and reads take different paths

[ADR-0005](adr/0005-separate-read-and-write-paths.md): writes go through the domain model and JPA,
reads are one hand-written SQL query per screen.

```mermaid
sequenceDiagram
    autonumber
    participant B as Browser
    participant P as Next.js proxy
    participant S as Spring Security
    participant C as EmployeeCommandService
    participant E as Employee (domain)
    participant D as Postgres

    B->>P: POST /api/v1/employees/7/salary-changes<br/>cookie + X-XSRF-TOKEN, {version, newSalary, date, reason}
    P->>S: forwarded (same origin)
    S->>S: session valid? role HR_MANAGER? CSRF token matches?
    S->>C: changeSalary(7, command)
    C->>D: load employee (JPA, @Version)
    C->>C: version the user saw == current? else 409
    C->>E: changeSalary(amount, date, reason, today, latest change)
    E-->>C: SalaryChange (or BusinessRuleException → 422)
    C->>D: UPDATE employees … WHERE version = ? (optimistic lock)
    C->>D: INSERT salary_history (…, changed_by = actor)
    C->>D: SELECT view (read model: joins + USD conversion)
    C-->>B: 200 EmployeeView (new version)
```

## 4. Data model

```mermaid
erDiagram
    countries ||--|| fx_rates : "priced in"
    countries ||--o{ employees : employs
    departments ||--o{ employees : contains
    job_titles ||--o{ employees : holds
    employees ||--o{ salary_history : "append-only"

    countries {
        char code PK
        text name
        char currency_code FK
    }
    fx_rates {
        char currency_code PK
        numeric usd_rate
        date as_of
    }
    departments {
        smallint id PK
        text name
    }
    job_titles {
        smallint id PK
        text name
        smallint level
    }
    employees {
        bigint id PK
        text employee_code UK
        text email UK
        char country_code FK
        numeric salary "local currency, NUMERIC(14,2)"
        bool active
        bigint version "optimistic lock"
    }
    salary_history {
        bigint id PK
        bigint employee_id FK
        numeric previous_salary
        numeric new_salary
        date effective_date
        text reason
        text changed_by
    }
    app_users {
        bigint id PK
        text username UK
        text password_hash "bcrypt"
        text role
        int failed_attempts
        timestamptz locked_until
    }
    audit_events {
        bigint id PK
        text actor
        text action
        text details
        timestamptz occurred_at
    }
```

- Salaries are stored **in local currency**, exactly; USD is computed at query time from a
  reference rate table ([ADR-0003](adr/0003-currency-handling.md)).
- Country and hire date are fixed after hiring (changing country would silently change the
  salary's currency); salary changes only through `salary_history`.

## 5. Frontend

```mermaid
flowchart TB
    subgraph app["src/app (routes)"]
        login["(auth)/login"]
        emp["(app)/employees · /employees/[id]"]
        ins["(app)/insights · /countries · /roles · /outliers"]
    end
    subgraph modules["src/modules (feature slices)"]
        auth["auth"]
        employees["employees"]
        insightsM["insights"]
        reference["reference"]
    end
    shared["src/shared<br/>api client (CSRF, typed errors) · UI primitives · formatting · CSP"]
    proxy["src/proxy.ts<br/>nonce CSP · session redirect"]

    login --> auth
    emp --> employees
    ins --> insightsM
    employees & insightsM --> reference
    auth & employees & insightsM & reference --> shared
```

Each module follows Craveo's admin-app layout: `api/` (HTTP calls) → `hooks/` (TanStack Query)
→ `components/`, with `types/` and `lib/` (pure, unit-tested logic such as URL state, form
schemas and chart geometry).

## 6. Delivery pipeline

```mermaid
flowchart LR
    pr["Pull request"] --> ci
    subgraph ci["GitHub Actions"]
        be["backend<br/>mvn verify: 173 tests<br/>(Testcontainers Postgres)"]
        fe["frontend<br/>audit · lint · 87 tests · build"]
        img["containers<br/>build images · Trivy scan<br/>(HIGH/CRITICAL fail)"]
        cq["CodeQL<br/>(once repo is public)"]
    end
    ci --> merge["merge commit to main"]
    deps["Dependabot<br/>Maven · npm · Docker · Actions"] --> pr
```
