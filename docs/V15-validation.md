# V15 validation

Run on 23 Nov 2026 with `tools/test_v15.mjs` (Playwright, headless Chromium with SwiftShader WebGL). All 13 checks pass.

| Check | Result |
| --- | --- |
| All 30 levels can be finished (invulnerable bot; no stalls at airlocks, pits, portals or rising lava) | Pass |
| Each biome uses its own enemies and hazards | Pass |
| The V14 scripted bot clears Easy on all 25 new levels | Pass (ends with 8 to 94 health) |
| All 28 new enemy kinds spawn, show and can be destroyed | Pass |
| All 16 weapons deal damage | Pass |
| Every biome's Level 3 set-piece triggers | Pass |
| Soldier upgrades apply (130 max health, 4 grenades, starting shield) | Pass |
| Bosses 2-5 go through three phases and can be defeated | Pass |
| Boss weapons unlock free at tier 1 | Pass |
| Overmind death sequence, celebration and New Game+ unlock | Pass |
| Quartermaster purchases spend coins | Pass |
| UI flow: title, six-zone map, level, pause | Pass |
| No page or console errors | Pass |

Boss fight length with a perfect-aim scripted player that fires constantly and never dodges (Medium): Dune Wyrm 47 s, Frost Titan 37 s, Magma Serpent 69 s, Void Manta 116 s, Overmind 62 s. A human who has to aim, dodge and use cover should take roughly two to three times as long. These are starting values for playtests.

`tools/test_v14.mjs` still passes its Forest checks (L1 unchanged, Easy clearable, Medium and Hard punishing, buggy, bee, spores, lighting, Beetle Tank). Two V14 checks now fail by design: Continue opens the Quartermaster instead of the next level, and the weapon chip is always shown.

Not verified here: frame rate on real hardware, and how the fights feel with a person playing. Play locally and report anything that feels off.
