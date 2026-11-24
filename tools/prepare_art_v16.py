# V16: turns Codex Art Briefs 3 and 4 (ground enemies, attack drone, level kits) into game files
# under art/biomes/<biome>/g_<item>.webp and art/biomes/drone/, and merges their aspects
# into art_manifest.js. Gray (#6B6B6B) backgrounds are keyed out by flood fill from the
# edges; effect sheets keep black (drawn additively) and are sliced into 3 cells.
# Usage: python3 tools/prepare_art_v16.py <brief3 dir>
import json, os, re, sys
import numpy as np
from PIL import Image
from scipy import ndimage

SRC = sys.argv[1]
OUT = 'art/biomes'
GRAY = np.array([107, 107, 107])
aspects = {}

def cutout(img, tol=16):
    a = np.asarray(img.convert('RGB')).astype(np.int16)
    dist = np.abs(a - GRAY).max(axis=2)
    near = dist <= tol
    lab, _ = ndimage.label(near)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(edge))
    holes, n = ndimage.label(near & ~bg)
    if n:
        sizes = ndimage.sum(np.ones_like(holes), holes, range(1, n + 1))
        for i, s in enumerate(sizes, 1):
            if s > 900:
                region = holes == i
                if dist[region].mean() < 6: bg |= region
    alpha = np.clip((ndimage.gaussian_filter((~bg).astype(np.float32), .8) - .15) / .7, 0, 1)
    rgb = a.astype(np.float32); k = alpha[..., None]
    fixed = np.clip(np.where(k > .02, (rgb - (1 - k) * GRAY) / np.maximum(k, .02), rgb), 0, 255)
    im = Image.fromarray(np.dstack([fixed, alpha * 255]).astype(np.uint8), 'RGBA')
    ys, xs = np.where(alpha > .06)
    m = 4
    return im.crop((max(0, xs.min() - m), max(0, ys.min() - m), min(im.width, xs.max() + m + 1), min(im.height, ys.max() + m + 1)))

def save(biome, key, im, size, quality=84):
    os.makedirs(os.path.join(OUT, biome), exist_ok=True)
    s = min(1, size / max(im.size))
    if s < 1: im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
    path = os.path.join(OUT, biome, key + '.webp')
    (im if im.mode == 'RGBA' else im.convert('RGB')).save(path, 'WEBP', quality=quality, method=4)
    aspects[biome + '/' + key] = round(im.width / im.height, 4)

def fx_cells(img, n):
    img = img.convert('RGB'); w, h = img.size
    out = []
    for c in range(n):
        cell = img.crop((c * w // n, 0, (c + 1) * w // n, h))
        a = np.asarray(cell).max(axis=2); ys, xs = np.where(a > 14)
        if len(xs): cell = cell.crop((max(0, xs.min() - 6), max(0, ys.min() - 6), min(cell.width, xs.max() + 7), min(cell.height, ys.max() + 7)))
        out.append(cell)
    return out

def fx_one(img):
    return fx_cells(img, 1)[0]

TEXTURES = {'canyon_wall', 'cave_wall', 'shaft_wall', 'water', 'chasm', 'crevasse', 'lava_river'}
STRIPS_GRAY = {'bridge', 'bridge_a', 'bridge_b'}  # top-down bridge pieces: gray sides cut away
FX = {'avalanche_fx', 'stampede_fx', 'lava_wave_fx', 'breach_fx'}

for biome in sorted(os.listdir(SRC)):
    d = os.path.join(SRC, biome)
    if not os.path.isdir(d) or biome == 'previews': continue
    for f in sorted(os.listdir(d)):
        m = re.match(r'(\w+?)_[34]x_(\w+)\.png$', f)
        if not m: continue
        item = m.group(2)
        img = Image.open(os.path.join(d, f))
        if biome == 'drone':
            if item == 'fire_fx':
                for name, cell in zip(['muzzle', 'tracer', 'spark'], fx_cells(img, 3)): save('drone', name, cell, 256, 80)
            else:
                save('drone', item, cutout(img), 384)
            continue
        key = 'g_' + item
        if item.startswith('nest_') and item != 'nest_fx':
            continue  # the three nest states are cut together below
        if item == 'nest_fx':
            for name, cell in zip(['g_nest_burst', 'g_nest_ring', 'g_nest_blast'], fx_cells(img, 3)): save(biome, name, cell, 384, 80)
        elif item == 'shot_fx':
            for name, cell in zip(['g_shot', 'g_ring', 'g_hit'], fx_cells(img, 3)): save(biome, name, cell, 256, 80)
        elif item in FX:
            save(biome, key, fx_one(img), 768, 80)
        elif item in TEXTURES:
            save(biome, key, img.convert('RGB'), 1024, 82)
        elif item in STRIPS_GRAY:
            save(biome, key, cutout(img, 20), 768)
        else:
            save(biome, key, cutout(img), 1024 if item.startswith(('gate', 'canyon')) else 512)

# Nests: closed, open and destroyed share one crop so the game can swap them in place.
def cutout_full(img, tol=16):
    a = np.asarray(img.convert('RGB')).astype(np.int16)
    dist = np.abs(a - GRAY).max(axis=2); lab, _ = ndimage.label(dist <= tol)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    alpha = np.clip((ndimage.gaussian_filter((~np.isin(lab, list(edge))).astype(np.float32), .8) - .15) / .7, 0, 1)
    rgb = a.astype(np.float32); k = alpha[..., None]
    fixed = np.clip(np.where(k > .02, (rgb - (1 - k) * GRAY) / np.maximum(k, .02), rgb), 0, 255)
    return Image.fromarray(np.dstack([fixed, alpha * 255]).astype(np.uint8), 'RGBA'), alpha
for biome in sorted(os.listdir(SRC)):
    d = os.path.join(SRC, biome); states = ['closed', 'open', 'destroyed']
    files = [os.path.join(d, f'{biome}_4x_nest_{st}.png') for st in states]
    if not all(os.path.exists(f) for f in files): continue
    cuts = [cutout_full(Image.open(f)) for f in files]
    ys, xs = np.where(np.maximum.reduce([c[1] for c in cuts]) > .06); m = 4
    box = (max(0, xs.min() - m), max(0, ys.min() - m), xs.max() + m + 1, ys.max() + m + 1)
    for st, (im, _) in zip(states, cuts): save(biome, 'g_nest_' + st, im.crop(box), 512)

path = 'art_manifest.js'
src = open(path).read()
cur = json.loads(re.search(r'BIOME_ASPECT = (\{.*\});', src).group(1))
cur.update(aspects)
with open(path, 'w') as fh:
    fh.write('// V15/V16: generated by tools/prepare_art.py and tools/prepare_art_v16.py. Width / height of every image in art/biomes/.\n')
    fh.write('export const BIOME_ASPECT = ' + json.dumps(cur, sort_keys=True, separators=(',', ':')) + ';\n')
print(len(aspects), 'images added;', len(cur), 'total')
