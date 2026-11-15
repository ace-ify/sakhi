# Security Policy & Architecture

**Sakhi** handles sensitive elderly healthcare schedules, medication adherence, and caregiver communications. The system is designed with a defense-in-depth posture adhering to the **Digital Personal Data Protection (DPDP) Act 2023** and **OWASP Top 10** secure coding standards.

---

## 1. Security Architecture & Controls

| Security Control | Implementation Detail | Enforcing Code / Route |
| :--- | :--- | :--- |
| **Passcode Hashing & Constant-Time Auth** | Caregiver PINs are evaluated using `crypto.timingSafeEqual` over SHA-256 digests to eliminate character-by-character side-channel timing attacks. | `src/components/caregiver/caregiver-portal-modal.tsx`, `tests/security.test.mjs` |
| **Brute-Force & Rate Limiting Guard** | Authenticated endpoints and PIN dialogs enforce lockout policies after repeated failed attempts to thwart dictionary attacks. | `tests/security.test.mjs`, `src/lib/server-state.ts` |
| **DPDP Act 2023 Compliance & PII Minimization** | Patient health records are strictly bound to authenticated family circles. Notification payloads mask phone numbers and email addresses. | `tests/security.test.mjs`, `src/lib/family-state.ts` |
| **Input Sanitization & Injection Prevention** | All medicine names, instructions, doctor notes, and appointment data are sanitized and validated against rigid length and character boundaries. | `src/lib/family-state.ts`, `tests/health-state-validator.test.mjs` |
| **Look-Alike Sound-Alike (LASA) Drug Guard** | Sub-0.1ms Rust WASM / compiled engine cross-checks medication additions against FDA/ISMP high-risk confused drug pairs (e.g., Hydralazine vs Hydroxyzine). | `crates/lasa_engine/`, `src/app/api/safety/check/route.ts` |
| **AI Safety & Zero-Hallucination Guardrails** | Google Gemini 2.5 Flash operates strictly as an extraction and conversational assistant; clinical decisions are enforced by tested, deterministic code. Responses must conform to rigid JSON schemas. | `src/app/api/gemini/analyze-prescription/route.ts`, `tests/prescription-parser.test.mjs` |
| **Truthful Notification Accounting** | Reminders and escalations only report "Delivered" when an external provider (Resend/Twilio) returns an authenticated `200/202 Accepted` receipt. | `src/app/api/notify/route.ts`, `tests/notification-delivery.test.mjs` |
| **Protected Cron Execution** | Background reminder polling (`/api/reminders/run`) mandates a 32-byte shared bearer token (`x-cron-secret`) passed via HTTPS headers. | `src/app/api/reminders/run/route.ts`, `tests/reminder-events.test.mjs` |

---

## 2. DPDP Act 2023 Compliance

1. **Purpose Limitation**: Schedule and dose history are used solely for real-time patient reminders and caregiver visibility. Data is never repurposed, monetized, or shared with third-party tracking networks.
2. **Data Minimization**: Voice audio streams are processed in-memory via Web Speech or LiveKit WebRTC and never written to permanent disk storage.
3. **Right to Erasure**: Families can flush local demo schedules or purge Redis circle records with a single administrative action.

---

## 3. Vulnerability Reporting

If you discover a security vulnerability within this repository, please report it privately via GitHub Security Advisories or contact the maintainers directly. Do not open public issues for sensitive security defects.

