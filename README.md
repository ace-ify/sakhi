This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The Next.js frontend and API routes can run together on Vercel; Cloud Run is not required. Add the server-side variables from `.env.example` in **Vercel → Project → Settings → Environment Variables**. Never prefix provider secrets with `NEXT_PUBLIC_`.

For prescription photos, set `GEMINI_API_KEY`. For email, set `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (a verified sender), and `CAREGIVER_EMAIL`. For outbound calls, set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, and `CAREGIVER_PHONE`. The API reports a provider **accepted** email or **queued** call; it does not claim the person received it.

For reminders when the app is closed:

1. Create an [Upstash Redis database](https://upstash.com/docs/redis/features/restapi) and set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in Vercel.
2. Set `FAMILY_PASSCODE=1234` to match the prototype caregiver gate. Set `APP_TIME_ZONE=Asia/Kolkata` (or the family's IANA time zone). Set `REMINDER_CRON_SECRET` to a long random value, for example from PowerShell: `[Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))`.
3. Deploy and unlock the caregiver portal once to sync the schedule. Check that it says **Shared schedule connected**. Add a real medicine or appointment; built-in tour examples do not trigger reminders.
4. Create an [Upstash QStash schedule](https://upstash.com/docs/qstash/features/schedules) every five minutes (`*/5 * * * *`) with destination `https://YOUR-VERCEL-DOMAIN/api/reminders/run?token=YOUR-REMINDER-CRON-SECRET`. The endpoint accepts QStash POST requests. Keep the URL private.
5. Check a test schedule and the response from the reminder endpoint. `delivered` counts provider-accepted emails and queued calls; `failures` lists channels requiring investigation.

QStash is used because [Vercel Hobby cron runs at most once daily](https://vercel.com/i/event-driven-architecture), which is too slow for dose reminders. The [QStash free allowance is 1,000 messages per day](https://upstash.com/pricing/qstash); a five-minute schedule uses 288 before retries.

This is a single-family hackathon prototype. The visible `1234` caregiver PIN and browser storage are not suitable for private health data in a public production deployment; add real user authentication, per-family server records, and consent before using it with real patients. Provider keys and the reminder secret stay server-side.

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
