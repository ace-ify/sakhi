# Deployment Guide: Sakhi

This guide provides reproducible instructions for deploying Sakhi to **Google Cloud Run** (hackathon top-10 requirement) as well as **Vercel** and **Render**.

---

## 1. Google Cloud Run (Container Deployment)

Sakhi includes a production-ready, multi-stage, non-root `Dockerfile` optimized for Google Cloud Run.

### Prerequisites:
- Google Cloud Project with Cloud Run & Artifact Registry APIs enabled:
  ```bash
  gcloud services enable run.googleapis.com artifactregistry.googleapis.com
  ```
- Authenticated `gcloud` CLI.

### Build and Deploy Command:
```bash
# 1. Set Google Cloud Project ID
PROJECT_ID="your-gcloud-project-id"
REGION="asia-south1" # Mumbai region for optimal Indic latency

# 2. Build container via Cloud Build
gcloud builds submit --tag gcr.io/${PROJECT_ID}/sakhi:latest

# 3. Deploy to Cloud Run
gcloud run deploy sakhi \
  --image gcr.io/${PROJECT_ID}/sakhi:latest \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars GEMINI_API_KEY="your-gemini-key",GROQ_API_KEY="your-groq-key"
```

---

## 2. Render Deployment

1. **Create Web Service**: Connect your GitHub repository `ace-ify/sakhi`.
2. **Environment**: `Node`
3. **Build Command**: `npm run build`
4. **Start Command**: `npm start`
5. **Environment Variables**:
   - `GEMINI_API_KEY`: Google Gemini API key
   - `GROQ_API_KEY`: Groq API key
   - `GNANI_API_KEY`, `GNANI_STT_MODEL`, `GNANI_TTS_MODEL` (Optional)
   - `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` (Optional)

---

## 3. Vercel Deployment

1. Import the repository in [Vercel](https://vercel.com).
2. Configure Environment Variables in Project Settings.
3. Deploy. Functions run globally on the Edge/Serverless runtime.

---

## 4. Health Check Verification

Verify the deployed instance responds properly:
```bash
curl -s https://<YOUR-DEPLOYED-URL>/api/safety/check?name=Hydralazine | jq .
```
Expected response:
```json
{
  "name": "Hydralazine",
  "hasCollision": true,
  "flaggedPair": "Hydroxyzine",
  "severity": "HIGH",
  "engine": "rust_wasm"
}
```

