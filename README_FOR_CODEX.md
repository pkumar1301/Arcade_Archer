# Arcade Archer — Phase 1 Visual for Codex

Upload this whole zip to Codex. `index.html` is at the top level — run it the same way as the original game.

## How to run

```sh
python3 -m http.server 8769 --bind 127.0.0.1
# open http://127.0.0.1:8769/
```

## What is in this zip

This is the **smooth stylized visual pass** on the Phase 1 prototype — the latest build. Visual direction chosen by the user: smooth stylized, soft, rounded, Pixar-like.

- `index.html`, `game.js`, `style.css` — Phase 1 Visual (Zone 1, Level 1, ground jungle run, 380 m)
- `art/` — canopy-loop.wav, distant-canopy.jpg, upgrades.jpg
- `vendor/` — Three.js (three.module.min.js, three.core.min.js) + LICENSE
- `README.md` — visual-pass notes and port 8769 run instructions
- `docs/` — the design source of truth. Read these before changing anything:
  - `Arcade_Archer_Redesign_v2.md` — the approved redesign plan (Phase 1 is §10)
  - `Arcade_Archer_Essence_Gap_v1.md` — what was wrong with the original canopy build, code-verified
  - `Enemy_Behaviour_Spec_v1.md` — exact enemy behaviours, classic Carrier Air Wing / Twin Cobra / Aero Fighters / Thunder Blade mapping
  - `Arcade_Game_Redesign_Brief_v1.md` — the original voice-note brief (18 Nov 2026)
  - `transcript-cleaned.md` — the cleaned voice-note transcript

## Visual pass — what changed, gameplay unchanged

- Smooth shading: `flatShading: true` removed from the main materials.
- Rounded geometry: Icosahedron detail 1→3, Cylinder 12→32 sides, Sphere 24×16→48×32, logs are cylinders not boxes.
- Textures: procedural bark 128×256 → 1024×1024, new procedural jungle-floor ground texture (1024 px, tiled).
- Lighting/rendering: shadow map 1024→2048 PCFSoft, exposure 1.04→1.15, fog 0.017→0.008, pixel-ratio cap 1.75→2, warmer sun/rim/bounce light, ACES kept.
- Gameplay constants verified unchanged by diff: run 6 m/s, strafe 4 m/s, jump apex ~1.4 m, roll ~3 m / 1.2 s cooldown / 0.4 s invulnerability, fire 0.31 s, damage log 20 / pothole 25 / projectile 30 / beetle 35, HP moth 1 / beetle-turret 2, 380 m finish.

Still blocky in places: leaf shards are flat triangles, tiny box straps remain on the actor, no normal/roughness maps beyond the bark bump map, no post-processing (bloom/vignette/SMAA), background panorama still 1774×887.

## Phase 1 scope — what this build is, and is not

**In:** free ground movement (W run 6 m/s, release to stop, S brake, no reverse; A/D strafe 4 m/s in a ~12 m corridor; double-tap A/D roll; Space jump), mouse aim + hold left click to fire, E / right-click Power Attack (damage 3, pierces 8, max 3 charges, starts with 1), logs (20 dmg) at 45/110/175/240/305/350 m, potholes (25 dmg) at 65/130/200/270/330 m, beetle / turret / moth zipper waves of 5, coins, 380 m finish, health 100.

**Not in Phase 1 (deferred, do not add unless asked):** glider air shooter, shop, zones/boss, weapon colours, lives, zipper Star bonus, endless spawn pressure.

## Rules for Codex

- Do not change the design decisions in `docs/Arcade_Archer_Redesign_v2.md` without the user approving the change first.
- Numbers in [brackets] in the design docs are starting proposals to tune in playtesting, not locked values.
- Every attack that can hurt the player must have a visible telegraph first and a dodge window — no instant, off-screen, or undodgeable hits.
- Do not invent a browser playtest: the cloud browser refuses loopback addresses, so gameplay feel is verified only by the user playing it locally.
