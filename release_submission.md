# Release Submission — preparation copy, not yet frozen

Release: R2
Team: team-03
Project Option: Project 1 — ImmXrsive Talent and Industry Platform
Deployment: https://immxrsive-platform-r7xi.onrender.com
Repository: https://github.com/Plathiya24/immxrsive-platform
Release tag: R2-submission — not created until deployed workflow verification
Commit: Pending final deployed-commit verification; the final Moodle upload must contain the resolved full SHA.
Adapter: evaluation_adapter.json
Known issues: External OAuth and email configuration/deployed tests are pending. Resume extraction can omit or mis-group complex-column content; no OCR for image-only PDFs. Fixture evidence links may be unavailable (P07 is intentionally broken). Company intake remains a simulation and sends no inquiry email.
Test notes: See RELEASE2_QA.md for actual local results and unverified deployed checks. Adapter mappings and isolated test doubles are not provider/deployment pass evidence.

## Test accounts

Public discovery requires no account. Student reviewers sign in with their own GitHub account and verify their own algomau.ca inbox. No shared password, code, API key, SMTP credential or private resume belongs in this submission. No instructor-approved alternative verification mode has been assumed. Provider configuration must allow actual delivery to all assigned reviewers, not merely a provider sandbox owner.

## Release notes

Added stable internal GitHub-linked identities, persistent signed-in sessions, exact-domain Algoma verification, expiring single-use challenges and bounded attempts. Verified students can maintain private profiles, review PDF import suggestions without silent overwrite, control availability/link visibility, preview, publish/unpublish, and choose three themes with optional-section ordering. The original PDF is discarded. Profile writes enforce ownership server-side. Public responses remove private fields before discovery filtering. The Release 1 directory, profiles, projects and contextual inquiry remain active.

## Privacy / visibility summary

New profiles start private. Only published profiles appear in public student APIs/discovery. Owner data, verification addresses and challenge/session records are never included in public profile responses. Students independently choose whether availability and professional links are public; hidden values become [] and {} respectively. Hidden availability is excluded from availability-filter matches as well. Name, headline, biography, program, standardized skills, education, experience and optional location are public profile content when published. Preview uses the same public projection and identifies excluded private categories.

PDFs are parsed in memory on the backend, cleared and discarded; no original-PDF download route exists. Suggestions are not persisted or automatically applied. The student selects/edits/rejects candidate fields, applies them to the editor, then explicitly saves. Text is escaped for rendering, professional links are restricted to http(s), and executable inline content is blocked by the response policy. Unpublishing preserves the maintained profile for the owner.

## Release-specific evidence and environment

Setup and reviewer instructions: RELEASE2_SETUP.md. Node 24 recommended. Existing PostgreSQL DATABASE_URL plus PUBLIC_ORIGIN are retained. SESSION_SECRET, GitHub OAuth app settings, and an authorized HTTPS email provider are required before deployment assessment; see backend/.env.example. The public studio is /studio, owner preview is /preview, and the adapter maps actual APIs and roles. /health reports the deployment commit when supplied by Render.

Local automated evidence covers identity/state/CSRF, domain rejection, single use, expiry, bounded attempts, ownership, server-side privacy, publication synchronization, PDF fixtures, lack of silent overwrite, safe structured choices and R1 regression. Local 390px editor/import/preview/publish/unpublish checks use an isolated synthetic identity, not actual provider sign-in. Complete fresh-session deployed OAuth/email/ownership/privacy/mobile/regression checks and repository issue-access verification before claiming readiness or freezing.
