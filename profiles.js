// V7: player profiles without email.
// Profiles live in this browser (localStorage). A "save code" moves a profile
// to another browser or device: copy it on one, paste it on the other.
// Everything storage-related is in this file so a cloud backend (e.g. Supabase
// anonymous sign-in) can replace load()/persist() later without touching game.js.

const KEY = 'jungleSoldier.save.v1';
const DIFFS = ['easy', 'medium', 'hard'];
// V14: Forest campaign progress, kept per difficulty: unlocked levels, best stars
// and best score per level, banked coins and unlocked weapons. Level 6 is the boss.
// V15: the whole campaign (36 stages), weapons bought or won, weapon tiers, soldier upgrades,
// the loadout, uniforms and New Game+ are kept per difficulty with the coins that pay for them.
const LEVEL_COUNT = 36;
const KNOWN_WEAPONS = ['rifle', 'dual', 'ripper', 'triple', 'scatter', 'marksman', 'lance', 'torch', 'rotary', 'launcher', 'arc', 'seeker', 'orb', 'repulsor', 'mine', 'cannon'];
const BOSS_WEAPONS = ['triple', 'lance', 'launcher', 'orb', 'cannon'];
const KNOWN_UPGRADES = ['hollow', 'trigger', 'barrel', 'weak', 'armour', 'feet', 'belt', 'blast', 'powerup', 'magnet', 'medic', 'startShield'];
const KNOWN_UNIFORMS = ['jungle', 'desert', 'arctic', 'ember', 'void', 'royal'];
const guestProgress = {}; // guests keep progress for this browser session only
const blankProgress = () => ({ unlocked: 1, levels: {}, coins: 0, weapons: ['rifle'], tiers: {}, upgrades: {}, loadout: { primary: 'rifle', secondary: null },
  uniforms: ['jungle'], uniform: 'jungle', finished: false, ng: false, ngOn: false });
// Older saves (V7-V13) only know Level 1: a cleared run unlocks Level 2 and keeps its stars and score.
function migrateProgress(best) {
  const pr = blankProgress();
  if (best?.cleared) {
    pr.unlocked = 2;
    pr.levels[1] = { stars: Math.max(1, Math.min(3, +best.stars || 1)), score: +best.score || 0, time: best.time == null ? null : +best.time };
  }
  return pr;
}
function cleanProgress(raw) {
  const pr = blankProgress();
  if (!raw || typeof raw !== 'object') return pr;
  pr.unlocked = Math.max(1, Math.min(LEVEL_COUNT, Math.floor(+raw.unlocked || 1)));
  for (let id = 1; id <= LEVEL_COUNT; id++) {
    const l = raw.levels?.[id];
    if (l) pr.levels[id] = { stars: Math.max(0, Math.min(3, Math.floor(+l.stars || 0))), score: Math.max(0, Math.floor(+l.score || 0)), time: l.time == null ? null : +l.time };
  }
  pr.coins = Math.max(0, Math.floor(+raw.coins || 0));
  pr.weapons = KNOWN_WEAPONS.filter(w => w === 'rifle' || (Array.isArray(raw.weapons) && raw.weapons.includes(w)));
  for (const w of pr.weapons) { const t = Math.floor(+raw.tiers?.[w] || 0); if (t > 0) pr.tiers[w] = Math.min(3, t); }
  for (const w of BOSS_WEAPONS) if (pr.weapons.includes(w)) pr.tiers[w] = Math.max(1, pr.tiers[w] || 0); // won from a boss: tier 1 is free (V14 saves with the Triple Shot too)
  for (const u of KNOWN_UPGRADES) { const n = Math.floor(+raw.upgrades?.[u] || 0); if (n > 0) pr.upgrades[u] = Math.min(3, n); }
  const lo = raw.loadout || {};
  pr.loadout = { primary: pr.weapons.includes(lo.primary) ? lo.primary : 'rifle', secondary: pr.weapons.includes(lo.secondary) && lo.secondary !== lo.primary ? lo.secondary : null };
  if (!raw.loadout && pr.weapons.includes('triple')) pr.loadout.secondary = 'triple'; // V14 saves: the Triple Shot was the Q weapon
  pr.uniforms = KNOWN_UNIFORMS.filter(u => u === 'jungle' || (Array.isArray(raw.uniforms) && raw.uniforms.includes(u)));
  pr.uniform = pr.uniforms.includes(raw.uniform) ? raw.uniform : 'jungle';
  pr.finished = raw.finished === true; pr.ng = raw.ng === true; pr.ngOn = pr.ng && raw.ngOn === true;
  return pr;
}
function ensureProgress(p) {
  p.progress ||= {};
  for (const d of DIFFS) p.progress[d] = p.progress[d] ? cleanProgress(p.progress[d]) : migrateProgress(p.stats?.best?.[d]);
  return p.progress;
}
export function progressFor(difficulty) {
  const d = DIFFS.includes(difficulty) ? difficulty : 'medium';
  const p = activeProfile();
  if (!p) return guestProgress[d] ||= blankProgress();
  return (p.progress && p.progress[d]) || ensureProgress(p)[d];
}
// Records a cleared level. Returns true for a new best (stars or score) on that level.
export function saveProgress() { if (activeProfile()) persist(); render(); } // V15: Quartermaster purchases and loadout changes
export function recordLevel({ difficulty, level, score = 0, stars = 0, time = null, coins = 0, weapon = null }) {
  const pr = progressFor(difficulty);
  const prev = pr.levels[level] || { stars: 0, score: 0, time: null };
  const better = stars > prev.stars || score > prev.score;
  pr.levels[level] = { stars: Math.max(prev.stars, stars), score: Math.max(prev.score, score), time: prev.time == null ? time : (time == null ? prev.time : Math.min(prev.time, time)) };
  pr.unlocked = Math.min(LEVEL_COUNT, Math.max(pr.unlocked, level + 1));
  pr.coins += Math.max(0, Math.floor(coins));
  if (weapon && KNOWN_WEAPONS.includes(weapon)) { if (!pr.weapons.includes(weapon)) pr.weapons.push(weapon); pr.tiers[weapon] = Math.max(1, pr.tiers[weapon] || 0); } // boss weapons are free at tier 1
  if (level === LEVEL_COUNT) { pr.finished = true; pr.ng = true; } // beating the Overmind unlocks New Game+
  if (activeProfile()) persist();
  render();
  return better;
}
let store = { activeId: null, profiles: {} };
let ui, onChange;

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.profiles === 'object') store = parsed;
      for (const p of Object.values(store.profiles)) ensureProgress(p); // V14: older saves gain campaign progress
    }
  } catch { /* private window or blocked storage: play without saving */ }
}
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(store)); return true; }
  catch { return false; }
}
function blankProfile(name) {
  const id = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  return {
    id, name, created: new Date().toISOString(),
    settings: { difficulty: 'medium' },
    stats: { runs: 0, wins: 0, totalCoins: 0, best: {} }
  };
}
function cleanName(name) {
  return String(name || '').replace(/[^\p{L}\p{N} _\-.]/gu, '').trim().slice(0, 18);
}

export function activeProfile() {
  return store.profiles[store.activeId] || null;
}
export function saveSetting(key, value) {
  const p = activeProfile();
  if (!p) return;
  p.settings[key] = value;
  persist();
}

// Returns true when the run set a new best distance or score for that difficulty.
// V14: the per-difficulty best line is Level 1 (Overgrown Trail); other levels only count runs, wins and coins.
export function recordRun({ won, score, coins, distance, time, difficulty, stars = 0, level = 1 }) {
  const p = activeProfile();
  if (!p) return false;
  const s = p.stats;
  s.runs++;
  if (won) s.wins++;
  s.totalCoins += coins;
  if (level !== 1) { p.lastPlayed = new Date().toISOString(); persist(); render(); return false; }
  const prev = s.best[difficulty] || { distance: 0, score: 0, time: null, cleared: false };
  const better = distance > prev.distance || score > prev.score || stars > (prev.stars || 0);
  s.best[difficulty] = {
    distance: Math.max(prev.distance, distance),
    score: Math.max(prev.score, score),
    cleared: prev.cleared || won,
    stars: Math.max(prev.stars || 0, stars), // V13: best stars per difficulty
    time: won ? (prev.time == null ? time : Math.min(prev.time, time)) : prev.time
  };
  p.lastPlayed = new Date().toISOString();
  persist();
  render();
  return better;
}

// Save code: versioned, base64 JSON with a short checksum so typos are caught.
function checksum(text) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (Math.imul(h, 31) + text.charCodeAt(i)) >>> 0;
  return h.toString(36).slice(-4);
}
// V14: JS2 codes add campaign progress. JS1 codes (V7-V13) still load and are migrated.
function exportCode(p) {
  const json = JSON.stringify({ v: 3, name: p.name, settings: p.settings, stats: p.stats, progress: ensureProgress(p), created: p.created });
  const body = btoa(unescape(encodeURIComponent(json)));
  return 'JS3-' + body + '-' + checksum(body); // V15: JS3 carries the whole campaign
}
function importCode(code) {
  const m = String(code).trim().match(/^JS([123])-([A-Za-z0-9+/=]+)-([a-z0-9]{1,4})$/);
  if (!m || checksum(m[2]) !== m[3]) throw new Error('That save code is incomplete or mistyped.');
  const data = JSON.parse(decodeURIComponent(escape(atob(m[2]))));
  const p = blankProfile(cleanName(data.name) || 'Soldier');
  p.created = data.created || p.created;
  p.settings = { difficulty: DIFFS.includes(data.settings?.difficulty) ? data.settings.difficulty : 'medium', leakWarningSeen: data.settings?.leakWarningSeen === true };
  const st = data.stats || {};
  p.stats = {
    runs: +st.runs || 0, wins: +st.wins || 0, totalCoins: +st.totalCoins || 0,
    best: Object.fromEntries(DIFFS.filter(d => st.best?.[d]).map(d => [d, {
      distance: +st.best[d].distance || 0, score: +st.best[d].score || 0,
      cleared: !!st.best[d].cleared, time: st.best[d].time == null ? null : +st.best[d].time,
      stars: Math.max(0, Math.min(3, Math.floor(+st.best[d].stars || 0)))
    }]))
  };
  p.progress = m[1] !== '1' && data.progress
    ? Object.fromEntries(DIFFS.map(d => [d, cleanProgress(data.progress[d])]))
    : Object.fromEntries(DIFFS.map(d => [d, migrateProgress(p.stats.best[d])]));
  // Replace an existing profile with the same name instead of duplicating it.
  const same = Object.values(store.profiles).find(x => x.name.toLowerCase() === p.name.toLowerCase());
  if (same) { p.id = same.id; }
  store.profiles[p.id] = p;
  store.activeId = p.id;
  persist();
  return p;
}

function fmtTime(t) {
  if (t == null) return '';
  const m = Math.floor(t / 60), s = Math.floor(t % 60);
  return m + ':' + String(s).padStart(2, '0');
}
function render() {
  const p = activeProfile();
  const list = Object.values(store.profiles).sort((a, b) => a.name.localeCompare(b.name));
  ui.profileSelect.replaceChildren(
    ...list.map(x => new Option(x.name, x.id, false, x.id === store.activeId)),
    new Option('Play as guest (no saving)', '', false, !p)
  );
  ui.profileDelete.hidden = !p;
  ui.profileExport.disabled = !p;
  if (!p) {
    ui.profileStats.textContent = 'Guest: runs are not saved. Create a profile to keep your bests.';
    return;
  }
  ensureProgress(p);
  const rows = DIFFS.map(d => {
    const pr = p.progress[d];
    const label = d[0].toUpperCase() + d.slice(1);
    const stars = Object.values(pr.levels).reduce((n, l) => n + l.stars, 0);
    const zone = ['Forest', 'Desert', 'Tundra', 'Volcano', 'Space', 'Alien City'][Math.floor((pr.unlocked - 1) / 6)];
    const open = pr.finished ? 'Campaign complete' + (pr.ng ? ' · NG+' : '') : zone + ' ' + (pr.unlocked % 6 === 0 ? 'boss' : 'L' + (((pr.unlocked - 1) % 6) + 1)) + ' open';
    return label + ' · ' + open + ' · ★' + stars + ' · ' + pr.coins + ' coins · ' + pr.weapons.length + ' weapons';
  });
  ui.profileStats.textContent = rows.join('   ') + '   ·   Runs ' + p.stats.runs;
}
function flash(text) {
  ui.profileNote.textContent = text;
  clearTimeout(flash.t);
  flash.t = setTimeout(() => { ui.profileNote.textContent = ''; }, 4000);
}

export function initProfiles(uiRefs, changed) {
  ui = uiRefs; onChange = changed;
  load();
  if (store.activeId && !store.profiles[store.activeId]) store.activeId = null;
  render();
  onChange(activeProfile());

  ui.profileSelect.addEventListener('change', e => {
    store.activeId = e.target.value || null;
    persist(); render(); onChange(activeProfile());
  });
  ui.profileForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = cleanName(ui.profileName.value);
    if (!name) { flash('Pick a call sign: letters, numbers, spaces.'); return; }
    if (Object.values(store.profiles).some(x => x.name.toLowerCase() === name.toLowerCase())) {
      flash('That call sign is already on this device.'); return;
    }
    const p = blankProfile(name);
    p.settings.difficulty = ui.difficulty.value;
    store.profiles[p.id] = p;
    store.activeId = p.id;
    ui.profileName.value = '';
    flash(persist() ? 'Profile created. Progress saves automatically.' : 'Created, but this browser blocks saving.');
    render(); onChange(p);
  });
  ui.profileDelete.addEventListener('click', () => {
    const p = activeProfile();
    if (!p) return;
    if (ui.profileDelete.dataset.armed !== '1') {
      ui.profileDelete.dataset.armed = '1';
      ui.profileDelete.textContent = 'Confirm delete';
      setTimeout(() => { ui.profileDelete.dataset.armed = ''; ui.profileDelete.textContent = 'Delete'; }, 3000);
      return;
    }
    delete store.profiles[p.id];
    store.activeId = null;
    ui.profileDelete.dataset.armed = ''; ui.profileDelete.textContent = 'Delete';
    persist(); render(); onChange(null);
    flash('Profile deleted from this device.');
  });
  ui.profileExport.addEventListener('click', async () => {
    const p = activeProfile();
    if (!p) return;
    const code = exportCode(p);
    ui.profileCode.value = code;
    ui.profileTransfer.open = true;
    try { await navigator.clipboard.writeText(code); flash('Save code copied. Paste it on another device.'); }
    catch { ui.profileCode.select(); flash('Save code shown below. Copy it to move this profile.'); }
  });
  ui.profileImport.addEventListener('click', () => {
    try {
      const p = importCode(ui.profileCode.value);
      ui.profileCode.value = '';
      render(); onChange(p);
      flash('Loaded ' + p.name + '.');
    } catch (err) { flash(err.message || 'Could not read that save code.'); }
  });
}
