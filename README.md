# iuseai — just-answer mode for Claude Code

A Claude Code slash-command pair + `UserPromptSubmit` hook that toggles a
"just answer the literal question, nothing else" mode for the rest of a
session.

## Commands

- `/just-answer:on` — turn the mode on
- `/just-answer:off` — turn the mode off

Trigger phrases (as a whole prompt) also work: "just answer mode" / "淨係答我" / "簡答模式" to turn on, "normal mode" / "正常模式" to turn off.

## Install

1. Copy `commands/just-answer/` into `~/.claude/commands/just-answer/`.
2. Copy `hooks/just-answer.mjs` into `~/.claude/hooks/just-answer.mjs`.
3. Add this to your `~/.claude/settings.json` under `hooks.UserPromptSubmit`:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"$HOME/.claude/hooks/just-answer.mjs\"",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

State is kept per-session under `~/.claude/.just-answer/<session_id>`, so one
session's mode never leaks into another.
