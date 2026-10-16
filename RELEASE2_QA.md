# Release 2 verification — October 16, 2026

## Completed locally

- 25 automated checks passed (npm test from backend): 11 R1 checks plus R2 identity, OAuth state/PKCE/minimal scope, unverified access, CSRF, exact email domain, account-bound/single-use/expiring verification, request/wrong-code limits, draft isolation, forged-owner refusal, validated fields, privacy in public responses/filters/preview, customization data stability, publication/unpublication, private resume import without overwrite, same internal account after GitHub rename, and four supplied PDF fixtures.
- Automated OAuth and mail use in-process dependencies. They do not validate GitHub/provider credentials or real delivery.
- Isolated local browser with synthetic verified account: created a private draft, edited fields, saved, imported clean PDF, rejected education/skills by leaving them unselected, edited and accepted experience, confirmed existing education/skills stayed unchanged. Explicit save persisted the changes.
- Preview displayed script-like biography as literal text, with zero script elements in the profile. Private professional links were absent.
- At measured innerWidth 390 and document clientWidth/scrollWidth 375/375: edited fields, imported/reviewed minimal PDF, cancelled review without changing manual education, saved/previewed, kept publication and unpublished while retaining data. Keyboard Tab reached a labeled review checkbox.
- Local screenshots are saved outside the repository under outputs/release2. A local synthetic test helper is not deployed or committed into the application. Production createApp is called without test dependencies; no test-login route exists.

## Pending before freeze

- Configure real OAuth app; verify actual sign-in, basic permissions and repeat sign-in on deployment.
- Configure authorized email provider; verify delivery to an Algoma inbox, real single-use verification, alternate-domain rejection and follow-up sign-in.
- Verify PostgreSQL-backed sessions/profiles persist on the actual deployment; run the required workflow in a fresh browser session.
- Use two authorized reviewer-owned accounts for deployed cross-owner write checks; do not probe other students' accounts.
- Deployed public API privacy, preview, publication synchronization, R1 regression and 390px/keyboard checks.
- Verify assigned reviewers/instructor can read the repository and create issues; identify current assignments rather than assuming R1 reviewer pairing still applies.
- Record exact deployed SHA, create immutable R2-submission at that commit, finalize evidence, then Submit assignment in Moodle before deadline.

No pending item above is claimed as passed. Original R1-submission is unchanged.
