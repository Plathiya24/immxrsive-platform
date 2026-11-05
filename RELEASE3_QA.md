# Release 3 verification — November 4, 2026

## Local automated evidence

39 tests pass: R1/R2 regression plus shared creation/import, URL normalization and duplicates, invitation/accept/decline, contribution ownership, portfolio hiding versus canonical history, private-profile nested projection, unauthorized editing, safe URLs, stale and simultaneous saves, transfer and repository disconnection, demo/fallback routes, and fixes for issues #2/#3.

The local multi-account tests use in-process injected identities and simulated repository metadata. They are not production identity/provider evidence. No synthetic login route is enabled in production.

## Observed deployed checks (November 4)

- Real GitHub/Algoma verified creator account on the replacement PostgreSQL database. Existing authenticated session survives R3 deploys.
- Shared published project created manually: R3-900f498a-10c0-42b4-b1c5-35cd5e4a3fe0. Exact username search found Plathiya24; role invitation sent. Pending invited student absent from public contributors. Creator profile was published with explicit user permission.
- GitHub API import initially failed. Added a public-page metadata fallback; deployed import returned title/repository suggestions, which were edited and saved as a private QA project. Removing its repository retained the same project ID/editor URL. Fallback metadata supplies no language/description when not present; manual entry remains available.
- Duplicate check for platform repository displayed View project and Request to join; intentional distinct-project checkbox used for the private import QA record.
- Two open browser editors: first saved an updated description; stale second save was refused with a conflict/reload message. Newer description remained.
- Hosted official demo Interact changed Ready to Interactions: 1. Deliberately missing playable URL returned a not-found page in its own tab while project/fallback/navigation remained usable. Working demo URL restored.
- At measured innerWidth 390, clientWidth and scrollWidth were 375/375; fallback image loaded and fit the page. Contributor profile link opened correctly and listed the canonical project. Repeat with both accepted contributors is pending.
- Synthetic project inquiry saved with authoritative context, no email sent.
- Live issue #2 checks: S05/S11 nested data and P03 project data exclude S16; S16 remains public 404.
- /health reports database connected and deployed R3 commit. Full final SHA will be rechecked before tagging.

## Pending deployed evidence

- Second verified student must accept the live invitation and save their own contribution statement. Creator fresh real sign-in and statement persistence passed.
- One shared published project with two consenting published profiles and accepted contributors.
- Join request route and transfer/authorization were covered locally; optional second-account deployed retest remains pending. Live import/edit/save/disconnect and duplicate view/join links passed.
- Repeat the mobile public presentation with two accepted/published contributor profiles. Single-contributor mobile/demo/fallback checks passed.
- Two open editor stale-save check passed live; separate clean browser storage context was not independently controlled by automation. Transfer, unauthorized writes and contributor ownership have multi-user automated coverage.
- Verify final deployed SHA after documentation commits; create immutable R3-submission only after required shared example is complete; upload final documents and Submit in Moodle.

Do not interpret pending checks as passed. Preserve original release tags.

Fresh real sign-in retest: signed out, signed in through GitHub again, restored Algoma verified status, published profile and shared record; the approved contribution statement persisted. No extra email challenge was needed.
