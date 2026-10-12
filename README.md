# OU Escape Route — Independent ChatGPT Rebuild

This repository is the independent rebuild workspace for OU Escape Route. The rebuild must not depend on Floot runtime code or services.

## Current status

- A self-contained, responsive HTML starter has been generated separately as `OU-Escape-Route-ChatGPT-Rebuild-Starter.zip` in the ChatGPT conversation.
- The starter contains a provisional login chooser (email / username / PIN), overview, route-description form, contacts, checklist, saved notes, settings, and local browser persistence.
- These screens are provisional assumptions, not a verified clone of the original Floot app.

## Known blockers to exact parity

The original `https://escaperoute.floot.app` could not be fetched from the current session. The repository's prior file tree/source could not be retrieved either (README request returned 404). Therefore original screens, labels, feature behavior, API integrations, and stored data models are not verified.

## Next steps

1. Add the independently generated `index.html` from the starter ZIP to the repository root.
2. Inspect the original app through a reachable browser session or obtain screenshots/screen recording/source.
3. Replace provisional assumptions with verified screens and behavior.
4. Implement real server-side authentication and persistence before production use.
5. Add tests and independent hosting configuration.

## Safety and security

The starter's sign-in is demo-only and must not be used with real credentials. Its route diagram is illustrative; it does not provide GPS, live navigation, emergency dispatch, or authoritative safety guidance.
