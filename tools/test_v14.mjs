// V14 checks: brief section 14 (Forest build: L2-L5, the Beetle Tank, level select and progression).
// Start a local server first: python3 -m http.server 8774 --bind 127.0.0.1
// Then: node tools/test_v14.mjs [outDir]   (Playwright + Chromium; SwiftShader WebGL)
import playwright from 'playwright';
import fs from 'node:fs';
const { chromium } = playwright;
const out = process.argv[2] || '.';
const base = (process.env.GAME_URL || 'http://127.0.0.1:8774/') + '?test=1';
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const errors = [];
const watch = p => { p.on('pageerror', e => errors.push(String(e))); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); };
const open = async ctx => { const p = await ctx.newPage(); watch(p); await p.goto(base, { waitUntil: 'domcontentloaded', timeout: 120000 }); await p.waitForFunction(() => window.gameTest, null, { timeout: 120000 }); return p; };
let ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
let page = await open(ctx);
await page.waitForTimeout(4000); // let the art load before screenshots
const ev = (fn, arg) => page.evaluate(fn, arg);
const R = { checks: {}, data: {} };
const check = (name, pass, detail) => { R.checks[name] = { pass: !!pass, detail }; console.log((pass ? 'PASS ' : 'FAIL ') + name + ' ' + JSON.stringify(detail)); };
const shot = async (name, fn, arg) => { if (fn) await ev(fn, arg); await page.waitForTimeout(300); await page.screenshot({ path: `${out}/v14-${name}.png` }); };

// L1 is unchanged from V13 (same bot results as docs/V13-validation.md).
const l1 = {};
for (const k of ['easy', 'medium', 'hard']) l1[k] = await ev(k => { const s = gameTest.bot(k, 1); return { mode: s.mode, health: s.health, d: +s.distance.toFixed(1), t: +s.elapsed.toFixed(1) }; }, k);
check('L1 unchanged (V13 bot)', l1.easy.mode === 'finish' && l1.easy.health === 4 && l1.easy.t === 196.1 && l1.medium.d === 130 && l1.hard.d === 90.1, l1);

// Level data
const info = [];
for (const id of [1, 2, 3, 4, 5, 6]) info.push(await ev(id => { gameTest.start('medium', id); return gameTest.levelInfo(); }, id));
R.data.levels = info;
check('Levels as data (music, light, enemy mix)', info.map(i => i.music).join() === 'jungle,canopy,jungle,canopy,night,boss' && info.map(i => i.light).join() === 'sunrise,sunrise,dusk,dusk,night,dusk'
  && info[1].types.turret >= 10 && info[2].types.buggy > 0 && info[3].types.bee > 0 && info[3].types.mushroom > 0 && ['moth', 'beetle', 'turret', 'buggy', 'bee'].every(t => info[4].types[t] > 0), info.map(i => ({ id: i.id, music: i.music, light: i.light, types: i.types })));
const tc = await ev(() => { gameTest.start('medium', 2); return gameTest.turretCover(); });
const gaps = tc.slice(1).map((t, i) => t.d - tc[i].d);
check('L2 turret every 70-90 m with cover in front', tc.every(t => t.cover.length > 0) && gaps.every(g => g >= 70 && g <= 90), { turrets: tc.length, gaps });

// Bots: clear Easy everywhere, die early on Medium and Hard
const bots = {};
for (const k of ['easy', 'medium', 'hard']) for (const id of [1, 2, 3, 4, 5]) bots[k + ' L' + id] = await ev(([k, id]) => { const s = gameTest.bot(k, id); return { mode: s.mode, health: s.health, d: +s.distance.toFixed(0), t: +s.elapsed.toFixed(0) }; }, [k, id]);
R.data.bots = bots;
check('Bot clears Easy on every level', [1, 2, 3, 4, 5].every(id => bots['easy L' + id].mode === 'finish'), Object.fromEntries([1, 2, 3, 4, 5].map(id => ['L' + id, bots['easy L' + id]])));
check('Bot dies early on Medium and Hard', ['medium', 'hard'].every(k => [1, 2, 3, 4, 5].every(id => bots[k + ' L' + id].mode === 'end' && bots[k + ' L' + id].d < 300)), Object.fromEntries(Object.entries(bots).filter(([k]) => !k.startsWith('easy'))));

// New enemies
const ram = { easy: 5, medium: 10, hard: 18 }, leak = { easy: 3, medium: 6, hard: 10 }, mini = { easy: 1, medium: 3, hard: 5 };
const buggies = {};
for (const k of ['easy', 'medium', 'hard']) buggies[k] = { inLane: await ev(k => gameTest.buggy(k, true), k), dodged: await ev(k => gameTest.buggy(k, false), k) };
check('Buggy lane marker 1.5 s before every charge; pods take damage; ram damage matches', Object.entries(buggies).every(([k, b]) => b.inLane.markerVisible && Math.abs(b.inLane.chargeAfter - 1.5) < .1 && b.inLane.speed === 10 && b.inLane.lost === ram[k] && b.dodged.lost === leak[k] && b.inLane.pod.podHp === 0 && b.inLane.pod.buggyHp === 6), buggies);
const bees = {};
for (const k of ['easy', 'medium', 'hard']) bees[k] = await ev(k => gameTest.bee(k), k);
check('Hive bee: 3 mini-drones every 4 s; belly double; grenade clears minis', Object.entries(bees).every(([k, b]) => b.releases.length >= 3 && b.releases.every(r => r.count === 3) && b.releases.slice(1).every((r, i) => Math.abs(r.t - b.releases[i].t - 4) < .1) && b.releases.every(r => r.range >= 20 && r.range <= 25) && b.belly === 2 * b.body && b.minisAfterGrenade === 0 && b.miniLeak === mini[k]), bees);
const spores = await ev(() => gameTest.spores('medium'));
check('Spore mushroom stuns within 4 m for 2 s; cloud slows the soldier', spores.near === 2 && spores.far === 0 && spores.nearMovedWhileStunned === 0 && spores.stunEndsAfter2s && spores.speedInCloud < spores.speedOutside * .62, spores);

// Lighting
check('Dusk fog on L3 and L4, night with lanterns on L5', info[2].light === 'dusk' && info[3].light === 'dusk' && info[2].fog > info[0].fog && info[4].light === 'night' && info[4].lanterns > 0, info.slice(2, 5).map(i => ({ id: i.id, light: i.light, fog: i.fog, lanterns: i.lanterns })));

// Boss
const boss = {};
for (const k of ['easy', 'medium', 'hard']) boss[k] = await ev(k => gameTest.boss(k), k);
const hpOk = boss.easy.start.hp === 80 && boss.medium.start.hp === 120 && boss.hard.start.hp === 160;
check('Boss: three phases at the right health, warnings, cover crumbles after 6 hits, death restarts at the arena', hpOk && Object.values(boss).every(b => b.volley.warnAt !== null && b.volley.firstBoltAt - b.volley.warnAt >= 1 && b.coreOpen === 1.5 && b.coverCrumbledAfter === 6
  && b.phase2.phase === 2 && b.phase2.art === 'brood' && b.podDamage === 5 && b.swellBeforeHatch && b.phase3.phase === 3 && b.markerVisible && b.rampage.warnTime >= 1 && b.coreOpenWhenStuck && b.stuckGrenade === 9 && b.slamRing && b.critical === 'critical'
  && b.death.mode === 'end' && b.restart.mode === 'play' && b.restart.hp === b.start.hp && b.restart.distance === b.start.distance && b.restart.covers === 3), boss);
const fight = {};
for (const e of [.12, .25]) fight['aim ' + e] = await ev(e => [0, 1].map(() => gameTest.bossBot('medium', e)), e);
R.data.bossFight = fight;
check('Boss fight length (scripted player, Medium)', true, fight);

// Rewards, Triple Shot, Continue, map and progression (guest, then a profile that survives a reload)
const map0 = await ev(() => gameTest.map('easy'));
check('Level select: L1 unlocked, others locked, six stops on the trail', map0.length === 6 && !map0[0].locked && map0.slice(1).every(s => s.locked), map0);
await shot('map', () => { gameTest.map('medium'); });
const l1clear = await ev(() => gameTest.finishLevel('easy', 1));
const map1 = await ev(() => gameTest.map('easy'));
const cont = await ev(() => gameTest.continueNext());
check('Clearing a level unlocks the next; Continue goes to it', !map1[1].locked && map1[2].locked && l1clear.cont.includes('L2') && cont.level === 2, { l1clear, map1: map1.map(s => s.locked), cont });
const before = await ev(() => gameTest.weapons('easy'));
const defeat = await ev(() => gameTest.defeatBoss('easy'));
const after = await ev(() => gameTest.weapons('easy'));
check('Beating the boss unlocks the Triple Shot; Q swaps weapons', !before.unlocked && defeat.progress.weapons.includes('triple') && defeat.progress.coins >= 200 && after.unlocked && after.after === 'triple' && after.tracers === 3 * before.tracers && defeat.cont === 'Continue · Map', { before, after, rows: defeat.rows, cont: defeat.cont });
await shot('boss-results', () => gameTest.defeatBoss('medium'));

// Real UI flow: title -> map -> click a stop -> play
await ctx.close();
ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
page = await open(ctx);
const old = await ev(() => { // a V13 (JS1) save code with Level 1 cleared on Medium
  const json = JSON.stringify({ v: 1, name: 'Veteran', settings: { difficulty: 'medium' }, stats: { runs: 4, wins: 1, totalCoins: 50, best: { medium: { distance: 950, score: 9000, cleared: true, time: 175, stars: 2 } } } });
  const body = btoa(unescape(encodeURIComponent(json))); let h = 0; for (let i = 0; i < body.length; i++) h = (Math.imul(h, 31) + body.charCodeAt(i)) >>> 0;
  return 'JS1-' + body + '-' + h.toString(36).slice(-4);
});
await ev(() => { document.getElementById('profileTransfer').open = true; });
await page.fill('#profileCode', old);
await ev(() => document.getElementById('profileImport').click());
const imported = await ev(() => gameTest.progress('medium'));
await ev(() => document.getElementById('start').click());
const mapShown = await ev(() => !document.getElementById('levelSelect').hidden);
await ev(() => document.querySelector('.map-stop[data-level="2"]').click());
const playing = await ev(() => ({ mode: gameTest.state().mode, level: gameTest.levelInfo().id }));
await ev(() => gameTest.finishLevel('medium', 3));
const progressBefore = await ev(() => gameTest.progress('medium'));
await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => window.gameTest, null, { timeout: 120000 });
const progressAfter = await ev(() => gameTest.progress('medium'));
const mapAfter = await ev(() => gameTest.map('medium'));
check('Old save codes load; progress survives a reload; map shows stars and locks', imported.unlocked === 2 && imported.levels[1].stars === 2 && mapShown && playing.mode === 'play' && playing.level === 2
  && JSON.stringify(progressBefore) === JSON.stringify(progressAfter) && progressAfter.unlocked === 4 && mapAfter[0].text.includes('★★☆') && mapAfter[2].text.includes('★★★') && !mapAfter[3].locked && mapAfter[4].locked,
  { imported, mapShown, playing, progressAfter, map: mapAfter.map(s => s.text + (s.locked ? ' [locked]' : '')) });

// Screenshots
for (const [id, d] of [[1, 120], [2, 150], [3, 240], [4, 300], [5, 400]]) await shot('L' + id, ([id, d]) => gameTest.lightView(id, d), [id, d]);
await shot('buggy-marker', () => gameTest.buggyView());
await shot('bee-minis', () => gameTest.beeView());
await shot('spore-cloud', () => gameTest.sporeView());
await shot('close-up', () => { gameTest.start('medium', 3); gameTest.clearTargets(); gameTest.closeUp(); });
for (const p of [1, 2, 3, 4]) await shot('boss-' + ['siege', 'brood', 'rampage', 'critical'][p - 1], p => gameTest.bossView(p), p);

R.errors = errors;
check('No page or console errors', errors.length === 0, errors.slice(0, 5));
fs.writeFileSync(out + '/v14-test-results.json', JSON.stringify(R, null, 2));
console.log(Object.values(R.checks).filter(c => c.pass).length + ' of ' + Object.keys(R.checks).length + ' checks passed');
await browser.close();
