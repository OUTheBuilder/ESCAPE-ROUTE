# Deploying the OU Escape Route authentication service

The auth service can be deployed independently from the Android/web client. Do not merge the feature branch into `main` merely to deploy it; deploy the feature branch if your host supports selecting a branch.

## Required resources

- A Node/Docker web service host with HTTPS.
- A PostgreSQL database.
- The repository branch containing `auth-service/`.

## Service configuration

Configure the host to build the Dockerfile at `auth-service/Dockerfile` with `auth-service/` as the Docker build context. The container listens on the port supplied through `PORT` (default 8080).

Set these environment variables in the hosting dashboard, not in Git:

- `NODE_ENV=production`
- `DATABASE_URL`: the provider's PostgreSQL connection string.
- `JWT_SECRET`: a cryptographically random secret with at least 32 characters. Use the host's secret generator.
- `APP_ORIGIN`: the exact HTTPS origin(s) allowed to call the API from a browser. Separate multiple origins with commas. Do not use `*` for credentialed browser access.
- `BCRYPT_ROUNDS=12` (optional).

Do not put production secrets in this repository or in a client-side app.

## Initialize the database

Run the contents of `schema.sql` against the PostgreSQL database using the provider's SQL console or a secure database client. Do this once per database. Do not expose the database publicly unless required and properly secured.

## Verify the deployment

1. Open `https://YOUR-SERVICE-HOST/health`.
2. Confirm the response includes `"ok": true` and `"configured": true`.
3. If it says `configured: false`, check `DATABASE_URL` and `JWT_SECRET` in the hosting dashboard and restart/redeploy.
4. Keep registration and login unavailable to real users until the service is HTTPS-only and the database, secret, allowed origins, logs, and rate limiting have been reviewed.

## Important client integration limitation

The repository's app archive contains compiled client assets, not the original editable app source. The current client uses a different hosted login/session endpoint, while this service issues bearer tokens. Deploying this backend alone will **not** add the three login choices to the app. Client code must be integrated with this API and its token/session lifecycle, then rebuilt and tested end to end.

Before public use, replace the in-memory rate limiter with a shared store and complete production security review, account recovery/verification, monitoring, and privacy requirements.
