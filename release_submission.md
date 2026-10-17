# Release 2 Submission

Release: R2
Team: team-03
Project Option: Project 1 — ImmXrsive Talent and Industry Platform
Deployment: https://immxrsive-platform-r7xi.onrender.com
Repository: https://github.com/Plathiya24/immxrsive-platform
Release tag: R2-submission
Commit: Resolve the immutable R2-submission tag to its full commit SHA. The Moodle submission copy records the resolved full SHA after this document is committed.
Adapter: evaluation_adapter.json
Known issues: Resume extraction can omit or mis-group complex-column content; no OCR for image-only PDFs. Fixture evidence links may be unavailable (P07 is intentionally broken). Company intake remains a simulation and sends no inquiry email. Free-tier hosting can require a cold start. Email delivery depends on Brevo and recipient filtering; real delivery to an Algoma inbox was verified with the configured sender.
Test notes: See RELEASE2_QA.md for actual local and deployed results, plus explicit coverage limits. Adapter mappings and isolated test doubles are not provider/deployment pass evidence.

## Test accounts

Public discovery requires no account. Student reviewers sign in with their own GitHub account and verify their own algomau.ca inbox. No shared password, code, API key, SMTP credential or private resume belongs in this submission. No instructor-approved alternative verification mode has been assumed. Provider configuration must allow actual delivery to all assigned reviewers, not merely a provider sandbox owner.

## Release notes

Added stable internal GitHub-linked identities, persistent signed-in sessions, exact-domain Algoma verification, expiring single-use challenges and bounded attempts. Verified students can maintain private profiles, review PDF import suggestions without silent overwrite, control availability/link visibility, preview, publish/unpublish, and choose three themes with optional-section ordering. The original PDF is discarded. Profile writes enforce ownership server-side. Public responses remove private fields before discovery filtering. The Release 1 directory, profiles, projects and contextual inquiry remain active.

## Privacy / visibility summary

New profiles start private. Only published profiles appear in public student APIs/discovery. Owner data, verification addresses and challenge/session records are never included in public profile responses. Students independently choose whether availability and professional links are public; hidden values become [] and {} respectively. Hidden availability is excluded from availability-filter matches as well. Name, headline, biography, program, standardized skills, education, experience and optional location are public profile content when published. Preview uses the same public projection and identifies excluded private categories.

PDFs are parsed in memory on the backend, cleared and discarded; no original-PDF download route exists. Suggestions are not persisted or automatically applied. The student selects/edits/rejects candidate fields, applies them to the editor, then explicitly saves. Text is escaped for rendering, professional links are restricted to http(s), and executable inline content is blocked by the response policy. Unpublishing preserves the maintained profile for the owner.

## Release-specific evidence and environment

Setup and reviewer instructions: RELEASE2_SETUP.md. Node 24 recommended locally; Render currently selected Node 26.12.0 and the deployed workflow passed. PostgreSQL, persistent sessions, GitHub OAuth and Brevo HTTPS delivery are configured. Secrets remain in hosting settings; see backend/.env.example for names only. The public studio is /studio, owner preview is /preview, and the adapter maps actual APIs and roles. /health reports the deployment commit supplied by Render. Assessed code is on codex/release-2 and the R2-submission tag; main still contains the original R1 release.

Twenty-five local automated checks cover identity/state/CSRF, domain rejection, single use, expiry, bounded attempts, ownership, server-side privacy, publication synchronization, PDF fixtures, lack of silent overwrite, safe structured choices and R1 regression. Twelve deployed public checks passed. Actual deployed GitHub sign-in, Algoma inbox verification, draft creation/edit/preview, four PDF imports and rejection/no-overwrite behavior, public hidden-link behavior, publish/search/unpublish, 390px layout, selected keyboard controls and repeat sign-in with retained verification/profile were observed. The repository is public and the signed-in new-issue form is accessible. Cross-owner writes were tested locally, not with two deployed accounts; a separate clean browser storage context and each assigned reviewer's account were not independently exercised. See RELEASE2_QA.md for precise evidence limits.
