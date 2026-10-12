# OU Escape Route authentication service

This is a standalone backend scaffold for the requested login methods. It is **not yet connected to the compiled Android/web client** and will not become live merely by committing these files.

## Supported API
- `POST /v1/auth/register` — create an account using email, username and password.
- `POST /v1/auth/login` — sign in with either email or username plus password.
- `POST /v1/auth/pin` — set/change a 6-digit PIN for the currently authenticated account (Bearer token required).
- `POST /v1/auth/login-pin` — sign in using email or username plus the saved 6-digit PIN.
- `GET /v1/auth/me` — verify the bearer token.
- `GET /health` — health/configuration check.

Passwords and PINs are stored as bcrypt hashes, never as plaintext. PINs are 6 digits to discourage trivially short PINs. Access tokens expire after 12 hours.

## Configure and run
1. Provision a PostgreSQL database on a trusted host.
2. Run `schema.sql` against that database.
3. Copy `.env.example` to `.env` and set `DATABASE_URL`, a random `JWT_SECRET` of at least 32 characters, and the allowed `APP_ORIGIN`.
4. Run `npm install`, then `npm start`.
5. Verify `GET /health` reports `configured: true`.

Do not commit real credentials or a populated `.env`. Use HTTPS in production. Before public deployment, replace the in-memory rate limiter with a shared store, configure trusted proxy/IP handling, add email verification/password reset and monitoring, and review the deployment's database TLS requirements.

## Integration status
The repository's existing application archive contains compiled client assets and no original editable React/server source. The currently bundled login calls a different hosted endpoint. This service therefore needs a deployment URL and a client rebuild/integration change before any of these methods can be used in the Android app. The scaffold intentionally does not pretend the current APK has these features.
