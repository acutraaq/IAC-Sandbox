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
echo "MANDATORY: read CLAUDE.md in full before doing anything, then docs/superpowers/HANDOFF.md."
echo "(Reminders below are pulled live from CLAUDE.md so they can't go stale — this is not a substitute for reading it.)"
echo ""

claude_md="$(dirname "$0")/../../CLAUDE.md"
if [ -f "$claude_md" ]; then
  grep -E '^\*\*(What is live and working|Latest session|What is designed but not built|SSO status|What needs admin action)( \([^)]*\))?:\*\*' "$claude_md"
else
  echo "(CLAUDE.md not found at expected path — read it manually)"
fi

echo ""
echo "Standing gotcha: run tests from web/ or functions/ (not repo root)."
