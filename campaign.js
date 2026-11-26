// V15: the full Jungle Soldier campaign as data. Six biomes of five levels and a boss
// (36 stages). The Forest (levels 1-6) keeps its V14 definitions in levels.js; this file
// adds Desert, Tundra, Volcano, Space and the Alien City, the enemy kinds of every biome,
// the five new bosses, the weapons, the Quartermaster prices and the soldier upgrades.
// Balance passes should only need to edit this file and levels.js.
import { LEVELS as FOREST_LEVELS } from './levels.js';

// ---- Biomes: art, scenery, hazard skins and lighting ----
// art keys are paths under art/biomes/ (see art_manifest.js); 'sprites/x' keys are the V8-V14 Forest art.
export const BIOMES = {
  forest: {
    name: 'The Forest', zone: 1, eyebrow: 'ZONE 1 · THE FOREST',
    enemies: { moth: 'drone', beetle: 'crawler', turret: 'turret' },
    thorn: null, cross: null, rocks: 'prop_rocks', soft: 'prop_fern', softSlow: .2,
    cover: { art: ['cover_stump', 'cover_boulder', 'cover_stone'], hits: Infinity },
    pit: 'pothole', polish: true, low: false, tint: 0xbfc4b8,
    music: ['jungle', 'canopy', 'night'], map: 'art/jungle-trail-map.webp', mapAlt: 'Jungle trail map from the Overgrown Trail to the temple',
    neon: [0xff5a2e, 0x22d3ee], particles: 'forest', floorTint: [1, 1, 1]
  },
  desert: {
    name: 'Sunken Dunes', zone: 2, eyebrow: 'ZONE 2 · THE DESERT',
    enemies: { moth: 'scarab', beetle: 'dune_crawler', turret: 'obelisk' },
    thorn: 'desert/decor_1', cross: 'desert/cross', rocks: 'desert/clutter_2', soft: 'desert/clutter_3', softSlow: .25,
    cover: { art: ['desert/cover_1', 'desert/cover_2', 'desert/cover_3'], cracked: ['desert/cracked_1', 'desert/cracked_2', 'desert/cracked_3'], hits: 8 },
    pit: 'quicksand', tint: 0xd8cfc0, scenery: 4, decor: 8, arch: 22, tower: 26, overhead: 16,
    music: ['desert', 'desert', 'night'], neon: [0xff8a2e, 0x22d3ee], floorTint: [1, 1, 1]
  },
  tundra: {
    name: 'Frozen Reach', zone: 3, eyebrow: 'ZONE 3 · THE TUNDRA',
    enemies: { moth: 'frost_drone', beetle: 'shell_crawler', turret: 'cryo_turret' },
    thorn: 'tundra/decor_3', cross: 'tundra/cross', rocks: 'tundra/clutter_4', soft: 'tundra/clutter_1', softSlow: .4,
    cover: { art: ['tundra/cover_1', 'tundra/cover_2', 'tundra/cover_3'], cracked: ['tundra/cracked_1', 'tundra/cracked_2', 'tundra/cracked_3'], hits: 6 },
    pit: 'thin_ice', tint: 0xd4dce6, scenery: 4, decor: 8, arch: 20, tower: 30, overhead: 15,
    music: ['tundra', 'tundra', 'night'], neon: [0x9fd8ff, 0x22d3ee], floorTint: [1, 1, 1]
  },
  volcano: {
    name: 'Ashen Caldera', zone: 4, eyebrow: 'ZONE 4 · THE VOLCANO',
    enemies: { moth: 'ember_drone', beetle: 'magma_crawler', turret: 'flame_turret' },
    thorn: 'volcano/decor_6', cross: 'volcano/cross', rocks: 'volcano/clutter_2', soft: 'volcano/clutter_1', softSlow: .25,
    cover: { art: ['volcano/cover_1', 'volcano/cover_2', 'volcano/cover_3'], cracked: ['volcano/cracked_1', 'volcano/cracked_2', 'volcano/cracked_3'], hits: 6, unbreakable: [1] },
    pit: 'lava_pool', tint: 0xd8c4bc, scenery: 4, decor: 8, arch: 20, tower: 30, overhead: 16,
    music: ['volcano', 'volcano', 'volcano'], neon: [0xff5a1e, 0xffa040], floorTint: [1, 1, 1]
  },
  space: {
    name: 'Dead Orbit', zone: 5, eyebrow: 'ZONE 5 · SPACE',
    enemies: { moth: 'security_drone', beetle: 'crawler_bot', turret: 'laser_turret' },
    thorn: 'space/clutter_4', cross: 'space/cross', rocks: 'space/clutter_2', soft: 'space/clutter_1', softSlow: .2,
    cover: { art: ['space/cover_1', 'space/cover_2', 'space/cover_3'], cracked: ['space/cracked_1', 'space/cracked_2', 'space/cracked_3'], hits: 8, unbreakable: [1] },
    pit: 'void_gap', tint: 0xc8ccd8, scenery: 4, decor: 8, arch: 18, archArt: 'space/overhead', tower: 40, overhead: 15, lowGravity: true,
    music: ['space', 'space', 'space'], neon: [0x22d3ee, 0x8a6bff], floorTint: [1, 1, 1]
  },
  city: {
    name: 'The Hive Capital', zone: 6, eyebrow: 'ZONE 6 · THE ALIEN CITY',
    enemies: { moth: 'elite_drone', beetle: 'elite_crawler', turret: 'elite_turret' },
    thorn: 'city/decor_3', cross: 'city/cross', rocks: 'city/clutter_6', soft: 'city/clutter_8', softSlow: .2,
    cover: { art: ['city/wall_full'], broken: 'city/wall_broken', bud: 'city/wall_bud', hits: 6, regrow: 10 },
    pit: 'pothole', tint: 0xd0c4d8, scenery: 4, decor: 8, arch: 24, tower: 34, overhead: 16,
    music: ['city', 'city', 'city'], neon: [0xff4ad8, 0x8a6bff], floorTint: [1, 1, 1]
  }
};
export const BIOME_ORDER = ['forest', 'desert', 'tundra', 'volcano', 'space', 'city'];

// ---- Enemy kinds. type is the engine role (moth = flyer, beetle = crawler, turret = fixed,
// or a unique behaviour). hp is in rifle hits. art is relative to art/biomes/ unless 'sprites/'.
export const ENEMY_KINDS = {
  // Forest (V14 behaviour, kept exactly)
  drone: { type: 'moth', hp: 2, art: 'drone_front', w: 2.2 },
  crawler: { type: 'beetle', hp: 6, art: 'crawler_front', w: 2.1 },
  turret: { type: 'turret', hp: 6, art: 'turret_front', w: 2.3 },
  // Desert
  scarab: { type: 'moth', hp: 2, art: 'desert/scarab', w: 2.4, split: true, name: 'Scarab drone' },
  scarab_half: { type: 'mini', hp: 1, art: 'desert/scarab_half', w: 1.4, name: 'Scarab half' },
  dune_crawler: { type: 'beetle', hp: 6, art: 'desert/dune_crawler', w: 2.3, burrow: true, name: 'Dune crawler' },
  obelisk: { type: 'turret', hp: 6, art: 'desert/obelisk', w: 2.2, fan: 3, popUp: true, name: 'Obelisk turret' },
  raptor: { type: 'raptor', hp: 5, art: 'desert/raptor', pounceArt: 'desert/raptor_pounce', w: 2.6, name: 'Mech raptor' },
  tortoise: { type: 'tortoise', hp: 14, art: 'desert/tortoise', w: 3.4, name: 'Stone tortoise' },
  // Tundra
  frost_drone: { type: 'moth', hp: 2, art: 'tundra/frost_drone', w: 2.3, slowShot: 1, name: 'Frost drone' },
  shell_crawler: { type: 'beetle', hp: 8, art: 'tundra/shell_crawler', w: 2.3, shell: 3, name: 'Ice-shell crawler' },
  cryo_turret: { type: 'turret', hp: 6, art: 'tundra/cryo_turret', w: 2.3, icesLane: true, name: 'Cryo turret' },
  stalker: { type: 'stalker', hp: 6, art: 'tundra/stalker', leapArt: 'tundra/stalker_leap', w: 2.6, name: 'Snow stalker' },
  ram: { type: 'ram', hp: 10, art: 'tundra/ram', rearArt: 'tundra/ram_rear', w: 3.0, name: 'Glacier ram' },
  // Volcano
  ember_drone: { type: 'moth', hp: 2, art: 'volcano/ember_drone', w: 2.3, explode: 2.2, name: 'Ember drone' },
  magma_crawler: { type: 'beetle', hp: 7, art: 'volcano/magma_crawler', w: 2.3, lavaTrail: true, name: 'Magma crawler' },
  flame_turret: { type: 'turret', hp: 6, art: 'volcano/flame_turret', w: 2.3, flame: 9, name: 'Flame turret' },
  lantern: { type: 'lantern', hp: 8, art: 'volcano/lantern', w: 3.0, name: 'Lantern drone' },
  golem: { type: 'golem', hp: 20, art: 'volcano/golem', exposedArt: 'volcano/golem_exposed', w: 3.4, armour: 8, name: 'Lava golem' },
  // Space
  security_drone: { type: 'moth', hp: 3, art: 'space/security_drone', w: 2.6, burst: 2, name: 'Security drone' },
  crawler_bot: { type: 'beetle', hp: 7, art: 'space/crawler_bot', ceilingArt: 'space/crawler_ceiling', w: 2.4, ceiling: true, name: 'Crawler bot' },
  laser_turret: { type: 'turret', hp: 8, art: 'space/laser_turret', w: 2.6, sweep: true, name: 'Laser turret' },
  wisp: { type: 'wisp', hp: 4, art: 'space/wisp', w: 2.2, name: 'Eye wisp' },
  shield_drone: { type: 'shielder', hp: 6, art: 'space/shield_drone', w: 2.2, name: 'Shield drone' },
  // Alien City elites: each mixes two earlier biomes
  elite_drone: { type: 'moth', hp: 3, art: 'city/elite_1', w: 2.5, explode: 2.2, split: true, splitArt: 'desert/scarab_half', name: 'Elite ember scarab' },
  elite_crawler: { type: 'beetle', hp: 9, art: 'city/elite_2', w: 2.4, burrow: true, lavaTrail: true, name: 'Elite magma burrower' },
  elite_turret: { type: 'turret', hp: 8, art: 'city/elite_3', w: 2.4, sweep: true, icesLane: true, name: 'Elite cryo laser' },
  elite_raptor: { type: 'raptor', hp: 7, art: 'city/elite_4', pounceArt: 'city/elite_4', w: 2.6, blink: true, name: 'Elite blink raptor' },
  elite_stalker: { type: 'stalker', hp: 8, art: 'city/elite_5', leapArt: 'city/elite_5', w: 2.6, projector: true, name: 'Elite shield stalker' },
  elite_golem: { type: 'golem', hp: 26, art: 'city/elite_6', exposedArt: 'city/elite_6', w: 3.4, armour: 10, shell: 3, name: 'Elite frost golem' },
  sentinel: { type: 'sentinel', hp: 12, art: 'city/sentinel', openArt: 'city/sentinel_open', w: 2.4, h: 4.7, name: 'Sentinel' },
  // V16: ground enemies. Rushers run at you (5 m/s, you run at 6), rear up for 0.6 s, then strike,
  // and keep attacking until killed or outrun. Spitters stop 12-15 m away and lob a slow shot onto
  // a marked spot, then keep pace with you. Each biome has its own style and attack.
  forest_rusher: { type: 'rusher', hp: 4, art: 'forest/g_rusher_run', strikeArt: 'forest/g_rusher_strike', w: 2.2, speed: 4.6, reach: 2.4, hit: 'melee', heavy: 1.3, name: 'Mushroom brute', how: 'slow and heavy · its smash hits hardest' },
  forest_spitter: { type: 'spitter', hp: 4, art: 'forest/g_spitter_walk', fireArt: 'forest/g_spitter_fire', fx: 'forest', w: 2.4, splash: 'acid', name: 'Jungle spider', how: 'acid leaves a burning puddle' },
  desert_rusher: { type: 'rusher', hp: 3.5, art: 'desert/g_rusher_run', strikeArt: 'desert/g_rusher_strike', w: 2.4, speed: 5.2, reach: 3.1, hit: 'melee', name: 'Sand scorpion', how: 'fast · its tail stabs from 3 m' },
  desert_spitter: { type: 'spitter', hp: 4.5, art: 'desert/g_spitter_walk', fireArt: 'desert/g_spitter_fire', fx: 'desert', w: 2.4, splash: 'dust', name: 'Dune spitter beetle', how: 'sand bursts blind you for 3 s' },
  tundra_rusher: { type: 'rusher', hp: 3.5, art: 'tundra/g_rusher_run', strikeArt: 'tundra/g_rusher_strike', w: 2.2, speed: 5, reach: 2.4, hit: 'melee', leap: 7, chill: 1.5, name: 'Frost imp', how: 'leaps in from 7 m · its claws numb you' },
  tundra_spitter: { type: 'spitter', hp: 4, art: 'tundra/g_spitter_walk', fireArt: 'tundra/g_spitter_fire', fx: 'tundra', w: 2.4, splash: 'frost', name: 'Ice spider', how: 'ice shards slow you for 2 s' },
  volcano_rusher: { type: 'rusher', hp: 4, art: 'volcano/g_rusher_run', strikeArt: 'volcano/g_rusher_strike', w: 2.3, speed: 5, reach: 2.4, hit: 'melee', scorch: true, name: 'Magma imp', how: 'leaves burning footprints' },
  volcano_spitter: { type: 'spitter', hp: 4.5, art: 'volcano/g_spitter_walk', fireArt: 'volcano/g_spitter_fire', fx: 'volcano', w: 2.4, splash: 'lava', name: 'Lava spider', how: 'lava blobs leave a burning pool' },
  space_rusher: { type: 'rusher', hp: 4.5, art: 'space/g_rusher_run', strikeArt: 'space/g_rusher_strike', w: 2.4, speed: 5, reach: 2.5, hit: 'melee', shock: 1.2, name: 'Boarding bot', how: 'its shock baton stuns you' },
  space_spitter: { type: 'spitter', hp: 4.5, art: 'space/g_spitter_walk', fireArt: 'space/g_spitter_fire', fx: 'space', w: 2.4, splash: 'plasma', name: 'Plasma tripod', how: 'plasma bursts hit a wide area' },
  city_rusher: { type: 'rusher', hp: 4.5, art: 'city/g_rusher_run', strikeArt: 'city/g_rusher_strike', w: 2.0, h: 3.0, speed: 5, reach: 2.6, hit: 'melee', double: true, name: 'Hive soldier', how: 'slashes twice' },
  city_spitter: { type: 'spitter', hp: 5, art: 'city/g_spitter_walk', fireArt: 'city/g_spitter_fire', fx: 'city', w: 2.4, splash: 'goo', name: 'Hive spider', how: 'goo leaves a sticky patch' },
  // V16: siege generators (shoot them all to open the gate)
  forest_generator: { type: 'generator', hp: 14, art: 'forest/g_generator', brokenArt: 'forest/g_generator_broken', w: 2.6, name: 'Turret-line generator' },
  volcano_generator: { type: 'generator', hp: 16, art: 'volcano/g_generator', brokenArt: 'volcano/g_generator_broken', w: 2.8, name: 'Forge generator' },
  space_generator: { type: 'generator', hp: 16, art: 'space/g_generator', brokenArt: 'space/g_generator_broken', w: 2.4, name: 'Shield generator' },
  city_generator: { type: 'generator', hp: 18, art: 'city/g_generator', brokenArt: 'city/g_generator_broken', w: 2.4, name: 'Hive node' },
  // V16: nests (mini elites). Armoured while closed (a quarter damage); every 6 s they open for 2 s, show the glowing core
  // and hatch 2 hatchlings (at most 4 alive). A grenade cracks one open. Destroying a nest always drops a drone or a shield.
  forest_nest: { type: 'nest', hp: 20, art: 'forest/g_nest_closed', openArt: 'forest/g_nest_open', brokenArt: 'forest/g_nest_destroyed', fx: 'forest', w: 4.2, name: 'Fungal pod hive' },
  forest_hatchling: { type: 'rusher', hp: 1, art: 'forest/g_hatchling_run', strikeArt: 'forest/g_hatchling_run', w: 1.2, speed: 5.4, reach: 1.7, windup: .45, dmg: 'hatch', name: 'Mushroom sprout', how: 'hatched by the nest · one hit kills it' },
  desert_nest: { type: 'nest', hp: 20, art: 'desert/g_nest_closed', openArt: 'desert/g_nest_open', brokenArt: 'desert/g_nest_destroyed', fx: 'desert', w: 4.2, name: 'Scarab mound' },
  desert_hatchling: { type: 'rusher', hp: 1, art: 'desert/g_hatchling_run', strikeArt: 'desert/g_hatchling_run', w: 1.2, speed: 5.4, reach: 1.7, windup: .45, dmg: 'hatch', name: 'Scorpion larva', how: 'hatched by the nest · one hit kills it' },
  tundra_nest: { type: 'nest', hp: 20, art: 'tundra/g_nest_closed', openArt: 'tundra/g_nest_open', brokenArt: 'tundra/g_nest_destroyed', fx: 'tundra', w: 4.2, name: 'Glacier egg nest' },
  tundra_hatchling: { type: 'rusher', hp: 1, art: 'tundra/g_hatchling_run', strikeArt: 'tundra/g_hatchling_run', w: 1.2, speed: 5.4, reach: 1.7, windup: .45, dmg: 'hatch', name: 'Frost imp hatchling', how: 'hatched by the nest · one hit kills it' },
  volcano_nest: { type: 'nest', hp: 20, art: 'volcano/g_nest_closed', openArt: 'volcano/g_nest_open', brokenArt: 'volcano/g_nest_destroyed', fx: 'volcano', w: 4.2, name: 'Obsidian egg mound' },
  volcano_hatchling: { type: 'rusher', hp: 1, art: 'volcano/g_hatchling_run', strikeArt: 'volcano/g_hatchling_run', w: 1.2, speed: 5.4, reach: 1.7, windup: .45, dmg: 'hatch', name: 'Magma imp hatchling', how: 'hatched by the nest · one hit kills it' },
  space_nest: { type: 'nest', hp: 20, art: 'space/g_nest_closed', openArt: 'space/g_nest_open', brokenArt: 'space/g_nest_destroyed', fx: 'space', w: 4.2, name: 'Drone fabricator' },
  space_hatchling: { type: 'rusher', hp: 1, art: 'space/g_hatchling_run', strikeArt: 'space/g_hatchling_run', w: 1.2, speed: 5.4, reach: 1.7, windup: .45, dmg: 'hatch', name: 'Mini boarding bot', how: 'hatched by the nest · one hit kills it' },
  city_nest: { type: 'nest', hp: 20, art: 'city/g_nest_closed', openArt: 'city/g_nest_open', brokenArt: 'city/g_nest_destroyed', fx: 'city', w: 4.2, name: 'Hive brood pod' },
  city_hatchling: { type: 'rusher', hp: 1, art: 'city/g_hatchling_run', strikeArt: 'city/g_hatchling_run', w: 1.2, speed: 5.4, reach: 1.7, windup: .45, dmg: 'hatch', name: 'Hive larva', how: 'hatched by the nest · one hit kills it' }
};

// Unique-enemy damage (flat, by difficulty: easy, medium, hard)
export const UNIQUE = {
  pounce: { easy: 6, medium: 12, hard: 18 },
  mortar: { easy: 5, medium: 9, hard: 13 },
  ram: { easy: 6, medium: 12, hard: 20 },
  bomb: { easy: 5, medium: 9, hard: 13 },
  golemHit: { easy: 6, medium: 12, hard: 18 },
  burn: { easy: 3, medium: 5, hard: 8 },     // per second in lava trails, crust and flames
  beam: { easy: 5, medium: 9, hard: 13 },
  explode: { easy: 4, medium: 8, hard: 12 },
  hazard: { easy: 6, medium: 12, hard: 18 }, // vents, falling rocks, meteors, icicles, laser fences
  melee: { easy: 4, medium: 10, hard: 15 },  // V16: rusher strikes
  hatch: { easy: 2, medium: 4, hard: 6 },    // V16: nest hatchlings
  spit: { easy: 5, medium: 8, hard: 12 },    // V16: spitter shots
  fall: { easy: 8, medium: 14, hard: 20 },   // V16: falling off a bridge or into a fork's chasm
  pit: { easy: 10, medium: 18, hard: 25 },   // lava pools and void gaps (no trap, you reappear at the edge)
  snipe: { easy: 6, medium: 12, hard: 18 },  // V17: sniper shot
  latch: { easy: 2, medium: 3, hard: 5 },    // V17: latcher, per second while it clings
  breath: { easy: 6, medium: 12, hard: 18 }, // V17: elite dragon breath
  bash: { easy: 4, medium: 8, hard: 12 }     // V17: blocker shell bash
};

// ---- Levels. Each non-boss level uses the shared V13 course (logs, thorns, pits, cover) in its
// biome's skin, plus the signature features below. enemies.uniques: [kind, [every min, max], start].
const L = (id, biome, name, idea, light, music, extra) => ({ id, biome, name, idea, length: 950, light, music, coverBlocksShots: true, ...extra });
const NEW_LEVELS = [
  // ---- Desert: reading the ground and exposed sightlines ----
  L(7, 'desert', 'Glass Sands', 'Quicksand sinks you over 2 s; jump repeatedly or roll across. Dune ramps launch long jumps.', 'noon', 'desert',
    { enemies: { uniques: [] }, waves: { intervalScale: 1.1, crawler: true }, hazards: { quicksand: 9, ramps: 6, mapStop: [12, 78] } }),
  L(8, 'desert', 'Raptor Flats', 'Mech raptors sprint in a zigzag and pounce from 6 m. Their chest core shows only mid-pounce.', 'noon', 'desert',
    { enemies: { uniques: [['raptor', [70, 95], 110]] }, waves: { intervalScale: 1.1, crawler: true, uniqueEvery: 5, unique: 'raptor' }, hazards: { quicksand: 4, ramps: 3, mapStop: [32, 64] } }),
  L(9, 'desert', 'The Long Storm', 'Every 40 s a sandstorm cuts visibility to 15 m. Hold position and shoot the glows.', 'sunset', 'desert',
    { enemies: { uniques: [['raptor', [140, 170], 160]] }, waves: { intervalScale: 1.15, crawler: true }, hazards: { quicksand: 5, ramps: 3, sandstorm: 40, mapStop: [50, 46] }, setPiece: { type: 'ambush', d: 560, kinds: ['raptor', 'raptor', 'raptor', 'raptor'], text: 'AMBUSH · RAPTORS IN THE STORM' } }),
  L(10, 'desert', 'Mortar Canyon', 'Stone tortoises lob mortars over cover. Advance on them; cover crumbles after 8 hits.', 'sunset', 'desert',
    { enemies: { uniques: [['tortoise', [140, 170], 150]] }, waves: { intervalScale: 1.1, crawler: true }, hazards: { quicksand: 4, extraCover: 10, mapStop: [70, 58] } }),
  L(11, 'desert', 'Moonlit Dunes', 'Night gauntlet: quicksand, storms, raptors and tortoises together.', 'desertNight', 'night',
    { enemies: { uniques: [['raptor', [110, 140], 130], ['tortoise', [220, 260], 260]] }, waves: { intervalScale: .8, crawler: true, uniqueEvery: 4, unique: 'raptor' }, hazards: { quicksand: 8, ramps: 4, sandstorm: 55, mapStop: [84, 36] } }),
  { id: 12, biome: 'desert', name: 'The Dune Wyrm', idea: 'Desert boss: a giant armoured sand worm in a circular sand basin.', boss: 'wyrm', length: 0, music: 'boss', light: 'sunset', coverBlocksShots: true, hazards: { mapStop: [88, 14] } },
  // ---- Tundra: controlling momentum ----
  L(13, 'tundra', 'First Frost', 'Ice patches: strafing slides, stopping takes about 1 s, and a roll goes twice as far.', 'snow', 'tundra',
    { enemies: { uniques: [] }, waves: { intervalScale: 1.1, crawler: true }, hazards: { ice: 9, drifts: 6, mapStop: [12, 80] } }),
  L(14, 'tundra', 'Cracking Lake', 'Thin ice cracks, then gives way into freezing water. Icicles fall where shadows mark the snow.', 'snow', 'tundra',
    { enemies: { uniques: [['stalker', [150, 180], 160]] }, waves: { intervalScale: 1.1, crawler: true }, hazards: { thinIce: 8, icicles: 10, ice: 3, mapStop: [30, 62] } }),
  L(15, 'tundra', 'Whiteout', 'Blizzard gusts push you sideways for 3 s. Lean into them with A or D. Glacier rams charge from behind.', 'whiteout', 'tundra',
    { enemies: { uniques: [['ram', [150, 190], 170]] }, waves: { intervalScale: 1.15, crawler: true }, hazards: { gusts: 14, ice: 4, drifts: 5, mapStop: [50, 50] }, setPiece: { type: 'chase', d: 420, length: 20, kind: 'ram', every: 2.6, text: 'STAMPEDE · KEEP MOVING, WATCH THE LANES' } }),
  L(16, 'tundra', 'Glacier Caves', 'Enclosed and dark. Snow stalkers leap between cover toward you; shoot them mid-leap.', 'cave', 'canopy',
    { enemies: { uniques: [['stalker', [80, 105], 100]] }, waves: { intervalScale: 1.1, crawler: true, uniqueEvery: 5, unique: 'stalker' }, hazards: { icicles: 14, ice: 4, extraCover: 6, mapStop: [68, 62] } }),
  L(17, 'tundra', 'Aurora Gauntlet', 'Night gauntlet under the aurora: ice, thin ice, gusts, stalkers and rams.', 'aurora', 'night',
    { enemies: { uniques: [['stalker', [130, 160], 130], ['ram', [230, 260], 240]] }, waves: { intervalScale: .8, crawler: true, uniqueEvery: 5, unique: 'stalker' }, hazards: { ice: 6, thinIce: 5, gusts: 20, icicles: 6, mapStop: [84, 38] } }),
  { id: 18, biome: 'tundra', name: 'The Frost Titan', idea: 'Tundra boss: an ice-armoured walking machine on a frozen lake.', boss: 'titan', length: 0, music: 'boss', light: 'snow', coverBlocksShots: true, hazards: { mapStop: [88, 14] } },
  // ---- Volcano: timing and keeping moving ----
  L(19, 'volcano', 'Ash Fields', 'Lava vents erupt in a lane on a rhythm; they glow for 1 s first. Time your lane changes.', 'lava', 'volcano',
    { enemies: { uniques: [] }, waves: { intervalScale: 1.1, crawler: true }, hazards: { vents: 14, mapStop: [12, 76] } }),
  L(20, 'volcano', 'Crust Walk', 'Lava crust cracks if you stand on it for more than 1 s. Falling rocks land on marked spots.', 'lava', 'volcano',
    { enemies: { uniques: [['lantern', [180, 220], 170]] }, waves: { intervalScale: 1.1, crawler: true }, hazards: { crust: 8, rocks: 9, vents: 5, mapStop: [32, 60] } }),
  L(21, 'volcano', 'Bridge of Embers', 'The stone bridges crumble behind you, so you cannot stop for long.', 'lava', 'volcano',
    { enemies: { uniques: [['lantern', [150, 190], 150]] }, waves: { intervalScale: 1.15, crawler: true }, hazards: { bridges: 5, vents: 5, mapStop: [52, 44] }, setPiece: { type: 'nest', d: 640, kinds: ['flame_turret', 'lantern', 'flame_turret'], text: 'TURRET NEST · USE THE COVER' } }),
  L(22, 'volcano', 'The Furnace', 'Inside the mountain, lit only by lava. Lava golems block lanes and throw magma.', 'furnace', 'volcano',
    { enemies: { uniques: [['golem', [150, 180], 140], ['lantern', [260, 300], 280]] }, waves: { intervalScale: 1.15, crawler: true }, hazards: { vents: 8, crust: 4, extraCover: 6, mapStop: [70, 56] } }),
  L(23, 'volcano', 'Eruption', 'Lava rises behind you, forcing a fast pace through everything.', 'eruption', 'volcano',
    { enemies: { uniques: [['lantern', [170, 200], 150], ['golem', [300, 340], 330]] }, waves: { intervalScale: .85, crawler: true }, hazards: { vents: 8, crust: 4, rocks: 8, risingLava: 4.6, mapStop: [84, 34] } }),
  { id: 24, biome: 'volcano', name: 'The Magma Serpent', idea: 'Volcano boss: a molten serpent in a lava lake ringed by rock.', boss: 'serpent', length: 0, music: 'boss', light: 'lava', coverBlocksShots: true, hazards: { mapStop: [88, 14] } },
  // ---- Space: low gravity ----
  L(25, 'space', 'Docking Bay', 'Low gravity: jumps go twice as high and far. Void gaps cost heavy damage.', 'space', 'space',
    { enemies: { uniques: [] }, waves: { intervalScale: 1.1, crawler: true }, hazards: { voids: 9, mapStop: [12, 76] } }),
  L(26, 'space', 'Security Grid', 'Laser fences: jump the low beams, roll under the high ones. Airlocks open on a timer.', 'space', 'space',
    { enemies: { uniques: [['wisp', [150, 180], 140]] }, waves: { intervalScale: 1.1, crawler: true }, hazards: { fences: 10, airlocks: 4, voids: 3, mapStop: [32, 62] } }),
  L(27, 'space', 'Asteroid Run', 'Open asteroid surface under a meteor shower. Step out of the marked spots.', 'asteroid', 'space',
    { enemies: { uniques: [['wisp', [140, 170], 130], ['shield_drone', [220, 260], 230]] }, waves: { intervalScale: 1.15, crawler: true }, hazards: { voids: 6, meteors: 3.5, asteroid: true, mapStop: [50, 46] }, setPiece: { type: 'chase', d: 480, length: 18, kind: 'meteor', every: .7, text: 'METEOR STORM · DO NOT STOP' } }),
  L(28, 'space', 'Maintenance Shaft', 'A dark tunnel. Crawler bots crawl on every surface; their belly core shows only on the ceiling.', 'tunnel', 'canopy',
    { enemies: { uniques: [['shield_drone', [170, 210], 170]] }, waves: { intervalScale: 1.1, crawler: true, extraCrawlers: 1 }, hazards: { fences: 6, voids: 4, mapStop: [68, 60] } }),
  L(29, 'space', 'Station Breach', 'Alarms and everything together: fences, airlocks, wisps and shield drones.', 'alarm', 'night',
    { enemies: { uniques: [['wisp', [110, 140], 120], ['shield_drone', [200, 240], 210]] }, waves: { intervalScale: .8, crawler: true, uniqueEvery: 5, unique: 'wisp' }, hazards: { fences: 8, airlocks: 3, voids: 5, meteors: 7, mapStop: [84, 38] } }),
  { id: 30, biome: 'space', name: 'The Void Manta', idea: 'Space boss: a huge alien ray in an open hangar.', boss: 'manta', length: 0, music: 'boss', light: 'space', coverBlocksShots: true, hazards: { mapStop: [88, 14] } },
  // ---- Alien City: a remix of the campaign. Portals in every district; living walls regrow ----
  L(31, 'city', 'Outer Gardens', 'Forest pits and desert quicksand among living walls. Step into a portal to jump ahead in another lane.', 'city', 'city',
    { enemies: { uniques: [['elite_raptor', [150, 180], 150]] }, waves: { intervalScale: 1.1, crawler: true }, hazards: { portals: 5, quicksand: 5, mapStop: [12, 78] } }),
  L(32, 'city', 'Cryo Labs', 'Tundra ice and thin ice inside the alien labs.', 'cityCold', 'city',
    { enemies: { uniques: [['elite_stalker', [150, 180], 140]] }, waves: { intervalScale: 1.1, crawler: true }, hazards: { portals: 4, ice: 6, thinIce: 5, mapStop: [30, 60] } }),
  L(33, 'city', 'Forge Quarter', 'Volcano vents and crust in the forges of the hive.', 'cityForge', 'city',
    { enemies: { uniques: [['elite_golem', [220, 260], 200], ['sentinel', [300, 340], 320]] }, waves: { intervalScale: 1.1, crawler: true }, hazards: { portals: 4, vents: 9, crust: 4, mapStop: [50, 44] }, setPiece: { type: 'nest', d: 620, kinds: ['elite_turret', 'sentinel', 'elite_turret'], text: 'SENTINEL NEST · USE THE COVER' } }),
  L(34, 'city', 'Gravity Spires', 'Low gravity and void gaps between the spires.', 'citySpires', 'city',
    { enemies: { uniques: [['sentinel', [160, 200], 150], ['elite_raptor', [240, 280], 260]] }, waves: { intervalScale: 1.1, crawler: true }, hazards: { portals: 5, voids: 7, lowGravity: true, mapStop: [68, 58] } }),
  L(35, 'city', 'The Throne Path', 'Every hazard at once, and Sentinels throughout. The throne is close.', 'cityNight', 'night',
    { enemies: { uniques: [['sentinel', [110, 140], 110], ['elite_stalker', [210, 250], 230], ['elite_golem', [380, 420], 400]] }, waves: { intervalScale: .8, crawler: true, uniqueEvery: 5, unique: 'elite_raptor' },
      hazards: { portals: 5, quicksand: 3, ice: 3, vents: 5, voids: 3, fences: 4, mapStop: [84, 36] } }),
  { id: 36, biome: 'city', name: 'The Overmind', idea: 'Final boss: the intelligence behind the invasion, at the top of the city.', boss: 'overmind', length: 0, music: 'finale', light: 'cityNight', coverBlocksShots: true, hazards: { mapStop: [88, 12] } }
];
// Each biome's Level 3 has one set-piece: an ambush, a chase or a turret nest.
const FOREST_SET = { 3: { type: 'ambush', d: 600, kinds: ['crawler', 'crawler', 'crawler', 'crawler'], text: 'AMBUSH · CRAWLERS FROM THE FOLIAGE' } };
// ---- V16: level layouts. Every biome mixes these so its five levels play differently.
// trail: the open path · open: open field, more ranged enemies · canyon: walls close in, spitters on ledges
// fork: a chasm splits the path, pick a side · bridge: a narrow causeway over water, lava or a chasm
// hold: a gate stays shut until you survive the waves · siege: shoot the generators to open the gate
// escape: something chases you from behind. ground: [rusher every m, spitter every m] (0 = none).
export const LAYOUTS = {
  1: { type: 'trail', ground: [0, 0] },
  2: { type: 'siege', d: 560, gens: 3, ground: [170, 0], text: 'SIEGE · SHOOT THE 3 GENERATORS TO OPEN THE GATE' },
  3: { type: 'trail', ground: [150, 220] },
  4: { type: 'hold', d: 600, secs: 60, ground: [140, 200], text: 'HOLD AT THE HIVE · SURVIVE UNTIL THE GATE OPENS' },
  5: { type: 'trail', ground: [120, 170] },
  7: { type: 'trail', ground: [150, 220] },
  8: { type: 'open', ground: [140, 110] },
  9: { type: 'hold', d: 600, secs: 60, ground: [160, 200], text: 'HOLD IN THE STORM · SURVIVE UNTIL THE GATE OPENS' },
  10: { type: 'canyon', from: 120, ground: [150, 0], ledges: 70 },
  11: { type: 'escape', speed: 4.5, fx: 'desert/g_avalanche_fx', cause: 'Sand avalanche', text: 'THE DUNES ARE COLLAPSING · RUN', ground: [130, 190] },
  13: { type: 'trail', ground: [150, 220] },
  14: { type: 'bridge', from: 260, len: 220, side: 'tundra/g_water', floes: true, ground: [170, 150], text: 'ICE FLOES · STAY ON THE ICE' },
  15: { type: 'open', ground: [150, 120] },
  16: { type: 'canyon', from: 110, ground: [150, 0], ledges: 75 },
  17: { type: 'fork', from: 320, len: 180, strip: 'tundra/g_crevasse', ground: [130, 180], text: 'CREVASSE · PICK A SIDE' },
  19: { type: 'trail', ground: [150, 220] },
  20: { type: 'fork', from: 300, len: 200, strip: 'volcano/g_lava_river', glow: 0xff5a10, ground: [140, 190], text: 'LAVA RIVER · PICK A SIDE' },
  21: { type: 'bridge', from: 250, len: 260, side: 'volcano/g_lava_river', path: 'volcano/g_bridge', pillars: 'volcano/g_bridge_pillar', glow: 0xff5a10, ground: [160, 150], text: 'THE EMBER BRIDGE · STAY ON THE STONE' },
  22: { type: 'siege', d: 600, gens: 3, ground: [150, 180], text: 'SIEGE · SHOOT THE 3 FORGE GENERATORS TO OPEN THE GATE' },
  23: { type: 'escape', lava: true, fx: 'volcano/g_lava_wave_fx', ground: [140, 200] },
  25: { type: 'trail', ground: [150, 220] },
  26: { type: 'siege', d: 620, gens: 2, ground: [150, 190], text: 'SECURITY GRID · SHOOT THE 2 SHIELD GENERATORS' },
  27: { type: 'open', ground: [150, 110] },
  28: { type: 'canyon', from: 110, ground: [150, 0], ledges: 70 },
  29: { type: 'escape', speed: 4.6, fx: 'space/g_breach_fx', cause: 'Hull breach', text: 'HULL BREACH · RUN FOR THE BULKHEAD', ground: [130, 180] },
  31: { type: 'fork', from: 280, len: 200, strip: 'city/g_chasm', glow: 0x22d3c0, ground: [140, 190], text: 'THE CHASM · PICK A SIDE' },
  32: { type: 'hold', d: 600, secs: 60, ground: [140, 180], text: 'HOLD IN THE LABS · SURVIVE UNTIL THE MEMBRANE OPENS' },
  33: { type: 'siege', d: 560, gens: 3, ground: [140, 180], text: 'SIEGE · BURST THE 3 HIVE NODES TO OPEN THE GATE' },
  34: { type: 'bridge', from: 260, len: 240, side: 'city/g_chasm', path: 'city/g_bridge_a', ground: [150, 150], text: 'SPIRE BRIDGE · STAY ON THE BRIDGE' },
  35: { type: 'canyon', from: 120, ground: [130, 0], ledges: 65 }
};
// ---- V17: the new enemy roster (Codex Art Brief 5). Every role is in all six biomes; each biome
// version is the same creature in that biome's materials. art keys are under art/biomes/<biome>/.
// type is the engine behaviour (see the V17 section of game.js). hp is in rifle hits.
const V17_NAMES = {
  blocker: ['Moss shell beetle', 'Sandstone scarab tank', 'Glacier tortoise', 'Obsidian armadillo', 'Riot bot', 'Hive bulwark'],
  exploder: ['Spore toad', 'Oil scarab', 'Cryo bloater', 'Magma bomb', 'Kamikaze bot', 'Acid larva'],
  ambusher: ['Trapdoor spider', 'Sand antlion', 'Snow worm', 'Lava eel', 'Vent crawler', 'Hive mantis'],
  pack: ['Jungle raptor', 'Desert raptor', 'Snow raptor', 'Ember raptor', 'Cyber raptor', 'Hive raptor'],
  wyvern: ['Leaf-wing wyvern', 'Bone wyvern', 'Frost wyvern', 'Ember wyvern', 'Mech wyvern', 'Hive wyvern'],
  dragon: ['Mushroom dragon', 'Dune drake', 'Frost drake', 'Magma drake', 'Mecha dragon', 'Hive drake'],
  charger: ['Dome-skull charger', 'Razorback boar', 'Woolly frost rhino', 'Furnace bull', 'Battering-ram bot', 'Hive beetle-rhino'],
  sniper: ['Chameleon sniper', 'Scorpion sniper', 'Frost imp marksman', 'Magma imp lancer', 'Sniper bot', 'Hive stalker'],
  latcher: ['Leech-tick', 'Sand hugger', 'Ice tick', 'Ember leech', 'Clamp bot', 'Hook larva'],
  mimic: ['Chest mimic', 'Urn mimic', 'Crate mimic', 'Obsidian chest mimic', 'Cargo mimic', 'Egg mimic'],
  shieldbearer: ['Mushroom shaman', 'Scarab priest', 'Frost shaman', 'Magma totem imp', 'Shield bot', 'Hive priest'],
  swarm: ['Jungle rat', 'Sand crab', 'Frost crawler', 'Magma crawler', 'Spider bot', 'Hive ant'],
  queen: ['Spider queen', 'Scorpion queen', 'Frost spider queen', 'Magma spider queen', 'Fabricator mother', 'Hive brood queen'],
  bomber: ['Horned beetle bomber', 'Bone vulture', 'Snow bat', 'Ember bat', 'Bomber drone', 'Hive flyer']
};
// What each biome's exploder leaves behind, and what its wyvern spits.
const V17_RESIDUE = { forest: 'spores', desert: 'oil', tundra: 'frost', volcano: 'lava', space: 'shock', city: 'acid' };
const V17_SPIT = { forest: 'acid', desert: 'lava', tundra: 'frost', volcano: 'lava', space: 'plasma', city: 'goo' };
const V17_HOW = {
  blocker: 'plants a shell on the trail · flank it or crack the shell with a grenade',
  exploder: 'bursts near you or when killed · shoot it early',
  ambusher: 'bursts out of the marked ground · step off the mound',
  pack: 'hunts in packs of three · the leader screeches first',
  wyvern: 'dives and spits onto a marked spot',
  dragon: 'ELITE · blocks the path · step out of the marked lane, shoot the glowing chest',
  charger: 'charges down a marked lane · dodge it and it is stunned',
  sniper: 'a red laser means it is aiming · keep moving or roll',
  latcher: 'clings to you · roll or jump to shake it off',
  mimic: 'not every chest is a reward',
  shieldbearer: 'shields the enemies near it · kill it first',
  swarm: 'comes in groups · one hit each',
  queen: 'ELITE · spawns young until killed · shoot the egg sac when it opens',
  bomber: 'drops bombs on marked spots'
};
const V17_STATS = { // type: [hp, width m, height m or null, soft (full body damage)]
  blocker: [10, 3.0, null, true], exploder: [2, 1.9, null, true], ambusher: [4, 2.6, null, true], pack: [3, 2.6, null, true],
  wyvern: [3, 3.4, null, true], dragon: [36, 6.0, null, false], charger: [8, 3.2, null, false], sniper: [3, 2.5, null, true],
  latcher: [1.5, 1.5, null, true], mimic: [5, 2.0, null, true], shieldbearer: [5, 2.4, null, true], swarm: [1, 1.15, null, true],
  queen: [26, 5.4, null, false], bomber: [3, 2.8, null, true]
};
const V17_ART = {
  blocker: { art: 'blocker_walk', bracedArt: 'blocker_braced', brokenArt: 'blocker_broken' },
  exploder: { art: 'exploder_run', swellArt: 'exploder_swell' },
  ambusher: { art: 'ambusher_attack', strikeArt: 'ambusher_attack', eruptArt: 'ambusher_erupt', tellArt: 'ambusher_tell' },
  pack: { art: 'raptor_run', strikeArt: 'raptor_leap', callArt: 'raptor_call' },
  wyvern: { art: 'wyvern_fly', diveArt: 'wyvern_dive' },
  dragon: { art: 'dragon_stand', breathArt: 'dragon_breath', woundedArt: 'dragon_wounded' },
  charger: { art: 'charger_walk', chargeArt: 'charger_charge', stunArt: 'charger_stunned' },
  sniper: { art: 'sniper_idle', aimArt: 'sniper_aim' },
  latcher: { art: 'latcher_run', strikeArt: 'latcher_run', clingArt: 'latcher_cling' },
  mimic: { art: 'mimic_revealed', strikeArt: 'mimic_revealed', hiddenArt: 'mimic_hidden' },
  shieldbearer: { art: 'shield_walk', castArt: 'shield_cast' },
  swarm: { art: 'swarm_run', strikeArt: 'swarm_run', groupArt: 'swarm_group' },
  queen: { art: 'queen_idle', spawnArt: 'queen_spawn', dyingArt: 'queen_dying' },
  bomber: { art: 'bomber_carry', dropArt: 'bomber_drop' }
};
const V17_FX = { blocker: 'blocker', exploder: 'exploder', ambusher: 'ambusher', wyvern: 'wyvern', dragon: 'dragon', charger: 'charger', sniper: 'sniper',
  latcher: 'latcher', mimic: 'mimic', shieldbearer: 'shield', swarm: 'swarm', bomber: 'bomber', pack: 'ambusher', queen: 'swarm' };
BIOME_ORDER.forEach((biome, i) => {
  for (const [type, names] of Object.entries(V17_NAMES)) {
    const [hp, w, h, soft] = V17_STATS[type], art = Object.fromEntries(Object.entries(V17_ART[type]).map(([k, v]) => [k, biome + '/n_' + v]));
    const fx = biome + '/n_' + V17_FX[type] + '_fx';
    ENEMY_KINDS[biome + '_' + type] = { type, hp, w, h: h ?? undefined, soft, name: names[i], how: V17_HOW[type], fx: [fx + '1', fx + '2', fx + '3'], biome, v17: true,
      residue: V17_RESIDUE[biome], splash: V17_SPIT[biome], ...art,
      // rusher-style movers reuse the V16 rusher logic with these numbers
      ...(type === 'swarm' ? { speed: 6.2, reach: 1.6, windup: .35, dmg: 'hatch' } : {}),
      ...(type === 'pack' ? { speed: 6.6, reach: 2.4, windup: .4, leap: 7, dmg: 'melee' } : {}),
      ...(type === 'ambusher' ? { speed: 5.2, reach: 2.4, windup: .45, dmg: 'melee' } : {}),
      ...(type === 'mimic' ? { speed: 5.4, reach: 2.2, windup: .4, dmg: 'melee' } : {}),
      ...(type === 'latcher' ? { speed: 6.8, reach: 1.6, windup: .2, dmg: 'hatch' } : {}) };
  }
});
// Which new roles each level brings. Forest introduces them two or three at a time; every other
// biome brings them back in its own skins. Every role appears in all six biomes.
// Elites (dragon, queen) come once per biome. Easy keeps every other non-elite.
export const ROSTER = {
  forest: { 1: ['swarm', 'mimic'], 2: ['exploder', 'ambusher', 'pack', 'swarm'], 3: ['blocker', 'wyvern', 'charger', 'dragon', 'exploder'],
    4: ['sniper', 'latcher', 'shieldbearer', 'queen', 'ambusher'], 5: ['bomber', 'pack', 'sniper', 'blocker', 'latcher', 'wyvern'] },
  other: { 1: ['swarm', 'pack', 'exploder', 'mimic'], 2: ['blocker', 'ambusher', 'wyvern', 'latcher', 'swarm'], 3: ['sniper', 'charger', 'shieldbearer', 'dragon', 'pack'],
    4: ['bomber', 'queen', 'exploder', 'mimic', 'ambusher'], 5: ['blocker', 'sniper', 'wyvern', 'charger', 'latcher', 'bomber', 'swarm'] }
};
export const ELITES = new Set(['dragon', 'queen']);
export const CAMPAIGN = [...FOREST_LEVELS.map(l => ({ ...l, biome: 'forest', boss: l.boss ? 'beetle' : undefined, setPiece: FOREST_SET[l.id] })), ...NEW_LEVELS]
  .map(l => LAYOUTS[l.id] ? { ...l, layout: LAYOUTS[l.id] } : l);
export const LEVEL_COUNT = CAMPAIGN.length; // 36
export const biomeOf = id => CAMPAIGN[id - 1]?.biome || 'forest';
export const firstLevelOf = biome => CAMPAIGN.find(l => l.biome === biome).id;

// ---- Bosses. Weak points are (fx, fy) fractions of the art (0,0 = top left). hp by difficulty.
// Every boss: 3 phases at 66% and 33%, an arena 16 m wide, three breakable cover blocks.
export const BOSSES = {
  wyrm: {
    name: 'THE DUNE WYRM', title: 'Dune Wyrm', biome: 'desert', hp: { easy: 130, medium: 190, hard: 250 }, w: 5.6,
    art: { front: 'desert/boss_a', roar: 'desert/boss_b', belly: 'desert/boss_c' },
    phases: ['SURFACE', 'BURROW', 'STORM'], reward: { coins: 250, weapon: 'lance' }, starTime: 170,
    weak: { gills: [[.2, .26, .5], [.8, .26, .5]], mouth: [[.5, .22, .7]], belly: [[.45, .55, .9]] },
    hint: 'Shoot the glowing gills when it rears up'
  },
  titan: {
    name: 'THE FROST TITAN', title: 'Frost Titan', biome: 'tundra', hp: { easy: 140, medium: 210, hard: 280 }, w: 7.2,
    art: { front: 'tundra/boss_a', open: 'tundra/boss_b' }, plate: 'tundra/ice_plate',
    phases: ['ARMOURED', 'FREEZE', 'BLIZZARD'], reward: { coins: 275, weapon: 'launcher' }, starTime: 180,
    plates: [[.37, .3], [.63, .3], [.18, .22], [.82, .22]], plateHp: 24,
    weak: { core: [[.5, .3, .8]] },
    hint: 'Shatter the four ice plates · grenades crack one each'
  },
  serpent: {
    name: 'THE MAGMA SERPENT', title: 'Magma Serpent', biome: 'volcano', hp: { easy: 150, medium: 225, hard: 300 }, w: 5.2,
    art: { front: 'volcano/boss_a', roar: 'volcano/boss_b', tail: 'volcano/tail' },
    phases: ['RISE', 'WAVE', 'COIL'], reward: { coins: 300, weapon: 'orb' }, starTime: 180,
    weak: { throat: [[.5, .36, .6]], head: [[.5, .12, .55], [.5, .3, .5]], tail: [[.42, .18, .55]] },
    hint: 'Shoot the glowing throat as it rears'
  },
  manta: {
    name: 'THE VOID MANTA', title: 'Void Manta', biome: 'space', hp: { easy: 160, medium: 240, hard: 320 }, w: 10,
    art: { front: 'space/boss_a', under: 'space/boss_b', crashed: 'space/boss_c' },
    phases: ['STRAFE', 'BEAM', 'CRASH'], reward: { coins: 325, weapon: 'cannon' }, starTime: 190,
    pods: [[.3, .3], [.68, .3], [.36, .68], [.62, .68]], podHp: 14,
    weak: { head: [[.5, .82, .7]], back: [[.5, .45, .9]] },
    hint: 'Shoot the red pods under its wings as it passes overhead'
  },
  overmind: {
    name: 'THE OVERMIND', title: 'Overmind', biome: 'city', hp: { easy: 210, medium: 310, hard: 410 }, w: 12.5,
    art: { base: 'city/boss_e', fortress: 'city/boss_a', split: 'city/boss_b', heart: 'city/boss_c', death: 'city/boss_d' },
    phases: ['FORTRESS', 'SWARM', 'COLLAPSE'], reward: { coins: 500, weapon: null }, starTime: 240,
    trophies: [ // [art, fx, fy, width fraction, hp, name]
      ['city/trophy_1', .5, .44, .3, 24, 'Beetle horn'], ['city/trophy_2', .26, .4, .2, 18, 'Frost plate'], ['city/trophy_3', .74, .4, .2, 18, 'Frost plate'],
      ['city/trophy_4', .5, .66, .26, 18, 'Wyrm collar'], ['city/trophy_5', .5, .2, .22, 18, 'Serpent scales']],
    weak: { eye: [[.5, .45, .9]], heart: [[.5, .45, 1.2], [.5, .15, .6]] },
    taunts: {
      start: 'SO, THE LITTLE SOLDIER CLIMBED MY TOWER. DO YOU LIKE MY TROPHIES? YOU MADE THEM FOR ME.',
      phase2: 'YOU BREAK MY ARMOUR. I HAVE ROOTS IN EVERY STONE BENEATH YOUR FEET.',
      phase3: 'ENOUGH. LOOK UPON WHAT YOU HAVE BEEN SHOOTING ALL ALONG. EVERY CORE YOU CRACKED WAS A PIECE OF ME.',
      low: 'IF I FALL, I TAKE THIS CITY WITH ME.',
      death: ['AGAIN. I CAN WAIT FOREVER.', 'YOUR WORLD WAS SEEDED BEFORE YOU WERE BORN.', 'STAY. BECOME MY NEXT TROPHY.']
    },
    hint: 'Shoot the trophies off its armour'
  }
};
export const BOSS_DAMAGE = { bullet: .4, armour: 1 / 3, weak: 3 }; // same scale as the Beetle Tank

// ---- Weapons. Standard weapons are bought at the Quartermaster once their level is reached;
// boss weapons are free at tier 1 the moment their boss falls, and only they have a tier 3 perk.
// dmg is per round in rifle-round units; cooldown in seconds; range in metres.
export const WEAPONS = {
  rifle: { name: 'Rifle', tier: 'standard', after: 1, price: 0, icon: 'sprites/weapon_rifle', kind: 'hitscan', cooldown: .12, dmg: 1, range: 70, pellets: [0], blurb: 'All-round · 70 m',
    t1: '+15% damage', t2: '+15% fire rate', t3: 'Every 6th shot fires a 3-round burst' },
  dual: { name: 'Dual Pistols', tier: 'standard', after: 2, price: 120, icon: 'sprites/weapon_dual', kind: 'hitscan', cooldown: .075, dmg: .62, range: 40, pellets: [0], alternate: true, blurb: 'Very fast fire · 40 m · strong against drones', t1: '+20% damage' },
  ripper: { name: 'Vine Ripper', tier: 'standard', after: 4, price: 200, icon: 'jungle-biome/weapon_vine_ripper', kind: 'hitscan', cooldown: .055, dmg: .5, range: 50, pellets: [0], wobble: .045, blurb: 'Bullet hose with a wobbly aim · low damage per hit', t1: 'Steadier aim (−40% wobble)' },
  scatter: { name: 'Thorn Scatter', tier: 'standard', after: 8, price: 300, icon: 'desert/weapon_1', kind: 'hitscan', cooldown: .62, dmg: .9, range: 22, pellets: [-.1, -.06, -.02, .02, .06, .1], vspread: .03, blurb: '6 pellets · 22 m · huge damage up close', t1: 'Tighter spread' },
  marksman: { name: 'Marksman Rifle', tier: 'standard', after: 10, price: 380, icon: 'desert/weapon_2', kind: 'hitscan', cooldown: .55, dmg: 4, range: 70, pellets: [0], weakBonus: 1.5, blurb: 'Slow and hard-hitting · rewards weak-point shots', t1: '+20% damage' },
  torch: { name: 'Ember Torch', tier: 'standard', after: 14, price: 450, icon: 'tundra/weapon_1', kind: 'flame', cooldown: .09, dmg: .45, range: 10, burn: 2, blurb: 'Short cone that burns · melts ice shells', t1: '+2 m reach' },
  rotary: { name: 'Rotary Gun', tier: 'standard', after: 16, price: 520, icon: 'tundra/weapon_2', kind: 'hitscan', cooldown: .045, spinUp: 1, dmg: .58, range: 55, pellets: [0], wobble: .02, slow: .15, blurb: 'Spins up to a huge fire rate · you run 15% slower', t1: 'Spins up twice as fast' },
  arc: { name: 'Arc Carbine', tier: 'standard', after: 20, price: 600, icon: 'volcano/weapon_1', kind: 'hitscan', cooldown: .32, dmg: 1.5, range: 50, pellets: [0], chain: 3, blurb: 'Lightning that chains between 3 enemies', t1: 'Chains to 4 enemies' },
  seeker: { name: 'Seeker Pod', tier: 'standard', after: 22, price: 650, icon: 'volcano/weapon_2', kind: 'rocket', cooldown: 1.35, dmg: 2.2, range: 70, salvo: 3, blurb: 'Fires 3 small rockets in a spread · slow reload', t1: '25% faster reload' },
  repulsor: { name: 'Void Repulsor', tier: 'standard', after: 26, price: 700, icon: 'space/weapon_1', kind: 'blast', cooldown: .9, dmg: 1.6, range: 14, blurb: 'Blast that knocks enemies back and stuns them', t1: 'Stun lasts 1.5 s' },
  mine: { name: 'Gravity Mine', tier: 'standard', after: 28, price: 750, icon: 'space/weapon_mine', kind: 'mine', cooldown: 2.4, dmg: 3, range: 30, pull: 5, blurb: 'Sticks to the ground and pulls enemies within 5 m together for 2 s', t1: 'Pull radius 7 m' },
  triple: { name: 'Triple Shot', tier: 'boss', boss: 6, price: 0, icon: 'sprites/weapon_triple', kind: 'hitscan', cooldown: .15, dmg: 1, range: 70, pellets: [-.075, 0, .075], blurb: 'Spread of 3 · swarms and drones',
    t1: 'Tighter spread', t2: '+15% damage', t3: 'Fires 5 shots instead of 3' },
  lance: { name: 'Lance', tier: 'boss', boss: 12, price: 0, icon: 'desert/weapon_3', kind: 'hitscan', cooldown: .45, dmg: 3, range: 70, pellets: [0], pierce: 3, blurb: 'Long range · pierces up to 3 enemies',
    t1: '25% faster fire', t2: '+20% damage', t3: 'Pierces 5 enemies' },
  launcher: { name: 'Grenade Launcher', tier: 'boss', boss: 18, price: 0, icon: 'tundra/weapon_3', kind: 'shell', cooldown: .85, dmg: 3, range: 50, radius: 3, blurb: 'Arcing splash · armour and groups',
    t1: '+20% radius', t2: '+15% fire rate', t3: 'Shells split into 3 bomblets' },
  orb: { name: 'Orb Blaster', tier: 'boss', boss: 24, price: 0, icon: 'volcano/weapon_3', kind: 'orb', cooldown: .5, dmg: 2.2, range: 60, blurb: 'Slow heavy orbs that fly straight · big hits',
    t1: 'Faster orbs', t2: '+15% damage', t3: 'Orbs split in two on a hit' },
  cannon: { name: 'Light Cannon', tier: 'boss', boss: 30, price: 0, icon: 'space/weapon_2', kind: 'beam', cooldown: .4, charge: .9, dmg: 7, range: 70, blurb: 'Hold to charge a piercing beam · bosses',
    t1: '25% faster charge', t2: 'Longer, wider beam', t3: 'The beam jumps to a second target' }
};
export const WEAPON_ORDER = ['rifle', 'dual', 'ripper', 'triple', 'scatter', 'marksman', 'lance', 'torch', 'rotary', 'launcher', 'arc', 'seeker', 'orb', 'repulsor', 'mine', 'cannon'];
// Tier prices: standard weapons have 2 tiers, boss weapons 3 (tier 3 = the perk).
export const TIER_PRICE = { standard: [150, 260], boss: [200, 320, 480] };
export const tierPrice = (key, next) => Math.round((TIER_PRICE[WEAPONS[key].tier][next - 1] || 0) * (1 + (WEAPONS[key].after || WEAPONS[key].boss || 1) / 60));

// ---- Soldier upgrades (permanent, every weapon and level). price per level.
export const UPGRADES = {
  hollow: { name: 'Hollow points', levels: 3, each: '+10% damage', price: [120, 220, 360] },
  trigger: { name: 'Trigger', levels: 3, each: '+10% fire rate', price: [120, 220, 360] },
  barrel: { name: 'Long barrel', levels: 2, each: '+3 m range for short-range weapons', price: [100, 200] },
  weak: { name: 'Weak-point specialist', levels: 2, each: '+15% weak-point damage', price: [160, 300] },
  armour: { name: 'Armour', levels: 3, each: '+10 max health · shown as gear', price: [150, 280, 420], gear: ['chest plate', 'shoulder plates', 'visor helmet'] },
  feet: { name: 'Quick feet', levels: 2, each: '+5% run speed · 0.2 s shorter roll cooldown', price: [130, 260] },
  belt: { name: 'Grenade belt', levels: 2, each: '+1 grenade capacity (3 → 4 → 5) · pouches on the belt', price: [140, 280] },
  blast: { name: 'Blast radius', levels: 2, each: '+20% grenade radius', price: [120, 240] },
  powerup: { name: 'Power-up time', levels: 2, each: 'Power-ups last 25% longer', price: [110, 220] },
  magnet: { name: 'Magnet', levels: 2, each: 'Larger coin pickup radius', price: [90, 180] },
  medic: { name: 'Field medic', levels: 1, each: 'Revive once per level at 30% health · medic pouch', price: [450] },
  startShield: { name: 'Starting shield', levels: 1, each: 'Begin each level with a shield', price: [300] }
};
export const UNIFORMS = {
  jungle: { name: 'Jungle', price: 0, tint: [1, 1, 1] },
  desert: { name: 'Desert', price: 80, tint: [1.25, 1.08, .82], after: 7 },
  arctic: { name: 'Arctic', price: 80, tint: [1.35, 1.38, 1.45], after: 13 },
  ember: { name: 'Ember', price: 80, tint: [1.2, .78, .66], after: 19 },
  void: { name: 'Void', price: 80, tint: [.62, .68, .86], after: 25 },
  royal: { name: 'Royal', price: 120, tint: [1.05, .72, 1.18], after: 31 }
};

// New Game+: unlocked by beating the Overmind on a difficulty.
export const NG_PLUS = { enemyHp: 1.5, waveScale: .82, coins: 1.5, bossHp: 1.35 };

// Ending credits: the cast roll, in order of appearance.
export const CAST = [
  ['sprites/drone_front', 'ROTOR DRONE'], ['sprites/crawler_front', 'ARMOURED CRAWLER'], ['sprites/turret_front', 'FLOWER TURRET'],
  ['jungle-biome/enemy_leaf_buggy_front', 'LEAF BUGGY'], ['sprites/enemy_hive_bee', 'HIVE BEE'], ['sprites/boss_beetle_tank_siege', 'THE BEETLE TANK'],
  ['desert/scarab', 'SCARAB DRONE'], ['desert/raptor', 'MECH RAPTOR'], ['desert/tortoise', 'STONE TORTOISE'], ['desert/boss_a', 'THE DUNE WYRM'],
  ['tundra/frost_drone', 'FROST DRONE'], ['tundra/stalker', 'SNOW STALKER'], ['tundra/ram', 'GLACIER RAM'], ['tundra/boss_a', 'THE FROST TITAN'],
  ['volcano/ember_drone', 'EMBER DRONE'], ['volcano/lantern', 'LANTERN DRONE'], ['volcano/golem', 'LAVA GOLEM'], ['volcano/boss_a', 'THE MAGMA SERPENT'],
  ['space/security_drone', 'SECURITY DRONE'], ['space/wisp', 'EYE WISP'], ['space/shield_drone', 'SHIELD DRONE'], ['space/boss_a', 'THE VOID MANTA'],
  ['city/sentinel', 'SENTINEL'], ['city/elite_6', 'ELITE FROST GOLEM'], ['city/boss_a', 'THE OVERMIND']
];
