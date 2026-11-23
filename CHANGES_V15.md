# Jungle Soldier V15: the complete campaign

Built on V14. The game is now the full campaign from the campaign design and art briefs 1 and 2:
six zones of five levels and a boss (36 stages), from the Forest to the Alien City, ending with the
Overmind, a 90s-style celebration, cast-roll credits and New Game+.

| Zone | Levels | Signature | Boss | Boss weapon |
| --- | --- | --- | --- | --- |
| 1 The Forest | Overgrown Trail · Temple Approach · Buggy Run · Hive Grove · Night of the Ancients | Pits | The Beetle Tank | Triple Shot |
| 2 Sunken Dunes | Glass Sands · Raptor Flats · The Long Storm · Mortar Canyon · Moonlit Dunes | Quicksand, dune ramps, sandstorms, breakable cover | The Dune Wyrm | Lance |
| 3 Frozen Reach | First Frost · Cracking Lake · Whiteout · Glacier Caves · Aurora Gauntlet | Ice slide, thin ice, icicles, snowdrifts, blizzard gusts | The Frost Titan | Grenade Launcher |
| 4 Ashen Caldera | Ash Fields · Crust Walk · Bridge of Embers · The Furnace · Eruption | Lava vents, crust, lava pools, falling rocks, crumbling bridges, rising lava | The Magma Serpent | Orb Blaster |
| 5 Dead Orbit | Docking Bay · Security Grid · Asteroid Run · Maintenance Shaft · Station Breach | Low gravity, void gaps, laser fences, airlocks, meteor showers | The Void Manta | Light Cannon |
| 6 The Hive Capital | Outer Gardens · Cryo Labs · Forge Quarter · Gravity Spires · The Throne Path | Portals, living walls that regrow, every earlier hazard | The Overmind | (the ending) |

Levels stay 950 m (about 3 minutes). No health regeneration, no reloading (V12 rules).

## Data
- `campaign.js`: biomes, all 36 stages, 34 enemy kinds, the five new bosses, weapons, tier prices, soldier upgrades, uniforms, New Game+ and the cast roll. `levels.js` keeps the Forest.
- `art_manifest.js` (generated): the aspect ratio of every image in `art/biomes/`.
- `tools/prepare_art.py`: turns the Codex handoffs into game-ready WebP and JPEG files (gray backgrounds keyed out by flood fill, sheets sliced, effects kept on black).

## Biomes and the polish kit (art brief 2)
- Scenery, sky, lighting, fog, ground and edge colours swap per biome. Each biome has 2 to 5 lighting presets (for example noon, sunset and night in the Desert; snow, whiteout, cave and aurora in the Tundra).
- Ground: three textures per biome (path, side and a blend texture laid in soft patches) with low-frequency colour variation. None are mirrored.
- Decals (10 per biome, instanced), base clutter at the foot of every tree, soft contact shadows under billboards, drifting particles, plant sway, a far horizon strip that scrolls with distance, and foreground framing pieces that sweep past the camera.

## Enemies (and the variety decisions)
- Each biome restyles the three core roles and adds two unique enemies, with the behaviour from the campaign design.
- Desert: scarab drones split into two halves when shot; obelisk turrets fire a fan and burrow to another lane; dune crawlers travel underground and surface in your lane; mech raptors zigzag and pounce, with the chest core showing only mid-pounce; stone tortoises lob mortars onto marked spots.
- Tundra: frost bolts slow you; ice-shell crawlers need 3 hits or a grenade (or the Ember Torch) to crack; cryo turrets ice your lane; snow stalkers leap between cover, with the core showing only mid-leap; glacier rams charge from behind down a marked lane, then run away showing their rear vent.
- Volcano: ember drones explode when killed; magma crawlers leave burning trails; flame turrets sweep an 8 m cone; lantern drones drop firebombs; lava golems block a lane and throw magma, and shooting their chest boulders off exposes the molten heart.
- Space: security drones fire bursts; crawler bots climb onto the ceiling, where their belly core shows; laser turrets fire a knee-high beam at your feet (jump it); eye wisps blink between lanes; shield drones make nearby enemies immune.
- Alien City: elites that mix two biomes (an exploding scarab that splits, a burrowing magma crawler, a cryo laser turret, a blink raptor, a shield stalker, a golem in an ice shell) and the Sentinel, which teleports, fires homing shots and opens its core after each teleport.
- Each biome's Level 3 has a set-piece: a crawler ambush (Forest), raptors in the storm (Desert), a glacier ram stampede (Tundra), a turret nest (Volcano), a meteor storm (Space) and a Sentinel nest (City).

## Bosses
One framework for bosses 2 to 6. Each has three phases at 66% and 33%, an arena in its biome's art, three breakable cover blocks, warnings before every attack, and a restart at the arena on death.
- Dune Wyrm: rises in a lane and spits acid (gills open); burrows and erupts under you (belly exposed); a permanent sandstorm, summoned raptors and a roaring mouth.
- Frost Titan: four ice plates to shatter (grenades crack one each); the arena turns to ice and ground slams open the core; then a blizzard, frost drones and an open core that keeps moving.
- Magma Serpent: rises to fire volleys (throat open); lava waves to jump and tail slams (tail tip exposed); vents everywhere and a roaring head core.
- Void Manta: strafing bomb runs overhead (red pods underneath); a beam sweep to jump and eye wisps; a crash and a crawl toward you with the core on its back exposed. Low gravity in the hangar.
- The Overmind (Trophy Throne): five trophies (beetle horn, two frost plates, wyrm collar, serpent scales) shot off its armour; then the shell splits, tendrils erupt under you and elites arrive; then the exposed heart with gravity shifts, lava waves and beam sweeps. It taunts at the start, at each phase, below 10% and when you die (the fight freezes while the line types out).

## The ending
Kill shot in slow motion, chain explosions, a white flash, dawn over the city and a victory pose. Then a 90s celebration: MISSION COMPLETE in chrome letters, fireworks, a tally with a final rank, CONGRATULATIONS, cast-roll credits of every enemy and boss (the Overmind stamped DEFEATED), and NEW GAME+ UNLOCKED.
New Game+ (toggle on the map) makes enemies 50% tougher, bosses 35% tougher and waves more frequent, and pays 50% more coins.

## Progression
- Campaign map with six zone tabs. A zone opens when the previous boss falls.
- After each level, Continue opens the Quartermaster (supply tent), then deploys to the next stop.
  - Armoury: 11 standard weapons, bought once their level is reached.
  - Weapon upgrades: 2 tiers for standard weapons, 3 for boss weapons (tier 3 is the perk).
  - Soldier upgrades: the 12 upgrades from the design.
  - Loadout: primary and secondary weapons (Q swaps), the gear worn, and six uniform colours.
- Boss weapons are free at tier 1 the moment the boss falls. The Gravity Mine is Space's third weapon.
- Gear shows on the soldier: chest plate, shoulder plates and visor helmet (Armour), grenade pouches (Grenade belt) and a medic pouch (Field medic).
- The coin magnet joins the power-up drop cycle (gold ring on the soldier).
- 16 weapons: Rifle, Dual Pistols, Vine Ripper, Triple Shot, Thorn Scatter, Marksman Rifle, Lance, Ember Torch, Rotary Gun, Grenade Launcher, Arc Carbine, Seeker Pod, Orb Blaster, Void Repulsor, Gravity Mine and Light Cannon (hold to charge).
- Saves: progress, weapons, tiers, upgrades, loadout, uniforms and New Game+ per difficulty. New save codes start `JS3-`; `JS1-` and `JS2-` codes still load.

## Music
Seven new chiptune tracks: Sunken Dunes, Frozen Reach, Ashen Caldera, Dead Orbit, The Hive Capital, The Overmind (finale) and Mission Complete (ending).

## Testing
`tools/test_v15.mjs` (Playwright; start the local server first). Results are in `docs/V15-validation.md` and `docs/V15-test-results.json`.
