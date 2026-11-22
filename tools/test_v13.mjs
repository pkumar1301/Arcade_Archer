// V13 checks. Start a local server first: python3 -m http.server 8774 --bind 127.0.0.1
// Then: node tools/test_v13.mjs [outDir]
import playwright from 'playwright';
const { chromium } = playwright;
import fs from 'node:fs';
const out = process.argv[2] || '.';
const url = (process.env.GAME_URL || 'http://127.0.0.1:8774/') + '?test=1';
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(url);
await page.waitForFunction(() => window.gameTest, null, { timeout: 120000 });
const results = { errors };
for (const key of ['easy', 'medium', 'hard']) {
  results['rules_' + key] = await page.evaluate(k => gameTest.rules(k), key);
  const s = await page.evaluate(k => gameTest.bot(k), key);
  results['bot_' + key] = { mode: s.mode, health: s.health, distance: +s.distance.toFixed(1), time: +s.elapsed.toFixed(1), fraction: +(s.distance / s.finish).toFixed(3) };
}
results.finish = await page.evaluate(() => { gameTest.start('medium'); return gameTest.finishRun(); });
await page.waitForTimeout(2600);
await page.screenshot({ path: out + '/v13-results.png' });
await page.evaluate(() => { gameTest.start('medium'); });
await page.evaluate(() => gameTest.view(820));
await page.screenshot({ path: out + '/v13-gate-130m.png' });
await page.evaluate(() => gameTest.view(930));
await page.screenshot({ path: out + '/v13-gate-20m.png' });
await page.evaluate(() => gameTest.waveView());
await page.screenshot({ path: out + '/v13-wave-entrance.png' });
await page.evaluate(() => gameTest.menu());
await page.screenshot({ path: out + '/v13-menu.png' });
fs.writeFileSync(out + '/v13-test-results.json', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 1));
await browser.close();
