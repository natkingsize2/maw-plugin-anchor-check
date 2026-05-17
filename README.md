# maw-anchor-check

**Filter decisions/specs against 3 anchors: mission, goal, reality.**

Plugin for the `maw` CLI that evaluates a decision text against loaded anchor files and produces a pass/warn/block verdict per anchor, plus an overall score.

## Why

Solo founders and small agent teams drift. After 60+ specs and a thousand commits, "does this still serve the mission?" gets answered by gut feel — and later by regret. anchor-check forces every spec or decision through three explicit filters (Mission, Goal, Reality) in under 100ms, returning an exit code you can wire into git hooks and pre-dispatch gates. No LLM in the loop, no latency cost, deterministic verdicts.

See **[USE-CASES.md](USE-CASES.md)** for concrete workflows, real session transcripts, and the origin story.

## Quick start

```bash
# Install dependencies
npm install

# Run tests
npm test

# Check a decision
npx tsx src/index.ts "Build an AI language app targeting 1000 subscribers"
```

## CLI

```bash
maw anchor-check "build CarBox OBD2 reader Phase 1A"
maw anchor-check --verify HEAD
maw anchor-check --show-anchors
```

## Anchors

| Anchor | Loaded from |
|---|---|
| **Mission** | `~/.claude/projects/-home-agent/memory/project_mission_statement.md` |
| **Goal** | `~/.claude/projects/-home-agent/memory/project_goal_1000_subs_2026.md` |
| **Reality** | `plugins/anchor-check/reality-rules.json` |

### Mission (4Q filter)

1. ช่วยให้คนใช้ AI ดีขึ้น? — Does this help people use AI better?
2. ผู้ใช้ AI → ช่วยคนอื่น? — AI users help others?
3. ราคาเข้าถึงได้ · scale ลดราคาได้? — Accessible price, scalable?
4. multiplier effect? — Compound/network/recurring effect?

### Goal filter

- Aligned with **1000 subscribers by 2026-12-31**?
- Days-remaining countdown
- Acquire strategy × retain strategy balance

### Reality filter

- **Line cap:** 300 lines per file
- **Plugin-first:** Plugin architecture over monolithic
- **Cyber-safe:** No harmful security content
- **Partner-not-replace:** AI as amplifier, not replacement

## Verdict

| Outcome | Meaning | Exit code |
|---|---|---|
| **pass** | All 3 anchors pass | 0 |
| **warn** | Some warnings, no blocks | 1 |
| **block** | Any anchor blocks | 2 |

## Project structure

```
plugins/anchor-check/
├── plugin.json              Plugin metadata
├── reality-rules.json       Static reality checks
├── src/
│   ├── index.ts             CLI handler + runCheck()
│   ├── anchor-loader.ts     Read 3 anchors from filesystem
│   ├── mission-filter.ts    4Q filter
│   ├── goal-filter.ts       Acquire/retain check
│   ├── reality-filter.ts    Cap/cyber/partner check
│   └── reporter.ts          Verdict formatting
├── test/
│   └── anchor-check.test.ts 3 test cases (pass/warn/block)
└── README.md
```
