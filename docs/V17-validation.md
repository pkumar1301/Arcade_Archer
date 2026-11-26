# V17 validation

Run of `tools/test_v17.mjs` (Playwright, Chromium with SwiftShader WebGL, 1280 x 720) against the V17 build on 25 November 2026. Raw results: `docs/v17/V17-test-results.json`. Screenshots: `docs/v17/`.

**31 of 31 checks pass.**

## Checks

| Check | Result |
| --- | --- |
| Drone pickups give 25 -> 35 -> 45 -> 55 -> 60%, then a pickup is ignored | Pass |
| Drone art steps up in three tiers | Pass |
| Drone takes the damage you take (20 -> 40 of 60) and a pickup at the cap repairs it | Pass |
| Drone can be destroyed (bracket stays) and the next pickup mounts a new one at 25% | Pass |
| Drone damage per second is its share of the current weapon (power bolts not counted) | Pass |
| Drone sits on the right shoulder (no flying drone) and does not carry over between levels | Pass |
| A shot through the crosshair hits the enemy painted under it | Pass |
| Transparent pixels inside an enemy picture are not hit (hit area = visible art) | Pass |
| Enemies level with you can be hit | Pass |
| The first enemy on the line takes the hit, not the one behind it | Pass |
| No target ring around the enemy under the crosshair (the crosshair turns red instead) | Pass |
| Rockets and orbs fly straight (no homing) | Pass |
| No role errors in any biome | Pass |
| Blocker: plants a shell wall, front hits soak into the shell, flank hits hurt, a grenade breaks it | Pass |
| Exploder: swells and bursts near you; killing it sets it off | Pass |
| Ambusher: marked ground, bullets cannot reach it hidden (a blast flushes it out), erupts at ~8.5 m and attacks | Pass |
| Raptor pack: three hold until the leader screeches, then run you down | Pass |
| Wyvern: flies, dives and spits onto a marked spot | Pass |
| Elite dragon: blocks the path, breath down a marked lane (dodgeable), chest weak point, path opens when it dies | Pass |
| Charger: a hit in its lane; dodged, it is stunned with a weak point | Pass |
| Sniper: red laser, hits a still target, misses if you move after the lock | Pass |
| Latcher: clings, drains health, a roll shakes it off | Pass |
| Mimic: looks like a chest, opens within ~6.5 m, bites, drops coins and a power-up | Pass |
| Shield-bearer: dome over its escorts (no damage), not itself, gone when it dies | Pass |
| Swarm: six critters that bite, one hit each | Pass |
| Brood queen: stays back, spawns young, egg sac weak point, young die with her | Pass |
| Bomber: flies high and drops bombs on marked spots | Pass |
| Every new role appears in all six biomes (Easy and Medium) | Pass |
| All 30 levels can be finished (invulnerable bot, Medium) | Pass |
| Easy bot (no dodging, fixed weave) clears most levels | Pass |
| No page or console errors | Pass |

## Shoulder drone damage per second (45% share, Medium)

| Weapon | Weapon DPS | Drone DPS wanted | Drone DPS measured |
| --- | --- | --- | --- |
| rifle | 8.33 | 3.75 | 3.69 |
| scatter | 8.71 | 3.92 | 3.76 |
| marksman | 7.27 | 3.27 | 3.24 |
| seeker | 4.89 | 2.2 | 2.11 |

## Easy bot, health left at the finish

The Easy bot holds W, weaves on a fixed pattern, never dodges and aims at the nearest threat. It is a floor, not a model of a player.

| Level | Result | Health |
| --- | --- | --- |
| 1 | finish | 4 |
| 2 | finish | 1 |
| 3 | finish | 74 |
| 4 | finish | 40 |
| 5 | finish | 57 |
| 7 | finish | 94 |
| 8 | finish | 88 |
| 9 | finish | 87 |
| 10 | finish | 100 |
| 11 | finish | 78 |
| 13 | finish | 79 |
| 14 | finish | 92 |
| 15 | finish | 87 |
| 16 | finish | 42 |
| 17 | finish | 39 |
| 19 | finish | 73 |
| 20 | finish | 63 |
| 21 | finish | 100 |
| 22 | finish | 45 |
| 23 | finish | 52 |
| 25 | finish | 64 |
| 26 | finish | 42 |
| 27 | finish | 42 |
| 28 | finish | 70 |
| 29 | finish | 39 |
| 31 | finish | 63 |
| 32 | finish | 88 |
| 33 | finish | 42 |
| 34 | finish | 64 |
| 35 | finish | 30 |

## What these checks do not cover

- How the new enemies feel to a human player, and whether the density is right. That needs playtesting.
- Medium and Hard balance: the scripted bots cannot clear Medium in V16 or V17, so there is no automated baseline.
- Frame rate on real graphics cards, browsers other than Chromium, and touch screens.
- The bosses and campaign are covered by `tools/test_v15.mjs`; layouts and nests by `tools/test_v16.mjs`.
