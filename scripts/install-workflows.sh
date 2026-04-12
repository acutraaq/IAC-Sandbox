#!/usr/bin/env bash
set -euo pipefail

# install-workflows.sh
# Copies workflows/ into .claude/ so Claude Code can discover agents and skills.
# Idempotent — safe to re-run after editing any file in workflows/.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

AGENTS_SRC="$ROOT_DIR/workflows/agents"
SKILLS_PHASE_SRC="$ROOT_DIR/workflows/skills/phase"
SKILLS_COMMANDS_SRC="$ROOT_DIR/workflows/skills/commands"
AGENTS_DST="$ROOT_DIR/.claude/agents"
SKILLS_DST="$ROOT_DIR/.claude/skills"

echo "IAC Sandbox — Installing workflows"
echo "Source : $ROOT_DIR/workflows/"
echo "Target : $ROOT_DIR/.claude/"
echo ""

# Create destination directories
mkdir -p "$AGENTS_DST"
mkdir -p "$SKILLS_DST"

# Copy agents
echo "Agents:"
for f in "$AGENTS_SRC"/*.md; do
  name=$(basename "$f")
  cp "$f" "$AGENTS_DST/$name"
  echo "  ✓ $name"
done

# Copy phase skills
echo ""
echo "Phase skills:"
for f in "$SKILLS_PHASE_SRC"/*.md; do
  name=$(basename "$f")
  cp "$f" "$SKILLS_DST/$name"
  echo "  ✓ $name"
done

# Copy command skills
echo ""
echo "Command skills:"
for f in "$SKILLS_COMMANDS_SRC"/*.md; do
  name=$(basename "$f")
  cp "$f" "$SKILLS_DST/$name"
  echo "  ✓ $name"
done

AGENT_COUNT=$(ls "$AGENTS_DST" | wc -l | tr -d ' ')
SKILLS_COUNT=$(ls "$SKILLS_DST" | wc -l | tr -d ' ')

echo ""
echo "Done. Installed $AGENT_COUNT agents and $SKILLS_COUNT skills."
echo "Re-run this script any time you edit files in workflows/."
