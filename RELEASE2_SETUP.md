# Release 2 setup and evaluation

Project 1, Team 03. This guide describes the new release; the original R1-submission tag must not move.

## Deployment configuration

Existing service: https://immxrsive-platform-r7xi.onrender.com
Repository: https://github.com/Plathiya24/immxrsive-platform
Render root: backend; build: npm ci; start: npm start; Node 24 recommended.

Keep the existing PostgreSQL DATABASE_URL and PUBLIC_ORIGIN. Set PUBLIC_ORIGIN to the exact HTTPS origin above, without a trailing slash. Add a persistent SESSION_SECRET with at least 32 random bytes, plus GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET. Keep secrets in Render environment variables, not this repository. Sessions, accounts, challenges and profiles persist in PostgreSQL; production must not use the ephemeral SQLite fallback.

Register a GitHub OAuth app:
- Name: ImmXrsive Team 03
- Homepage: https://immxrsive-platform-r7xi.onrender.com
- Callback: https://immxrsive-platform-r7xi.onrender.com/auth/github/callback
- No wildcard callbacks or device flow are needed.
- The application requests read:user only. It does not request repository access, retain OAuth access tokens, or use GitHub usernames as ownership keys. GitHub numeric IDs map to stable random internal account IDs.

Configure email delivery using either BREVO_API_KEY + MAIL_FROM or RESEND_API_KEY + MAIL_FROM. The sender must be authorized and capable of sending to any reviewer’s Algoma address; a provider sandbox restricted to the account owner is insufficient. The HTTPS API avoids Render Free’s SMTP-port restrictions. SMTP is also supported when the hosting environment permits it (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_SECURE).

APPROVED_EMAIL_DOMAINS defaults to algomau.ca; supply comma-separated exact domains if the instructor changes the list. VERIFICATION_TTL_MINUTES defaults to 15 and is clamped to 1–30. Three requests per address/account are permitted per ten minutes, with five attempts per challenge. A replacement challenge invalidates its predecessor. Failed delivery never grants affiliation. Challenge values are hashed and never returned by the public API or application logs. No alternate production sign-in or unapproved verification test mode is provided.

## Reviewer access and main workflow

Reviewers use their own GitHub accounts and Algoma email inboxes; no shared student password is required. Public browsing needs no account.

1. Open /studio in a fresh browser session and select Continue with GitHub.
2. Check the basic-profile permission request, then return to the app.
3. Try an outside-domain email: it must be rejected. Submit your algomau.ca address, read the code privately from your inbox, and enter it in the same signed-in session.
4. Create a private profile. Existing R1 fixture profiles are not claimable.
5. Edit the main fields and standardized skills, then Save profile.
6. Upload a supplied PDF, review candidates, reject at least one, edit another, apply selected suggestions, then Save profile. The upload itself never overwrites maintained values.
7. Choose visibility, theme and first/last section order. Save & preview shows only public values and names excluded private categories.
8. Publish, check the directory and direct public URL from another session, then unpublish. The maintained editor data remains saved.
9. Sign out and sign back in through GitHub: the same internal account and verified affiliation must remain.

## Resume fixtures and privacy

The four supplied synthetic PDFs are in backend/fixtures/resumes. Upload a PDF of at most 5 MB and 20 pages. The parser reads text locally in the backend; it sends no resume data to an AI service. Education/experience extraction recognizes headings and can omit or mis-group complex column layouts; always compare suggestions with the source excerpt. Scanned image-only PDFs have no OCR and may yield no useful suggestions. Continue editing manually if parsing fails.

Unknown skill candidates do not become standardized public filters. Original PDFs are held in memory during the request, cleared, and discarded; no original-PDF storage/download route exists. Extracted suggestions are returned privately for review and are not stored until the student explicitly applies selected values to the editor and saves them. No facts are invented to fill sparse documents. Resume text is data and cannot execute instructions.

Private profiles are absent from public directory/profile APIs. Hidden availability becomes [] and hidden links become {} in public responses, before filtering; this prevents private availability from being inferred by directory filters. Verification addresses, ownership identifiers, session information and challenge hashes are excluded from public profile responses. Optional public location, biography, education and experience are clearly labeled public/editor content; do not put sensitive details there.

## Retest and freeze

Run npm test in backend. Tests include in-process OAuth/email doubles for repeatability; those are not deployed test-login endpoints and do not prove external provider integration. Browser checks against the isolated local test server likewise do not count as deployed sign-in/verification evidence.

Before freezing, complete real deployed GitHub sign-in and email verification in a fresh session, plus reviewer/instructor repository and issue access. Check /health for the deployed commit. Resolve all setup blockers, prepare final release_submission.md with the full assessed SHA, tag that exact verified commit R2-submission, upload the documents, and Submit assignment in Moodle. Do not freeze a draft or claim an unverified external flow passed.
