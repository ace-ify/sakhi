# Deploy Sakhi

The hackathon top 10 condition in `abouthack/` requires a working **Google Cloud Run URL**. The current Render demo is useful for preview but does not meet that specific condition. Cloud Run's free tier still requires an active Google Cloud billing account.

## Environment

Set these in the hosting service's secret or environment settings. See `.env.example` for the complete list.

| Purpose | Variables |
| --- | --- |
| Family access and persistent shared state | `FAMILY_PASSCODE`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| Prescription scan and AI chat | `GEMINI_API_KEY` |
| Email reminders | `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CAREGIVER_EMAIL` |
| Outbound calls | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, `CAREGIVER_PHONE` |
| Background reminder execution | `REMINDER_CRON_SECRET`, optionally `APP_TIME_ZONE` |
| Optional voice session | `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` |

Use a long private `FAMILY_PASSCODE` and a separate random `REMINDER_CRON_SECRET`. Do not commit real values. Provider keys and phone numbers must be configured on the deployed backend. The reminder endpoint must be called by a scheduler with `x-cron-secret` set to `REMINDER_CRON_SECRET`; deploying alone does not create a scheduler.

## Cloud Run

1. Enable billing for a Google Cloud project and enable Cloud Run, Cloud Build, and Artifact Registry APIs.
2. Install and authenticate `gcloud`, then select the project: `gcloud config set project PROJECT_ID`.
3. From the repository root, run:

```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
gcloud run deploy sakhi --source . --region asia-south1 --allow-unauthenticated --port 8080
```

The repository `Dockerfile` builds the Next.js server. Add environment variables in Cloud Run's console or via Secret Manager, redeploy, then open the generated `run.app` URL and check the caregiver and prescription flows. Set up a scheduler separately for `/api/reminders/run` if reminders must run while nobody is visiting the site. Keep the family passcode private.

## Render

For the existing preview, use a Node web service with `npm ci && npm run build` as the build command and `npm start` as the start command. Add the environment variables above in Render's dashboard. A sleeping free service may delay the first request. Verify the URL and provider flows after deployment.

## Vercel

Import the repository, set the environment variables in Project Settings, and deploy. The server routes use the Node runtime. Configure a scheduled request for `/api/reminders/run` separately. Vercel deployment does not substitute for the Cloud Run link required by the hackathon.
