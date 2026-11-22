# Jungle Soldier: jungle biome sprite pack

Transparent PNG cutouts made from the jungle biome art zip and the finish-line art.
`manifest.json` lists every file with its pixel size, aspect ratio (width / height), source, use, pivot and notes.
Add each aspect to `SPRITE_ASPECT` in game.js when you import it.

## Files

| File | Use | Notes |
| --- | --- | --- |
| enemy_leaf_buggy_front.png | Buggy Run, night gauntlet | Eye lamps, side vents and wheel rings recoloured warm orange-red so it reads against foliage. Pivot: tyre contact. Add a red ground lane marker in-game before it charges. |
| boss_beetle_tank_intact.png / _damaged.png | Beetle Tank arena (damaged = Rampage) | Same canvas, centreline and tread baseline: swap with no offset. Cyan core = weak point. Cannons use the red shot warning. |
| brood_pod_sealed.png / _hatching.png | Beetle Tank Brood phase | Same canvas, bases aligned. |
| armour_chest_plate.png, armour_shoulder_plate.png, armour_visor_helmet.png | Upgrade references, shop icons | Shoulder plate can be mirrored. Bronze trim or leaf emblem still to add. |
| prop_temple_lantern.png | Night route landmark | Pivot: bottom centre. |
| weapon_vine_ripper.png | Quartermaster shop icon, 3D reference | |
| vfx_spore_cloud_green.png | Hive Grove, night gauntlet hazard | Black background: draw additively, like the other vfx_ sprites. Recoloured cyan to toxic green so cyan only means "weak point". |
| bg_temple_clearing_dusk.png | Beetle Tank arena far backdrop | Cropped above the ground line, graded for dusk; bottom 8% fades to transparent. Never place under the 3D floor. |
| bg_quartermaster_tent.jpg | Quartermaster screen | Unchanged. Left side open for UI. |
| finish_gate.png | Level finish gate | Fixed vertical plane across the path, not a billboard. 14 m wide: opening about 11 m (spans the corridor), height about 5.8 m. |
| finish_line_checker.png | Finish line on the ground | Flat under the gate, 12 m x 1.74 m keeps the squares square. |

## How they were made
Grey studio backgrounds and soft cast shadows were removed by flood fill from the border, with soft edges and the grey
fringe colour removed. Two-state sheets share one canvas. The finish art was already transparent; solid areas were set
fully opaque (they were 99% opaque) and empty padding trimmed.
