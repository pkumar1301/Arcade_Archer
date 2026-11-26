# V17: turns Codex Art Brief 5 (enemy roster and shoulder drone) into game files under
# art/biomes/<biome>/n_<item>.webp and art/biomes/drone/p_<item>.webp, and merges their aspects
# into art_manifest.js.
# - Characters: the flat background (gray #6B6B6B, or black on a few images) is keyed out by flood
#   fill from the edges. All poses of one enemy share one crop so the game swaps them in place.
# - Effects sheets (black): sliced into 3 cells, thin divider or frame lines removed, drawn additively.
# Usage: python3 tools/prepare_art_v17.py <dir with the unzipped batches>
import json, os, re, sys, glob
import numpy as np
from PIL import Image
from scipy import ndimage

SRC = sys.argv[1]
OUT = 'art/biomes'
aspects = {}

# Poses that must swap in place share one crop.
GROUPS = {
    'blocker': ['blocker_walk', 'blocker_braced', 'blocker_broken'],
    'exploder': ['exploder_run', 'exploder_swell'],
    'ambusher': ['ambusher_erupt', 'ambusher_attack'],
    'raptor': ['raptor_run', 'raptor_leap', 'raptor_call'],
    'wyvern': ['wyvern_fly', 'wyvern_dive'],
    'dragon': ['dragon_stand', 'dragon_breath', 'dragon_wounded'],
    'charger': ['charger_walk', 'charger_charge', 'charger_stunned'],
    'sniper': ['sniper_idle', 'sniper_aim'],
    'latcher': ['latcher_run'],
    'latcher_cling': ['latcher_cling'],
    'mimic': ['mimic_hidden', 'mimic_revealed'],
    'shield': ['shield_walk', 'shield_cast'],
    'swarm': ['swarm_run'],
    'swarm_group': ['swarm_group'],
    'queen': ['queen_idle', 'queen_spawn', 'queen_dying'],
    'bomber': ['bomber_carry', 'bomber_drop'],
    'tell': ['ambusher_tell'],
}
BIG = {'dragon', 'queen', 'swarm_group'}
DRONE_GROUPS = {'pod': ['pod_t1', 'pod_t2', 'pod_t3', 'pod_damaged', 'pod_destroyed'], 'side': ['pod_side'], 'pickup': ['pickup'], 'icon': ['icon']}


def find(biome, item):
    hits = glob.glob(os.path.join(SRC, '*', biome, f'{biome}_5x_{item}.png'))
    return hits[0] if hits else None


def cutout_full(img, tol=16):
    a = np.asarray(img.convert('RGB')).astype(np.int16)
    border = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
    bgc = np.median(border, axis=0)  # gray #6B6B6B, or black on a few images
    dist = np.abs(a - bgc).max(axis=2)
    near = dist <= tol
    lab, _ = ndimage.label(near)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(edge))
    holes, n = ndimage.label(near & ~bg)  # enclosed background (between legs, inside wings)
    if n:
        sizes = ndimage.sum(np.ones_like(holes), holes, range(1, n + 1))
        for i, s in enumerate(sizes, 1):
            if s > 900:
                region = holes == i
                if dist[region].mean() < 6: bg |= region
    # A few images put the character on a black square inside the gray margin: key that out too.
    black = a.max(axis=2) < 20
    lab2, _ = ndimage.label(black | bg)
    touch = set(np.unique(lab2[bg])) - {0}
    extra = np.isin(lab2, list(touch)) & black & ~bg
    if extra.mean() > .1: bg |= extra
    alpha = np.clip((ndimage.gaussian_filter((~bg).astype(np.float32), .8) - .15) / .7, 0, 1)
    rgb = a.astype(np.float32); k = alpha[..., None]
    bgfill = np.where(extra[..., None], 0, bgc) if extra.mean() > .1 else bgc
    fixed = np.clip(np.where(k > .02, (rgb - (1 - k) * bgfill) / np.maximum(k, .02), rgb), 0, 255)
    return Image.fromarray(np.dstack([fixed, alpha * 255]).astype(np.uint8), 'RGBA'), alpha


def save(biome, key, im, size, quality=84):
    os.makedirs(os.path.join(OUT, biome), exist_ok=True)
    s = min(1, size / max(im.size))
    if s < 1: im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
    im.save(os.path.join(OUT, biome, key + '.webp'), 'WEBP', quality=quality, method=4)
    aspects[biome + '/' + key] = round(im.width / im.height, 4)


def save_group(biome, prefix, items, files, size):
    cuts = [cutout_full(Image.open(f)) for f in files]
    ys, xs = np.where(np.maximum.reduce([c[1] for c in cuts]) > .06); m = 6
    box = (max(0, xs.min() - m), max(0, ys.min() - m), xs.max() + m + 1, ys.max() + m + 1)
    for item, (im, _) in zip(items, cuts): save(biome, prefix + item, im.crop(box), size)


def strip_lines(arr):
    """Zero the frame and divider bars some sheets carry: pure gray parts made of straight bars
    (long rows or columns, at most 56 px thick), alone or joined into brackets."""
    mx = arr.max(axis=2).astype(np.int16); ch = mx - arr.min(axis=2)
    gray = (ch <= 4) & (mx > 60) & (mx < 190)
    lab, n = ndimage.label(gray)
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        comp = lab[sl] == i
        if comp.sum() < 300: continue
        bar = np.zeros_like(comp)
        for axis in (1, 0):
            long_ = comp.sum(axis=axis) >= 60  # rows (axis 1) or columns (axis 0) the part runs along
            runs, k = ndimage.label(long_)
            for r in range(1, k + 1):
                idx = np.where(runs == r)[0]
                if len(idx) <= 56:
                    if axis == 1: bar[idx, :] |= comp[idx, :]
                    else: bar[:, idx] |= comp[:, idx]
        if bar.sum() / comp.sum() > .7:
            region = np.zeros(gray.shape, bool); region[sl] = comp
            arr[ndimage.binary_dilation(region, iterations=3)] = 0
    return arr


def fx_cells(img, n=3):
    img = img.convert('RGB'); w, h = img.size; out = []
    for c in range(n):
        arr = np.asarray(img.crop((c * w // n, 0, (c + 1) * w // n, h))).copy()
        arr = strip_lines(arr)
        arr[:3] = 0; arr[-3:] = 0; arr[:, :3] = 0; arr[:, -3:] = 0
        ys, xs = np.where(arr.max(axis=2) > 14)
        cell = Image.fromarray(arr)
        if len(xs): cell = cell.crop((max(0, xs.min() - 6), max(0, ys.min() - 6), min(cell.width, xs.max() + 7), min(cell.height, ys.max() + 7)))
        out.append(cell)
    return out


FX = ['blocker_fx', 'exploder_fx', 'ambusher_fx', 'wyvern_fx', 'dragon_fx', 'charger_fx', 'sniper_fx',
      'latcher_fx', 'mimic_fx', 'shield_fx', 'swarm_fx', 'bomber_fx']
missing = []
for biome in ['forest', 'desert', 'tundra', 'volcano', 'space', 'city']:
    for g, items in GROUPS.items():
        files = [find(biome, it) for it in items]
        if not all(files): missing += [biome + ':' + it for it, f in zip(items, files) if not f]; continue
        save_group(biome, 'n_', items, files, 768 if g in BIG else 512)
    for fx in FX:
        f = find(biome, fx)
        if not f: missing.append(biome + ':' + fx); continue
        for k, cell in enumerate(fx_cells(Image.open(f)), 1): save(biome, f'n_{fx}{k}', cell, 320, 80)

for g, items in DRONE_GROUPS.items():
    files = [find('drone', it) for it in items]
    if not all(files): missing.append('drone:' + g); continue
    save_group('drone', 'p_', items, files, 384 if g == 'pod' else 256)
for fx, names in {'fire_fx': ['p_muzzle', 'p_tracer', 'p_spark'], 'break_fx': ['p_sparks', 'p_smoke', 'p_frags']}.items():
    f = find('drone', fx)
    for name, cell in zip(names, fx_cells(Image.open(f))): save('drone', name, cell, 256, 80)

path = 'art_manifest.js'
src = open(path).read()
cur = json.loads(re.search(r'BIOME_ASPECT = (\{.*\});', src).group(1))
cur.update(aspects)
with open(path, 'w') as fh:
    fh.write('// V15-V17: generated by tools/prepare_art.py, prepare_art_v16.py and prepare_art_v17.py. Width / height of every image in art/biomes/.\n')
    fh.write('export const BIOME_ASPECT = ' + json.dumps(cur, sort_keys=True, separators=(',', ':')) + ';\n')
print(len(aspects), 'images added;', len(cur), 'total; missing:', missing)
