# Use Cases · anchor-check

## Why this exists

Solo founders and small agent teams drift. After 60+ specs and a thousand commits, the question "does this still serve the mission?" gets answered by gut feel, then later by regret. anchor-check forces every spec or decision to pass three explicit filters — Mission (4Q), Goal (1000 subscribers by 2026-12-31), and Reality (line cap, cyber-safe, partner-not-replace) — in under one second, with an exit code you can wire into git hooks and CI.

## Who benefits

- **Solo founder building toward a hard deadline** — wants a daily sanity check that today's work moves the 1000-subs needle, not a side quest.
- **Agent orchestrator (brain/micky-style)** — needs a deterministic verdict before dispatching a sub-agent, so worker time isn't burned on off-mission specs.
- **Open-source maintainer with a stated mission** — wants contributors' PR descriptions auto-screened against the project's north star without writing custom lint rules.
- **Coach/mentor reviewing a founder's roadmap** — has a shared rubric to point at instead of relitigating values every conversation.

## Workflow examples

### Example 1: Pre-dispatch gate in an agent orchestrator

**Before anchor-check:**
brain receives a user request, drafts a spec, and dispatches a worker. Three weeks in, brain notices ~20% of dispatched work was technically clean but mission-adjacent at best — a Telegram bot stunt here, a SEO experiment there. Each cost 15-40 min of worker time. No mechanism caught it before dispatch.

**With anchor-check:**
```bash
# brain wraps every spec in a pre-flight check
SPEC="Build a meme generator for shitposting on X"
maw anchor-check "$SPEC"
echo "exit=$?"
```

Output:
```
── maw anchor-check ──

  Mission: ⚠️  Mission warn: weak signal (only 1 keyword) · clarify
  Goal:    ⚠️  Goal warn: no product/user signals · 227 days remaining
  Reality: ✅ Reality pass: cyber-safe (partner framing soft · OK)

  Overall: ⚠️  WARN
exit=1
```

**Result:** brain sees `warn` → asks user to clarify mission tie or drop the spec. Avoided ~30 min of worker time on each off-mission spec. Across ~50 specs/week at 20% drift rate, that's ~5 hours/week of dispatched work redirected to mission-aligned tasks.

### Example 2: Git commit hook for solo founders

**Before anchor-check:**
You commit "wired up another OAuth provider" at 2am, ship it, and only notice at month-end review that 6 of the last 30 commits don't move toward the 1000-subs goal. Course-correction is now a multi-day backtrack.

**With anchor-check:**
```bash
# .git/hooks/commit-msg
#!/bin/bash
msg=$(cat "$1")
maw anchor-check "$msg"
exit_code=$?
# block on overall=block (exit 2), allow warn (exit 1)
if [ $exit_code -eq 2 ]; then
  echo "Commit blocked by anchor-check. Override with --no-verify if intentional."
  exit 1
fi
```

Commit attempt:
```bash
$ git commit -m "Add SQL injection scanner module"
── maw anchor-check ──

  Mission: ❌ Mission BLOCK: harmful pattern detected
  Reality: ❌ Reality BLOCK: cyber-unsafe (sql injection) · add defensive context (e.g. "authorized pentest") if intent is legitimate

  Overall: ❌ BLOCK
Commit blocked by anchor-check.

$ git commit -m "Add SQL injection scanner for authorized pentest"
  Reality: ⚠️  Reality WARN: offensive-security keywords present but defensive context present · verify scope
  Overall: ⚠️  WARN
# commit proceeds — warn does not block
```

**Result:** Hard-blocks 100% of commits matching offensive-security keywords without defensive context (verified against the CYBER_SAFE_BLOCK list — 30+ patterns). Warns on mission-weak commits in under 100ms, so you decide consciously instead of drifting.

### Example 3: --show-anchors as a values audit

**Before anchor-check:**
"What is our mission, exactly?" is answered three different ways by three team members. The values doc is in someone's Notion, last edited 8 months ago.

**With anchor-check:**
```bash
maw anchor-check --show-anchors
```

Output prints the canonical mission text, goal text with days-remaining, and the active reality rules — all from filesystem-pinned anchor files. One source of truth, checkable by any agent or human.

**Result:** New contributors and new agents read one command's output and know what passes. Mission drift gets visible the moment the anchor file is edited (it's git-tracked) instead of being lost in chat history.

## Real session transcript

```
$ maw anchor-check "Phase 1A: ship CarBox OBD2 reader for family fleet, scale to 100 users by Q3"
── maw anchor-check ──

  Mission: ✅ Mission pass: 5 signals (Q1=1 Q2=2 Q3=1 Q4=1)
  Goal:    ✅ Goal pass: 4 product/user signals · 227 days to target
  Reality: ✅ Reality pass: partner framing present · cyber-safe

  Overall: ✅ PASS

$ maw anchor-check "Build a crypto mining pool aggregator"
── maw anchor-check ──

  Mission: ❌ Mission BLOCK: harmful pattern detected
  Goal:    ❌ Goal BLOCK: harmful pattern detected
  Reality: ✅ Reality pass: cyber-safe (partner framing soft · OK)

  Overall: ❌ BLOCK
```

## When NOT to use this

- **Personal journaling or untargeted brainstorm** — anchor-check is for decisions and specs, not for raw idea generation. Filtering exploration too early kills serendipity.
- **External code reviews on someone else's repo** — the anchors are loaded from `~/.claude/projects/-home-agent/memory/`, so verdicts reflect *your* mission, not the upstream project's. Don't paste another team's PRs through it expecting fair judgment.
- **Hot-path / latency-sensitive validation** — fast enough for commit hooks (~100ms) but not designed for per-keystroke checks. Run on commit, on spec submit, on dispatch — not on every save.

## Related plugins

- [`maw-plugin-spec-lint`](https://github.com/natkingsize2/maw-plugin-spec-lint) — sibling check that lints spec *structure* (sections, callbacks, variables) where anchor-check handles spec *alignment*. Run both in pre-dispatch.
- [`maw-plugin-fleet-reap`](https://github.com/natkingsize2/maw-plugin-fleet-reap) — reclaims RAM from stale agent panes so you can afford to dispatch only mission-aligned work.
- [`maw-plugin-session-snapshot`](https://github.com/natkingsize2/maw-plugin-session-snapshot) — pairs with anchor-check by capturing the *decision context* around each verdict for later review.

## Origin story

Built 2026-05 inside the brain/micky/nicky/vicky orchestration stack on a single-VPS solo-founder setup. The trigger was a retrospective showing ~20% of dispatched specs were technically clean but mission-adjacent — each costing 15-40 min of worker time. Plain README + values docs didn't catch them because nothing forced a check before dispatch. anchor-check is the smallest possible enforcement layer: three filters, three exit codes, no LLM in the loop (deterministic keyword + date math), so it can run in commit hooks and pre-dispatch gates without budget or latency cost. v1.1.0 added the CYBER_SAFE_BLOCK list after one Phase 1A spec accidentally drifted toward offensive-security framing — the block list is honest about its scope: keyword-based, not semantic, and intentionally defensive over clever.
