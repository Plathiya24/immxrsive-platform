# Release Submission

Release: R1
Team: team-03
Deployment: https://immxrsive-platform-r7xi.onrender.com/talent
Repository: https://github.com/Plathiya24/immxrsive-platform
Release tag: R1-submission — pending creation and release freeze
Commit: cd850281df994a9b8456e28203f778f477ad67bf (deployed and tested implementation; final assessed commit must be confirmed after documentation updates)
Adapter: evaluation_adapter.json
Known issues: Fixture external evidence links may be unavailable; P07 is intentionally broken. Company intake is a simulation that stores inquiries and sends no email.
Test notes: All 11 automated checks passed locally. Bikramjit confirmed the deployed mobile workflow at 390 × 844 CSS pixels and keyboard workflow passed, with no horizontal scrolling required, visible focus, correct project inquiry context, and successful synthetic inquiry submission. PostgreSQL connection setup was reported successful. Detailed scope and remaining checks are in QA_CHECKLIST.md.
Test accounts: None; Release 1 is public.

## Release notes

Replaced the Phase 0 items demo with a public talent directory, case-insensitive text search, standardized skill filters using AND, availability/status filters using OR within each category, clearable filters, student profiles, shared project pages, contributor roles, and contextual company intake. Unpublished profiles are excluded from discovery and public profile APIs. Direct profile/project routes support reloads; optional external evidence is isolated from the core workflow. The interface supports mobile layout, labeled controls, and visible keyboard focus.

## Technology and deployment summary

Express 5 serves the HTML/CSS/JavaScript frontend and JSON API from one origin. The deployed service is configured for PostgreSQL through DATABASE_URL; local development without that variable uses persistent SQLite. Fixtures seed a new database once, and application requests read persisted records. Database queries use bound parameters. The backend derives inquiry context from the canonical student or project and stores inquiries without a public listing endpoint.

Render deploys the main branch with root directory backend, build command npm ci, and start command npm start. Node 22.13+ is required; Node 24 is recommended. PUBLIC_ORIGIN should be https://immxrsive-platform-r7xi.onrender.com so saved source URLs match the public service. No employer login or browser XR runtime is required. The exact browser/version used for manual testing was not recorded; cross-browser compatibility is not independently verified.

## Company intake configuration

Student intake: https://immxrsive-platform-r7xi.onrender.com/inquiry?source_type=student&source_id=S01
Project intake: https://immxrsive-platform-r7xi.onrender.com/inquiry?source_type=project&source_id=P01

Context fields: source_type, source_id, source_name, source_url.
Employer fields: company_name, contact_name, contact_email, description.
Records are stored in the inquiries table. This is a simulated intake, with no email delivery.

## Remaining release evidence

Commit and push these documentation updates, deploy the resulting main commit, and confirm that deployment before choosing the final assessed commit. Repeat a smoke check and record the final commit in the submitted release evidence. Create and push R1-submission at that exact deployed commit, following the Student Course Operations Handbook. The commit above identifies the implementation actually tested; it must not be presented as a newer documentation commit. Assigned peer QA remains separate from Bikramjit's self-testing.
