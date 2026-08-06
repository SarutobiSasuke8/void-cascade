You are running a structured playtest review of **Void Cascade**.

Read `CLAUDE.md` (contract and verification policy), `STYLE_GUIDE.md` (the art bible),
`docs/PLAYTEST_CHECKLIST.md` (what a passing build looks like) and
`docs/INPUT_CONTROL_MAP.md` (what the controls are supposed to be) before starting.

## Task

The user's request is: $ARGUMENTS

If no request is given, run a full playtest review of the current build state.

## Protocol

1. **Establish the build.** Confirm the branch, working-tree state and what changed since
   the last playtest (check `Session Logs/` for the previous verdict).
2. **Run the checklist.** Work through `docs/PLAYTEST_CHECKLIST.md` section by section.
   Verify in code and by measurement whatever you can — pixel probes for rendering, frame
   simulation at 60/90/144Hz for timing, path existence for assets. For anything that
   genuinely requires a human at the keyboard, turn it into a concrete instruction the
   user can perform in under a minute, and collect their observation.
3. **Check the control map.** Verify implemented inputs against
   `docs/INPUT_CONTROL_MAP.md`. Flag undocumented inputs and unmapped actions as failures.
4. **Judge the loop and the feel.** Rotation weight, thrust inertia, fire rate, shield
   timing, wave pacing. Give tuning values, not adjectives.
5. **Judge the vibe.** Does the black stay black, does everything important glow, do the
   particles still carry the emotional weight?

## Output

- Completed checklist with pass/fail per section, and measurements where you took them.
- Verdict: `pass | pass with issues | fail`.
- Issues written as `TODO.md`-ready lines, ordered by impact on the core loop.
- The single highest-impact question the next playtest should answer.

Do not soften a failing verdict. A broken restart, a wave-count bug, laggy input, or a
dead asset path fails the build no matter how much else works.
