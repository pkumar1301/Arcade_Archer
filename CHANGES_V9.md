# Jungle Soldier V9: full jungle scenery from art batch 2

Built on V8. Difficulty, profiles, hitboxes and balance are unchanged.

## New art (art/sprites/, listed in manifest_batch2.json)
trees (kapok, fig, hardwood, palm), canopy_vines, log_cross, cover_stump/boulder/stone, 8 plants,
ruin_arch, ruin_tower, pit_rim (centre made transparent), ground_path/ground_forest (seam-fixed), 8 VFX sprites.

## What changed in game.js
- All procedural trees, distant jungle, skyline boxes, grey pillar ruins, vine arches and leaf shards removed.
  Replaced with billboards: near tree line every 9 m per side, a darker back row every 12 m, 16 distant temple towers,
  a temple archway every 60 m (lantern glow), hanging vine canopies midway between arches.
- Path edges: ferns, 8 plant types and rock piles.
- Ground: world-space shader blends the dirt path into forest floor along the curving corridor (`floorMat.onBeforeCompile`).
  Puddles removed.
- Cross logs use `log_cross`; trunk cover picks stump / boulder / carved stone. Original collision and shot-blocking volumes kept.
- Pits: flat painted rim around the existing hole (opening radius 1.65 m = trap radius). Pit walls darkened.
- VFX (additive): painted muzzle flash, bullet impact spark, enemy kill explosion, grenade explosion
  (also fixes the V5 explosion glow that was never removed), enemy energy bolt aimed along its flight,
  coin sparkle, heal/shield burst on pickups. Helpers: `makeFx`, `spawnFx`.
- Neon path edges toned down (emissive 2.4 → 0.55) to suit the daylight jungle.

## Performance
About 680 draw calls per frame in a mid-level test view. Fine on desktop GPUs; if integrated laptop GPUs struggle,
thin the decoration loop on Low quality.

## Still to do
The soldier (waiting on the rigged 3D model).
