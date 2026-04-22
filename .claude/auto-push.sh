#!/bin/bash
# Auto-commit + push hook. Blocks push if staged changes look like secrets.

cd /d/NetStart || exit 0

git add -A

if git diff --cached --quiet; then
  exit 0
fi

# 1. Block by filename - files that commonly hold secrets
BAD_FILES=$(git diff --cached --name-only | grep -iE "(^|/)\.env($|\.)|(^|/)credentials\.|\.pem$|\.key$|\.p12$|\.pfx$|id_rsa$|id_ed25519$|service-account.*\.json$")

if [ -n "$BAD_FILES" ]; then
  git reset >/dev/null 2>&1
  printf '%s\n' '{"systemMessage":"Auto-push aborted - sensitive filename staged (.env/.pem/credentials/key/etc). Review, add to .gitignore if needed, or commit manually."}'
  exit 0
fi

# 2. Scan staged additions for secret-shaped content
SECRETS=$(git diff --cached -U0 | grep -E "^\+[^+]" | grep -iE \
  -e "AKIA[0-9A-Z]{16}" \
  -e "-----BEGIN [A-Z ]*PRIVATE KEY" \
  -e "gh[pousr]_[A-Za-z0-9]{36,}" \
  -e "xox[pboars]-[A-Za-z0-9-]{10,}" \
  -e "sk-[A-Za-z0-9]{20,}" \
  -e "(api[_-]?key|secret[_-]?key|access[_-]?token|client[_-]?secret|auth[_-]?token)[[:space:]]*[:=][[:space:]]*['\"]?[A-Za-z0-9+/=_-]{20,}")

if [ -n "$SECRETS" ]; then
  git reset >/dev/null 2>&1
  printf '%s\n' '{"systemMessage":"Auto-push aborted - possible secret detected in staged diff. Review manually and commit yourself if safe."}'
  exit 0
fi

# 3. Safe - commit + push
git commit -m "auto: update from Claude" >/dev/null 2>&1

if git push -u origin HEAD >/dev/null 2>&1; then
  printf '%s\n' '{"systemMessage":"Auto-pushed to GitHub."}'
else
  printf '%s\n' '{"systemMessage":"Auto-commit succeeded; push failed. Run git push manually."}'
fi
