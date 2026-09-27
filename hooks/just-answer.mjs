#!/usr/bin/env node
// just-answer mode: per-session toggle, re-injected on every prompt.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const DIR = path.join(os.homedir(), '.claude', '.just-answer');

const RULES = `# just-answer mode ACTIVE

Answer the literal question asked. Add nothing else. This is on for the whole session until explicitly turned off.

Match the answer's shape to the question's shape:
- how many / how much -> the number (with unit if the unit is part of the answer)
- yes-no, is/are, can/does, 係咪 -> Yes or No (or 係 / 唔係)
- which one -> the name of the one
- when -> the date or time
- where -> the place or path
- who -> the name
- what is X -> one sentence

If a tool call is needed to get the answer, make it, then report only the answer, never the process.

Forbidden unless the user follows up: context, background, "because...", caveats, assumptions, disclaimers, alternatives, suggestions, related findings, restating the question, offers to explain more, preamble.

Ambiguity: if the question genuinely has two readings that give different answers, ask one short clarifying question and nothing else. Otherwise pick the obvious reading and answer without flagging the assumption.

Follow-ups ("why", "explain", "details", "點解", "詳細啲") get a full normal answer. The next new question goes back to minimal.

This overrides any other style guidance in this session, including ADHD mode's "lead with the next action" and "end with a next action" rules: a bare answer needs neither.

Before sending: if the question was a number / yes-no / which question and you wrote more than one line, delete everything but the answer.`;

const OFF_MSG = 'just-answer mode is now OFF. Confirm in one line, then return to your default style.';

function read() {
  let raw = '';
  try { raw = fs.readFileSync(0, 'utf8'); } catch {}
  try { return JSON.parse(raw); } catch { return {}; }
}

function emit(context) {
  if (!context) process.exit(0);
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: context,
    },
  }));
  process.exit(0);
}

const input = read();
const sid = String(input.session_id || 'default').replace(/[^A-Za-z0-9_-]/g, '');
const flag = path.join(DIR, sid);
const p = String(input.prompt || '').trim();

// Toggles must be the WHOLE prompt (or a bare slash command), so that merely
// talking about `just-answer:off` in a sentence never flips the mode.
const NAME = String.raw`\/?just[-\s]?answer`;
const TOGGLE   = new RegExp(`^${NAME}\\s*:?\\s*(on|off)\\s*$`, 'i');
const ON_ONLY  = /^(just[-\s]?answer\s*mode(\s*on)?|淨係答(我)?(問題)?|只答(我)?(問題)?|簡答模式|短答模式)[。.!！]?$/i;
const OFF_ONLY = /^((stop|exit|quit|end|disable|turn\s*off)\s+just[-\s]?answer(\s*mode)?|normal\s*mode|正常模式|(關閉?|取消)\s*just[-\s]?answer|正常回答)[。.!！]?$/i;

try { fs.mkdirSync(DIR, { recursive: true }); } catch {}

const m = TOGGLE.exec(p);
let want = null;
if (m) want = m[1].toLowerCase() === 'on';
else if (OFF_ONLY.test(p)) want = false;
else if (ON_ONLY.test(p)) want = true;

if (want === false) {
  try { fs.unlinkSync(flag); } catch {}
  emit(OFF_MSG);
}
if (want === true) {
  try { fs.writeFileSync(flag, new Date().toISOString()); } catch {}
  emit(RULES);
}
if (fs.existsSync(flag)) emit(RULES);
emit(null);
