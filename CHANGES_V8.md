# Jungle Soldier V8: concept art in the game

Built on V7 (difficulty modes + profiles unchanged).

## What changed
- `art/sprites/`: 60 transparent PNGs cut from the Codex concept sheets, plus `manifest.json` (file, width, height).
- Enemies are camera-facing sprites: drone = `drone_front`, armored crawler = `crawler_front`, gun emplacement = `turret_front`.
  The old procedural bodies stay as **invisible hitboxes** (`ghostify()`), so aiming, weak points, cover and balance are identical to V7.
  Hits tint the sprite warm; drones bank as they weave.
- Thorn bushes use `prop_thorn`; trunk cover uses `prop_log` (same collision box underneath).
- ~900 fern and rock sprites line the corridor edges.
- Pickups and coins use the icon art; HUD power-up icons use the new icons; menu weapon cards show the rifle and grenade art.
- Sky is `sky_jungle_sunrise.jpg`; fog and sky light warmed to match it.

## Not yet replaced (no matching art)
- Trees and canopy (still procedural). Biggest remaining visual gap.
- The soldier (a flat billboard can't run, aim or roll; needs a rigged 3D model).
- Pits, the long cross logs, ruins/skyline.

## Unused art ready for later
12 extra enemies/boss (`enemy_*`, `boss_beetle_tank`), angled views (`*_angle`), soldier turnaround (`soldier_front/back/side`), weapon icons (`weapon_*`), upgrade icons (`icon_*`).

## Helpers in game.js
- `makeSprite(name, widthMeters, {tint, bottom})`: billboard from art/sprites/<name>.png (add its aspect to `SPRITE_ASPECT`).
- `ghostify(object, keep)`: makes meshes invisible but still raycastable.
