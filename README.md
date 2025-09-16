# HaulGuard

This repository contains a small Driver and Load Management API. It allows users to manage drivers, loads and assign loads to drivers under the rule that a driver can only have one active load at a time.

## Quick start

1. **Bootstrap environment files and dependencies, boot the infrastructure stack, run database migrations, start the API**
  Be sure to have docker daemon running before this step.
   ```bash
   cp .env.example .env
   npm run infra:up
   npm install
   npm run db:migrate
   npm run start:dev
   ```
2. **Start the background worker** (run in it's own terminal)
   ```bash
   npm run start:worker
   ```
3. **Run the smoke test script** once both processes are online to verify the API and Pub/Sub wiring
   ```bash
   ./scripts/test_endpoints.sh
   ```

After the API and worker are online you can exercise automated tests from the same terminal session.

## Key npm scripts

| Script | Purpose |
| --- | --- |
| `npm run start:dev` | Launch the REST API with live reload (default entry point).
| `npm run start:worker` | Boot the Pub/Sub consumer worker using the development entry file.
| `npm run start:prod` | Start the compiled API from `dist/main.js`.
| `npm run build` | Compile the project to the `dist` directory.
| `npm run db:migrate` | Apply pending TypeORM migrations using the configured Postgres database.
| `npm run test` | Execute the Jest unit test suite (uses the polyfilled environment).
| `npm run test:e2e` | Run the integration tests that spin up Nest modules with mocked infrastructure.
| `npm run infra:up` | Bring up the local infrastructure with `docker-compose up --build -d` and built-in healthchecks.
| `npm run infra:down` | Stop and remove the infrastructure containers when you are done.
| `npm run infra:logs` | Tail docker-compose logs for troubleshooting services.

## Critical environment variables

| Variable | Description |
| --- | --- |
| `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Connection details for the primary Postgres database.
| `REDIS_HOST`, `REDIS_PORT` | Redis configuration used by the cache module.
| `MONGO_URI`, `MONGO_DB` | Mongo connection information for audit event persistence.
| `PUBSUB_PROJECT_ID` | Google Cloud project (or emulator project) used by the Pub/Sub SDK.
| `PUBSUB_LOAD_ASSIGNED_TOPIC`, `PUBSUB_LOAD_ASSIGNED_SUBSCRIPTION` | Topic and subscription names exchanged between the API publisher and worker consumer.
| `PUBSUB_EMULATOR_HOST` | Optional emulator endpoint (set automatically by `docker-compose`).
| `JWT_SECRET` | Secret used to sign application JWTs.
| `BCRYPT_ROUNDS`, `BCRYPT_PEPPER` | Password hashing parameters required by the shared security module.

## Services provided by `docker-compose`

| Service  | Purpose |
| --- | --- |
| **Postgres** | Primary relational database storing users, drivers, loads, and assignment records. |
| **Redis** | Cache layer used by the API to accelerate read-heavy endpoints such as `GET /loads`. |
| **Mongo** | Document database that stores audit logs and other event payloads produced by the worker. |
| **Pub/Sub emulator** | Local Google Cloud Pub/Sub emulator (with `pubsub` and `pubsub-init` containers) delivering assignment events to the worker. |

Use `docker-compose ps` to confirm the containers are healthy. When you are done working, shut them down with `npm run infra:down` (or `docker-compose down`).

## Testing & verification

Run automated checks after the API and worker are online:

* **Unit tests**
  ```bash
  npm run test
  ```
* **End-to-end tests**
  ```bash
  npm run test:e2e
  ```
* **Endpoint smoke test script** (from the repository root)
  ```bash
  ./scripts/test_endpoints.sh
  ```
  The script creates sample data, exercises cached endpoints, and validates error handling against the running API.

## Additional tips

* The default `.env.example` contains development-friendly credentials; adjust as needed before bringing the stack online.
* If you modify dependencies or TypeORM migrations, restart the API and worker processes to pick up the changes.
* Use `npm run infra:logs` (or `docker-compose logs -f <service>`) to inspect infrastructure logs while debugging.
* Healthchecks baked into `docker-compose.yml` ensure Postgres, Redis, Mongo, and the Pub/Sub emulator are reachable before the API or worker start handling requests.
