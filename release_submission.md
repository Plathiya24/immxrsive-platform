Chosen challenge: R4.19 - Server-Side Collaboration Privacy

# Release Submission

Release: R4
Team: team-03
Project Option: Project 1 — ImmXrsive Talent and Industry Platform
Deployment: https://immxrsive-platform-r7xi.onrender.com
Repository: https://github.com/Plathiya24/immxrsive-platform
Release tag: R4-submission
Commit: Pending deployment verification and tag creation.
Adapter: evaluation_adapter.json
Known issues: Company import depends on reachable public HTML and may need manual completion. Inquiry is simulated.
Test notes: The local suite passed. Deployment, seeded records, fresh-browser QA and reviewer access are pending verification.

## Test accounts

- Public: open /partners and /talent without signing in.
- Staff: sign in via GitHub and open /staff using the authorized account identified through the private course channel.
- Student maintainer: sign in via GitHub, verify your Algoma email in /studio, and open a project you maintain in /my-projects.

## Release-specific evidence

- Staff work queue: https://immxrsive-platform-r7xi.onrender.com/staff
- Public partner directory: https://immxrsive-platform-r7xi.onrender.com/partners
- Published import and two collaboration records: pending live setup. Import and publish North Shore Simulations, then select **Load course collaboration fixtures**. Open the public partner and confirm COL01 (past) and COL02 (current).
- Student-requested relationship: pending live setup. Submit a partner request from a maintained project, confirm pending status in the staff queue, then record the staff decision and check the public project.
- Fixture source URLs for website import:
  - https://immxrsive-platform-r7xi.onrender.com/import-fixtures/company_normal.html
  - https://immxrsive-platform-r7xi.onrender.com/import-fixtures/company_sparse.html
  - https://immxrsive-platform-r7xi.onrender.com/import-fixtures/company_prompt_injection.html
  - https://immxrsive-platform-r7xi.onrender.com/import-fixtures/company_same_name_other_domain.html

## Release notes

Chosen challenge: R4.19 - Server-Side Collaboration Privacy. Anonymous partner and inquiry responses omit private collaboration records and return a separate public summary for limited collaborations.

Release 4 adds staff project verification, draft-only website imports with provenance, approved industry relationships, current and past collaborations, and contextual inquiries.
