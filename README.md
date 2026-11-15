# Sakhi — medication and care companion

Sakhi lets a caregiver manage an elder's medicines and appointments, record doses, scan prescriptions with Gemini, and send reminder emails or outbound calls when providers are configured. The interface supports Hindi and English speech where the browser supports Web Speech APIs.

Live demo: [sakhi-fh6o.onrender.com](https://sakhi-fh6o.onrender.com). Deployment and environment setup: [docs/DEPLOY.md](docs/DEPLOY.md).

## Main flows

| Flow | Implementation | Verification |
| --- | --- | --- |
| Family access and shared health state | `src/app/api/family-auth`, `src/app/api/family-state` | `tests/family-auth.test.mjs`, `tests/integration/api.test.mjs` |
| Medicine and appointment schedule | `src/lib/family-state.ts`, caregiver portal | `tests/health-state-validator.test.mjs`, `tests/e2e/caregiver.spec.mjs` |
| Dose and appointment reminder scheduling | `src/lib/reminder-events.ts`, reminder API | `tests/reminder-events.test.mjs`, API integration tests |
| Email and outbound call delivery | `src/lib/notification-delivery.ts`, notify API | `tests/notification-delivery.test.mjs`, API integration tests |
| Gemini prescription extraction | `src/app/api/gemini/analyze-prescription`, `src/lib/prescription-parser.ts` | `tests/prescription-parser.test.mjs` |
| Look-alike medicine name alert | `crates/lasa_engine`, `src/lib/lasa-check.ts`, safety API | Rust tests, `tests/lasa-check.test.mjs` |

Prescription output needs caregiver review before adding medicines. The look-alike checker covers known pairs; an absence of an alert does not establish medication safety. Provider delivery requires valid environment keys and recipient details. The live demo's provider delivery and Gemini calls must be verified with deployed credentials.

## Local checks

```bash
npm ci
npm run lint -- --max-warnings=0
npm test
npm run build
npm run test:api
npx playwright install chromium
npm run test:e2e
cargo test --manifest-path crates/lasa_engine/Cargo.toml --locked
```

The test suite imports production source modules, exercises production HTTP routes, and runs two browser journeys including an automated WCAG A/AA scan of the welcome screen. That scan covers the tested screen and automated rules only; it is not a claim of full WCAG conformance.

## Hackathon deployment

The hackathon screenshot in `abouthack/` says a working **Cloud Run deployed project link** is required for top 10 consideration. The Render demo alone does not satisfy that condition. `Dockerfile` and [docs/DEPLOY.md](docs/DEPLOY.md) prepare a Cloud Run deployment; a Google Cloud billing account is still needed even when usage stays inside the free tier.
