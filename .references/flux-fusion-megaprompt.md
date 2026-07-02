# FLUX FUSION — the Multi-Model Orchestration System (v3)

**What it is:** a portable, $0 orchestration system that turns several different LLMs into ONE system that produces a measurably better, lower-hallucination answer than any single model — by making them *complement* each other instead of competing. Drop it into any workspace, name your models (any vendor), and run the flow. This is the upgraded **v3**: it now has **three axes** — breadth (panel), depth (trinity), and **parallel (swarm — split a big task across models at once)** — plus a **cross-watch review** where each model hunts the others' weaknesses, an **external-evidence fact-check**, a **learning loop that gets smarter every run**, a **measured quality floor** so a merge can never make the answer worse, and a **run log** that proves which models actually did the work.

**Why it beats one model:** different labs trained on different data make *different* mistakes. When models draft independently, cross-examine through *distinct lenses*, and a judge keeps only what survives — fabrications get caught (different architectures rarely hallucinate the *same* thing), gaps get filled, weak parts get rewritten. The lift is largest on **hard, open-ended, high-stakes** work and near-zero on trivial tasks — so a planner sends easy tasks solo and saves the heavy machinery for where it pays.

---

## 0. The router picks the right mode per task

| Mode | When | What runs |
|---|---|---|
| **SOLO** | simple / tactical / short | one best-fit model, one shot (fast, cheap) |
| **RELAY** (collaborate) | code & build work — models hand off | one model AUTHORS → a second REVIEWS & REWRITES in real time → a **fresh-eyes model cross-watches** → judge finalizes |
| **PANEL** (breadth) | hard / multi-perspective | many models draft in parallel → cross-verify → synthesize → judge |
| **TRINITY** (depth) | hard *multi-step* (long reasoning, algorithms, gnarly debugging) | one Thinker→Worker→Verifier loop that refines until a verifier accepts |
| **SWARM** (parallel) | large / decomposable (build N files, audit N modules, draft N sections) | a planner splits into independent parts → **workers build them in parallel** (each routed to its best seat) → synthesizer merges into one |

A fast model decides mode per request. **RELAY** makes the models *build on each other* (the best coder improves the reliable author's real work, in real time); **PANEL** explores many angles at once; **TRINITY** iterates one answer until verified. Routing correctly is where most of the cost is saved — and the reliable author/lead is always the floor, so a collaborative run can never come back empty.

---

## 1. The roster — each model owns ONE job (no overlap = complement)

Name your models. Pick from *different labs* — diversity is the engine. Route by **benchmarked strength**, never one model for everything.

| Seat | Use a model that's… | Owns this lens | Best for |
|---|---|---|---|
| **CORRECTNESS** | precise / agentic / tool-strong | "is this right, will it run, are the steps sound" | code, tool-use, factual rigor |
| **COMPLETENESS** | broad, low-hallucination | "what's missing, every case covered, nothing invented" | coverage, reasoning, grounded work |
| **CLARITY** | fast, clean, well-structured | "is this clear, shippable, well-organized" | writing, structure, agent steps |
| **RISK** | a sharp algorithmic/analytical reasoner | "how does it fail, edge cases, the downside" | red-teaming, math, hard algorithms |
| **JUDGE** | your single strongest, most-careful model | final authority: synthesize, fact-check, write the final | high-stakes only (held in reserve) |

> Two hard rules that drive the quality: **(1) the JUDGE never drafts** — held back so it evaluates with fresh eyes. **(2) A model that's elite at *generating* but weak at *reviewing* (e.g. a competitive-code specialist that false-positives on review) may DRAFT but must NEVER synthesize or verify** — the merge goes to your most reliable, best-presenting model.

---

## 2. The pipeline — copy-paste prompts

### STAGE 1 — PLAN (route in real time)
```
You are a routing planner. For the TASK, decide:
- mode: "solo" (simple) | "panel" (hard/multi-perspective) | "trinity" (hard multi-step needing iterative depth)
- seats: which 2-4 of CORRECTNESS / COMPLETENESS / CLARITY / RISK the task needs (panel mode)
- stakes: "routine" or "high_end" (flagship / customer-facing / ships to production)
- grounding: does a correct answer depend on external facts to look up? (true/false)
Pick the most COMPLEMENTARY team — models that each add a distinct strength, not duplicates.
Output JSON: {"mode":"...","seats":[...],"stakes":"...","grounding":bool,"reason":"..."}
TASK: <task>
```

### STAGE 2 — DRAFT (independent, parallel, strength-aware)
Send the SAME task to each seat independently (they must NOT see each other yet). Tell each model its edge:
```
You are one member of an elite multi-model panel. Your benchmarked edge: <that seat's strength>.
Produce YOUR strongest, complete answer. The others answer the same task and you'll cross-examine each
other, so make this defensible. NEVER invent specifics (numbers, names, URLs, citations, APIs) — if you
don't know, say so; abstaining beats fabricating.
TASK: <task>
```

### STAGE 3 — VERIFY (each model, its own lens, span-level)
```
You are an ADVERSARIAL reviewer through the <SEAT> lens ONLY. For each problem visible through THIS lens,
output one line: [SEVERITY high|med|low] the specific issue -> the single best fix. Flag EVERY unsupported
or likely-fabricated specific explicitly as [UNSUPPORTED]. Report every issue, even low-severity; no praise.
TASK: <task>
DRAFTS: <all drafts>
```

### STAGE 4 — SYNTHESIZE (your reliable, best-presenting model — never the weak-at-merge one)
```
You are the synthesizer. Merge the strongest material from ALL drafts and fix every VALID issue from the
lens-critiques. DROP any claim flagged [UNSUPPORTED] unless the task/context supports it. Resolve conflicts
toward the more correct option, preferring the draft from the model whose strength matches this task. Keep
every piece of real substance. Output ONLY the merged answer.
```

### STAGE 4.5 — EVIDENCE CHECK (factual tasks only — the anti-hallucination upgrade)
This is the one check cross-model agreement *cannot* give you: catch a fact that all your models are confidently wrong about. Retrieve real evidence (your docs / a search / a vector store), then:
```
You are a strict fact-checker. Given EVIDENCE and an ANSWER, extract the answer's checkable specific claims
and verdict EACH: "supported" only if directly entailed by the evidence; "unsupported" if it contradicts or
is a checkable specific absent from it; "unverifiable" if the evidence is silent (when in doubt, unverifiable).
Output JSON: {"claims":[{"claim":"...","verdict":"..."}]}
EVIDENCE: <retrieved sources>   ANSWER: <stage 4 output>
```
Then re-run the synthesizer once: *"remove or hedge ONLY these unsupported claims, change nothing else."* **Skip this entirely if you have no real evidence** — never delete a claim on thin evidence. Count the unsupported claims — that's your *measured* hallucination number.

### STAGE 5 — JUDGE (your strongest model — the step that makes fusion ≥ your best single model)
This is the guarantee. Because clause **E (FLOOR)** forbids the judge from going below what it would write alone, **running the judge means the fused answer is *at minimum* as good as your single best model — and better whenever the panel caught something that model alone would've missed.** So keep the judge **on whenever you want that guarantee** (the strong default for any judgment-grade output). The *only* reason to skip it is pure cost-saving on easy, already-agreed routine tasks — and even then, **auto-escalate when the drafts disagree** (low overlap between drafts = a strong difficulty signal). Always-on = ≥ your best model every time; gated = ≈that, cheaper.
```
You are the final judge — the council's last authority and strongest single reasoner. Work through A–E
internally, output ONLY the final answer:
A) CORRECTNESS: verify the task is fully/correctly solved; for code/math mentally execute the critical path.
B) CONSENSUS vs CONFLICT: agreement = higher confidence; resolve conflicts toward the most defensible option.
C) HALLUCINATION SWEEP (span-level): check every number, name, date, citation, URL; remove/qualify anything
   unsupported or not derivable from the task/evidence.
D) COMPLETENESS + BLIND SPOTS: add what the panel missed.
E) FLOOR: your final MUST be at least as strong as the best single expert would produce alone — the panel
   may only ADD, never subtract.
TASK: <task>   CANDIDATE: <stage 4/4.5 output>
```

### TRINITY (depth mode) — the iterative alternative to the panel
For hard multi-step work, instead of breadth, loop three roles until verified:
```
THINKER: decompose the task into the key steps + what the solution MUST get right (plan only, don't solve).
WORKER:  using the plan + any verifier feedback, produce/improve the full solution.
VERIFIER: evaluate vs the task + plan. Reply "ACCEPT" if it's correct, complete, top-tier — else "REVISE"
          + the specific fixes. Loop WORKER↔VERIFIER until ACCEPT or a turn budget (e.g. 3). Carry the full
          transcript each turn. Use a DIFFERENT model as verifier than the worker (diversity).
```

### RELAY (collaborate mode) — the models build on each other in real time
The highest-value pattern for **code and build work**: don't have models draft blind in parallel — have them *hand off*, each improving the previous one's actual output.
```
1. AUTHOR  — your reliable, fast coder writes the first complete solution.
2. REFINER — your strongest/agentic coder receives the AUTHOR's ACTUAL code and rewrites it:
   "You're given a teammate's draft. Improve it for real — fix every bug, missing edge case, error path,
    race, and non-idiomatic or suboptimal choice. Output the COMPLETE improved solution (full, runnable),
    never a diff. If it's already optimal, return it essentially unchanged."
   (Use a DIFFERENT model than the author — it catches what the author couldn't see in its own work.)
3. JUDGE   — on high-stakes, your strongest model does the final correctness + execution pass.
```
Why this beats parallel-then-merge for code: the best coder works **on the real draft** instead of blind-merging fragments, and the reliable author is the **floor** — if the refiner stalls or times out, you still ship the author's working code, so a code run can never come back empty. (This is the "your reliable coder writes it → your agentic coder sees it could be better and replaces it in real time → your strongest model finalizes" flow.)

---

## SWARM (parallel decomposition) — many parts, built at once

For large, decomposable work — *build these 5 files, implement this multi-component module, audit these N modules, draft these N sections.* A planner splits the task into independent sub-tasks, workers build them **in parallel** (each routed to its best-suited seat), then a synthesizer merges everything into one coherent deliverable.

| Use SWARM when | Don't use SWARM when |
|---|---|
| 3+ genuinely independent parts | A single cohesive answer (one essay, one API design, one root-cause) |
| Parts complete without reading each other's drafts | Each step depends on the prior step's output |
| Wall-clock matters and you can run workers concurrently | You need one unified voice from line one |

**Speed win:** wall-clock ≈ the **slowest single part**, not the sum — five 2-minute parts finish in ~2 minutes, not ~10. **Routing win:** each part goes to the seat that's best at it.

**Stage 1 — DECOMPOSE** (your strongest reasoner):

```
You are the SWARM PLANNER.
TASK: <paste full task>

Split this into independent sub-tasks — each completable WITHOUT reading
another worker's draft. Output:
1. MERGE CONTRACT — shared interfaces, naming, file layout, and assumptions
   every worker must follow so outputs combine cleanly.
2. SUB-TASK TABLE — id | deliverable | why it's independent | best seat
   (agentic coder / reliable generalist / sharp reasoner).
3. SYNTHESIS NOTES — how to merge, what to dedupe, what to reconcile.

Rules: no two sub-tasks own the same file/function unless one is explicitly
"integration only." If the task can't be cleanly split, output
NOT_SWARM — USE SOLO OR TRINITY and stop.
```

**Stage 2 — DISPATCH** — run one prompt per sub-task, **concurrently**, routing by the planner's seat column:

| Sub-task type | Route to |
|---|---|
| Code, tests, refactors | Your fast agentic coder |
| Prose, specs, docs | Your reliable generalist |
| Audits, tradeoffs, edge-case analysis | Your sharp reasoner |

```
You are SWARM WORKER <id>.
MERGE CONTRACT: <paste from planner>
YOUR SUB-TASK: <paste one row>

Complete ONLY your sub-task. Don't merge, summarize, or touch other parts.
Follow the contract exactly so your output integrates without conflict.
Output: the deliverable + a short handoff (files touched, public APIs,
assumptions made, open questions for synthesis).
```

> **Concurrency cap:** dispatch at most N workers at once (N = what your rate limits comfortably allow, often 3–5); queue the rest. **Never drop a part:** if a worker stalls, errors, or returns empty, re-dispatch that sub-task to your reliable generalist. The swarm degrades to a slower path, never a broken one.

**Stage 3 — SYNTHESIZE** (your reliable author):

```
You are the SWARM SYNTHESIZER.
MERGE CONTRACT: <paste>
WORKER OUTPUTS: <paste every deliverable + handoff>

Merge into ONE coherent deliverable:
- Resolve conflicts; prefer the merge contract on ties.
- Remove duplication, wire interfaces, fix cross-part inconsistencies.
- Integrate any fallback output; leave no gaps.
Integrate and polish — do NOT redo the work. Output the unified artifact
+ a brief merge log (conflicts resolved, gaps filled).
```

> **Honest caveat:** SWARM only pays off with a clean split. Bad decomposition creates merge conflicts and duplicated logic — the value lives in the planner's contract, so spend effort there before any worker starts.

---

## CROSS-WATCH REVIEW — each model watches the others for weaknesses

An upgrade to the RELAY / code flow that makes the models check each other instead of trusting one pass:

> author → refine → **cross-watch review** → judge

After your author drafts and your refiner improves it, a **fresh-eyes reviewer — a different model/architecture than the one that just refined** — runs a final adversarial pass, then the judge finalizes. **Why it works:** different architectures rarely make the *same* mistake, so a reviewer from another family catches the bugs, bad APIs, races, and edge cases that self-review systematically misses.

| Stage | Seat |
|---|---|
| Author | Your reliable author |
| Refine | Your fast agentic coder (or strongest model for hard logic) |
| **Cross-watch review** | **A different model than the refiner** |
| Judge | Your strongest model |

```
You are the CROSS-WATCH REVIEWER. You did NOT write or refine this — fresh eyes only.
ORIGINAL TASK: <paste>
REFINED SOLUTION: <paste full revision>

Treat the revision as GUILTY until proven correct. Hunt EVERY weakness it
introduced or left behind:
- bugs, regressions, logic errors
- missed edge cases / failure modes (empty, null, overflow, concurrency)
- wrong or deprecated APIs, types, contracts, environment assumptions
- races, resource leaks, performance and security holes
- non-idiomatic or unmaintainable choices that would fail code review

Fix ALL of them. Output the COMPLETE corrected solution — not a diff, not a
list of comments (the next stage receives only your output). If you find
nothing material, say so, then output the full solution unchanged.
End with: VERDICT — PASS | FIXED | BLOCKED (list blockers).
```

> **The review must never silently skip.** If your fresh-eyes reviewer returns empty, times out, or is unavailable, **fall back to another model** (reliable generalist, then strongest) so the review ALWAYS happens. A silently skipped review is worse than no plan — it manufactures false confidence that the work was checked.

**Honest framing:** cross-watching *drives* output quality toward the 0%-bad ideal by turning each model into the others' error-detector. That ideal is the **target** the process is engineered around — not a mathematical guarantee. Architecture-diverse review misses far less than any single model alone, but "far less" is not "never."

---

## OBSERVABILITY — prove which models did the work

Without a log you're *assuming* your models ran in the right roles. Write **one line per run** and you can see actual participation, catch a model silently falling back, and measure cost/latency per mode.

```json
{"ts":"<ISO-8601>","mode":"swarm","seats":[{"role":"planner","model":"strongest","ms":4200,"degraded":false},{"role":"worker","model":"agentic-coder","subtask":"auth","ms":38000,"degraded":false},{"role":"worker","model":"generalist","subtask":"docs","ms":51000,"degraded":true}],"ms":84200,"degraded":true}
```

| Field | Purpose |
|---|---|
| `mode` | solo \| relay \| relay-crosswatch \| panel \| trinity \| swarm |
| `seats[]` | who participated — `role`, `model` label, optional `subtask`, per-seat `ms`, `degraded` |
| `ms` (top level) | end-to-end wall clock |
| `degraded` | true if any seat fell back — your alarm for silent substitution |

**Tally usage:** append each line to a file and count runs per `model` to see which seats carry the load; filter `degraded:true` to surface every fallback you'd otherwise never notice. Rising degradation means availability or routing needs attention — not more prompt-tuning.

---

## 3. The two upgrades that make it compound

**A measured floor (a merge can't make it worse).** Score the final answer in the same blind batch as the raw drafts. If the merged final scored materially *below* the best raw draft, the merge regressed it — revert to that draft. A free safety net against the known failure where aggregation corrupts a correct draft.

**A learning loop that gets smarter every run.** After each panel, have a *neutral* model (not one of the drafters — no self-scoring) score the drafts, and record which model won for that task-kind. Route future tasks of that kind toward the proven winner, while still occasionally sampling the others (so an improved model gets re-discovered). **And distill a one-line lesson on every failed run** ("the recurring mistake + the fix"), then inject those known failure modes into future prompts — so the system stops *repeating* mistakes, not just re-picking models. This is the part whose value grows with every cycle.

---

## 4. Routing — send each work-type to its strength
- **Repo / real-world code** (features, refactor, integration) → your best *agentic* coder leads; others verify. (A competitive-code specialist is NOT the best here — it's weak at real-world/repo code and at review.)
- **Algorithmic / competitive code, math** → your competitive-code/math specialist drafts; a reliable model synthesizes the write-up.
- **Strategy / writing / analysis** → your broad low-hallucination model leads; the sharp reasoner critiques.
- **Cheap / mechanical** (classify, summarize, extract) → skip the whole thing; one cheap model, one shot.

## 5. Cost discipline (why it's affordable)
- The PLAN call is cheap; easy tasks exit at `solo` → you rarely pay for the panel on trivial work.
- Mechanical calls go to the cheapest model. The expensive judge fires only on high-stakes OR genuine draft disagreement — and *skips* on easy consensus, a net saving.
- A hard per-model wall-timeout means a slow/cold model drops from the panel instead of stalling it.

## 6. Why it works (the mechanism, not magic)
1. **Independent drafts** → diverse candidates, no anchoring.
2. **Lens-specific critique** → each model's strength becomes the others' error-detector.
3. **Synthesis** → keeps only what survives every lens.
4. **External-evidence check** → catches *correlated* hallucinations cross-model agreement can't (the one verification axis intrinsic methods miss).
5. **Judge + hallucination sweep** → strips unsupported specifics.
6. **Measured floor + learning loop** → the merge can't regress, and the router gets sharper every cycle.

**Honest note:** the lift is real but *task-dependent* — big on hard/open-ended work, ~zero on trivial tasks (which is why the planner sends those solo). Don't take a number on faith — measure it on YOUR tasks with a blind A/B: generate one answer solo, one with the full flow, and have a *different* model score both 0-10 without knowing which is which. Trust the number you measure.

---

## How this compares to renting an orchestrator (e.g. Sakana Fugu)

In June 2026, Sakana AI shipped **Fugu / Fugu Ultra** — a multi-model *orchestrator-as-a-product*. Its own published benchmarks make the case for this entire approach: **Fugu Ultra scores ~73.7 on SWE-bench Pro — ahead of the strongest single frontier models** (e.g. Claude Opus 4.8 at 69.2), and matches the top closed models on hard engineering/reasoning. In other words, **Fugu's results prove that orchestrating many models beats even the best single model** — better than relying on any one flagship alone.

FLUX FUSION is built on that exact insight — and then goes further on the things that actually matter when you're *building* with it:

| | Sakana Fugu (rented) | **FLUX FUSION (this)** |
|---|---|---|
| **Cost** | metered API (~$5/$30 per 1M; up to ~$10/heavy message) or a monthly plan | **$0 marginal** — runs on the model memberships/plans you already have |
| **Control** | hidden, **non-auditable** routing; a **fixed pool you can't exclude models from** | **you see + control every model, lens, and route** — and can swap any model out |
| **What you get** | a black box you send a prompt to | a **system you own and can modify** — every stage prompt is yours |
| **Depth** | one orchestration mode | **two axes: panel (breadth) + trinity (depth, refine-until-verified)** |
| **Hallucinations** | internal only | **+ an external-evidence fact-check** that catches the *correlated* hallucinations cross-model agreement can't |
| **Gets smarter** | fixed | a **learning loop** that adapts routing to *your* tasks every run |
| **Data** | your prompts leave to a third party | **stays in your stack** — route nothing sensitive to models you don't trust |

**The honest version:** Fugu's headline numbers are Sakana's own (a launch benchmark), and we're not claiming a head-to-head benchmark win — that's not the point. The point is that **the orchestration approach Fugu validated is something you can own outright with FLUX FUSION**: same core idea (a pool of models beating any single one), but **$0, fully auditable, in your control, extensible, and with depth + evidence-checking + self-learning that a rented black box doesn't hand you.** Fugu proved the ceiling is higher than any one model — FLUX FUSION lets you reach for it on your own terms.

---
*FLUX FUSION v3 — many models, one answer, measurably better and lower-hallucination. Breadth + depth + parallel, with each model watching the others for weaknesses. Build it once; run it on every high-stakes output. Works with any models from any vendors.*
