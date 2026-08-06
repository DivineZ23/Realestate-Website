# Imperial Estates

Imperial Estates is a production-oriented real-estate management monorepo. It combines a polished public property experience with a permission-aware internal workspace for agents and managers.

The application uses Angular 21 standalone components, ASP.NET Core 8, MongoDB, Discord OAuth2, HTTP-only JWT cookies, FluentValidation, Serilog, Swagger, Angular Material, Docker, xUnit, Vitest, and Playwright.

## What is included

- Public landing, available-property search, property detail, enquiry, and company pages.
- Discord sign-in with OAuth state verification, pending approval, revocation, and role enforcement.
- Manager-only user approval, promotion, demotion, revocation, restoration, and soft deletion.
- Manager-editable team cards published on the About page.
- Block, property, tenant, enquiry, status-history, audit-log, and upload workflows.
- Enforced property lifecycle: available → booked → occupied, controlled unavailability, and historical eviction.
- Server-side search, filters, sorting, and pagination backed by MongoDB indexes.
- Local image storage with a configurable Zipline implementation.
- Docker images, Atlas-ready configuration, unit tests, and browser tests.

## Architecture

```text
.
├── frontend/                          Angular standalone application
│   ├── src/app/core/                  Auth, guards, interceptors, models, API services
│   ├── src/app/shared/                Reusable UI and permission utilities
│   ├── src/app/layouts/               Public and dashboard shells
│   ├── src/app/features/              Route-level feature components
│   └── e2e/                           Playwright scenarios
├── backend/src/
│   ├── ImperialEstates.Domain/        Entities, enums, lifecycle invariants
│   ├── ImperialEstates.Application/   DTOs, validators, ports, use-case services
│   ├── ImperialEstates.Infrastructure MongoDB, Discord, JWT, storage, seed data
│   ├── ImperialEstates.Api/           Controllers, middleware, policies, composition
│   └── ImperialEstates.Tests/         Domain and service tests
├── docs/                              Architecture and operations references
├── docker-compose.yml
├── .env.example
└── ImperialEstates.sln
```

See [architecture.md](docs/architecture.md), [database-design.md](docs/database-design.md), and [authorization-matrix.md](docs/authorization-matrix.md) for the detailed design.

## Prerequisites

- Node.js compatible with Angular 21 (Node 20.19+, 22.12+, or 24+)
- pnpm 11+
- .NET 8 SDK
- A MongoDB Atlas cluster with database access and network access configured
- Docker with Compose, or the .NET and Node.js toolchains for direct execution
- A Discord application for employee sign-in

## Local setup

1. Copy `.env.example` to `.env` for Docker, and copy `backend/src/ImperialEstates.Api/appsettings.example.json` to `appsettings.Development.json` for direct local execution.
2. Configure the Atlas connection string and allow your current IP in Atlas Network Access.
3. Replace the JWT development key with at least 32 random bytes.
4. Configure the Discord values described below and leave seed data disabled.
5. Start the API:

```bash
dotnet restore ImperialEstates.sln --configfile NuGet.Config
dotnet run --project backend/src/ImperialEstates.Api
```

6. In another terminal, start Angular:

```bash
cd frontend
pnpm install --frozen-lockfile
pnpm start
```

Open `http://localhost:4200`. Swagger is available in development at `http://localhost:5080/swagger`.

## Docker setup

```bash
cp .env.example .env
docker compose config
docker compose up --build
```

The public application is served at `http://localhost:4200` and the API at `http://localhost:5080`. Both direct and Docker execution connect to MongoDB Atlas; Compose does not start a local MongoDB service.

## Discord OAuth setup

1. Create an application in the Discord Developer Portal.
2. Under OAuth2, add the redirect URI `http://localhost:5080/api/v1/auth/discord/callback`.
3. Configure `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, and `DISCORD_REDIRECT_URI` in `.env`, or their `Discord:*` equivalents in development settings/user secrets.
4. The API requests `identify email`. Email remains optional because Discord may not return it.
5. Never place the Discord secret in Angular or commit it to source control.

The Discord account whose immutable user ID matches `OWNER_DISCORD_USER_ID` is automatically maintained as the approved, active Owner. Other first-time sign-ins create pending Agent records that the Owner or a Manager can review. There are no password credentials because authentication is exclusively Discord OAuth.

## Seed data

Production and shared Atlas environments must keep `SEED_DATA=false`. Create real blocks, properties, tenants, and users through the application instead of loading development fixtures.

## Environment variables

| Variable | Purpose |
|---|---|
| `MONGODB_CONNECTION_STRING` | MongoDB connection string |
| `MONGODB_DATABASE` | Database name |
| `JWT_SIGNING_KEY` | 32+ byte JWT HMAC secret |
| `JWT_ISSUER`, `JWT_AUDIENCE` | Token validation boundaries |
| `DISCORD_CLIENT_ID` | Discord application ID |
| `DISCORD_CLIENT_SECRET` | Server-only Discord secret |
| `DISCORD_REDIRECT_URI` | Registered OAuth callback |
| `FRONTEND_URL` | Exact CORS origin and callback destination |
| `ZIPLINE_BASE_URL` | Optional Zipline origin |
| `ZIPLINE_API_TOKEN` | Optional server-only upload token |
| `SEED_DATA` | Enables development seeding |

ASP.NET Core also accepts hierarchical names such as `MongoDb__ConnectionString` and `Jwt__SigningKey`.

## Tests and builds

```bash
dotnet build ImperialEstates.sln --no-restore
dotnet test ImperialEstates.sln --no-build

cd frontend
pnpm build
pnpm test
pnpm e2e
```

Playwright starts the Angular development server automatically and mocks external API responses for the included public journeys. Full authenticated E2E should run against an isolated Mongo database and a Discord test application.

## Main routes

Public: `/`, `/properties`, `/properties/:id`, `/about`, `/pending-approval`, `/access-revoked`.

Internal: `/dashboard`, `/dashboard/properties`, `/dashboard/blocks`, `/dashboard/tenants`, `/dashboard/enquiries`, `/dashboard/profile`. Manager-only routes are `/dashboard/users`, `/dashboard/audit-logs`, and `/dashboard/settings`.

## Zipline

When both Zipline values are configured, uploads are sent through `ZiplineFileStorageService`. When either is absent, development uploads use `wwwroot/uploads`. Zipline deployments differ; adjust the endpoint/header mapping in that single adapter if your instance uses a different contract.

## Production notes

- Terminate TLS at the ingress so authentication cookies remain Secure.
- Use a managed MongoDB replica set so tenant assignment and eviction use transactions.
- Store secrets in the deployment platform, not JSON files.
- Restrict production Swagger, configure backups, scan uploaded media, and send structured logs to a durable sink.
- Serve the Angular image and API behind one trusted origin where possible.
- Run `docker compose config`, builds, tests, and vulnerability scanning in CI before deployment.
