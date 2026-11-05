# Release 3 submission preparation

Release: R3
Team: team-03
Project Option: Project 1 — ImmXrsive Talent and Industry Platform
Deployment: https://immxrsive-platform-r7xi.onrender.com
Repository: https://github.com/Plathiya24/immxrsive-platform
Tag: R3-submission (create only after deployed verification)
Full commit SHA: pending final deployed version

## Entry points and accounts

Public: /talent, /students/{id}, /projects/{id}, /inquiry.
Students: /studio for own GitHub sign-in and algomau.ca verification; /my-projects for shared projects and invitations. Reviewers use two own accounts. No shared credential or unapproved test-login mode is provided.

## Required demonstration records

Shared published project with two accepted contributors: pending real invitation acceptance.
Working playable demo: /demos/working_demo.html; fallback image: /demos/fallback.svg.
Public repository used for import: pending deployed demonstration.

## Editing and removal decisions

Only the current maintainer edits shared project fields. Accepted contributors control their own standardized role, narrative and personal portfolio featuring. Maintenance transfer preserves one project record and URL. Maintainers cannot unilaterally erase accepted relationships; canonical relationships remain, while personal display can be hidden/re-enabled. Versioned conditional saves reject stale updates with 409 and a reload path.

## Known limits and evidence

See README.md and RELEASE3_QA.md. Resume extraction may require manual review, especially complex layouts/scans; no OCR. GitHub public metadata may be rate-limited. External demos/media can fail; independent fallback remains. Inquiry is simulated. Previous free database expired; a fresh PostgreSQL database seeds official R1 records but does not recover previous personal records. New users verify again.

38 local tests passed; deployed checks and evidence are not yet complete. The original R1/R2 tags are unchanged. This preparation document must not be presented as a frozen release.
