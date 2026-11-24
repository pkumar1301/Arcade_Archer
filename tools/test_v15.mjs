// V15 checks: the full campaign (6 zones, 36 stages), every enemy kind, weapon and boss,
// the Quartermaster, set-pieces, the ending and New Game+, plus a click-through of the real UI.
// Start a local server first: python3 -m http.server 8774 --bind 127.0.0.1
// Then: node tools/test_v15.mjs [outDir]   (Playwright + Chromium; SwiftShader WebGL)
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
const shot = async (name, fn, arg, wait = 4500) => { if (fn) await ev(fn, arg); await page.waitForTimeout(wait); await ev(() => gameTest.scene()); await page.waitForTimeout(250); await page.screenshot({ path: `${out}/v15-${name}.png` }); };
const NEW = [7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 19, 20, 21, 22, 23, 25, 26, 27, 28, 29, 31, 32, 33, 34, 35];

// 1. Every level can be finished (invulnerable bot: no stalls, no dead ends at airlocks, pits or portals)
const god = {};
for (const id of [1, 2, 3, 4, 5, ...NEW]) god[id] = await ev(id => { const r = gameTest.godBot('medium', id); return { mode: r.mode, d: r.d, stuck: r.stuck, kinds: r.kinds, hazards: r.hazards, light: r.light }; }, id);
R.data.god = god;
check('All 30 levels can be finished (no stalls)', Object.values(god).every(r => r.mode === 'finish' && r.stuck === 0), Object.fromEntries(Object.entries(god).map(([k, r]) => [k, r.mode + ' ' + r.d])));
check('Each biome uses its own enemies and hazards', [7, 13, 19, 25, 31].every(id => !god[id].kinds.includes('drone')) && god[7].hazards.includes('quicksand') && god[13].hazards.includes('ice')
  && god[19].hazards.includes('vent') && god[26].hazards.includes('fence') && god[26].hazards.includes('airlock') && god[31].hazards.includes('portal'), { 7: god[7].hazards, 13: god[13].hazards, 19: god[19].hazards, 26: god[26].hazards, 31: god[31].hazards });

// 2. Easy stays clearable for the V14 scripted bot on every new level
const easy = {};
for (const id of NEW) easy[id] = await ev(id => { const s = gameTest.bot('easy', id); return { mode: s.mode, health: s.health }; }, id);
R.data.easy = easy;
check('Bot clears Easy on every new level', Object.values(easy).every(r => r.mode === 'finish'), easy);

// 3. Enemies, weapons, set-pieces, upgrades
const enemies = await ev(() => gameTest.enemyCheck('medium', 20));
check('Every enemy kind spawns, shows and can be destroyed', Object.values(enemies).every(e => e.dead), Object.keys(enemies).length + ' kinds');
const weapons = await ev(() => gameTest.weaponCheck('medium'));
check('All 16 weapons deal damage', Object.values(weapons).every(v => v > 0) && Object.keys(weapons).length === 16, weapons);
const sets = await ev(() => gameTest.setPieces('medium'));
check('Every biome Level 3 has a set-piece that triggers', Object.values(sets).every(s => s.done), sets);
const hp = await ev(() => gameTest.maxHealthCheck('medium'));
check('Soldier upgrades apply (armour, grenade belt, starting shield)', hp.maxHealth === 130 && hp.charges === 3 && hp.shield === 1, hp);

// 4. Bosses: three phases each, defeat leads to results and the boss weapon (free at tier 1)
const bosses = {};
for (const id of [12, 18, 24, 30]) bosses[id] = await ev(id => { const r = gameTest.bossRun('medium', id, true, false); return { mode: r.mode, t: r.t, phases: r.phases, title: r.results }; }, id);
const tiers = await ev(() => gameTest.progress('medium').tiers);
R.data.bosses = bosses;
check('Bosses 2-5: three phases, defeat, results', Object.values(bosses).every(b => b.mode === 'results' && b.phases.join() === '1,2,3'), bosses);
check('Boss weapons are unlocked free at tier 1', ['lance', 'launcher', 'orb', 'cannon'].every(w => tiers[w] === 1), tiers);
const ending = await ev(() => gameTest.endingRun('easy'));
check('Overmind: death sequence, 90s celebration, New Game+ unlocked', ending.mode === 'ending' && ending.ng && ending.finished, ending);
await page.waitForTimeout(6000);
await page.screenshot({ path: `${out}/v15-ending-congrats.png` });
await ev(() => document.getElementById('endClose').click());

// 5. Quartermaster
const shop = await ev(() => gameTest.shop('medium'));
check('Quartermaster: four tabs, purchases spend coins', shop.spent > 0 && shop.cards > 0, shop);

// 6. Screenshots: biomes, bosses and screens
for (const [name, id, d] of [['desert', 9, 140], ['tundra', 14, 150], ['volcano', 23, 205], ['space', 26, 160], ['city', 34, 180], ['forest', 1, 120]])
  await shot(name, ([id, d]) => { gameTest.start('medium', id); gameTest.view(d); }, [id, d]);
for (const [name, id, n] of [['wyrm', 12, 75], ['titan', 18, 40], ['serpent', 24, 60], ['manta', 30, 200], ['overmind', 36, 200]])
  await shot('boss-' + name, ([id, n]) => { gameTest.start('medium', id); for (let i = 0; i < n; i++) gameTest.step(1 / 30); }, [id, n]);
await shot('quartermaster', () => { document.querySelector('#qmTabs [data-tab=armoury]').click(); }, null, 500);

// 7. A click-through of the real interface: title, map, a level, pause, map zones
await page.goto(base.replace('?test=1', ''), { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => !document.getElementById('start').disabled, null, { timeout: 120000 });
await page.click('#start'); await page.waitForSelector('#levelSelect:not([hidden])');
const zones = await page.$$eval('.zone-tab', t => t.map(b => ({ text: b.textContent, locked: b.disabled })));
await page.click('.map-stop:not(.locked)'); await page.waitForTimeout(1500);
const playing = await page.evaluate(() => !document.getElementById('hud').hidden && document.getElementById('levelLabel').textContent);
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
const paused = await page.evaluate(() => document.getElementById('start').textContent);
check('UI flow: title → six-zone map → level → pause', zones.length === 6 && zones[0].locked === false && zones[1].locked === true && /LEVEL 1/.test(playing) && /Resume/i.test(paused), { zones: zones.map(z => z.locked), playing, paused });
check('No page or console errors', errors.length === 0, errors.slice(0, 5));
fs.writeFileSync(`${out}/V15-test-results.json`, JSON.stringify(R, null, 1));
await browser.close();
