# Jungle Soldier V10: animated soldier

Built on V9. Difficulty, profiles, scenery, hitboxes and balance unchanged
(bot clears Easy in ~5:28, V7 was ~5:20).

## The model
- TRELLIS image-to-3D -> reduced from 280k to 28k triangles, double-walled shell fixed, texture re-baked
  -> rigged in Mixamo (33-bone skeleton).
- `art/soldier/soldier_rig.bin` + `soldier_rig.json`: skinned mesh (positions, normals, UVs, 4 bone weights per vertex) and skeleton.
- `art/soldier/soldier_clips.json`: 10 clips sampled at 30 fps, root motion removed (in place).
- `art/soldier/soldier_texture.jpg`: texture.
- Converted with a custom binary-FBX reader (`tools/fbx.py`, `tools/mixamo_rig.py`) because no FBX/GLTF loader ships in vendor/.

## Clips and when they play (`animateSoldier()` in game.js)
| State | Clip (Mixamo source) | Trigger |
|---|---|---|
| idle | rifle aiming idle | standing still |
| run | Rifle Run (in place) | W held; speed-matched |
| strafeLeft / strafeRight | Strafe Left / Right (in place) | A / D while not running |
| fire | Firing Rifle | firing while standing |
| jump | rifle jump | in the air (not in a pit) |
| roll | Running Dive Roll (roll section only) | double-tap roll, fitted to 0.4 s |
| hit | Hit Reaction (first 0.9 s) | taking damage while standing |
| grenade | toss grenade (throw section) | throwing while standing |
| death | Death From The Front | health reaches 0 |

- Chest leans with aim pitch (Spine2); body turns with aim yaw (as before).
- The procedural rifle is kept and follows the right hand, still pointing at the aim point; muzzle/bullets unchanged.
- `soldier.js` loads everything with three.js core only (SkinnedMesh, Skeleton, AnimationMixer).
- If the model fails to load, the old procedural soldier stays visible.

## Known rough edges
- A few white flecks on the trousers from the texture re-bake.
- The left hand doesn't grip the rifle exactly (the rifle tracks the right hand only).
- Firing while running uses the run clip (no upper-body blend yet).
