# Release 1 browser QA

## Recorded manual verification

Tester: Bikramjit (team-03)
Report recorded: October 2, 2026
Deployment: https://immxrsive-platform-r7xi.onrender.com
Commit tested: cd850281df994a9b8456e28203f778f477ad67bf
Browser/version: Not recorded
Evidence source: Bikramjit's confirmation in this chat; these deployed checks were not independently observed by the assistant.

- Mobile viewport: 390 × 844 CSS pixels.
- Mobile directory → search/filter → student → project → inquiry workflow: Passed.
- Horizontal scrolling required for the core workflow: No.
- Project inquiry context retained: Passed.
- Synthetic inquiry submission: Passed.
- Keyboard workflow using Tab, Shift+Tab, Space and Enter: Passed.
- Checkbox selection with Space: Passed.
- Links/buttons activated with Enter: Passed.
- Visible focus throughout: Passed.
- Problems reported in these mobile/keyboard checks: None.
- PostgreSQL connection setup: Reported successful after configuring DATABASE_URL and redeploying.

These are self-test results, not an assigned peer QA report. The browser/version and independent production database restart verification were not recorded.

## Automated regression evidence

All 11 local checks passed before the implementation was pushed to main. Coverage includes published-only discovery, deterministic results, case-insensitive text search, structured skill AND matching, availability/status combination semantics, hidden/invalid API records, shared project roles, optional broken evidence isolation, direct page routing, inquiry context/storage, and local database restart persistence. Local SQLite tests do not establish production PostgreSQL restart behavior.

## Full release checklist

The checklist below remains available for additional deployed verification. Items beyond the recorded results above are not claimed as passed.

- Open /talent without signing in and compare the count with the 17 published fixture students.
- Search uppercase substrings of a name, headline and skill.
- Select Unity and C# together; every result must have both structured skills.
- Select Blender; Avery Chen must not match merely because P01 uses Blender.
- Try availability/status combinations and clear individual filters and Clear all.
- Open S01, follow P01, verify Maya Patel's 3D Artist role, and open her profile.
- Reload and paste /students/S01 and /projects/P01 in a new tab.
- Open hidden student IDs and invalid student/project IDs; confirm useful not-found states.
- Start student and project inquiries; verify the source type, ID, name and URL.
- Submit synthetic employer information and confirm simulation acknowledgement.
- Open P07's intentionally broken link; verify the directory and other profiles still work.
- Complete the mobile workflow at 390 CSS pixels with no horizontal scrolling.
- Complete the keyboard workflow with meaningful labels and visible focus.
- Restart the production service and confirm data/inquiries persist in PostgreSQL.
- Check /health after deployment.
- After documentation updates deploy, record the final commit and repeat a smoke check before tagging.
