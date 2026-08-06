# Deployment

Build the Angular static bundle and ASP.NET API image using the supplied Dockerfiles. MongoDB should be a managed replica set in production. Place the frontend and API behind TLS and preferably the same origin.

Before release:

1. Supply all secrets through the deployment platform.
2. Register the exact production Discord callback URL.
3. Set the exact frontend CORS origin.
4. Use a 32+ byte random JWT signing key and rotate it deliberately.
5. Configure durable uploads or the site-specific Zipline contract.
6. Run backend build/tests, frontend build/tests, Playwright, `docker compose config`, image scanning, and dependency auditing.
7. Disable seed data and restrict Swagger.
8. Configure MongoDB backups, alerting, and log retention.

The API exposes `/health` for basic process health. Add authenticated dependency health checks at the platform level if your environment requires them.
