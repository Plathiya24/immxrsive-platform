# Release 3 verification — November 4, 2026

## Local automated evidence

38 tests pass: R1/R2 regression plus shared creation/import, URL normalization and duplicates, invitation/accept/decline, contribution ownership, portfolio hiding versus canonical history, private-profile nested projection, unauthorized editing, safe URLs, stale and simultaneous saves, transfer and repository disconnection, demo/fallback routes, and fixes for issues #2/#3.

The local multi-account tests use in-process injected identities and simulated repository metadata. They are not production identity/provider evidence. No synthetic login route is enabled in production.

## Pending deployed evidence

- Real signed-in creator and second verified student invitation/acceptance; personal contribution statements.
- One shared published project with two consenting published profiles and accepted contributors.
- Real public GitHub import, edit suggestions, duplicate warning and join path.
- Demo Interact button, fallback, broken demo isolation, mobile 390 CSS pixels.
- Two-session stale save, transfer, authorization and regression checks.
- Deployed health SHA, immutable R3-submission, final submission documents and Moodle submission.

Do not interpret pending checks as passed. Preserve original release tags.
