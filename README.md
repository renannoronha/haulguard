# HaulGuard

This repository contains the HaulGuard API, background worker, and infrastructure needed to manage drivers, loads, and assignment events.

## Quick start

1. **Copy environment variables**
   ```bash
   cp .env.example .env
   ```
2. **Start infrastructure containers**
   ```bash
   docker-compose up -d
   ```
3. **Install Node.js dependencies** (from the repository root)
   ```bash
   npm install
   ```
4. **Run database migrations**
   ```bash
   npm run db:migrate
   ```
5. **Run the API in watch mode** (leave running in its own terminal)
   ```bash
   npm run start:dev
   ```
6. **Start the background worker** in a separate terminal so it can consume Pub/Sub messages and write audit events.
   ```bash
   npm run start:worker
   ```

After the API and worker are online you can exercise automated tests from the same terminal session.

## Services provided by `docker-compose`

| Service  | Purpose |
| --- | --- |
| **Postgres** | Primary relational database storing users, drivers, loads, and assignment records. |
| **Redis** | Cache layer used by the API to accelerate read-heavy endpoints such as `GET /loads`. |
| **Mongo** | Document database that stores audit logs and other event payloads produced by the worker. |
| **Pub/Sub emulator** | Local Google Cloud Pub/Sub emulator (with `pubsub` and `pubsub-init` containers) delivering assignment events to the worker. |

Use `docker-compose ps` to confirm the containers are healthy. When you are done working, shut them down with `docker-compose down`.

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
* Use `docker-compose logs -f <service>` to inspect infrastructure logs while debugging.
