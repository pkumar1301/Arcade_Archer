# Jungle Soldier V14: the Forest campaign (L2–L5, the Beetle Tank, level select and progression)

Built on V13. Covers section 14 of the change brief. Overgrown Trail (L1) plays exactly as in V13: same course, enemies, damage and bot results.

## Levels as data (`levels.js`)
Every level is described in `levels.js`: length, enemy mix, wave settings, hazard density, lighting and music. All five levels share one engine; the course (hazards, cover, rocks, ferns, pits, coins) is rebuilt per level into `courseGroup`. L1 is rebuilt from the same random seed, so it is identical to V13.

| Level | New idea | Enemies | Hazards and lighting | Music |
| --- | --- | --- | --- | --- |
| L1 Overgrown Trail | V13 level | Drones, crawlers, turrets | Sunrise | Jungle Rush |
| L2 Temple Approach | Turret gauntlet | Drones, crawlers, a turret every 70–90 m with cover 13–15 m in front of it | Sunrise | Canopy Charge |
| L3 Buggy Run | Leaf Buggies on marked lanes | Drones, buggies (every 60–75 m, and in every 4th wave), crawlers | Seven pit gates (two pits leave one safe lane); dusk fog | Jungle Rush |
| L4 Hive Grove | Hive bees and spore mushrooms | Hive bees (every 120–140 m), drones, turrets | Three spore mushrooms before each hive bee; dusk fog | Canopy Charge |
| L5 Night of the Ancients | Gauntlet | All five types; waves 25% more often; two crawlers side by side at 475 m | Six extra pits and eight extra thorns; night lit by 24 temple lanterns | Night Patrol |

Every level keeps the V12–V13 systems: 55 m warm-up, health drops, warnings, entrances and fade-in, final wave, finish gate and results.

- **Cover blocks enemy fire** on L2–L5 and in the boss arena (L1 keeps V13 behaviour, where bolts pass through cover).
- **Easy on L2–L5** keeps half of each level's new enemies, half the loose pits, one pit per pit gate and every other thorn row (`featureKeep`, `pitKeep`). Medium and Hard get the full layout. This is what lets the bot clear Easy on every level.

## New enemies and objects
- **Leaf Buggy** (`jungle-biome/enemy_leaf_buggy_front`, 8 HP). Enters 45–50 m ahead from the path edge, picks the lane you are in, shows a red ground lane marker for 1.5 s, then charges down it at 10 m/s. Four seed pods on its back glow cyan and take 2 hits each (8 HP total); the body is armoured (35%). A ram costs 5 / 10 / 18; a buggy that gets past costs normal leak damage.
- **Hive bee** (`enemy_hive_bee`, 10 HP). Hovers 20–25 m ahead and releases 3 mini-drones every 4 s. The honeycomb belly (cyan glow) takes double damage. A grenade clears every mini-drone within 9 m. Only one bee is active at a time, and it flies off after 12 / 16 / 20 s, or as the clear run begins.
- **Mini-drone** (drone art at half size, 1 HP, never shoots). A mini-drone that gets past costs 1 / 3 / 5. Mini-drones and mushrooms are not counted in Kills or Leaks on the results screen.
- **Spore mushroom** (`plant_mushroom_blue`, 1 HP), beside the path. Shooting it releases a green cloud (`vfx_spore_cloud_green`, 3.2 s) that stuns enemies within 4 m for 2 s (no movement, no firing, green tint). Walking through the cloud slows the soldier by 40%.

## Lighting
Presets in `game.js` (`LIGHTING`): sunrise (V13), dusk (L3, L4, boss: warm fog at 0.021, purple-orange sky) and night (L5: dark blue fog and sky, scenery dimmed, temple lanterns with glow sprites and three point lights that follow the soldier). Enemy art ignores fog and lighting, so enemies stay readable.

## The Beetle Tank (boss)
The arena is the temple clearing past the finish gate: 16 m wide, the soldier strafes the full width and steps 3 m forward or back (S steps back here). Three carved stone blocks give cover and crumble after 6 hits. The tank sits 22 m away in front of the dusk temple backdrop (faded into the sky, never under the floor).

- **Art.** Four damage states (`boss_beetle_tank_siege`, `_brood`, `_rampage`, `_critical`) on one canvas and anchor, swapped at 66%, 33% and 12% health. Brood pods use `brood_pod_sealed` / `_hatching`, placed over the growths painted on the treads.
- **Health** 80 / 120 / 160, shown in a bar at the top of the screen. Armour takes a third of normal damage, the cyan core triple. A rifle round counts as 0.4 against the tank (`BOSS.bulletDamage`), so the fight lasts minutes, not seconds (see validation).
- **Phase 1, Siege (100–66%).** A 3-bolt volley at your lane every 3 s, with the section 6 warning on both cannons (red rings, aim line, charge sound) for 1.1 s. The core opens for 1.5 s after each volley.
- **Phase 2, Brood (66–33%).** Two pods hatch a crawler each every 8 s; the cannons fire every 5 s. Pods swell and pulse for 2.2 s before hatching. A pod has 2 HP; shooting it stops that hatch and deals 5 damage to the tank. Hatched crawlers walk at you and follow normal crawler rules.
- **Phase 3, Rampage (33–0%).** The tank creeps forward. Horn charge: a red lane marker for 1 s while the tank revs and smokes, then it charges down that lane, crushing any cover in it. After the charge it is stuck for 2 s with the core open; grenades do triple damage then. Then a ground slam: a red ring warns for 1 s, and the shockwave must be jumped. Entering Rampage gives 2 grenades.
- **Checkpoint.** Death restarts the fight at the arena (Retry fight), not the level.
- **Kill.** A run of large explosions and a slow-motion beat, then the results.
- **Reward.** 200 coins and the Triple Shot, unlocked immediately. Boss stars: win; 50+ health; under 2:30. Music: Iron Beetle.

## Triple Shot
A spread of 3 rounds (±4.3°), 0.15 s between shots. Q swaps between the rifle and the Triple Shot in every level once it is unlocked; the HUD shows the current weapon. Uses the new `art/sprites/weapon_triple.png`.

## Level select and progression
- The title screen's Launch Mission opens a level-select map (`art/jungle-trail-map.webp`) with L1–L5 and the boss as stops along the trail, at the positions in `docs/forest-art-handoff.md`. Each stop shows its best stars for the chosen difficulty, or a lock. The map has its own difficulty selector.
- Clearing a level on a difficulty unlocks the next one on that difficulty. L1 starts unlocked.
- Results: Continue goes to the next level; after L5 it goes to the boss, and after the boss to the map. Retry replays the level; a death offers Retry level (or Retry fight) and Level map.
- The profile saves per difficulty: unlocked levels, best stars, best score and best time per level, banked coins and unlocked weapons (`profiles.js`, `progress`). Coins collected in a level are banked when you clear it. Guests keep progress for the browser session.
- Save codes: new codes start `JS2-` and carry the campaign. Old `JS1-` codes (V7–V13) still load: a cleared Level 1 becomes an unlocked Level 2 with its stars and score.

## Smaller changes
- Results: Kills now counts every enemy in the run out of the total (V13 counted only wave enemies in the total).
- Music follows the level table (L1 is always Jungle Rush; V13 rotated tracks per run).
- New art: `docs/forest-art-handoff.md` and the files it lists (tank states, Triple Shot icon, trail map). New campaign art is preloaded at start.

## Not in this build
The Quartermaster (armoury, upgrades, loadout, gear on the soldier), the Vine Ripper and the Dual Pistols.

## Testing
`tools/test_v14.mjs` (Playwright; start the local server first). Results in `docs/V14-validation.md`.
