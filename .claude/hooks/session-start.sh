#!/usr/bin/env bash
# SessionStart banner: branch, dirty count, and standing project reminders.
# Output goes to the session as additional context.

set -uo pipefail

branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "(no git)")
dirty=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
ahead_behind=$(git rev-list --left-right --count "@{upstream}...HEAD" 2>/dev/null || echo "")

echo "IAC Sandbox — session start"
echo "  branch : $branch"
echo "  dirty  : $dirty file(s)"
if [ -n "$ahead_behind" ]; then
  behind=$(echo "$ahead_behind" | awk '{print $1}')
  ahead=$(echo "$ahead_behind" | awk '{print $2}')
  echo "  vs upstream : $ahead ahead, $behind behind"
fi
echo ""
echo "Reminders (see CLAUDE.md):"
echo "  - MSAL: placeholder login is live; real SSO blocked on App Registration creds"
echo "  - Managed identity setup pending — verify with GET /api/healthz/arm"
echo "  - Run tests from web/ or functions/ (not repo root)"
