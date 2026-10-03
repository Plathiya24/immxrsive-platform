# ImmXrsive · Release 1
Public talent discovery built on the existing Express/PostgreSQL project.

Team: team-03. Public directory: https://immxrsive-platform-r7xi.onrender.com/talent. Contribution branch: Bikramjit; Render deployment branch: main.
Deployed/tested implementation: cd850281df994a9b8456e28203f778f477ad67bf. Bikramjit confirmed mobile and keyboard workflow checks passed; see QA_CHECKLIST.md. R1-submission remains pending.

## Run locally
Use Node 22.13 or newer (Node 24 recommended).
From `backend`:
```
npm ci
npm start
```
Open http://localhost:3001/talent. No account is required.
Without DATABASE_URL, fixtures are imported once into a persistent SQLite database at backend/data/talent.sqlite. Subsequent requests read the database, not fixture files.
Run `npm test` for Release 1 regression tests. Run `npm run seed` only to intentionally reimport fixtures (it updates fixture records).

## Deploy the existing Render service
The service deploys main from this repository.
Root directory: backend. Build command: npm ci. Start command: npm start.
Set NODE_VERSION=24.14.0, DATABASE_URL to your existing PostgreSQL connection string, and PUBLIC_ORIGIN to the deployed HTTPS origin.
For a same-region Render internal Postgres connection, leave DATABASE_SSL unset. For other providers, use DATABASE_SSL=true only when TLS is required and its certificate is trusted.
The backend serves the frontend and API together. Public directory: https://immxrsive-platform-r7xi.onrender.com/talent.
The PostgreSQL database must be persistent. The app creates its records/inquiries tables and imports fixtures when the student table is empty. Existing Phase 0 items are left in place.
SQLite is suitable for local development or a deployment with an attached persistent disk; an ephemeral hosting filesystem will lose data.

## Public API
- GET /api/skills
- GET /api/students?text=unity&skill=Unity&skill=C%23&availability=internship&status=current
- GET /api/students/{id}
- GET /api/projects/{id}
- POST /api/inquiries
Repeat skill parameters for AND, availability/status parameters for OR within each category. All categories combine with AND. Skills match exact standardized names. Text matches case-insensitive substrings. Results are ordered by student ID.
Stable pages: /talent, /students/{id}, /projects/{id}, /inquiry?source_type=student&source_id=S01.
Only published students can be discovered or opened. Project contributor displays omit unpublished students.

## Intake simulation
The form derives source_type, source_id, source_name and source_url from the chosen record, collects company/contact/email/description, and saves them in the datastore. This is explicitly a simulation; no email is sent and there is no public inquiry-list endpoint. Use synthetic contact details for QA.

## Finish the release
1. Commit and push the updated documentation on main (see DEPLOY.md).
2. Deploy using the configuration above and confirm /health and the complete public workflow.
3. Confirm the final assessed commit in the submission evidence after documentation deployment; the recorded SHA identifies the implementation already tested.
4. Perform the mobile and keyboard checks in QA_CHECKLIST.md against the deployed build.
5. Create and push R1-submission at the verified deployed commit, following your course freeze procedure. Do not overwrite an existing submission tag.
6. Submit the deployed URL, repository, tag, release notes and evaluation_adapter.json.
Peer QA must be completed by the assigned reviewing team; no peer report is fabricated here.
