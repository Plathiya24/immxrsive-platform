# ImmXrsive · Release 3

Team 03 · Project 1 — Talent and Industry Platform

Deployment: https://immxrsive-platform-r7xi.onrender.com
Student profile: /studio · Shared project workspace: /my-projects · Public discovery: /talent

## Release 3

Verified students can create projects manually or review public GitHub metadata suggestions. A canonical project has a stable ID independent of repository URLs. Projects support multiple source URLs, playable/video links and fallback evidence. Use Add project, Add teammate, Accept invitation and Play Demo.

Only the **current maintainer** edits shared fields. A creator starts as maintainer; maintenance can transfer to any other accepted contributor. Every accepted contributor controls their own standardized role, contribution statement and personal portfolio featuring. Transfer changes neither project identity nor contributor history.

**Removal policy:** maintainers cannot erase accepted canonical relationships. There is no unilateral canonical removal operation. A contributor can hide personal portfolio display and later re-feature it; the underlying accepted relationship remains intact. Public contributor details also respect profile publication. Pending invitations and declined invitations never appear publicly as accepted contributions.

Shared saves include a version and use a database conditional update. Stale or simultaneous competing saves receive a 409 conflict and a reload path. Project technologies never update personal skills.

Duplicate source URLs are normalized for repository casing, trailing slash and .git suffix. Creating/saving warns and offers the existing project or a join-request path; an explicit distinct-project override permits legitimate separate work. Titles alone never merge records.

## Access and setup

Public browsing needs no account. Students use their own GitHub account and algomau.ca inbox. Verification is once per account. No shared passwords or public test-login endpoint exists. Start at /studio, verify, create a private profile, then open My projects. Find teammates by their exact GitHub username or account display name; they must already have a verified account and profile. Invitees accept in My projects and maintain their own contribution.

Render root backend; build npm ci; start npm start. Persistent PostgreSQL DATABASE_URL, PUBLIC_ORIGIN, SESSION_SECRET, GITHUB_CLIENT_ID/SECRET and the existing authorized Brevo MAIL_FROM/BREVO_API_KEY are required. See backend/.env.example and RELEASE2_SETUP.md for configuration names. Never commit credentials. Node 24 or later is required. The previous free database expired; a new PostgreSQL database was configured on November 4, so prior personal account/profile/inquiry records were not migrated. Original R1 fixture data seeds an empty database automatically. Users must verify again on the new database.

The app preserves the frozen R1-submission and R2-submission tags. R3 development is on codex/release-3; do not assume main is the assessed release. Final release_submission.md and immutable R3-submission identify the assessed commit.

## Fixtures and demos

Official standardized roles and duplicate cases: backend/fixtures/standard_roles.json and project_duplicate_cases.json. Demo and fallback: /demos/working_demo.html and /demos/fallback.svg, hosted publicly on this deployment. The demo retains the official inline code with a narrowly scoped hash-based Content Security Policy. Project pages accept URLs, not raw script/iframe HTML. Demos launch in a separate tab; a broken runtime cannot break the containing project page. A fallback image, link and video may be supplied independently.

Public GitHub metadata import uses GitHub's unauthenticated repository endpoint, requests only a public owner/repository path, and does not retain an OAuth token. GitHub rate limits and outages have a manual-entry fallback. Imported values remain editable and are saved only by explicit project creation/save.

## Repairs and validation

Issue #2: public student detail now filters nested project contributors through the same published-profile projection used for project detail. Private contributors do not leak through nested responses.

Issue #3: resume section recognition now includes TECHNICAL SKILLS, RELEVANT EXPERIENCE, SELECTED PROJECTS and other common headings. Education stops at the next recognized section. Extracted data still requires review and explicit save; complex/scanned PDFs can require manual correction.

Run `npm test` in backend. Current local suite: 38 passing checks, including simulated multiple users and concurrency. Test injection is only provided by in-process tests, never enabled by production startup. Local tests do not prove external OAuth/mail or deployed multi-account behavior. Record actual deployed checks in RELEASE3_QA.md before freezing.

## Limits

Resume extraction is text-based, with no OCR. Public GitHub import can be rate-limited. External media can be unavailable and may be blocked by browser mixed-content rules; use HTTPS media and fallback links. Company inquiry is a persistent simulation and sends no email. Free hosting may cold-start and free database lifetimes must be monitored. Published projects can be visible with no public contributor names if all accepted contributors keep their profiles private; publish both consenting QA profiles for the required public shared example.
