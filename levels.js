// V14: Forest campaign data (brief section 14). Every level is described here so
// L1-L5 and the boss share one engine. game.js reads these fields; balance passes
// should only need to edit this file.
//
// length      metres to the finish gate (all Forest levels are 950 m; the scenery
//             is built once for that length)
// music       track key in music.js
// light       lighting preset in game.js: sunrise, dusk or night
// enemies     fixed encounters along the course
// waves       recurring waves (V13 system): interval scale, what each wave carries
// hazards     course layout: base pattern plus extra pits, pit gates and thorns
// coverBlocksShots  cover stops enemy bolts (new levels; L1 keeps V13 behaviour)

export const FOREST = 'Forest';

export const LEVELS = [
  {
    id: 1, name: 'Overgrown Trail', idea: 'The jungle run: drones, crawlers and turrets.',
    length: 950, music: 'jungle', light: 'sunrise', coverBlocksShots: false,
    enemies: { base: 'v13', turrets: null, buggies: null, bees: null, mushrooms: null, sideBySide: null },
    waves: { intervalScale: 1, crawler: true, buggyEvery: 0, extraDrones: 0 },
    hazards: { base: 'v13', extraPits: 0, pitGates: 0, extraThorns: 0, mapStop: [14, 84] }
  },
  {
    id: 2, name: 'Temple Approach', idea: 'Turret gauntlet: stop behind cover, wait for the shot, pop out.',
    length: 950, music: 'canopy', light: 'sunrise', coverBlocksShots: true,
    enemies: { base: 'v13-no-turrets', turrets: { every: [70, 90], start: 95, coverGap: 13 }, buggies: null, bees: null, mushrooms: null, sideBySide: null },
    waves: { intervalScale: 1.1, crawler: true, buggyEvery: 0, extraDrones: 0 },
    hazards: { base: 'v13', extraPits: 0, pitGates: 0, extraThorns: 0, mapStop: [30, 68] }
  },
  {
    id: 3, name: 'Buggy Run', idea: 'Leaf Buggies charge down marked lanes; pits narrow the safe lanes.',
    length: 950, music: 'jungle', light: 'dusk', coverBlocksShots: true,
    enemies: { base: 'v13-drones-crawlers', turrets: null, buggies: { every: [60, 75], start: 110 }, bees: null, mushrooms: null, sideBySide: null },
    waves: { intervalScale: 1.15, crawler: true, buggyEvery: 4, extraDrones: 0 },
    hazards: { base: 'v13-light', extraPits: 0, pitGates: 7, extraThorns: 0, mapStop: [36, 40] }
  },
  {
    id: 4, name: 'Hive Grove', idea: 'Hive bees and spore mushrooms: stun groups, then clear them.',
    length: 950, music: 'canopy', light: 'dusk', coverBlocksShots: true,
    enemies: { base: 'v13-drones-turrets', turrets: null, buggies: null, bees: { every: [120, 140], start: 140 }, mushrooms: { perBee: 3 }, sideBySide: null },
    waves: { intervalScale: 1.1, crawler: false, buggyEvery: 0, extraDrones: 1 },
    hazards: { base: 'v13', extraPits: 0, pitGates: 0, extraThorns: 0, mapStop: [65, 49] }
  },
  {
    id: 5, name: 'Night of the Ancients', idea: 'Gauntlet with no quiet stretches; two crawlers side by side midway.',
    length: 950, music: 'night', light: 'night', coverBlocksShots: true,
    enemies: { base: 'v13', turrets: null, buggies: { every: [130, 150], start: 160 }, bees: { every: [210, 230], start: 230 }, mushrooms: { perBee: 2 }, sideBySide: { d: 475 } },
    waves: { intervalScale: .75, crawler: true, buggyEvery: 5, extraDrones: 0 },
    hazards: { base: 'v13', extraPits: 6, pitGates: 0, extraThorns: 8, lanterns: 24, mapStop: [62, 28] }
  },
  {
    id: 6, name: 'The Beetle Tank', idea: 'Forest boss: three phases in the temple clearing.',
    boss: true, length: 0, music: 'boss', light: 'dusk', coverBlocksShots: true,
    hazards: { mapStop: [87, 24] }
  }
];

// Flat damage per difficulty (brief section 14). Index: easy, medium, hard.
export const NEW_DAMAGE = {
  buggyRam: { easy: 5, medium: 10, hard: 18 },
  miniLeak: { easy: 1, medium: 3, hard: 5 }
};

export const BUGGY = { hp: 8, podHp: 2, enterRange: [45, 50], markerTime: 1.5, chargeSpeed: 10, laneHalfWidth: 1.35 };
export const BEE = { hp: 10, hover: [20, 25], releaseEvery: 4, minis: 3, bellyMultiplier: 2, grenadeClearRadius: 9 };
export const MINI = { hp: 1, speed: 6.5, scale: .5 };
export const MUSHROOM = { hp: 1, stunRadius: 4, stunTime: 2, cloudTime: 3.2, cloudRadius: 2.6, soldierSlow: .4 };

// Beetle Tank (brief section 14). Health and damage are starting values for playtests.
export const BOSS = {
  hp: { easy: 80, medium: 120, hard: 160 },
  armour: 1 / 3, core: 3, podHp: 2, podTankDamage: 5,
  bulletDamage: .4, // damage of one rifle round before armour or core multipliers (playtest value)
  arenaHalfWidth: 8, stepRange: 3, tankRange: 22, rampageMinRange: 15, creepSpeed: .35,
  cover: { count: 3, hits: 6, range: 4.5, lanes: [-5, 0, 5] },
  siege: { volleyEvery: 3, bolts: 3, boltGap: .16, chargeTime: 1.1, coreOpen: 1.5 },
  brood: { hatchEvery: 8, volleyEvery: 5, swell: 2.2, crawlerSpeed: 3 },
  rampage: { markerTime: 1, chargeSpeed: 15, chargeEnd: 1, stuck: 2, laneHalfWidth: 2.6, slamWarn: 1, slamSpeed: 11, slamJump: .45, grenadeMultiplier: 3, grenadeBonus: 2, criticalAt: .12 },
  reward: { coins: 200, weapon: 'triple' },
  starTime: 150
};

export const WEAPONS = {
  rifle: { name: 'Rifle', icon: 'weapon_rifle', cooldown: .12, pellets: [0] },
  triple: { name: 'Triple Shot', icon: 'weapon_triple', cooldown: .15, pellets: [-.075, 0, .075] }
};
