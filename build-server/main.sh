export GIT_REPO_URL="$GIT_REPO_URL"
git cone "$GIT_REPO_URL" /home/app/output
exec node index.js