// V7: player profiles without email.
// Profiles live in this browser (localStorage). A "save code" moves a profile
// to another browser or device: copy it on one, paste it on the other.
// Everything storage-related is in this file so a cloud backend (e.g. Supabase
// anonymous sign-in) can replace load()/persist() later without touching game.js.

const KEY = 'jungleSoldier.save.v1';
const DIFFS = ['easy', 'medium', 'hard'];
let store = { activeId: null, profiles: {} };
let ui, onChange;

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.profiles === 'object') store = parsed;
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
export function recordRun({ won, score, coins, distance, time, difficulty }) {
  const p = activeProfile();
  if (!p) return false;
  const s = p.stats;
  s.runs++;
  if (won) s.wins++;
  s.totalCoins += coins;
  const prev = s.best[difficulty] || { distance: 0, score: 0, time: null, cleared: false };
  const better = distance > prev.distance || score > prev.score;
  s.best[difficulty] = {
    distance: Math.max(prev.distance, distance),
    score: Math.max(prev.score, score),
    cleared: prev.cleared || won,
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
function exportCode(p) {
  const json = JSON.stringify({ v: 1, name: p.name, settings: p.settings, stats: p.stats, created: p.created });
  const body = btoa(unescape(encodeURIComponent(json)));
  return 'JS1-' + body + '-' + checksum(body);
}
function importCode(code) {
  const m = String(code).trim().match(/^JS1-([A-Za-z0-9+/=]+)-([a-z0-9]{1,4})$/);
  if (!m || checksum(m[1]) !== m[2]) throw new Error('That save code is incomplete or mistyped.');
  const data = JSON.parse(decodeURIComponent(escape(atob(m[1]))));
  const p = blankProfile(cleanName(data.name) || 'Soldier');
  p.created = data.created || p.created;
  p.settings = { difficulty: DIFFS.includes(data.settings?.difficulty) ? data.settings.difficulty : 'medium' };
  const st = data.stats || {};
  p.stats = {
    runs: +st.runs || 0, wins: +st.wins || 0, totalCoins: +st.totalCoins || 0,
    best: Object.fromEntries(DIFFS.filter(d => st.best?.[d]).map(d => [d, {
      distance: +st.best[d].distance || 0, score: +st.best[d].score || 0,
      cleared: !!st.best[d].cleared, time: st.best[d].time == null ? null : +st.best[d].time
    }]))
  };
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
  const rows = DIFFS.map(d => {
    const b = p.stats.best[d];
    const label = d[0].toUpperCase() + d.slice(1);
    if (!b) return label + ' –';
    return label + ' ' + (b.cleared ? '✓ ' + fmtTime(b.time) : b.distance + ' m') + ' · ' + b.score + ' pts';
  });
  ui.profileStats.textContent = 'Best: ' + rows.join('   ') + '   ·   Runs ' + p.stats.runs + ' · Coins ' + p.stats.totalCoins;
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
