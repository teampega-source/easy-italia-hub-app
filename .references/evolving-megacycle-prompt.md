# ♾️ The Autonomous Mega-Cycle Kit

**A self-improving agent loop that paces itself — every ~2 minutes, forever, getting measurably stronger each cycle.**

Most agent loops repeat the same prompt and plateau. This one **schedules its own next wake-up** (~2 min later), does
real verified work, scores its *own* outcome, folds the lesson forward, raises the bar, and re-arms with a prompt that
is provably different from the last. Drop it into Claude Code (or any harness with a self-scheduling primitive) and the
agent runs continuously and compounds — no babysitting.

Harness-agnostic. Model-agnostic. Zero dependencies (plain Node + your agent harness).

---

## What you get
1. **`loop` skill** — the self-pacing engine: at the end of every cycle it re-arms a wake-up ~2 minutes out (the
   auto-cycling you came for).
2. **`cycle.mjs`** — a pre-flight GO/STOP gate + a post-flight recorder (the cycle's bookends).
3. **`cycle-rl.mjs`** — the reinforcement pass: a grounded reward (0–1) from the *real* outcome + an evolved prompt for
   the next cycle.
4. **The Mega-Prompt template** — the standing driver, with the 5-part evolution contract.
5. **The Laws** — the honesty discipline that stops "evolving" from becoming "inflating."

---

## Quick start (3 steps)
1. **Drop in the skill.** Save the `loop` skill below to `.claude/commands/loop.md` in your project (Claude Code reads
   `/`-commands from there). Save `cycle.mjs` and `cycle-rl.mjs` to a `scripts/` folder.
2. **Kick it off.** In your agent, run: `/loop <your standing goal>` (e.g. `/loop keep improving my pipeline`).
3. **Walk away.** Each cycle ships real work, scores itself, evolves the next prompt, and **re-arms a wake-up ~2 min
   later**. It keeps going until you stop it (remove the final `ScheduleWakeup` call, or just close the session).

---

## 1) The auto-cycling engine — the `loop` skill

> Save as `.claude/commands/loop.md`. This is the piece that makes it cycle on its own. The mechanism: run the work
> now, then **as the last action of the turn, schedule the next wake-up ~120 seconds out** carrying the *evolved*
> prompt — so the harness re-invokes the agent in ~2 minutes and the loop continues. (In Claude Code the primitive is
> `ScheduleWakeup`; any harness with a "wake me later with this prompt" call works — cron, a queue, a timer.)

```markdown
# /loop — self-pacing autonomous mega-cycle

Run one full mega-cycle now, then schedule the next one ~2 minutes out so the loop continues unattended.

## Each invocation
1. PRE-FLIGHT: run `node scripts/cycle.mjs pre`. If it prints STOP, fix the named cause first — never schedule
   through a STOP.
2. SHIP: do N real, VERIFIED tasks toward the standing goal (never idle). Rotate focus areas for variety; bias to
   the highest-leverage work. Verify each task (run it, read the output) before claiming it done.
3. POST: record the cycle — `node scripts/cycle.mjs post --tasks=N --domain=<area> --depth=<1-6> --verified`.
4. RL: run `node scripts/cycle-rl.mjs --lesson="<what this cycle taught>" --next="<next highest-leverage move>"`.
   Read its `evolved_prompt_seed` — that is the driver for the next cycle.
5. RE-ARM (the auto-cycling): as the LAST action of the turn, call `ScheduleWakeup` with:
   - `delaySeconds: 120`  (≈2 minutes — the cadence)
   - `prompt: "/loop " + <the evolved_prompt_seed from step 4>`  (so the next firing re-enters this skill, evolved)
   - `reason: "<one line on what the next cycle will do>"`
   Then end the turn. The harness re-invokes you in ~2 min and the cycle repeats — stronger and deeper.

To STOP the loop: simply omit the ScheduleWakeup call on the final cycle (or close the session).
```

> **No `ScheduleWakeup` in your harness?** Use the equivalent: a `setInterval`/cron that re-runs the agent with the
> evolved prompt every 120s, or append the evolved prompt to a work-queue your runner drains. The contract is the
> same: *re-fire ~2 min later with the evolved prompt.*

---

## 2) The cycle bookends — `cycle.mjs`

> Save as `scripts/cycle.mjs`. Pure Node, no dependencies. `pre` is a GO/STOP gate; `post` records the cycle to a
> JSONL log the RL pass reads.

```js
// scripts/cycle.mjs — pre-flight gate + post-flight recorder for the autonomous mega-cycle.
import fs from 'node:fs';
import path from 'node:path';

const LOG = path.join('memory', 'cycle-log.jsonl');
fs.mkdirSync('memory', { recursive: true });

const arg = (n, d = '') => {
  const hit = process.argv.find(a => a.startsWith(`--${n}=`));
  if (hit) return hit.slice(n.length + 3);
  return process.argv.includes(`--${n}`) ? 'true' : d;
};
const lastCycles = (k) => {
  try {
    return fs.readFileSync(LOG, 'utf8').trim().split('\n').filter(Boolean)
      .map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean).slice(-k);
  } catch { return []; }
};

const cmd = process.argv[2];

if (cmd === 'pre') {
  // A minimal GO/STOP gate. Extend with your own checks (failing tests, stale outputs, error logs).
  // Default heuristic: STOP if the last 3 recorded cycles all shipped 0 tasks (the loop is spinning).
  const recent = lastCycles(3);
  const spinning = recent.length === 3 && recent.every(c => (Number(c.tasks_count) || 0) === 0);
  if (spinning) {
    console.log('STOP — last 3 cycles shipped 0 tasks. Investigate before continuing (the loop is idling).');
    process.exit(1);
  }
  const lastDepth = recent.length ? (Number(recent[recent.length - 1].depth) || 1) : 0;
  console.log(`GO — ${recent.length} recent cycle(s) on record. Last depth ${lastDepth}. Ship real work, then post.`);
  process.exit(0);
}

if (cmd === 'post') {
  const entry = {
    ts: new Date().toISOString(),
    work_shipped: (Number(arg('tasks', '0')) > 0),
    tasks_count: Number(arg('tasks', '0')),
    domain: arg('domain', '?'),
    depth: Number(arg('depth', '1')),
    verified: arg('verified', 'false') === 'true',
    notes: arg('notes', ''),
  };
  fs.appendFileSync(LOG, JSON.stringify(entry) + '\n');
  console.log('recorded:', JSON.stringify(entry));
  process.exit(0);
}

console.log('usage: node scripts/cycle.mjs pre | post --tasks=N --domain=X --depth=1-6 [--verified] [--notes="..."]');
```

---

## 3) The reinforcement pass — `cycle-rl.mjs`

> Save as `scripts/cycle-rl.mjs`. This is the brain: it computes a **grounded reward** from the real cycle outcome,
> reward-ranks your focus areas (exploit what paid off vs explore what's untried), raises the depth bar, and composes
> the **evolved prompt** for the next cycle.

```js
// scripts/cycle-rl.mjs — grounded reward + self-evolving next-prompt for the autonomous mega-cycle.
import fs from 'node:fs';
import path from 'node:path';

const LOG = path.join('memory', 'cycle-log.jsonl');
const arg = (n, d = '') => { const h = process.argv.find(a => a.startsWith(`--${n}=`)); return h ? h.slice(n.length + 3) : d; };
const lastCycles = (k) => {
  try { return fs.readFileSync(LOG, 'utf8').trim().split('\n').filter(Boolean)
    .map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean).slice(-k); } catch { return []; }
};

// Grounded reward (0..1): real, falsifiable signals — NOT self-report.
//   shipped 0.30 · tasks/4 → 0.15 · depth/6 → 0.20 · verified 0.05 · domain-varied 0.10 · grounded-outcome 0.20
// "grounded-outcome" = a REAL downstream result (a sale, a passing CI run, a merged PR, a user reply). Wire your own
// signal into groundedTerm() below; until you do, it returns 0 (honest — the reward simply tops out at 0.80).
function groundedTerm(/* recentCycle */) {
  // EXAMPLE: return fs.existsSync('memory/real-win.flag') ? 1 : 0;
  return 0;
}
function rewardOf(c) {
  const n = String(c?.notes || '').toLowerCase();
  const verified = c?.verified === true || /verif|green|clean|tested|passe|confirmed|no regress/.test(n);
  let r = 0;
  if (c?.work_shipped) r += 0.30;
  r += Math.min((Number(c?.tasks_count) || 0) / 4, 1) * 0.15;
  r += Math.min((Number(c?.depth) || 1) / 6, 1) * 0.20;   // depth ladder: 1 = surface fix … 6 = foundation rebuild
  if (verified) r += 0.05;
  return { r, verified };
}

const recent = lastCycles(10);
const last = recent[recent.length - 1] || {};
const prior = recent[recent.length - 2] || {};
const { r: base, verified } = rewardOf(last);
const variedDomain = last.domain && prior.domain && last.domain !== prior.domain;
const grounded = groundedTerm(last) === 1 ? 0.20 : 0;
const reward = Math.min(1, Math.round((base + (variedDomain ? 0.10 : 0) + grounded) * 100) / 100);

const basis = [
  last.work_shipped ? 'shipped+0.30' : 'unshipped+0',
  `tasks(${last.tasks_count || 0})+${(Math.min((Number(last.tasks_count) || 0) / 4, 1) * 0.15).toFixed(2)}`,
  `depth(${last.depth || 1})+${(Math.min((Number(last.depth) || 1) / 6, 1) * 0.20).toFixed(2)}`,
  verified ? 'verified+0.05' : 'unverified+0',
  variedDomain ? 'domain-varied+0.10' : 'same-domain+0',
  grounded ? 'grounded+0.20' : 'grounded+0(wire-your-own-signal)',
].join(' ');

// Reward-rank focus areas: exploit what paid off, name what's untried.
const byDomain = {};
for (const c of recent) { if (!c.domain || c.domain === '?') continue; (byDomain[c.domain] ||= []).push(rewardOf(c).r); }
const ranked = Object.entries(byDomain).map(([d, rs]) => ({ d, avg: rs.reduce((a, b) => a + b, 0) / rs.length, n: rs.length }))
  .sort((a, b) => b.avg - a.avg);
const exploit = ranked.slice(0, 2).map(x => `${x.d}(avg${x.avg.toFixed(2)},n${x.n})`);

// Depth bar: exceed the recent max (cap 6) — force "deeper", not "wider-and-shallower".
const depthBar = Math.min(Math.max(...recent.slice(-3).map(c => Number(c.depth) || 1), 1) + 1, 6);

const lesson = arg('lesson', '(pass --lesson="what this cycle taught")');
const nextMove = arg('next', '(pass --next="next highest-leverage move")');

// The EVOLVED next-prompt — different + deeper every cycle (the 5-part contract).
const evolved = [
  `[EVOLVED — measurably different + stronger than last]`,
  `1. RL: reward=${reward} | ${basis}.`,
  `2. LESSON (fold forward): ${lesson}`,
  `3. NEXT (reward-ranked): ${nextMove}`,
  `4. EXPLOIT what paid off: ${exploit.join(', ') || 'n/a'}. EXPLORE something untried this window.`,
  `5. DEPTH BAR: reach depth >= ${depthBar} (deeper than last ${last.depth || 1}) OR rotate focus — deeper, never wider-shallow.`,
  `6. EVOLVE: this prompt MUST differ from the last (new lesson, new reward, raised bar) — never just swap numbers.`,
  `Run: cycle.mjs pre -> ship >=N verified tasks -> cycle.mjs post -> cycle-rl.mjs -> re-arm ScheduleWakeup(120s).`,
].join('\n');

console.log(JSON.stringify({ reward, reward_basis: basis, depth_bar: depthBar, exploit_areas: exploit, evolved_prompt_seed: evolved }, null, 2));
```

---

## 4) The Mega-Prompt template (the standing driver)

Use this as your `/loop` argument the first time; thereafter the RL pass regenerates it each cycle. Every re-arm must
satisfy all five parts of the **evolution contract**:

```
[EVOLVED — measurably different + stronger than last]
1. RL: <reward + basis from the last cycle, grounded in the real outcome — falsifiable, not self-report>.
2. LESSON (fold forward): <the one concrete thing the last cycle taught — a rule, finding, or correction>.
3. NEXT (reward-ranked): <the single highest-leverage move — exploit a focus area that paid off, or explore one untried>.
4. DEPTH BAR: reach depth >= <recent max + 1> OR rotate focus — go deeper, never wider-and-shallower.
5. EVOLVE: this prompt must be MEASURABLY different from the last — a re-arm that only swaps numbers is a violation.
Run: pre-flight gate -> ship N verified tasks -> post -> RL pass -> re-arm a wake-up ~120s out with the evolved prompt.
```

---

## 5) The Laws that keep it honest (so "evolving" never becomes "inflating")

- **Depth ladder.** Each cycle deeper than the last (surface fix → foundation rebuild). Stamp depth by honest
  judgment, never a number you're hitting for its own sake.
- **The backlog GROWS.** Net-add ≥1 item per cycle. More understanding surfaces more gaps; a *shrinking* to-do list is
  decreasing awareness, not progress.
- **Self-modify the loop.** Every cycle improves the loop itself — a missed gate, a slow check, a recurring friction —
  derived from *this* cycle's real friction, never speculation.
- **Verify-your-verification.** A surprising "broken / missing / dead" finding is, in order: (1) your own check is
  wrong, (2) a stale read, (3) actually real. Rule out 1 and 2 with a falsifying check before claiming 3.
- **Honesty floor.** Never inflate a metric, and never let a check cry wolf. A clean verify is a valid result — do NOT
  manufacture a finding to look busy. Claim the smaller fact you can prove.
- **Ground the reward.** Self-graded terms cap at 0.80; the top 0.20 requires a *real* downstream outcome (a sale, a
  green CI run, a merged PR, a user reply). Wire that signal in so the loop optimizes reality, not vibes.
- **Cadence.** Keep it tight (~120s). The point is continuous, compounding progress — not a giant batch once an hour.

---

## How it fits together

```
            ┌─────────────────────── every ~2 minutes ───────────────────────┐
            ▼                                                                 │
   PRE-FLIGHT (GO/STOP)  →  SHIP N verified tasks  →  POST (record)  →  RL PASS  →  RE-ARM
        cycle.mjs pre          (the real work)        cycle.mjs post   cycle-rl.mjs   ScheduleWakeup(120s,
                                                                       (reward +       evolved prompt)
                                                                        evolved prompt)
```

Each loop is strictly more informed than the last: past outcomes are scored, the lesson is folded forward, the depth
bar rises, and the driving prompt is rewritten from what just happened. That's the whole trick — **a loop that
rewrites its own instructions, on a 2-minute heartbeat.**

---

## Customize it
- **Cadence:** change `delaySeconds` (120 = 2 min). Tighter = more responsive; looser = cheaper.
- **GO/STOP gate:** add your real checks to `cycle.mjs pre` (failing tests, error-log spikes, stale artifacts).
- **Grounded signal:** implement `groundedTerm()` in `cycle-rl.mjs` to read your real win (Stripe webhook, CI status,
  PR merged, reply received). This is the single highest-value customization — it points the whole loop at reality.
- **Focus areas / domains:** tag each `post` with a `--domain` so the RL pass can reward-rank where to spend the next
  cycle (exploit vs explore).

---

*A free build. Use it, ship with it, make it yours.*
