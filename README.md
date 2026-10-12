# OU Escape Route — Independent ChatGPT Rebuild

This repository contains an independent, self-contained web-app starter for OU Escape Route. It does not use the Floot runtime.

## Current implementation

- Responsive mobile-first interface.
- Demo sign-in chooser: email + password, username + password, or a 4–8 digit PIN.
- Overview, route-description form, contacts, checklist, saved notes, and settings.
- The route details, contacts, checklist, and notes are stored in the browser's local storage.
- No external JavaScript libraries are required.

## Deploying as a web app

A GitHub Actions workflow is included at `.github/workflows/deploy-pages.yml`. It deploys the repository root to GitHub Pages on pushes to `main` and via manual workflow dispatch.

1. Open the repository's **Settings → Pages**.
2. If asked for a publishing source, select **GitHub Actions**.
3. Open **Actions** and check the **Deploy OU Escape Route to GitHub Pages** workflow. Wait for a successful deployment.
4. GitHub will show the actual published URL in the workflow run and in **Settings → Pages**.

The public website could not be fetched during this build session, so the exact live URL is not yet confirmed. Do not assume deployment succeeded until the workflow completes successfully.

## Important limitations

This is a functional starter, **not a verified exact clone** of the Floot app. The original website and previous source tree could not be reliably inspected in this session, so the original screens, labels, rules, and integrations remain unverified.

- Sign-in is simulated in the browser. It is not secure authentication and must not be used with real passwords or PINs.
- Data is stored only in the current browser/device. It is not synchronized to a server or other devices.
- The route screen saves text only; it does not provide GPS, live maps, turn-by-turn navigation, emergency dispatch, or offline mapping.
- Use official local emergency guidance for real-world safety decisions.

## Next development stage

Once the original app can be inspected or its source/screenshots are available, compare every screen and flow and replace provisional assumptions with verified behavior. Add secure server-side authentication, durable storage, tests, and real route/map integrations only after requirements are confirmed.
