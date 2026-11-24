# V16 validation

`tools/test_v16.mjs` at commit after dd5a46f, Chromium with SwiftShader WebGL, 1280×720. All 18 checks pass. `tools/test_v15.mjs` still covers the campaign, bosses, ending, shop and UI; its boss, weapon, set-piece, shop, ending and UI checks passed on V16.

| Check | Result |
| --- | --- |
| Shield blocks exactly 2 hits, then you take damage | PASS |
| Grenades stack to 3 | PASS |
| Power bolts and rapid fire last 15 s, coin magnet 20 s | PASS |
| Drones: max 2, hit with you, repaired by a pickup, pickup ignored at full health | PASS |
| HUD shows drone health and countdown rings | PASS |
| Each drone fires at rifle rate for 60% of rifle damage | PASS |
| Every biome has a rusher that closes in, rears up and strikes | PASS |
| Every biome has a spitter that holds 12-15 m and lobs onto a marked spot | PASS |
| Rushers can be outrun | PASS |
| Siege: generators keep the gate shut; destroying them opens it | PASS |
| Hold point: the gate stays shut for the countdown, then opens | PASS |
| Fork and bridge: stepping into the chasm or water costs health and puts you back | PASS |
| Escape: the wall behind you advances | PASS |
| Canyon: walls and spitters on the ledges | PASS |
| All 30 levels can be finished (invulnerable bot, Medium) | PASS |
| Bot clears Easy on every level from the Desert on (the Forest bot predates V16 and is not scored) | PASS |
| No page or console errors | PASS |

Measured: each drone deals 4.95 damage per second (target 5: the rifle's base 8.33 shots/s × 60%). Spitters held 12.0–14.8 m. Every level finished with the invulnerable bot on Medium; the Easy bot finished every Desert-to-City level.

Not verified: frame rate on real hardware, and how it feels to play. The Forest's Level 2 is not finished by the simple Easy bot (it dies to the V14 pits and thorns, not to V16 content); the Forest was never in the bot's Easy check.

Screenshots: `docs/v16/`.
