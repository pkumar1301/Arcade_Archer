# Arcade Archer — Phase 1 Prototype, Smooth Stylized Visual Pass

Visual direction: smooth stylized — soft, rounded, Pixar-like. Visual changes
only; gameplay is unchanged from the Phase 1 prototype in
`../arcade-archer-phase1/` (same speeds, jump, roll, damage, HP, encounters,
log/pothole positions, coins, 380 m finish, controls, health 100).

What changed visually: flat shading removed (smooth normals), geometry raised
(Icosahedron detail 1→3, crowns 2→3, cylinders 12→32 sides, spheres 24×16→
48×32, coins 12→32, horns/membranes smoothed), boxy actor torso / crossbow /
finish arch / logs replaced with rounded equivalents at the same size and
position, procedural bark texture 128×256→1024 px, new procedural jungle-floor
ground texture (1024 px, tiled) instead of a flat-colour plane, softened and
warmed foliage palette, shadow map 1024→2048 with PCFSoft shadows, warmer sun
with stronger cool rim/fill plus a soft warm bounce light, exposure 1.04→1.15,
fog density 0.017→0.008, pixel-ratio cap 1.75→2. ACES tone mapping kept.
Background panorama unchanged.

# Arcade Archer — Phase 1 Prototype

Zone 1, Level 1 only: a 380-meter ground jungle run, single-player, 3D
(Three.js). This is the Redesign v2 Phase 1 build — the canopy branch run
is replaced by a player-controlled run on the jungle floor between two
rows of trees. No shop, no zones/boss, no new weapon colours, no lives.
Health 100; death ends the run (restart from the menu).

Original game: `../arcade-archer-src/` — do not edit that folder; this
Phase 1 copy is the only one changed.

## Run locally

From this folder, run:

```sh
python3 -m http.server 8769 --bind 127.0.0.1
```

Then open <http://127.0.0.1:8769/> in Chrome (desktop, WebGL enabled).
Port 8769 is used because 8767 serves the original build and 8768 serves
the Phase 1 prototype.

## Publish with GitHub Pages

Upload the extracted contents to the root of a GitHub repository, with
`index.html` at the top level. Under **Settings → Pages**, choose
**Deploy from a branch**, select the branch you uploaded to (usually
`main`) and **/ (root)**, then save. Use the URL shown in Pages once
deployment completes.

## Controls

- **W / Up** run forward (~6 m/s). Release to slow to a stop — no auto-run.
- **S / Down** brake to a stop. No reverse.
- **A / D or Left / Right** strafe freely (~4 m/s) across the ~12 m corridor.
- **Double-tap A / D** roll (~3 m, ~1.2 s cooldown, ~0.4 s invulnerability).
- **Space** jump (clears logs and potholes).
- **Mouse** aims. **Hold left click** to fire.
- **E / right click** spends a Power Attack charge (damage 3, pierces up to
  8 enemies, max 3 charges). You start with 1 charge.
- **M** toggles music. **Esc** pauses.

## Hazards and enemies (Phase 1)

- **Logs** (at 45, 110, 175, 240, 305, 350 m): jump over them, or take
  20 health damage and a brief slow.
- **Potholes** (at 65, 130, 200, 270, 330 m): strafe around them, or jump
  over them; falling in costs 25 health and a brief slow.
- **Beetle** — standard ground attacker, 2 HP, 180 pts, 35 damage on
  contact. Drifts toward you when close. Jumping high over it clears it.
- **Turret** — fortification, 2 HP, 180 pts, fixed on the ground, shoots
  at 7–38 m with a growing halo telegraph; its bolts do 30 damage.
- **Moth** — zipper, 1 HP, 100 pts, in waves of 5, flying toward you fast.
  No attack; the challenge is hitting them before they pass.

Coins lie on the ground route (+1 coin, +25 score each). Some defeated
enemies drop a power-up ahead on your line (Shield, Auto attack, Power
bolts, Quick reload, Power attack charge). Reach 380 m to clear the level.
