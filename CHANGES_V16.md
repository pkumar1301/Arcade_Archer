# Jungle Soldier V16: power-ups, attack drones, ground enemies and level layouts

Built on V15. This version adds the playtest feedback and Art Brief 3 (ground enemies, the attack drone and the level kits).

## Power-ups

| Pickup | V15 | V16 |
| --- | --- | --- |
| Attack drone | An invisible auto-shot every 0.85 s for 15 s | A visible gun drone that flies beside you for the whole level (see below) |
| Shield | Blocked 1 hit | Blocks 2 hits and lasts the whole level. A second pickup refills it to 2 |
| Grenade | +1, up to 3 (+1 per Grenade belt level) | Same cap: up to 3 (+1 per Grenade belt level). A pickup with the pouches full is ignored and says so |
| Power bolts | Double damage for the next 8 shots | Double damage for 15 s |
| Rapid fire | Faster fire for the next 12 shots | +50% fire rate for 15 s |
| Coin magnet | 10 s | 20 s |
| Health | +20 | Unchanged |

- Timed power-ups show a countdown ring on their HUD chip. The Power-up time upgrade extends them (+25% per level), as before.
- Each drone's HUD chip shows its health on a cyan ring.

## Attack drones
- Up to 2 drones fly at once: one above your left shoulder, one to the right.
- Each drone fires at the rifle's base rate (0.12 s) for 60% of the rifle's base damage. Soldier and weapon upgrades don't apply.
- Each shot is visible: a cyan muzzle flash, a tracer and a hit spark.
- Drones target the nearest rusher first, including one behind you. Then they take the nearest enemy ahead, then the boss.
- Each drone has 60 health. When you take damage, each drone takes the same amount. A shield-blocked hit doesn't count.
- Below half health a drone shows its damaged art. At 0 it explodes.
- A drone pickup with 2 drones out fully repairs the most damaged one. If both are at full health, the pickup is ignored.

## Ground enemies

Every biome has two new enemies that come at you on foot.
- **Rushers** run at you at about 5 m/s (you run at 6). Each rears up for 0.6 s in its strike pose, then strikes. A rusher keeps attacking until you kill it or outrun it by 10 m. Rolling through the strike dodges it.
- **Spitters** stop 12 to 15 m ahead and keep pace with you. Each lobs a slow shot onto a ring marked on the ground, and its weak point glows while it fires. In canyons, spitters sit on the ledges.

| Biome | Rusher | Its attack | Spitter | Its shot |
| --- | --- | --- | --- | --- |
| Forest | Mushroom brute | Slower, and its smash hits 30% harder | Jungle spider | Acid leaves a burning puddle |
| Desert | Sand scorpion | Faster; its tail stabs from 3 m | Dune spitter beetle | Sand burst blinds you for 3 s |
| Tundra | Frost imp | Leaps in from 7 m; its claws slow you | Ice spider | Ice shard slows you for 2 s and leaves ice |
| Volcano | Magma imp | Leaves burning footprints | Lava spider | Lava blob leaves a burning pool |
| Space | Boarding bot | Shock baton slows you | Plasma tripod | Plasma burst hits a wider area |
| Alien City | Hive soldier | Slashes twice | Hive spider | Goo patch halves your speed |

- They appear from Forest Level 2 onward, with no more than 2 of each kind at once (1 on Easy). Their damage is in `UNIQUE.melee` and `UNIQUE.spit` in `campaign.js`.
- Kills sometimes drop power-ups. The first time each kind appears, a one-line tip describes it.

## Level layouts

The five levels of each biome now play differently. The layouts are in `LAYOUTS` in `campaign.js`.

| Layout | How it plays |
| --- | --- |
| Trail | The open path, as before |
| Open field | More spitters |
| Canyon | Rock walls close in on both sides, with spitters perched on ledges |
| Fork | A chasm (crevasse, lava river or hive chasm) splits the path; pick a side. Falling in costs health and puts you back on the edge |
| Bridge run | A narrow causeway (ice floes, a stone bridge, an organic bridge) over freezing water, lava or a chasm. Stepping off costs health |
| Hold point | The gate stays shut; survive 60 s of rushers, spitters and drone waves (about 42 s on Easy) |
| Siege | Shoot the 2 or 3 generators to open the gate |
| Escape | A sand avalanche, hull breach or lava wave chases you; a HUD pill shows how far behind it is |

| Biome | L1 | L2 | L3 | L4 | L5 |
| --- | --- | --- | --- | --- | --- |
| Forest | Trail | Siege (turret line) | Trail + ambush | Hold point (hive) | Trail |
| Desert | Trail | Open field | Hold point (storm) | Canyon (mortars) | Escape (avalanche) |
| Tundra | Trail | Bridge run (ice floes) | Open field (whiteout) | Canyon (ice caves) | Fork (crevasse) + rams |
| Volcano | Trail | Fork (lava river) | Bridge run | Siege (forge) | Escape (eruption) |
| Space | Trail | Siege (security grid) | Open field (asteroids) | Canyon (shaft) | Escape (hull breach) |
| Alien City | Fork (chasm) | Hold point (labs) | Siege (hive nodes) | Bridge run (spires) | Canyon to the throne |

- Forks and bridges clear their own zone: no logs, coins or obstacles land in the chasm or water.
- Hold and siege levels keep a clear yard in front of the gate.
- The level map and the level-start line name each level's layout.

## Art (brief 3)
- 74 PNGs are prepared into 88 game files by `tools/prepare_art_v16.py`, which merges their aspects into `art_manifest.js`.
- Files go to `art/biomes/<biome>/g_*.webp` and `art/biomes/drone/`.
- The script cuts sprites out of the gray background, slices the shot sheets into projectile, ring and impact, and keeps walls, water, lava and chasm textures opaque.

## Tests
- `tools/test_v16.mjs` checks the power-up rules, the drones' damage rate, every biome's rusher and spitter, and every layout.
- It also runs the invulnerable bot on all 30 levels and the Easy bot on all 30 levels.
- Results are in `docs/V16-validation.md`.
- `tools/test_v15.mjs` still covers the campaign, bosses, ending, shop and UI.
