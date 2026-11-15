# Security notes

- Family API routes require a configured family access code. The production deployment should set a long, private code and keep it out of the repository.
- Shared health state and prescription data are validated at API boundaries. The Gemini parser accepts only expected fields and rejects malformed or oversized output.
- Reminder execution requires a separate cron secret. Notification APIs require family authorization and report provider acceptance or failure truthfully.
- Look-alike medicine alerts are limited to known pairs and are not clinical clearance. Caregivers must review extracted prescription details and follow clinician advice.
- Automated tests cover selected authorization and validation paths. They do not prove legal compliance, exhaustive security, or complete accessibility.

Report a security issue privately to the repository owner rather than opening a public issue containing patient data or credentials.
