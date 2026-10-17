# Release 2 verification — October 16, 2026

## Completed locally

- 25 automated checks passed (npm test from backend): 11 R1 checks plus R2 identity, OAuth state/PKCE/minimal scope, unverified access, CSRF, exact email domain, account-bound/single-use/expiring verification, request/wrong-code limits, draft isolation, forged-owner refusal, validated fields, privacy in public responses/filters/preview, customization data stability, publication/unpublication, private resume import without overwrite, same internal account after GitHub rename, and four supplied PDF fixtures.
- Automated OAuth and mail use in-process dependencies. They do not validate GitHub/provider credentials or real delivery.
- Isolated local browser with synthetic verified account: created a private draft, edited fields, saved, imported clean PDF, rejected education/skills by leaving them unselected, edited and accepted experience, confirmed existing education/skills stayed unchanged. Explicit save persisted the changes.
- Preview displayed script-like biography as literal text, with zero script elements in the profile. Private professional links were absent.
- At measured innerWidth 390 and document clientWidth/scrollWidth 375/375: edited fields, imported/reviewed minimal PDF, cancelled review without changing manual education, saved/previewed, kept publication and unpublished while retaining data. Keyboard Tab reached a labeled review checkbox.
- Local screenshots are saved outside the repository under outputs/release2. A local synthetic test helper is not deployed or committed into the application. Production createApp is called without test dependencies; no test-login route exists.

## Completed on the deployed application

- GitHub sign-in with the real provider succeeded using basic read-only profile permission. The signed-in account displayed Algoma verified after the user entered the code received in the Algoma Gmail inbox.
- Real email delivery initially failed to appear in the inbox despite Brevo reporting Delivered. A verified personal sender, rewritten by Brevo to its sending domain, produced an actual inbox message at 23:03 Toronto. No verification code was retrieved from provider previews or logs.
- Created a private draft, saved user-entered fields, and previewed it with professional links excluded. The verified session survived application redeployments.
- Imported the clean, minimal, layout-stress, and untrusted-text official PDFs on deployment. Clean extraction presented skills, education, experience and links for review. Editing and applying an education suggestion changed only the editor; reloading without saving restored every saved field. Cancelling subsequent reviews also preserved all saved fields.
- Layout-stress extraction offered standardized skills while leaving uncertain education/experience empty for review. Instruction-like untrusted PDF text remained displayed as document data; suggestions were rejected.
- With explicit user permission, briefly published the profile. Directory name search returned one matching profile; the public page showed selected skills/availability and no professional links. Unpublished immediately afterward: directory search returned zero results and the direct public URL displayed Student not found. The editor retained the private draft.
- Twelve deployed public checks previously passed, including health/commit, R1 filter queries, fixture detail and invalid-ID behavior, and provider configuration flags. Evidence and screenshots are outside the repository in outputs/release2.
- Deployed editor and preview measured innerWidth 390, clientWidth 375 and scrollWidth 375 (no horizontal overflow). Tab moved from biography to the labeled Accessibility checkbox; Space toggled it and toggled it back; Enter activated Save & preview. The saved profile remained unchanged.
- Signed out of the app, then signed in again through real GitHub OAuth: the account remained Algoma verified, retained its private draft, and every recorded editor field matched the saved values. No new email challenge was required.
- Repository is Public. The signed-in bigill-sunny account reached the new-issue form with title, description and Create controls. No empty test issue was posted. Access from the assigned reviewers' individual accounts was not independently exercised.

## Pending before freeze

- Real code replay and alternate-domain rejection have automated local coverage; deployed negative checks were not repeated on the already-verified account.
- A completely separate browser storage context was not exercised. The main workflow used a real signed-out app session; repeat sign-in and persistence across service redeployments were observed.
- Use two authorized reviewer-owned accounts for deployed cross-owner write checks; do not probe other students' accounts.
- Cross-owner writes and public API field privacy have local automated coverage; deployed two-account writes and direct inspection of a published profile's JSON were not exercised. Deployed preview/public-page privacy, publication synchronization, mobile/keyboard and public R1 regression checks above are complete.
- Verify assigned reviewers/instructor can read the repository and create issues; identify current assignments rather than assuming R1 reviewer pairing still applies.
- Record exact deployed SHA, create immutable R2-submission at that commit, finalize evidence, then Submit assignment in Moodle before deadline.

Unexercised checks above are evidence limits, not observed product defects. No pending item above is claimed as passed. Original R1-submission is unchanged.
