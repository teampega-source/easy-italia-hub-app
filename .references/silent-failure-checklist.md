# THE SILENT-FAILURE CHECKLIST — 16 Bugs Your Agent (and You) Keep Shipping

**A free code-health checklist for AI agents and engineers. Run it on any codebase each cycle. No email, no payment.**

Silent failures are the worst class of bug: the code runs, the exit code is green, the dashboard says OK — and something is quietly broken. They hide for weeks. This is the checklist that catches them. Distilled from real production hunts.

## How to use it
1. Pick a hot-path slice (your send pipeline, your data layer, your job runner).
2. Read each file. For every pattern below, grep/scan for the signal.
3. **Verify against the ACTUAL code and live data** before believing a finding — default to "false positive" until confirmed. (A status-enum bug was only confirmed after dumping the live records and seeing 0 of the assumed value.)
4. Fix only what's real, safe, and minimal. Prove with a before/after.

## The 16 patterns

| # | Pattern | Signal | Why it hides bugs |
|---|---------|--------|-------------------|
| 1 | Empty / swallowed catch | `catch {}` or `catch(e){}` with no log/rethrow | The error vanishes; the caller proceeds as if it succeeded |
| 2 | Dangerous fallback | `.catch(() => default)` / `?? fallback` over a real op | A failure is laundered into a plausible-looking value |
| 3 | Unawaited / fire-and-forget promise | An async call with no `await`/`.then` | Errors become unhandled rejections; ordering breaks |
| 4 | `Promise.race` vs `setTimeout` | race against a timer to "cancel" | The slow promise keeps running — no real cancellation. Use an abort signal |
| 5 | Silent skip with no counter | a `continue`/`return` in a filter with no tally | You can't tell "nothing to do" from "dropped everything" |
| 6 | False-block log line | logs "blocked"/"failed" but doesn't actually block | Diagnosis is harder than with no log at all |
| 7 | Shaped-default gap | a function returns `null`/partial that a consumer reads | Consumer reads `undefined`, renders `0`/blank, or crashes |
| 8 | Eligibility ≠ actionable | a single-filter count reported as the answer | "7 eligible" is a ceiling; real actionable count is lower |
| 9 | `===` vs a prefixed enum family | `status === 'x'` when values are `x_a`, `x_b`… | The exact token is a tiny subset; the rest bypass the check |
| 10 | Presence ≠ readiness | "exists / registered" treated as "live / loaded" | Configured-but-cold fails under a tight time budget |
| 11 | Stub output behind a green exit | a job exits 0 but produced empty/placeholder output | Cron-green ≠ output-usable |
| 12 | Missing error handling around I/O | network/file/db/child-process with no check | A broken dependency becomes an always-pass gate |
| 13 | Speculative write | writing a URL/file/resource claim you didn't verify | You ship 404s and "ready" flags for things that don't exist |
| 14 | Null display placeholder | `?`/`—` masking a schema-mismatch read-failure | A read bug looks like "no data yet" |
| 15 | Non-atomic write on synced disk | `writeFileSync` + `renameSync` on OneDrive/Dropbox/iCloud | The sync agent deletes the tmp mid-rename → ENOENT loops |
| 16 | Stale source read, no age flag | reading a dated file without surfacing its age | You act on week-old data thinking it's current |

## The meta-rule
**Treat `?` / `null` / "silent-when-clean" output as a candidate bug, not a missing source.** A check that logs "blocked"/"failed" should actually block/fail. A producer should write every run, not just on alert — silent-when-clean is indistinguishable from silent-when-broken from the outside.

## The verification discipline (so your fixes are real)
- Trace every number to its lowest writer (aggregate < internal-write < what the recipient actually saw).
- Smoke-test with production-shaped input, not a one-line synthetic.
- A high-confidence claim needs two independent methods agreeing.
- Don't call a class "closed" until 2–3 later cycles show clean via the same check.

---
*Built by [Your Business]. Free to use and adapt.*
