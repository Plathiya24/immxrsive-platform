# Release 1 browser QA
Record actual results against the final deployed build; this checklist is not a claim that peer QA has occurred.

- Open /talent without signing in. Compare the count with published fixture records.
- Search uppercase substrings of a name, headline and skill.
- Select Unity and C# together. Confirm every result has both structured skills.
- Select Blender; Avery Chen must not match merely because P01 uses Blender.
- Try availability and status combinations. Clear individual filters and Clear all.
- Open S01, follow P01, verify Maya Patel's 3D Artist role, and open her profile.
- Reload and paste /students/S01 and /projects/P01 in a new tab.
- Open hidden student IDs and invalid student/project IDs; confirm useful not-found states.
- Start an inquiry from S01 and P01; verify student versus project context and all four source fields.
- Submit synthetic employer information and confirm simulation acknowledgement.
- Open P07's intentionally broken external link; verify directory and other profiles still work.
- At a 390 CSS-pixel viewport, complete search → profile → project → inquiry. Confirm no horizontal scrolling.
- Using only Tab, Shift+Tab, Space and Enter, reach controls, select a skill, open a result and submit an inquiry. Confirm labels and visible focus.
- Stop/restart the backend and confirm imported data and submitted inquiry records survive.
- Verify the production PostgreSQL connection and /health.
