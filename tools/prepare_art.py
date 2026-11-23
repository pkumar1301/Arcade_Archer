# V15: turns the Codex art handoffs into game-ready files under art/biomes/<biome>/.
# Gray (#6B6B6B) backgrounds are keyed out by flood fill from the image edges, so gray
# parts inside an object (hull plating, stone) stay opaque. Sheets are sliced at equal
# cell bounds, sprites are cropped to their content and saved as WebP with alpha.
# Effects keep their black background (they are drawn with additive blending).
# Usage: python3 tools/prepare_art.py <brief1 dir> <brief2 dir> [out dir]
import json, os, sys
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

B1, B2 = sys.argv[1], sys.argv[2]
OUT = sys.argv[3] if len(sys.argv) > 3 else 'art/biomes'
GRAY = np.array([107, 107, 107])
aspects = {}

def find(name):
    for root in (B1, B2):
        for dirpath, _, files in os.walk(root):
            if name in files:
                return os.path.join(dirpath, name)
    raise FileNotFoundError(name)

def cells(img, cols, rows):
    w, h = img.size
    for r in range(rows):
        for c in range(cols):
            yield img.crop((c * w // cols, r * h // rows, (c + 1) * w // cols, (r + 1) * h // rows))

def cutout(img):
    a = np.asarray(img.convert('RGB')).astype(np.int16)
    dist = np.abs(a - GRAY).max(axis=2)
    near = dist <= 16
    lab, _ = ndimage.label(near)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(edge))
    # small gray holes enclosed by the object (gaps between legs, under an arch) also go
    holes, n = ndimage.label(near & ~bg)
    if n:
        sizes = ndimage.sum(np.ones_like(holes), holes, range(1, n + 1))
        for i, s in enumerate(sizes, 1):
            if s > 900:  # large enclosed flat-gray areas are background seen through the object
                region = holes == i
                if dist[region].mean() < 6: bg |= region
    alpha = (~bg).astype(np.float32)
    alpha = ndimage.gaussian_filter(alpha, .8)
    alpha = np.clip((alpha - .15) / .7, 0, 1)
    # remove gray fringe: un-mix the background colour from semi-transparent edge pixels
    rgb = a.astype(np.float32)
    k = alpha[..., None]
    fixed = np.where(k > .02, (rgb - (1 - k) * GRAY) / np.maximum(k, .02), rgb)
    fixed = np.clip(fixed, 0, 255)
    out = np.dstack([fixed, alpha * 255]).astype(np.uint8)
    im = Image.fromarray(out, 'RGBA')
    ys, xs = np.where(alpha > .06)
    if len(xs) == 0: return None
    m = 4
    return im.crop((max(0, xs.min() - m), max(0, ys.min() - m), min(im.width, xs.max() + m + 1), min(im.height, ys.max() + m + 1)))

def fit(im, size):
    s = min(1, size / max(im.size))
    return im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS) if s < 1 else im

def save(biome, key, im, kind='sprite', size=512, quality=84):
    os.makedirs(os.path.join(OUT, biome), exist_ok=True)
    im = fit(im, size)
    if kind == 'jpg':
        path = os.path.join(OUT, biome, key + '.jpg')
        im.convert('RGB').save(path, quality=quality, optimize=True, progressive=True)
    else:
        path = os.path.join(OUT, biome, key + '.webp')
        im.save(path, 'WEBP', quality=quality, method=4) if im.mode == 'RGBA' else im.convert('RGB').save(path, 'WEBP', quality=quality, method=4)
    aspects[biome + '/' + key] = round(im.width / im.height, 4)

def sprite(biome, key, file, size=512, grid=None, keep=None, names=None):
    img = Image.open(find(file))
    parts = list(cells(img, *grid)) if grid else [img]
    for i, cell in enumerate(parts):
        if keep is not None and i not in keep: continue
        cut = cutout(cell)
        if cut is None: continue
        name = names[i] if names else (key if len(parts) == 1 else f'{key}_{i + 1}')
        save(biome, name, cut, size=size)

def fx(biome, key, file, grid=None, size=384, names=None):
    img = Image.open(find(file)).convert('RGB')
    parts = list(cells(img, *grid)) if grid else [img]
    for i, cell in enumerate(parts):
        a = np.asarray(cell).max(axis=2)
        ys, xs = np.where(a > 14)
        if len(xs): cell = cell.crop((max(0, xs.min() - 6), max(0, ys.min() - 6), min(cell.width, xs.max() + 7), min(cell.height, ys.max() + 7)))
        name = names[i] if names else (key if len(parts) == 1 else f'{key}_{i + 1}')
        save(biome, name, cell, size=size, quality=80)

def flat(biome, key, file, size, quality=82):
    save(biome, key, Image.open(find(file)).convert('RGB'), 'jpg', size=size, quality=quality)

def silhouette(biome, file):
    img = Image.open(find(file))
    a = np.asarray(img.convert('RGB')).astype(np.int16)
    dist = np.abs(a - GRAY).max(axis=2)
    lab, _ = ndimage.label(dist <= 16)
    top = set(np.unique(lab[0])) - {0}
    bg = np.isin(lab, list(top))
    alpha = np.clip((ndimage.gaussian_filter((~bg).astype(np.float32), 1.2) - .1) / .8, 0, 1)
    k = alpha[..., None]; rgb = a.astype(np.float32)
    fixed = np.clip(np.where(k > .02, (rgb - (1 - k) * GRAY) / np.maximum(k, .02), rgb), 0, 255)
    save(biome, 'silhouette', Image.fromarray(np.dstack([fixed, alpha * 255]).astype(np.uint8), 'RGBA'), size=2048, quality=82)

BIOMES = ['desert', 'tundra', 'volcano', 'space', 'city']
for b in BIOMES:
    p = b + '_'
    if b != 'city':
        sprite(b, 'scenery', p + '01_scenery.png', 768, (2, 2))
    else:
        sprite(b, 'scenery', 'city_01_scenery.png', 768, (2, 2))
    sprite(b, 'overhead', p + '02_overhead_arch.png', 1024)
    sprite(b, 'cross', p + '03_cross_obstacle.png', 1024)
    if b == 'city':
        sprite(b, 'wall', 'city_04_living_wall_states.png', 512, (3, 1), names=['wall_full', 'wall_broken', 'wall_bud'])
    else:
        sprite(b, 'cover', p + '04a_cover_intact.png', 512, (3, 1))
        sprite(b, 'cracked', p + '04b_cover_cracked.png', 512, (3, 1))
    sprite(b, 'decor', p + '07_small_decor.png', 320, (4, 2))
    sprite(b, 'arch', {'city': 'city_08a_city_gate.png', 'space': 'space_08a_airlock.png'}.get(b, p + '08a_archway.png'), 1024)
    sprite(b, 'tower', {'city': 'city_08b_throne_spire.png', 'space': 'space_08b_distant_station.png'}.get(b, p + '08b_distant_tower.png'), 768)
    flat(b, 'sky', p + '09_sky.png', 2048, 80)
    flat(b, 'arena', p + '13_arena.png', 2048, 80)
    fx(b, 'fx', p + '14_effects.png', (2, 3))
    for t, f in (('path', '06a_path_texture_v2'), ('side', '06b_side_texture_v2'), ('blend', '06d_blend_texture')):
        flat(b, t, p + f + '.png', 1024, 84)
    sprite(b, 'decal', p + '16_ground_decals.png', 256, (5, 2))
    sprite(b, 'clutter', p + '17_base_clutter.png', 256, (4, 2))
    fx(b, 'particle', p + '18_particles.png', (3, 2), 128)
    silhouette(b, p + '19_far_silhouette.png')
    sprite(b, 'frame', p + '20_foreground_framing.png', 512, (2, 2))

# Enemies (front view = left cell), bosses and extras
E = {'desert': ['scarab', 'dune_crawler', 'obelisk', 'raptor', 'tortoise'],
     'tundra': ['frost_drone', 'shell_crawler', 'cryo_turret', 'stalker', 'ram'],
     'volcano': ['ember_drone', 'magma_crawler', 'flame_turret', 'lantern', 'golem'],
     'space': ['security_drone', 'crawler_bot', 'laser_turret', 'wisp', 'shield_drone']}
SRC = {'desert': ['10a_scarab_drone', '10b_dune_crawler', '10c_obelisk_turret', '11a_mech_raptor', '11b_stone_tortoise'],
       'tundra': ['10a_frost_drone', '10b_ice_shell_crawler', '10c_cryo_turret', '11a_snow_stalker', '11b_glacier_ram'],
       'volcano': ['10a_ember_drone', '10b_magma_crawler', '10c_flame_turret', '11a_lantern_drone', '11b_lava_golem'],
       'space': ['10a_security_drone', '10b_crawler_bot', '10c_laser_turret', '11a_eye_wisp', '11b_shield_drone']}
for b, keys in E.items():
    for k, s in zip(keys, SRC[b]):
        sprite(b, k, f'{b}_{s}.png', 512, (2, 1), keep=[0], names=[k])
BOSS = {'desert': ['12a_dune_wyrm_front', '12b_dune_wyrm_damaged', '12c_dune_wyrm_belly'],
        'tundra': ['12a_frost_titan_front', '12b_frost_titan_damaged'],
        'volcano': ['12a_magma_serpent_front', '12b_magma_serpent_damaged'],
        'space': ['12a_void_manta_front', '12b_void_manta_underside', '12c_void_manta_crashed'],
        'city': ['12a_overmind_fortress', '12b_overmind_split', '12c_overmind_heart', '12f_overmind_death', 'runtime_overmind_fortress_base']}
for b, files in BOSS.items():
    for i, f in enumerate(files):
        sprite(b, 'boss_' + 'abcdefg'[i], f'{b}_{f}.png', 1024)
sprite('tundra', 'ice_plate', 'tundra_12c_ice_plate.png', 384)
sprite('volcano', 'tail', 'volcano_12c_serpent_tail.png', 512)
sprite('city', 'trophy', 'city_12d_trophy_plates.png', 384, (5, 1))
sprite('city', 'tendril', 'city_12e_tendril_tip.png', 512)
for i, n in enumerate(['sentinel', 'sentinel_side', 'sentinel_open']):
    sprite('city', n, ['city_11a_sentinel_front.png', 'city_11b_sentinel_threequarter.png', 'city_11c_sentinel_core_open.png'][i], 640)
sprite('city', 'elite', 'city_10_elites_v2.png', 512, (2, 3))
fx('city', 'celebrate', 'city_15a_celebration_effects.png', (2, 3), 512)
for i in range(1, 7):  # the ending draws these in HTML over the game, so they get alpha from brightness
    pth = os.path.join(OUT, 'city', f'celebrate_{i}.webp'); a = np.asarray(Image.open(pth).convert('RGB')).astype(np.float32); al = np.clip((a.max(axis=2) / 255 - .04) / .96, 0, 1)
    Image.fromarray(np.dstack([np.clip(a / np.maximum(al[..., None], .02), 0, 255), al * 255]).astype(np.uint8), 'RGBA').save(pth, 'WEBP', quality=82, method=4)
flat('city', 'dawn', 'city_15b_victory_dawn.png', 2048, 80)
for b in ('desert', 'tundra', 'volcano', 'space'):
    pass
sprite('desert', 'scarab_half', 'desert_21a_scarab_split.png', 384, (2, 1), keep=[0], names=['scarab_half'])
sprite('desert', 'obelisk_burrow', 'desert_21b_obelisk_burrow.png', 384, (3, 1))
sprite('desert', 'raptor_pounce', 'desert_21c_raptor_pounce.png', 512)
sprite('tundra', 'ram_rear', 'tundra_21a_glacier_ram_rear.png', 512)
sprite('tundra', 'stalker_leap', 'tundra_21b_stalker_leap.png', 512)
sprite('volcano', 'golem_exposed', 'volcano_21_golem_exposed.png', 512)
sprite('space', 'crawler_ceiling', 'space_21_crawler_ceiling.png', 512)
sprite('space', 'weapon_mine', 'space_15b_gravity_mine.png', 512)
flat('tundra', 'ice', 'tundra_06c_ice_patch_texture.png', 1024, 84)
flat('volcano', 'crust', 'volcano_06c_crust_texture.png', 1024, 84)
flat('space', 'asteroid', 'space_06c_asteroid_ground.png', 1024, 84)
for b in ('desert', 'tundra', 'volcano'):
    sprite(b, 'weapon', f'{b}_15_weapons.png', 512, (1, 3))
sprite('space', 'weapon', 'space_15_weapons.png', 512, (1, 2))
HZ = {'desert': [('quicksand', 'desert_05_quicksand_topdown.png')],
      'tundra': [('thin_ice', 'tundra_05a_thin_ice_topdown.png'), ('ice_hole', 'tundra_05b_ice_hole_topdown.png')],
      'volcano': [('lava_pool', 'volcano_05a_lava_pool_topdown.png'), ('lava_vent', 'volcano_05b_lava_vent_topdown.png')],
      'space': [('void_station', 'space_05a_void_gap_station_topdown.png'), ('void_asteroid', 'space_05b_void_gap_asteroid_topdown.png')],
      'city': [('portal_in', 'city_05a_portal_entry.png'), ('portal_out', 'city_05b_portal_exit.png')]}
for b, items in HZ.items():
    for k, f in items: sprite(b, k, f, 512)
# Forest polish kit (the rest of the Forest art already lives in art/sprites and art/jungle-biome)
b = 'forest'
for t, f in (('path', '06a_path_texture_v2'), ('side', '06b_side_texture_v2'), ('blend', '06d_blend_texture')):
    flat(b, t, 'forest_' + f + '.png', 1024, 84)
sprite(b, 'decal', 'forest_16_ground_decals.png', 256, (5, 2))
sprite(b, 'clutter', 'forest_17_base_clutter.png', 256, (4, 2))
fx(b, 'particle', 'forest_18_particles.png', (3, 2), 128)
silhouette(b, 'forest_19_far_silhouette.png')
sprite(b, 'frame', 'forest_20_foreground_framing.png', 512, (2, 2))
fx(b, 'spores', 'forest_05_spore_cloud.png', None, 512)

with open(os.path.join(OUT, '..', '..', 'art_manifest.js'), 'w') as fh:
    fh.write('// V15: generated by tools/prepare_art.py. Width / height of every image in art/biomes/.\n')
    fh.write('export const BIOME_ASPECT = ' + json.dumps(aspects, sort_keys=True, separators=(',', ':')) + ';\n')
print(len(aspects), 'images')
