# Jungle Soldier V13: enemy arrivals, sight-range rifle and finish line

Built on V12. Covers sections 11-13 of the V12 change brief. Difficulty damage values, health drops and warnings from V12 are unchanged.

## Enemy arrival (brief section 11)
- **Fade-in.** Every enemy fades in between 85 m and 70 m (`FADE_START`, `FADE_END`) instead of switching on at 85 m. Enemy art ignores fog so it stays readable at range.
- **Entrances.** Recurring waves spawn out of view: drones drop in from above the canopy (easing down over 1.1 s, `ENTRANCE_TIME`), crawlers burst out of the foliage at the path edge with a leaf burst and turn onto the path. Turrets are fixed and fade in.
- **Warning.** About 2 s before a wave (`WAVE_WARNING`), a positional sound plays from its side (rising rotor hum, then a rustle and crunch of leaves) and a red double chevron pulses on that screen edge. Each wave comes from one side; sides alternate.
- **Spawn distance.** Waves enter at least 45 m ahead: `waveDistance` 50 / 48 / 45 (Easy / Medium / Hard), was 40 / 34 / 28.
- **Rifle range = sight.** `combatRange` 30 m to 70 m: hit detection, aim assist, target ring and weak-point exposure all use it. Cover still blocks shots. Enemy fire range is unchanged (7-28 m).

## Finish line (brief section 13)
- **Art.** `art/sprites/finish_gate.png` as a fixed panel across the path (14 m wide, front and back faces so FINISH reads correctly from both sides), lanterns as glow sprites that ignore fog, `finish_line_checker.png` flat on the ground. Gate posts are solid. The old procedural arch is removed.
- **Last stretch.** Recurring waves stop 150 m out (`breatherDistance` 150). One final wave (one extra drone, one extra shooter) is announced and enters as the gate appears (~150 m). "FINAL STRETCH" banner and a music lift (`music.lift(1.12)`: 12% faster, slightly louder) at 100 m. No fixed encounters in the last 60 m.
- **Crossing.** New mode `finish`: 0.6 s at 30% speed, confetti and leaves from the banner, lantern flare, every surviving enemy vanishes (no more damage), the soldier runs on and stops, and the camera arcs round to his face. Results open at 2.9 s.
- **Results.** New mode `results` with a counting tally: time, kills / spawned, leaks, health bonus (health x 10), time bonus (20 points per second under 3:00), total. Stars: cleared; 50+ health; under 3:00 with 3 or fewer leaks. Best stars are saved per difficulty (`profiles.js`, `best.stars`) and shown in the profile line. Buttons: Continue (disabled, "Coming soon" until the level system exists), Retry, Menu. The camera orbits the soldier behind the card.

## Jungle biome art (brief section 12)
`art/jungle-biome/`: 15 transparent sprites with `manifest.json` and README (Leaf Buggy with warm headlights, Beetle Tank intact/damaged, brood pods, armour pieces, temple lantern, Vine Ripper, green spore cloud, dusk temple backdrop, Quartermaster tent, finish gate and line). Only the finish art is used in this build; the rest is for the coming levels.

## Testing
`tools/test_v13.mjs` (Playwright; start the local server first). See docs/V13-validation.md.
