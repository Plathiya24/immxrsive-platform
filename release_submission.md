Chosen challenge: R4.19 - Server-Side Collaboration Privacy

# Release Submission

Release: R4
Team: team-03
Project Option: Project 1 — ImmXrsive Talent and Industry Platform
Deployment: https://immxrsive-platform-r7xi.onrender.com
Repository: https://github.com/Plathiya24/immxrsive-platform
Release tag: R4-submission
Commit: 474bb898bb698001565f9cfa6efc854bc15b9aa4 (frozen R4-submission)
Adapter: evaluation_adapter.json
Known issues: Company import depends on reachable public HTML and may need manual completion. Inquiry is simulated and sends no email. Staff access was granted on November 23 after the reviewer reported a 403 on November 22; this delayed access cannot be corrected retroactively (issue #6). Previously saved QA records remain in the shared database: partner 158be66f-e700-4282-a04c-0642221575af still links to the fixture page, and a public collaboration with year "banana" remains on partner f70d0a17-b18e-4e23-858c-6a327f804416. New imports and year submissions are fixed; those existing records require an authorized staff member to correct them.
Test notes: This submission records the frozen version above. At freeze, deployment, seeded records, fresh-browser QA and reviewer access were listed as pending. Post-freeze repair commit 50276be on `codex/release-4` passes all 44 backend checks locally and is deployed; the live health endpoint reports version 50276be1d5f6ca3a3aed8e325c277e0ae81b5aa6. The original R4-submission tag and commit are unchanged. Commit 75ebc1d adds clearer labeling for legacy import history on `codex/release-4`; it has not yet appeared in the live health version. Post-freeze deployment and retest evidence are recorded in GitHub issues #6–#11.

## Test accounts

- Public: open /partners and /talent without signing in.
- Staff: sign in via GitHub and open /staff using the authorized account identified through the private course channel.
- Student maintainer: sign in via GitHub, verify your Algoma email in /studio, and open a project you maintain in /my-projects.

## Release-specific evidence

The following repair notes were added after the R4 freeze and do not change the assessed tag. Reviewer staff access was added on November 23 after the reviewer encountered a 403 on November 22. Access was therefore not available to that reviewer before they requested it.

- Staff work queue: https://immxrsive-platform-r7xi.onrender.com/staff
- Public partner directory: https://immxrsive-platform-r7xi.onrender.com/partners
- Post-freeze code fixes and automated retests are documented in GitHub issues #7–#11. The original issues describe the R4-submission behavior; the repair branch is separate from the frozen assessment commit.
- Staff-only workflow evidence depends on an authorized staff GitHub account. Do not treat the local automated tests as proof of a fresh-browser staff login or reviewer access at freeze.
- Existing QA data is not silently rewritten. The issue #7 company website and issue #9 arbitrary-year row are still present in the live database and need staff correction; see the issue replies for the observed records.
- Fixture source URLs for website import:
  - https://immxrsive-platform-r7xi.onrender.com/import-fixtures/company_normal.html
  - https://immxrsive-platform-r7xi.onrender.com/import-fixtures/company_sparse.html
  - https://immxrsive-platform-r7xi.onrender.com/import-fixtures/company_prompt_injection.html
  - https://immxrsive-platform-r7xi.onrender.com/import-fixtures/company_same_name_other_domain.html

## Release notes

Chosen challenge: R4.19 - Server-Side Collaboration Privacy. Anonymous partner and inquiry responses omit private collaboration records and return a separate public summary for limited collaborations.

Release 4 adds staff project verification, draft-only website imports with provenance, approved industry relationships, current and past collaborations, and contextual inquiries.
