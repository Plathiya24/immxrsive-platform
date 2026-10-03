# Deploy and submit Release 1

## Current status

Team: team-03
Working repository: C:\Users\sunny\OneDrive\Desktop\immxrsive-platform
Contribution branch: Bikramjit
Deployment branch: main
Public directory: https://immxrsive-platform-r7xi.onrender.com/talent
Deployed/tested implementation: cd850281df994a9b8456e28203f778f477ad67bf

The implementation was pushed to main and deployed successfully. Bikramjit reported successful PostgreSQL setup and mobile/keyboard workflow checks. The submission tag is still pending. See QA_CHECKLIST.md for evidence scope.

## Render configuration

- Branch: main
- Root Directory: backend
- Build Command: npm ci
- Start Command: npm start
- Recommended NODE_VERSION: 24.14.0
- DATABASE_URL: your private persistent PostgreSQL connection string
- PUBLIC_ORIGIN: https://immxrsive-platform-r7xi.onrender.com

Use the internal Postgres URL for a Render database in the same region/workspace. That internal connection does not require DATABASE_SSL=true. For another database connection, follow the provider's trusted TLS requirements. Keep credentials in Render environment settings, not Git.

The backend serves both frontend and API. A fresh database imports the fixtures automatically. /health should report status ok and database connected; /talent should show 17 published students.

## Publish these documentation updates

Open PowerShell in your Desktop repository and confirm you are on main:

```powershell
git branch --show-current
git status
git add README.md DEPLOY.md QA_CHECKLIST.md release_submission.md
git commit -m "Record Release 1 deployment and verification"
git push origin main
git rev-parse HEAD
```

Wait for Render to deploy the new commit. Confirm the deployed commit matches the command output and repeat the public smoke checks. The SHA recorded in the documents describes the implementation previously tested, not the new documentation commit.

## Freeze the assessed release

Follow your course freeze procedure and check whether a submission tag already exists:

```powershell
git fetch origin --tags
git tag --list R1-submission
```

If the tag exists, inspect it with your team before proceeding. Do not overwrite it.

If no tag exists and the final deployment is verified:

```powershell
git tag -a R1-submission DEPLOYED_COMMIT_SHA -m "Release 1 submission"
git push origin R1-submission
```

Replace DEPLOYED_COMMIT_SHA with the full verified deployed commit. Record that exact commit and the published tag in the final submission evidence. A document cannot contain its own resulting commit SHA; use the tag to resolve the final revision and include its full SHA in the submission portal or a separately saved final submission copy.

## Submit

Provide the public directory URL, repository URL, R1-submission tag, final assessed commit, release notes, known issues, technology summary, intake configuration and evaluation_adapter.json. The adapter already matches the implemented API/routes. Assigned peer QA must be performed separately.
