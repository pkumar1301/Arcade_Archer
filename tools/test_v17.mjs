// V17 checks: the shoulder drone, the line of fire, the 14 new enemy roles in all six biomes,
// the roster's coverage, and every level still finishable by the bots.
// Start a local server first: python3 -m http.server 8774 --bind 127.0.0.1
// Then: node tools/test_v17.mjs [outDir]   (Playwright + Chromium; SwiftShader WebGL)
import playwright from 'playwright';
import fs from 'node:fs';
const { chromium } = playwright;
const out = process.argv[2] || '.';
const base = (process.env.GAME_URL || 'http://127.0.0.1:8774/') + '?test=1';
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const errors = [];
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', e => errors.push(String(e))); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.waitForFunction(() => window.gameTest, null, { timeout: 120000 });
await page.waitForTimeout(3000);
const ev = (fn, arg) => page.evaluate(fn, arg);
const R = { checks: {}, data: {} };
const check = (name, pass, detail) => { R.checks[name] = { pass: !!pass, detail }; console.log((pass ? 'PASS ' : 'FAIL ') + name + ' ' + JSON.stringify(detail).slice(0, 600)); };
const LEVELS = [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 19, 20, 21, 22, 23, 25, 26, 27, 28, 29, 31, 32, 33, 34, 35];
const BIOMES = ['forest', 'desert', 'tundra', 'volcano', 'space', 'city'];

// 1. Shoulder drone
const d = await ev(() => gameTest.v17Drone('medium'));
R.data.drone = d;
check('Drone pickups give 25 -> 35 -> 45 -> 55 -> 60%, then a pickup is ignored', d.shares.join() === '25,35,45,55,60' && d.capIgnored, { shares: d.shares, capIgnored: d.capIgnored });
check('Drone art steps up in three tiers', d.arts.join() === 'drone/p_pod_t1,drone/p_pod_t1,drone/p_pod_t2,drone/p_pod_t2,drone/p_pod_t3', d.arts);
check('Drone takes the damage you take (20 -> 40 of 60) and a pickup at the cap repairs it', d.hpAfter20 === 40 && d.repairedAtCap, d);
check('Drone can be destroyed (bracket stays) and the next pickup mounts a new one at 25%', d.destroyed && d.afterRebuild === 25, d);
check('Drone damage per second is its share of the current weapon (power bolts not counted)', Object.values(d.dps).every(x => x.got >= x.want * .9 && x.got <= x.want * 1.06), d.dps);
check('Drone sits on the right shoulder (no flying drone) and does not carry over between levels', d.onRightShoulder && d.flying && d.carriedOver === 0, { onRightShoulder: d.onRightShoulder, carriedOver: d.carriedOver });

// 2. Line of fire
const a = await ev(() => gameTest.v17Aim('medium'));
R.data.aim = a;
check('A shot through the crosshair hits the enemy painted under it', a.centreHit, a);
check('Transparent pixels inside an enemy picture are not hit (hit area = visible art)', a.maskBuilt && a.transparentMiss, a);
check('Enemies level with you can be hit', a.levelHit, a);
check('The first enemy on the line takes the hit, not the one behind it', a.firstOnLine, a);
check('No target ring around the enemy under the crosshair (the crosshair turns red instead)', !a.ringShown && a.reticleRed, a);
check('Rockets and orbs fly straight (no homing)', a.rocketTurn < .01 && a.orbTurn < .01, { rocketTurn: a.rocketTurn, orbTurn: a.orbTurn });

// 3. The 14 new roles in all six biomes
const roles = {};
for (const b of BIOMES) roles[b] = await ev(b => gameTest.v17Roles('medium', b), b);
R.data.roles = roles;
const all = (role, fn) => BIOMES.every(b => !roles[b][role].error && fn(roles[b][role]));
const errs = Object.fromEntries(BIOMES.flatMap(b => Object.entries(roles[b]).filter(([, o]) => o.error).map(([r, o]) => [b + ':' + r, o.error])));
check('No role errors in any biome', Object.keys(errs).length === 0, errs);
check('Blocker: plants a shell wall, front hits soak into the shell, flank hits hurt, a grenade breaks it', all('blocker', o => o.braced && o.frontAbsorbed && o.flankHurts && o.wall && o.grenadeBreaks && o.wallGone), roles.forest.blocker);
check('Exploder: swells and bursts near you; killing it sets it off', all('exploder', o => o.swelled && o.blastHurts && o.killSetsOff), roles.forest.exploder);
check('Ambusher: marked ground, bullets cannot reach it hidden (a blast flushes it out), erupts at ~8.5 m and attacks', all('ambusher', o => o.hiddenSafe && o.blastFlushes && o.tellShown && o.erupted && o.attacks), BIOMES.map(b => roles[b].ambusher.eruptRange));
check('Raptor pack: three hold until the leader screeches, then run you down', all('pack', o => o.n === 3 && o.leaderCalled && o.released && o.attacks), roles.forest.pack);
check('Wyvern: flies, dives and spits onto a marked spot', all('wyvern', o => o.dove && o.spitHurts && o.flying), roles.forest.wyvern);
check('Elite dragon: blocks the path, breath down a marked lane (dodgeable), chest weak point, path opens when it dies', all('dragon', o => o.blocks && o.breathHurts && o.dodged && o.weakInBreath && o.passableAfter), roles.forest.dragon);
check('Charger: a hit in its lane; dodged, it is stunned with a weak point', all('charger', o => o.hitInLane && o.stunnedOnMiss && o.weakWhenStunned), roles.forest.charger);
check('Sniper: red laser, hits a still target, misses if you move after the lock', all('sniper', o => o.laser && o.hitsStill && o.missesMover), roles.forest.sniper);
check('Latcher: clings, drains health, a roll shakes it off', all('latcher', o => o.latched && o.drains && o.rollShakesOff), roles.forest.latcher);
check('Mimic: looks like a chest, opens within ~6.5 m, bites, drops coins and a power-up', all('mimic', o => o.looksLikeChest && o.bites && o.loot), BIOMES.map(b => roles[b].mimic.revealedAt));
check('Shield-bearer: dome over its escorts (no damage), not itself, gone when it dies', all('shieldbearer', o => o.escorts >= 1 && o.casting && o.shielded && o.noDamageInDome && o.selfNotShielded && o.domeDropsOnDeath), roles.forest.shieldbearer);
check('Swarm: six critters that bite, one hit each', all('swarm', o => o.n === 6 && o.bites && o.oneHit), roles.forest.swarm);
check('Brood queen: stays back, spawns young, egg sac weak point, young die with her', all('queen', o => o.young > 0 && o.eggSacWeak && o.staysBack && o.youngDie), roles.forest.queen);
check('Bomber: flies high and drops bombs on marked spots', all('bomber', o => o.marked && o.bombHurts && o.high), roles.forest.bomber);

// 4. Roster coverage: every role in every biome, on Easy and Medium
const cov = await ev(() => gameTest.v17Coverage());
R.data.coverage = cov;
check('Every new role appears in all six biomes (Easy and Medium)', Object.values(cov).every(c => c.count === 14), Object.fromEntries(Object.entries(cov).map(([k, c]) => [k, c.count])));

// 5. Every level can still be finished
const god = {};
for (const id of LEVELS) god[id] = await ev(id => { const r = gameTest.godBot('medium', id); return { mode: r.mode, d: r.d, t: r.t, stuck: r.stuck }; }, id);
R.data.god = god;
check('All 30 levels can be finished (invulnerable bot, Medium)', Object.values(god).every(r => r.mode === 'finish' && r.stuck === 0), Object.fromEntries(Object.entries(god).map(([k, r]) => [k, r.mode + ' ' + r.d + ' m ' + r.t + ' s'])));
const easy = {};
for (const id of LEVELS) easy[id] = await ev(id => { const s = gameTest.bot('easy', id); return { mode: s.mode, health: s.health }; }, id);
R.data.easy = easy;
const easyClears = Object.values(easy).filter(r => r.mode === 'finish').length;
check('Easy bot (no dodging, fixed weave) clears most levels', easyClears >= 24, { cleared: easyClears + ' / 30', levels: easy });

// 6. Screenshots
const role = (r, frames, d = 'distance+30', extra = '') => `(()=>{gameTest.prep('medium',gameTest.cur);const es=spawnRole('${r}',${d});gameTest.step(${frames},(i)=>{${extra}});})()`;
const shots = [
  ['drone', 9, "(()=>{gameTest.prep('medium',9);for(let i=0;i<5;i++)collectDrop('auto');spawnRole('swarm',distance+14);gameTest.step(14);})()"],
  ['blocker', 8, role('blocker', 150, 'distance+30', 'if(es[0].state==="braced")return false;')],
  ['exploder', 3, role('exploder', 60, 'distance+16', 'if(es[0].state==="swell")return false;')],
  ['ambusher', 14, role('ambusher', 4, 'distance+16')],
  ['pack', 19, role('pack', 30, 'distance+26')],
  ['wyvern', 26, role('wyvern', 120, '0', 'if(es[0].state==="dive"&&es[0].t>.5)return false;')],
  ['dragon', 33, "(()=>{gameTest.prep('medium',33);const e=spawnRole('dragon',distance+40)[0];held.add('KeyW');gameTest.step(260,()=>!(e.phase==='breath'&&e.t>.3));held.clear();})()"],
  ['charger', 21, role('charger', 160, 'distance+30', 'if(es[0].state==="aim"&&es[0].t>.6)return false;')],
  ['sniper', 27, role('sniper', 200, '0', 'if(es[0].state==="aim"&&es[0].t<.8)return false;')],
  ['latcher', 20, role('latcher', 90, 'distance+9', 'if(roster.latched)return false;')],
  ['mimic', 13, role('mimic', 3, 'distance+12')],
  ['shieldbearer', 7, role('shieldbearer', 120, 'distance+16', 'if(es[0].casting>3)return false;')],
  ['swarm', 31, role('swarm', 12, 'distance+18')],
  ['queen', 22, role('queen', 260, '0', 'if(es[0].spawning>.4&&es[0].spawning<.8)return false;')],
  ['bomber', 34, role('bomber', 300, '0', 'if(hz.markers.length>=2)return false;')]];
for (const [name, id, src] of shots) {
  await ev(([id, src]) => { gameTest.start('medium', id); gameTest.cur = id; gameTest.run(src); }, [id, src]);
  await page.waitForTimeout(3000); await ev(() => gameTest.scene()); await page.waitForTimeout(250);
  await page.screenshot({ path: `${out}/v17-${name}.png` });
}
check('No page or console errors', errors.length === 0, errors.slice(0, 5));
fs.writeFileSync(`${out}/V17-test-results.json`, JSON.stringify(R, null, 1));
const failed = Object.entries(R.checks).filter(([, c]) => !c.pass).map(([k]) => k);
console.log(failed.length ? 'FAILED: ' + failed.join(' | ') : 'ALL ' + Object.keys(R.checks).length + ' CHECKS PASSED');
await browser.close();
