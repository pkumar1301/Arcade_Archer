# V12 validation

Checked locally in isolated headless Chrome against the actual game module. No console exceptions were observed in the tested scenarios. These checks do not establish subjective visual quality, sound quality, or human completion time.

## Bot

No existing bot executable was present in the package. Recreated the stated behavior: hold W, fire straight ahead without aiming, jump every 1.1 seconds, and strafe toward a sinusoidal target between -2.5 and +2.5 m. Health pickups are collected by the normal in-game proximity check. No health, aiming, movement, or damage advantages were granted.

| Difficulty | Result | Distance | Time | Health |
| --- | --- | --- | --- | --- |
| Easy | Cleared | 950 m | 196.13 s | 10 |
| Medium | Died | 130 m (13.7%) | 27.47 s | 0 |
| Hard | Died | 87.10 m (9.2%) | 20.07 s | 0 |

These results cover one deterministic input pattern, not a distribution of player outcomes. The Easy bot deliberately falls into several pits. The 2:45 to 3:15 human Medium target is not yet verified.

## Rule checks

- Ten seconds after a controlled 17-damage hit, health remains 83 on every difficulty.
- Health pickups cap at 100; collecting at 100 leaves health at 100.
- Shot damage is 4/7/10 and collision damage is 6/12/20.
- Two immediate leaks remove 6/12/20 total health, bypassing recovery.
- Main-path health counts are 3/2/1. Earned caps are 4/3/3 and earned expiry is 12/8/6 seconds.
- A completed test group earns a drop; a leaked group earns none.
- No recurring wave before 55 m. The first wave is eligible after that gate.
- Log contact sets speed to zero, shake to 0.15 and the hit animation state.
- Off-screen warning test produced visible red chevron pixels. Charge sound created and stopped an oscillator in a running AudioContext; subjective audio quality was not assessed.
- Red warning ring shrinks with charge and changes to white in the last 0.2 s. Easy aim line appears throughout charge, Medium in the last 0.6 s, Hard never.
- No rifle readiness or reloading label remains in the HUD. Rapid fire is the player-facing upgrade name.

## Menu

Checked at 1280 x 720, 1366 x 768 and 1100 x 700. When scrolled to the bottom, the Graphics row is fully above the action bar. The more hint is visible at the top of overflowing content and hidden at the bottom.

## Remaining human checks

- Medium completion time with deliberate aiming and obstacle avoidance.
- Perceptual readability of warnings in motion, sound mix, and feel of the log bump.
- Balance across multiple player styles and frame rates.
