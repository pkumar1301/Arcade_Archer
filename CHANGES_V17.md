# Jungle Soldier V17: shoulder drone, line of fire and the new enemy roster

Built on V16. This version adds the V17 decisions (25 November 2026) and Codex Art Brief 5: 287 images, prepared into 434 game files.

## Shoulder drone

The two flying drones are gone. With two, the game played itself, and the drones kept flying in front of the soldier and blocking the screen.

- One drone, a small pod mounted on the soldier's right shoulder.
- Its damage per second is a share of your current weapon's, with that weapon's tiers and your soldier upgrades. Power bolts and rapid fire don't count.
- The first pickup gives 25%. Each further pickup adds 10% and repairs it: 25 → 35 → 45 → 55 → 60%. 60% is the cap. At the cap, a pickup repairs it; at full health, the pickup is ignored.
- The pod looks stronger in three steps (25-35%, 45-55%, 60%), and scorched below half health.
- It has 60 health and takes the same damage you take. When it is destroyed, the bare bracket stays on the shoulder and the next drone pickup mounts a new pod at 25%.
- It doesn't carry over between levels.

How the share works: the drone fires at your weapon's rate (between 0.12 s and 0.6 s per shot) and each shot does the share of your weapon's damage for that time. A rifle at 45% deals 3.75 damage per second against the rifle's 8.3.

## Line of fire

- Aim with the mouse; the crosshair stays where you put it.
- A shot travels in a straight line from the gun through the crosshair. The first enemy on that line is hit. Piercing weapons carry on to the next.
- Enemies are hit on their painted art. Transparent pixels inside a picture don't count, so the hit area matches what you see. This applies to every enemy, old and new. Boss weak points are unchanged.
- Enemies level with you, or slightly behind, can be hit.
- The ring around the enemy under the crosshair is gone. The crosshair still turns red over an enemy.
- Rockets (Seeker Pod) and orbs (Orb Blaster) no longer home in. They fly straight from the gun toward the crosshair.

## New enemies

Fourteen new roles, each in all six biomes. Each biome version is the same creature in that biome's materials. Data is in `campaign.js` (`ENEMY_KINDS`, built from `V17_NAMES`); behaviour is in the V17 section of `game.js`.

| Role | What it does | How to beat it |
| --- | --- | --- |
| Blocker | Lumbers in, plants itself on the trail and raises its shell. It is a wall and bashes you up close | Flank it (shots from 2.3 m to the side hit the body), or crack the shell: 12 hits or one grenade. Broken, it takes 1.5x |
| Exploder | Runs at you and swells for 0.75 s when close, then bursts (3.4 m). Killing it also sets it off | Shoot it early. The blast hurts other enemies too. What it leaves depends on the biome: spores, burning oil, frost, lava, a shock ring or acid |
| Ambusher | Waits under marked ground (shaking ferns, a sand swirl, a cracking mound) with a pulsing ring. Bursts out when you are 8.5 m away | Step off the mound. Bullets can't reach it while hidden, but a grenade on the mound flushes it out. Then it fights like a rusher |
| Raptor pack | Three hold back until the leader screeches, then sprint (faster than you run) and pounce | Kill the leader before it calls |
| Wyvern | Flies 22-27 m ahead, dives to 11 m and spits onto a marked spot | Step out of the ring |
| Elite dragon | Plants 26 m ahead and blocks the path until killed. Breathes down a lane marked red for 1.15 s | Leave the lane. Its chest glows while it breathes and once it is wounded (3x) |
| Charger | Walks in, lowers its head (its lane is marked), then charges at 16 m/s | Dodge it and it is stunned for 2.6 s just ahead of you, weak point showing |
| Sniper | Crouches 34-40 m ahead. A red laser shows it aiming for 1.6 s; it locks 0.3 s before firing | Keep moving or roll after the lock. Its lens is a weak point while it aims |
| Latcher | Scuttles at you and clings to your back. Drains health every second and slows you | Roll, jump, or strafe left-right-left. It lets go after 8 s |
| Mimic | A supply chest glowing like a reward, with one giveaway (an eye, a tooth, a twitching leg). Opens within 6.5 m or when shot | Shoot chests from range. It always drops a power-up and 8 coins |
| Shield-bearer | Walks ahead with two spitters. Casts a dome for 4 s: enemies within 8 m take no damage | Kill it first. It is never shielded itself |
| Swarm | Six critters (four on Easy) that bite | One hit each |
| Brood queen | Elite. Stays 27 m ahead and spawns her young every 5.5 s | Shoot the egg sac while it is open (3x). Her young die with her |
| Bomber | Flies in high and drops up to three bombs onto marked spots where you will be | Keep changing pace or lane |

New damage values are in `UNIQUE` in `campaign.js`: `snipe`, `latch` (per second), `breath` and `bash`. Exploders use `explode`, chargers `ram`, bombers `bomb`, swarms and latcher bites `hatch`.

## Which levels bring them

`ROSTER` in `campaign.js` lists the roles per level. The Forest brings in a few new ones per level. Every other biome brings them back in its own skins, and every role appears in every biome. Elites (dragon, queen) come once per biome, on Level 3 and Level 4.

| Level | Forest | Every other biome |
| --- | --- | --- |
| 1 | Swarm, mimic | Swarm, raptor pack, exploder, mimic |
| 2 | Exploder, ambusher, raptor pack, swarm | Blocker, ambusher, wyvern, latcher, swarm |
| 3 | Blocker, wyvern, charger, elite dragon, exploder | Sniper, charger, shield-bearer, elite dragon, raptor pack |
| 4 | Sniper, latcher, shield-bearer, brood queen, ambusher | Bomber, brood queen, exploder, mimic, ambusher |
| 5 | Bomber, raptor pack, sniper, blocker, latcher, wyvern | Blocker, sniper, wyvern, charger, latcher, bomber, swarm |

- Spawn points are spread from 150 m to 130 m before the finish. They avoid the gate yards of hold and siege levels, keep ground enemies off chasms and bridges, and keep elites away from nests.
- Easy keeps each role's first appearance in the biome plus the elites (at least three per level), so every role still appears in every biome on Easy.
- The first time a role appears, a one-line tip names it and says how to beat it.

## Art (brief 5)

- `tools/prepare_art_v17.py` turns the 287 PNGs into 434 files: `art/biomes/<biome>/n_<item>.webp` and `art/biomes/drone/p_<item>.webp`. It merges their aspects into `art_manifest.js`.
- All poses of one enemy share one crop, so the game swaps them in place.
- Three blocker images (Desert, Tundra, Space) came on black instead of gray; the script keys out both.
- Some effects sheets had gray frame or divider bars; the script removes them.
- The drone pods were drawn facing the viewer rather than from behind. They read well on the shoulder, so they are used as delivered.

## Tests

- `tools/test_v17.mjs` checks the drone (shares, tiers, damage, destruction, damage per second for four weapons, shoulder position, no carry-over), the line of fire (pixel hits, transparent misses, level enemies, first on the line, no ring, no homing), all 14 roles in all six biomes, the roster's coverage on Easy and Medium, all 30 levels with the invulnerable bot and the Easy bot, and takes the screenshots in `docs/v17/`.
- Results are in `docs/V17-validation.md`.
- `tools/test_v15.mjs` passes (campaign, every enemy kind including the 84 new ones, bosses, weapons, shop, ending). `tools/test_v16.mjs` passes except its two drone checks, which describe the V16 drones and now fail by design.
