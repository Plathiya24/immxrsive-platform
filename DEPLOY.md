# Deploy and submit Release 1
The implementation has been copied into this Desktop repository. Its existing main branch and Git history are preserved. Create the Release 1 branch with the command below. Changes have not been committed or pushed.

## 1. Publish the branch to your GitHub repository
Review the changed files in your editor, then open a terminal in this repository:
```powershell
git switch -c codex/release-1
git add .
git commit -m "Implement Release 1 public talent discovery"
git push -u origin codex/release-1
```
If Git asks you to sign in, use your GitHub account. Create a pull request and merge after review, or configure Render to deploy this branch. Follow your team's course workflow.

## 2. Configure your existing Render backend
In Render, open immxrsive-platform and set:
- Branch: the branch containing the reviewed Release 1 commit
- Root Directory: backend
- Build Command: npm ci
- Start Command: npm start
- NODE_VERSION: 24.14.0
- DATABASE_URL: the PostgreSQL connection string for your existing persistent database
- PUBLIC_ORIGIN: https://immxrsive-platform.onrender.com (or the actual service origin)
- DATABASE_SSL: true if your database provider requires TLS; use its trusted certificate configuration

Deploy the latest commit. The backend serves both the website and API.
Visit /health; it should show status ok and database connected.
Visit /talent; it should show 17 published students.
Do not deploy with SQLite on an ephemeral disk. Use your PostgreSQL database.

## 3. Verify the deployed build
Complete QA_CHECKLIST.md. Use synthetic contact information in the intake form.
Run npm test from backend (11 checks passed locally).
Production PostgreSQL has not been tested in this chat.
The local browser verified skill AND filtering, shared contributor roles, project inquiry context, a saved simulated inquiry, and no horizontal overflow on directory/profile/project/inquiry at 390 pixels. Keyboard Tab and Space reached and toggled a filter. Complete the full keyboard and browser checks against your deployment.

## 4. Freeze the assessed release
Fill in your team, actual deployed URL and deployed commit in release_submission.md.
Ensure the submission documents are included in the commit that will be assessed.
After confirming the deployed commit and following your course release-freeze procedure:
```powershell
git tag -a R1-submission DEPLOYED_COMMIT_SHA -m "Release 1 submission"
git push origin R1-submission
```
Replace DEPLOYED_COMMIT_SHA with the actual verified commit. Do not tag a different local commit or overwrite an existing tag.

## 5. Submit
Provide the public /talent URL, GitHub repository, R1-submission tag, completed release_submission.md and evaluation_adapter.json. The submission document includes release notes, known issues, technology summary and intake configuration. Peer QA is for the assigned reviewing team to perform, not something to invent.
