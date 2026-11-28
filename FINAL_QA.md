# ImmXrsive final release QA

## Local verification

Verified November 27, 2026, on the working copy with Tickets 1–7 applied over `e8e44afed373441f15b2561f2e7284692c23990d`. Browser checks used local SQLite fixtures and a mocked GitHub provider. The deployed release still needs its own verification.

- [x] **Regression suite.** Run `npm test --prefix backend`. All 44 tests passed, including published-only data, OAuth session handling, private workspace access, simulated inquiry persistence, and collaboration privacy.
- [x] **Public deep links.** In a signed-out browser, open and reload `/students/S01` and `/projects/P01`. Avery Chen’s profile and the Industrial Safety VR Trainer reloaded at their canonical URLs. The trainer credits Avery as XR Developer.
- [x] **Studio and My projects.** Opening `/my-projects` signed out showed the sign-in gate. A verified local test account signed in through the mocked GitHub flow and saw its private portfolio draft in Studio and its private project in My projects. Signing out restored the gate.
- [x] **Published-only data.** Direct public links to the fixture’s private profile and project both showed Record unavailable, including during its signed-in session. The automated suite also checked that private records stay out of public results and that anonymized collaborations retain their public projection.
- [x] **Trainer outcomes and replay.** At 390 CSS pixels, Space selected “Walk around the spill and continue” and explained that the hazard remained unreported. Try again cleared the answer. “Stop clear of the spill and notify the site lead” displayed the success explanation. Meet the team opened `/projects/P01#contributors` and moved focus to the credits.
- [x] **Mobile filters and Back.** At 390 CSS pixels, Unity and C# selected by keyboard yielded five fixture matches and both removable chips. Escape closed the filters and returned focus to the disclosure. Opening Avery’s profile and using Back restored both filters and the same count.
- [x] **Inquiry context.** Discuss this project opened `/inquiry?source_type=project&source_id=P01` and displayed Industrial Safety VR Trainer. A synthetic submission showed the simulation confirmation with a link back to `/projects/P01`. The North Shore collaboration inquiry displayed Industrial Safety Training Prototype and North Shore Simulations.

## Deployed release checks

- [ ] Record the deployment URL, full commit SHA, test date, browser, and viewport. Check the deployed version and database connectivity at `/health`.
- [ ] In a fresh signed-out browser session, repeat the homepage → scenario → contributor → inquiry journey. Check the direct links and mobile filter Back behavior.
- [ ] Use an authorized verified test account to confirm deployed GitHub sign-in, Studio, My projects, and sign-out. Verify draft visibility in a separate signed-out session.
- [ ] Run the five sessions on the same release using [the usability observation sheet](FINAL_USABILITY_SESSIONS.md). Check whether at least four of five meet the target before reporting a usability score.

## Observations to watch

The scripted browser journey completed. The project page’s **Try browser sample** link opens a new tab, while the homepage’s **Try the scenario** link stays in the same tab. Record whether the switch makes anyone lose their place. Participant blocker frequencies are pending.
