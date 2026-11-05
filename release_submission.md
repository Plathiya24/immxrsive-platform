# Release 3 Submission

Release: R3
Team: team-03
Project Option: Project 1 — ImmXrsive Talent and Industry Platform
Deployment: https://immxrsive-platform-r7xi.onrender.com
Repository: https://github.com/Plathiya24/immxrsive-platform
Tag: R3-submission
Full commit SHA: Resolve R3-submission. The final Moodle copy records the full resolved SHA after this document is committed.

## Entry points and accounts

Public: /talent, /students/{id}, /projects/{id}, /inquiry.
Students: /studio for own GitHub sign-in and algomau.ca verification; /my-projects for shared projects and invitations. Reviewers use two own accounts. No shared credential or unapproved test-login mode is provided.

## Required demonstration records

Shared published project: https://immxrsive-platform-r7xi.onrender.com/projects/R3-900f498a-10c0-42b4-b1c5-35cd5e4a3fe0
Accepted contributors: Bikramjit Singh GIll and Parthil Lathiya (Plathiya24), both Software Developer. Both public profiles and personal contribution statements are visible on this canonical project.
Working playable demo: /demos/working_demo.html; fallback image: /demos/fallback.svg.
Public repository used for deployed import: https://github.com/Plathiya24/immxrsive-platform. Imported suggestions were edited and saved in a private QA record; disconnecting its repository retained its identity.

## Editing and removal decisions

Only the current maintainer edits shared project fields. Accepted contributors control their own standardized role, narrative and personal portfolio featuring. Maintenance transfer preserves one project record and URL. Maintainers cannot unilaterally erase accepted relationships; canonical relationships remain, while personal display can be hidden/re-enabled. Versioned conditional saves reject stale updates with 409 and a reload path.

## Known limits and evidence

See README.md and RELEASE3_QA.md. Resume extraction may require manual review, especially complex layouts/scans; no OCR. GitHub public metadata may be rate-limited. External demos/media can fail; independent fallback remains. Inquiry is simulated. Previous free database expired; a fresh PostgreSQL database seeds official R1 records but does not recover previous personal records. New users verify again.

39 local tests passed. Live manual create, invite, public pending-invite exclusion, metadata import/edit/save/disconnect, duplicate warning, stale-save refusal, working and broken demo/fallback, 390px layout, fresh GitHub sign-in, nested privacy repair and contextual inquiry checks passed. Real teammate acceptance, own contribution and public profile are complete; transfer and outsider writes have local automated coverage, not yet two-person deployed evidence. The original R1/R2 tags are unchanged. The final Moodle copy and R3-submission tag identify the assessed version; README and RELEASE3_QA.md distinguish observed deployed checks from local-only coverage.
