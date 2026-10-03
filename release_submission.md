# Release Submission
Release: R1
Team: TO COMPLETE
Deployment: TO COMPLETE — existing service candidate https://immxrsive-platform.onrender.com/talent; new build has not been deployed by this chat.
Repository: https://github.com/Plathiya24/immxrsive-platform
Release tag: R1-submission — pending verified deployment and release freeze
Commit: TO COMPLETE after review and commit
Adapter: evaluation_adapter.json
Known issues: Synthetic external evidence may be unavailable (P07 is intentionally broken). Intake is a simulation, saves records, and sends no email. Production PostgreSQL and deployed browser checks remain pending.
Test notes: Run npm test from backend. See QA_CHECKLIST.md.
Test accounts: None; Release 1 is public.

## Release notes
Replaced the Phase 0 items demo with searchable talent directory, structured skill/availability/status filters, public profile pages, shared project evidence, contributor roles, contextual intake, mobile layout, and keyboard-accessible controls.

## Technology and deployment summary
Express 5 serves a plain HTML/CSS/JavaScript frontend and JSON API. PostgreSQL is used when DATABASE_URL is configured; local development uses Node's built-in SQLite with persistent storage. Fixtures seed records once; the API reads the database. Queries use bound parameters. Inquiry context is reconstructed on the backend and inquiries persist privately. Node 22.13+ is required; Node 24 is recommended. Deployment can reuse the existing Render backend with root backend, build npm ci, start npm start, persistent PostgreSQL, and PUBLIC_ORIGIN set to its HTTPS URL. No employer login or external runtime is needed. Current Chromium, Firefox and Safari are intended; browser verification is recorded separately.

## Company intake configuration
Simulated form: /inquiry?source_type=student&source_id=S01 or /inquiry?source_type=project&source_id=P01.
Context fields: source_type, source_id, source_name, source_url.
Employer fields: company_name, contact_name, contact_email, description.
Submitted records are stored in inquiries; there is no email delivery.

## Remaining release evidence
Fill the final deployment URL, team identifier, frozen commit and release tag after deployment. Follow the Student Course Operations Handbook before freezing a release or making changes during peer QA.
