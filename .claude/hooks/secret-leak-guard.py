#!/usr/bin/env python3
"""PreToolUse hook: block Write/Edit if content looks like a real secret.

Reads Claude Code hook JSON on stdin. Exits 0 to allow, 2 to deny (with
stderr message shown to Claude). Patterns target the secrets actually
present in this repo's surface area: Azure Storage connection strings,
App Service publish profiles, JWTs, and inline client_secret values.

Whitelisted: env-var NAMES (e.g. AZURE_STORAGE_CONNECTION_STRING in code)
and obvious placeholders like <your-secret> or {{...}}.
"""
import json
import re
import sys

PATTERNS = [
    # Azure Storage / Service Bus / Event Hub connection string with real key
    (r"AccountKey=[A-Za-z0-9+/]{60,}={0,2}", "Azure storage AccountKey"),
    (r"SharedAccessKey=[A-Za-z0-9+/]{20,}={0,2}", "Azure SAS key"),
    # App Service publish profile XML (contains userPWD)
    (r"<publishProfile\s+[^>]*userPWD\s*=\s*\"[^\"]+\"", "App Service publish profile"),
    # JWT
    (r"eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}", "JWT token"),
    # Inline client_secret = "<value>" (not just the env var name)
    (
        r"""client[_-]?secret["']?\s*[:=]\s*["'][^"'<>${{}}\s]{20,}["']""",
        "Inline client_secret value",
    ),
    # AZURE_AD_CLIENT_SECRET = "..." with real-looking value
    (
        r"""AZURE_AD_CLIENT_SECRET\s*[:=]\s*["'][^"'<>${{}}\s]{20,}["']""",
        "AZURE_AD_CLIENT_SECRET literal",
    ),
    # SESSION_SECRET literal hex 32+ bytes
    (
        r"""SESSION_SECRET\s*[:=]\s*["'][0-9a-fA-F]{40,}["']""",
        "SESSION_SECRET literal",
    ),
]


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except Exception:
        return 0  # malformed input — don't block

    tool = payload.get("tool_name") or payload.get("tool") or ""
    if tool not in ("Write", "Edit", "MultiEdit"):
        return 0

    tool_input = payload.get("tool_input") or {}
    file_path = tool_input.get("file_path", "")

    # Don't scan .env files — they're for secrets and are gitignored.
    if file_path.endswith((".env", ".env.local")) or "/.env." in file_path.replace("\\", "/"):
        return 0

    candidates = [
        tool_input.get("content", ""),
        tool_input.get("new_string", ""),
    ]
    for edit in tool_input.get("edits", []) or []:
        candidates.append(edit.get("new_string", ""))

    blob = "\n".join(c for c in candidates if c)
    if not blob:
        return 0

    for pattern, label in PATTERNS:
        if re.search(pattern, blob):
            sys.stderr.write(
                f"[secret-leak-guard] Blocked {tool} on {file_path or '(unknown)'}: "
                f"matched pattern '{label}'. If this is a placeholder or false positive, "
                f"adjust the value or update .claude/hooks/secret-leak-guard.py.\n"
            )
            return 2

    return 0


if __name__ == "__main__":
    sys.exit(main())
