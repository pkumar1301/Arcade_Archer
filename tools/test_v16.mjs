// V16 checks: the power-up rework, attack drones, ground enemies of every biome and the level layouts,
// plus every level finishable by the bots. Run tools/test_v15.mjs too for the campaign, bosses and UI.
// Start a local server first: python3 -m http.server 8774 --bind 127.0.0.1
// Then: node tools/test_v16.mjs [outDir]   (Playwright + Chromium; SwiftShader WebGL)
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
const check = (name, pass, detail) => { R.checks[name] = { pass: !!pass, detail }; console.log((pass ? 'PASS ' : 'FAIL ') + name + ' ' + JSON.stringify(detail).slice(0, 700)); };
const LEVELS = [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 19, 20, 21, 22, 23, 25, 26, 27, 28, 29, 31, 32, 33, 34, 35];

// 1. Power-ups
const p = await ev(() => gameTest.powerCheck('medium'));
R.data.power = p;
check('Shield blocks exactly 2 hits, then you take damage', p.shieldHits === 2 && p.after1 === 1 && p.after2 === 0 && p.thirdHitHurts > 0, p);
check('Grenades stack to 3', p.grenades === 3 && p.grenadeCap === 3, { grenades: p.grenades, cap: p.grenadeCap });
check('Power bolts and rapid fire last 15 s, coin magnet 20 s', p.timers.heavy === 15 && p.timers.rapid === 15 && p.timers.magnet === 20 && p.after16s.heavy === 0 && p.after16s.rapid === 0 && p.after16s.magnet > 0, { timers: p.timers, after16s: p.after16s });
check('Drones: max 2, hit with you, repaired by a pickup, pickup ignored at full health', p.drones === 2 && p.droneHp.join() === '40,40' && p.repaired.join() === '60,40' && p.fullIgnored === '60,60 · 2', p);
check('HUD shows drone health and countdown rings', p.chips.some(c => c.includes(' hp:DRONE')) && p.chips.some(c => c.includes(' timed:')), p.chips);
const d = await ev(() => gameTest.droneCheck('medium'));
R.data.drone = d;
check('Each drone fires at rifle rate for 60% of rifle damage', d.visible && d.perDronePerSec >= d.rifleDps * .88 && d.perDronePerSec <= d.rifleDps * 1.05, d);

// 2. Ground enemies
const g = await ev(() => gameTest.groundCheck('medium'));
R.data.ground = g;
check('Every biome has a rusher that closes in, rears up and strikes', Object.values(g).every(b => b.reached && b.windup && b.causes.includes(b.rusher)), Object.fromEntries(Object.entries(g).map(([k, b]) => [k, b.rusher + ' ' + b.windup])));
check('Every biome has a spitter that holds 12-15 m and lobs onto a marked spot', Object.values(g).every(b => b.lobbed && b.spitGap > 11 && b.spitGap < 16 && b.causes.includes(b.spitter)), Object.fromEntries(Object.entries(g).map(([k, b]) => [k, b.spitter + ' ' + b.spitGap])));
check('Rushers can be outrun', Object.values(g).every(b => b.outran), Object.fromEntries(Object.entries(g).map(([k, b]) => [k, b.outran])));

// 2b. Nests (mini elites)
const n = await ev(() => gameTest.nestCheck('medium'));
R.data.nests = n;
check('Every biome has a nest: opens, hatches, armoured while closed, destroyed with a guaranteed drop', Object.values(n).every(o => o.opened && o.hatched >= 1 && o.closedDmg < o.openDmg && o.destroyed && o.drop), n);

// 3. Layouts
const L = await ev(() => gameTest.layoutCheck('medium'));
R.data.layouts = L;
const by = t => Object.values(L).filter(o => o.type === t);
check('Siege: generators keep the gate shut; destroying them opens it', by('siege').every(o => o.gens >= 2 && o.blocked && o.opened), by('siege'));
check('Hold point: the gate stays shut for the countdown, then opens', by('hold').every(o => o.holding && o.blocked && o.opened && /HOLD/.test(o.objective)), by('hold'));
check('Fork and bridge: stepping into the chasm or water costs health and puts you back', [...by('fork'), ...by('bridge')].every(o => o.fell && o.coinsSafe), [...by('fork'), ...by('bridge')]);
check('Escape: the wall behind you advances', by('escape').every(o => o.wallMoved > 0 && o.wallVisible), by('escape'));
check('Canyon: walls and spitters on the ledges', by('canyon').every(o => o.ledges > 3 && o.perched > 0), by('canyon'));

// 4. Every level can still be finished
const god = {};
for (const id of LEVELS) god[id] = await ev(id => { const r = gameTest.godBot('medium', id); return { mode: r.mode, d: r.d, stuck: r.stuck }; }, id);
R.data.god = god;
check('All 30 levels can be finished (invulnerable bot, Medium)', Object.values(god).every(r => r.mode === 'finish' && r.stuck === 0), Object.fromEntries(Object.entries(god).map(([k, r]) => [k, r.mode + ' ' + r.d])));
const easy = {};
for (const id of LEVELS.filter(id => id > 6)) easy[id] = await ev(id => { const s = gameTest.bot('easy', id); return { mode: s.mode, health: s.health }; }, id);
R.data.easy = easy;
check('Bot clears Easy on every level from the Desert on (the Forest bot predates V16 and is not scored)', Object.values(easy).every(r => r.mode === 'finish'), easy);

// 5. Screenshots
const shots = [
  ['drones', 8, "(()=>{distance=150;lateral=0;collectDrop('auto');collectDrop('auto');collectDrop('heavy');collectDrop('reload');collectDrop('shield');spawnGround('rusher',{d:distance+16,x:1});spawnGround('spitter',{d:distance+26,x:-2.5});for(let i=0;i<40;i++){health=maxHealth;update(1/30);}})()"],
  ['rusher-city', 31, "(()=>{distance=150;lateral=0;spawnGround('rusher',{d:distance+9,x:-.5});spawnGround('spitter',{d:distance+14,x:2.4});for(let i=0;i<12;i++){health=maxHealth;update(1/30);}})()"],
  ['spitter-lob', 19, "(()=>{distance=200;lateral=0;spawnGround('spitter',{d:distance+25,x:1.5});for(let i=0;i<300&&!lobs.length;i++){health=maxHealth;update(1/30);}for(let i=0;i<14;i++)update(1/30);})()"],
  ['canyon-desert', 10, "(()=>{const l=lay.ledges[2];distance=l.d-30;lateral=-2;for(let i=0;i<40;i++){health=maxHealth;update(1/30);}distance=l.d-14;place(1);for(let i=0;i<3;i++)update(1/30);ui.game.classList.remove('dusted');})()"],
  ['fork-volcano', 20, "(()=>{distance=lay.def.from+12;lateral=3.2;for(let i=0;i<5;i++)update(1/30);})()"],
  ['bridge-volcano', 21, "(()=>{distance=lay.def.from+12;lateral=0;for(let i=0;i<5;i++)update(1/30);})()"],
  ['bridge-tundra', 14, "(()=>{distance=lay.def.from+12;lateral=0;for(let i=0;i<5;i++)update(1/30);})()"],
  ['siege-space', 26, "(()=>{distance=lay.def.d-26;lateral=0;for(let i=0;i<10;i++){health=maxHealth;update(1/30);}})()"],
  ['hold-forest', 4, "(()=>{distance=lay.def.d-30;lateral=0;for(let i=0;i<30*4;i++){health=maxHealth;held.clear();held.add('KeyW');update(1/30);}held.clear();})()"],
  ['nest-forest', 4, "(()=>{const e=targets.find(t=>t.type==='nest');distance=e.d-18;lateral=0;for(let i=0;i<30*3.2;i++){health=maxHealth;held.clear();update(1/30);}})()"],
  ['escape-space', 29, "(()=>{distance=200;lateral=0;lay.wallD=150;for(let i=0;i<60;i++){health=maxHealth;update(1/30);}})()"]];
for (const [name, id, src] of shots) {
  await ev(([id, src]) => { gameTest.start('medium', id); gameTest.run(src); }, [id, src]);
  await page.waitForTimeout(3500); await ev(() => gameTest.scene()); await page.waitForTimeout(250);
  await page.screenshot({ path: `${out}/v16-${name}.png` });
}
check('No page or console errors', errors.length === 0, errors.slice(0, 5));
fs.writeFileSync(`${out}/V16-test-results.json`, JSON.stringify(R, null, 1));
await browser.close();
