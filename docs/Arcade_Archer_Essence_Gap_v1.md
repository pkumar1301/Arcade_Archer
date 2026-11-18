# Arcade Archer — Essence Gap v1

**Date:** 18 Nov 2026
**Source:** `Arcade-Archer-GitHub.zip`, extracted to `arcade-archer-src/` — `game.js` (940 lines), `index.html`, `README.md`
**Status:** Code-verified only. No browser playtest was possible — see §5. Nothing here is invented gameplay.

## 1. What the current game actually is

Level 1, "The Canopy": a single-player 3D, 380 m run through tree branches, built in Three.js.

- **Finish:** 380 m. HUD shows `distance / 380 m`.
- **Route:** landings every 20 m. Landings alternate between a centre lane (0) and a split left / right (±2.65).
- **Speed:** base 5 m/s, rising by up to +2 m/s in the second half. W / Up = 1.35×, S / Down = 0.65×. There is no stop.
- **Movement:** the runner moves forward automatically along the route. A/D or Left/Right only chooses which landing to take.
- **Takeoff choice:** sampled at the branch edge, `source.d + 3`. Hold A/D there and the next landing is that side.
- **Midair switch:** allowed only while `destination.d - 3 - distance > 1.4` m — i.e. more than 1.4 m before the landing point. After that, the landing is locked.
- **Aim / fire:** mouse aims, hold left click to fire. Raycast shot, cooldown 0.31 s (0.17 s with Quick reload).
- **Space:** spends a Power Attack charge — damage 3, pierces up to 8 enemies. It is **not** a jump.
- **Health:** 100. Recovery / invulnerability 0.75 s after a hit. Shield absorbs 1 hit.
- **Shop:** one stop only, at **120 / 380 m**.

## 2. Enemies — the whole roster, from the code

Only four types, on a fixed encounter plan. No endless spawn, no scaling with time standing still.

| Type | HP | Score | Behaviour in code |
|---|---|---|---|
| Moth | 1 | 100 | Flies, wings flap, drifts side to side. Does not shoot. |
| Beetle | 2 | 180 | On the landing. Collision only: if within 1.25 m in distance and 1.27 m of the actor, it dies and deals **35 damage**. |
| Turret | 2 | 180 | Fixed below, at y −8.05. Shoots only when range is 7–38 m. Halo grows as a telegraph (visible above 0.42), fires at 1.4, then resets. |
| Glider | 2 | 180 | Flies with a sine sway (±4 m). Shoots the same way as the turret, same range and timing. |

Enemy projectiles: speed 12 m/s, predictive intercept (aimed at where you will be), **30 damage**, hit radius 0.67 m. So three projectile hits, or three beetle hits, end a 100-health run, minus a shield.

Encounters, in order (distance, type, side, drop):

25 moth, 37 turret, 55 glider, 60 beetle, 75 moth, 95 turret, 106 glider, 135 moth, 148 turret, 165 glider, 180 beetle, 193 moth, 204 turret, 219 glider, 220 beetle, 238 moth, 253 glider, 260 beetle, 282 turret, 296 moth, 316 glider, 340 beetle, 351 turret, 365 glider — 32 encounters total, the last at 365 m, 15 m before the finish.

Drops are placed ahead of the kill, on a landing: Shield, Auto attack (15 s), Power bolts (8 shots), Quick reload (12 shots), Power attack charge. Which enemy drops what is fixed in the plan above.

## 3. Shop — at 120 m only

| Offer | Cost | Limit |
|---|---|---|
| Extra crossbow (dual) | 8 coins | once |
| Power bolts (bolt level +1) | 7 coins | level < 3 |
| Power attack charge | 4 coins | max 3 charges |
| Quick reload · 12 shots | 4 coins | only if no quick reload active |
| Shield · 1 hit | 3 coins | only if no shield active |

Coins: +1 wallet and +25 score per coin collected, on the route. The shop pauses the run — it is a menu, not a pre-mission shop.

## 4. Essence gap — voice note vs current build

| Voice note / Carrier Air Wing essence | Current build |
|---|---|
| Wide, open space; player controls running | Narrow 3-lane branch route; forward is automatic |
| Up = forward, Back = stop | W = faster, S = slower; no stop, no reverse |
| Side buttons = move sideways freely | A/D = choose a landing, only at branch points |
| Double-click side = roll | No roll |
| Space = jump | Space = Power Attack |
| On the ground, between two rows of jungle trees; logs to jump, potholes to avoid | High in the canopy, above a forest floor at y −9; no ground, no logs, no potholes |
| Land: standard, fortification, artillery. Air: fast zipper wave (5–6, bonus), dive-bomber, shooter | Land: beetle (collision), turret (shooter). Air: moth (no attack), glider (shooter). No artillery lob, no zipper wave, no dive-bomber, no formation |
| No limit to enemies; standing still brings more, faster | Fixed 32 encounters; standing still is impossible, and nothing spawns |
| 4–5 zones × 6 levels, boss on level 6, harder per zone | Level 1 only, 380 m, no zones, no boss |
| Power-ups on the ground + a drop from a specific enemy | Drops placed on a future landing after a kill; coins on the route |
| Carrier Air Wing: pre-mission shop, fuel, shields 3/5 hits, POW weapon levels, special weapons | One mid-run shop at 120 m; shield 1 hit; bolt levels 1–3; no fuel, no pre-mission loadout |

In short: the current game captures the *shooting* half of Carrier Air Wing (aim, fire, shop upgrades, score) but not the *running* half of your voice note — space, stopping, jumping, rolling, ground hazards, or pressure for standing still. The canopy branch-hopping is the core loop; the jungle run you described would replace it, not tune it.

## 5. Why there is no playtest report

The game server was verified running here — `curl http://127.0.0.1:8767/` returned 200 — but the cloud browser refuses loopback addresses at validation (`invalid_request`), for 127.0.0.1, localhost, 127.1 and [::1]. It never contacted the server, so no takeoff, branch switch, firing, shop, or final-stretch test was done, and no HUD distance from play is reported. The same block applied to the Mac's server earlier.

Routes to a real playtest:
1. **You play it in your own Chrome** at http://127.0.0.1:8767/ and report what you hit, with HUD distances.
2. **Publish to GitHub Pages** (instructions are in the game's README: upload to a repo root, Settings → Pages, Deploy from a branch, / root) and give me the public URL — then the cloud browser can open and play it.
3. Start the redesign from the code findings in §4, without a playtest of the old loop.

## 6. Suggested next step

Decide the redesign's core first, before tuning enemies or the shop: ground jungle run (voice note) replacing the canopy branch run, or canopy run kept with jungle-run elements added to it? That one choice decides whether the route, movement, Space, and enemy roster above are replaced or kept.
